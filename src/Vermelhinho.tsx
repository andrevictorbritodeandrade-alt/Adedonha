import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, MapPin, Trophy, RefreshCw, Bus, AlertCircle, Clock, 
  ZoomIn, User, Medal, Move, Maximize2, Info, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÕES E CONSTANTES ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MARICA_LOCATIONS = [
  "Igreja de Nossa Senhora do Amparo",
  "Lagoa de Araçatiba",
  "Praia de Ponta Negra",
  "Farol de Ponta Negra",
  "Pedra do Elefante",
  "Cachoeira do Espraiado",
  "Orla de Itaipuaçu",
  "Terminal Rodoviário de Maricá",
  "Praça Orlando de Barros Pimentel",
  "Barra de Maricá"
];

const BUS_LINES = ["E01", "E02", "E11", "E24", "E30", "E31"];

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  time: number;
  date: any;
}

export default function Vermelhinho({ onBack }: { onBack: () => void }) {
  // Estados do Jogo
  const [gameState, setGameState] = useState<'menu' | 'loading' | 'playing' | 'result'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [gameImage, setGameImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [busLine, setBusLine] = useState("");
  const [curiosity, setCuriosity] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar Leaderboard
  useEffect(() => {
    const q = query(collection(db, 'vermelhinho_scores'), orderBy('score', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeaderboardEntry[];
      setLeaderboard(scores);
    });
    return () => unsubscribe();
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLeft]);

  // Gerar Novo Jogo com Gemini e Imagen
  const startNewGame = async () => {
    setGameState('loading');
    setLoadingProgress(10);
    setLoadingStatus("Escolhendo destino em Maricá...");
    
    const selectedLoc = MARICA_LOCATIONS[Math.floor(Math.random() * MARICA_LOCATIONS.length)];
    const selectedBus = BUS_LINES[Math.floor(Math.random() * BUS_LINES.length)];
    setLocation(selectedLoc);
    setBusLine(selectedBus);

    try {
      // 1. Gerar Curiosidade e Prompt com Gemini
      setLoadingProgress(30);
      setLoadingStatus("Consultando guia turístico (Gemini)...");
      
      const promptText = `Você é um guia turístico de Maricá, RJ. 
      Fale uma curiosidade curta (máximo 150 caracteres) sobre ${selectedLoc}.
      Depois, crie um prompt detalhado para geração de imagem no estilo "Onde está o Waldo" (muitos detalhes, pessoas, objetos) que se passe em ${selectedLoc}. 
      O elemento principal a ser escondido é um ônibus municipal de Maricá (conhecido como Vermelhinho), que é totalmente vermelho com detalhes brancos.
      Responda em formato JSON: {"curiosity": "...", "imagePrompt": "..."}`;

      const result = await genAI.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
      });
      const text = result.candidates[0].content.parts[0].text || "{}";
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      setCuriosity(data.curiosity);
      setLoadingProgress(50);
      setLoadingStatus("Pintando o cenário (Imagen)...");

      // 2. Gerar Imagem com Imagen
      const finalPrompt = `Estilo ilustração detalhada "Where's Waldo", visão panorâmica de ${selectedLoc} em Maricá, centenas de pessoas, carros, barracas, árvores. Escondido em algum lugar pequeno está um ônibus municipal totalmente vermelho (Vermelhinho de Maricá). Alta complexidade, cores vibrantes, 8k. ${data.imagePrompt}`;
      
      const imageResult = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          },
        },
      });

      let imageUrl = "";
      for (const part of imageResult.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGameImage(imageUrl);
        setLoadingProgress(90);
        setLoadingStatus("Escondendo o Vermelhinho...");
        
        // Posicionar alvo aleatoriamente (evitar bordas extremas)
        setTargetPos({
          x: 15 + Math.random() * 70,
          y: 15 + Math.random() * 70
        });

        setLoadingProgress(100);
        setTimeout(() => {
          setGameState('playing');
          setTimeLeft(difficulty === 'easy' ? 90 : difficulty === 'medium' ? 60 : 30);
          setZoom(1);
          setOffset({ x: 0, y: 0 });
        }, 500);
      } else {
        throw new Error("Falha ao gerar imagem");
      }
    } catch (error) {
      console.error("Erro ao iniciar jogo:", error);
      // Fallback para imagem do Picsum se a IA falhar
      setGameImage(`https://picsum.photos/seed/${selectedLoc.replace(/ /g, '')}/1920/1080`);
      setCuriosity("Maricá é uma cidade linda com transporte gratuito!");
      setTargetPos({ x: 50, y: 50 });
      setGameState('playing');
      setTimeLeft(60);
    }
  };

  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing') return;

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Calcular posição relativa considerando zoom e offset
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const distance = Math.sqrt(Math.pow(x - targetPos.x, 2) + Math.pow(y - targetPos.y, 2));
    const threshold = 5 / zoom; // Margem de erro diminui com o zoom

    if (distance < threshold) {
      handleWin();
    } else {
      // Penalidade de tempo por clique errado
      setTimeLeft(prev => Math.max(0, prev - 5));
    }
  };

  const handleWin = async () => {
    const timeBonus = timeLeft * 10;
    const difficultyMult = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
    const finalScore = Math.floor((1000 + timeBonus) * difficultyMult);
    
    setScore(finalScore);
    setGameState('result');

    // Salvar no Firebase
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'vermelhinho_scores'), {
          uid: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Anônimo',
          score: finalScore,
          time: timeLeft,
          difficulty,
          location,
          date: serverTimestamp()
        });
      } catch (e) {
        console.error("Erro ao salvar score:", e);
      }
    }
  };

  // Controles de Zoom e Pan
  const handleWheel = (e: React.WheelEvent) => {
    if (gameState !== 'playing') return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(1, prev * delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Search size={20} />
          <span className="font-bold uppercase tracking-tighter">Sair</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-600/20 px-3 py-1 rounded-full border border-red-600/50">
            <Bus size={16} className="text-red-500" />
            <span className="text-xs font-black text-red-500 uppercase">Vermelhinho de Maricá</span>
          </div>
          {gameState === 'playing' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className={timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
                <span className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-20" /> {/* Spacer */}
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'menu' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-2xl px-6"
            >
              <div className="mb-8 relative inline-block">
                <div className="absolute -inset-4 bg-red-600 blur-3xl opacity-20 animate-pulse" />
                <Bus size={120} className="text-red-600 mx-auto relative z-10" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase leading-none">
                ONDE ESTÁ O <span className="text-red-600">VERMELHINHO?</span>
              </h1>
              <p className="text-gray-400 text-lg mb-12 font-medium">
                O ônibus de Maricá se perdeu na cidade! <br/>
                Encontre-o antes que o tempo acabe e torne-se o mestre detetive.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-12">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      difficulty === d 
                        ? 'border-red-600 bg-red-600/10 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                        : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/30'
                    }`}
                  >
                    <span className="block font-black uppercase text-sm">{d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}</span>
                    <span className="text-[10px] opacity-60">{d === 'easy' ? '90s' : d === 'medium' ? '60s' : '30s'}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={startNewGame}
                className="w-full py-6 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-2xl uppercase italic tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-4"
              >
                <PlayIcon /> INICIAR BUSCA
              </button>
            </motion.div>
          )}

          {gameState === 'loading' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-red-600/20 rounded-full" />
                <div 
                  className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '0.8s' }}
                />
                <Bus size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 animate-bounce" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black italic uppercase mb-2">{loadingStatus}</h2>
                <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="mt-4 text-gray-500 font-bold text-xs uppercase tracking-widest">Gerando cenário único com IA...</p>
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col"
            >
              {/* Game Info Bar */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-4">
                <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                  <MapPin size={18} className="text-red-500" />
                  <span className="font-black uppercase text-sm italic">{location}</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                  <Bus size={18} className="text-red-500" />
                  <span className="font-black uppercase text-sm italic">Linha {busLine}</span>
                </div>
              </div>

              {/* Game Canvas */}
              <div 
                className="flex-1 relative cursor-crosshair overflow-hidden"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div 
                  className="w-full h-full transition-transform duration-200 ease-out"
                  style={{ 
                    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                    transformOrigin: 'center'
                  }}
                >
                  {gameImage && (
                    <img 
                      ref={imageRef}
                      src={gameImage} 
                      alt="Cenário de Maricá"
                      className="w-full h-full object-cover pointer-events-none select-none"
                      onMouseDown={(e) => e.preventDefault()}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {/* Invisible Target Area */}
                  <div 
                    onClick={handleImageClick}
                    className="absolute w-[5%] h-[8%] cursor-pointer group"
                    style={{ 
                      left: `${targetPos.x}%`, 
                      top: `${targetPos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {showHint && (
                      <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping" />
                    )}
                  </div>
                </div>

                {/* Interaction Overlay */}
                <div className="absolute inset-0 pointer-events-none" onClick={handleImageClick} />
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
                <button 
                  onClick={() => setZoom(prev => Math.min(prev + 0.5, 5))}
                  className="p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <ZoomIn size={24} />
                </button>
                <button 
                  onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
                  className="p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <Maximize2 size={24} />
                </button>
                <button 
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className="px-8 py-4 bg-yellow-500 text-black rounded-2xl font-black uppercase italic tracking-tighter flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Sparkles size={20} /> Dica (-20s)
                </button>
              </div>

              {/* Curiosity Toast */}
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="absolute bottom-8 right-8 max-w-xs bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl z-40"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-600/20 p-2 rounded-lg">
                    <Info size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-red-500 mb-1">Você sabia?</p>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{curiosity}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl px-6 flex flex-col md:flex-row gap-8 items-center"
            >
              {/* Score Card */}
              <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-[3rem] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                <Trophy size={80} className="text-yellow-500 mx-auto mb-6" />
                <h2 className="text-4xl font-black italic uppercase mb-2">Busca Concluída!</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Você encontrou o Vermelhinho em {location}</p>
                
                <div className="text-7xl font-black text-white mb-12 tabular-nums">
                  {score.toLocaleString()}
                  <span className="block text-sm text-red-500 uppercase tracking-[0.5em] mt-2">Pontos</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="block text-[10px] text-gray-500 font-black uppercase mb-1">Tempo Restante</span>
                    <span className="text-xl font-bold">{timeLeft}s</span>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="block text-[10px] text-gray-500 font-black uppercase mb-1">Dificuldade</span>
                    <span className="text-xl font-bold uppercase">{difficulty}</span>
                  </div>
                </div>

                <button 
                  onClick={startNewGame}
                  className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xl uppercase italic tracking-tighter transition-all flex items-center justify-center gap-3"
                >
                  <RefreshCw size={24} /> Jogar Novamente
                </button>
              </div>

              {/* Leaderboard */}
              <div className="w-full md:w-80 bg-black/40 border border-white/10 p-6 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-6">
                  <Medal size={24} className="text-yellow-500" />
                  <h3 className="text-xl font-black italic uppercase">Top Detetives</h3>
                </div>
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold truncate max-w-[100px]">{entry.name}</span>
                      </div>
                      <span className="text-sm font-black text-red-500">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-white/5 bg-black/40">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
          Desenvolvido por André Victor Brito de Andrade • Maricá-RJ © 2026
        </p>
      </footer>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
