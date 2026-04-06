import React, { useState, useEffect, useRef } from 'react';
import { PERGUNTAS } from './perguntas';
import { ArrowLeft } from 'lucide-react';

const CATEGORIAS = [
  { id: 1, name: "Português", icon: "🧙‍♂️", color: "#FF3366" }, // Pink/Red
  { id: 2, name: "Matemática", icon: "👽", color: "#33CCFF" }, // Light Blue
  { id: 3, name: "Geografia", icon: "🌋", color: "#33FF66" }, // Neon Green
  { id: 4, name: "História", icon: "👑", color: "#FFCC00" }, // Gold/Yellow
  { id: 5, name: "Ciências", icon: "🧪", color: "#9933FF" }, // Purple
  { id: 6, name: "Entretenimento", icon: "🎪", color: "#FF66CC" }, // Hot Pink
  { id: 7, name: "Educação Física", icon: "🥋", color: "#FF6600" }, // Orange
  { id: 8, name: "Artes", icon: "🎨", color: "#00CC99" }, // Teal
  { id: 9, name: "Inglês", icon: "🗽", color: "#0066FF" }, // Blue
  { id: 10, name: "Francês", icon: "🥐", color: "#FF3333" }, // Red
];

const TEMPO_INICIAL = 30; // 30 segundos para responder

export default function Perguntados({ onBack }: { onBack: () => void }) {
  const [timeLeft, setTimeLeft] = useState(TEMPO_INICIAL);
  const [isRunning, setIsRunning] = useState(false);
  const [categoriaSorteada, setCategoriaSorteada] = useState<any>(null);
  const [perguntaAtual, setPerguntaAtual] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [players, setPlayers] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: '', score: 0, roundScore: '' }))
  );

  // Load answered questions from localStorage
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('answeredQuestions');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('answeredQuestions', JSON.stringify(Array.from(answeredQuestions)));
  }, [answeredQuestions]);

  const playTick = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtxRef.current.currentTime + 0.02);
      
      gainNode.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.02);
      
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.02);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const playDing = () => {
    try {
      if (!audioCtxRef.current) return;
      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtxRef.current.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 1);
      
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 1);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) return;
      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, audioCtxRef.current.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
      
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.1);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const sortearCategoria = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setCategoriaSorteada(null);
    setPerguntaAtual(null);
    setOpcaoSelecionada(null);
    setIsAnswered(false);
    setFlashColor(null);
    setIsRunning(false);
    setTimeLeft(TEMPO_INICIAL);
    
    const targetIndex = Math.floor(Math.random() * CATEGORIAS.length);
    const targetAngle = 360 - (targetIndex * (360 / CATEGORIAS.length));
    const extraSpins = 5 * 360; 
    
    const currentMod = rotation % 360;
    let diff = targetAngle - currentMod;
    if (diff < 0) diff += 360;
    
    const newRotation = rotation + extraSpins + diff;
    
    setRotation(newRotation);

    const startTime = Date.now();
    const duration = 3000;
    
    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        playDing();
        return;
      }
      playTick();
      
      const progress = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const nextDelay = 30 + (easeOut * 200); 
      
      setTimeout(tick, nextDelay);
    };
    
    tick();
    
    setTimeout(() => {
      const cat = CATEGORIAS[targetIndex];
      setCategoriaSorteada(cat);
      
      // Select random question
      const perguntasCat = PERGUNTAS[cat.id];
      const unansweredQuestions = perguntasCat.filter(q => !answeredQuestions.has(q.id));
      
      if (unansweredQuestions.length > 0) {
        const randomQ = unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];
        // Shuffle options
        const shuffledOptions = [...randomQ.o].sort(() => Math.random() - 0.5);
        setPerguntaAtual({ ...randomQ, options: shuffledOptions });
      } else {
        // All questions answered, reset
        setAnsweredQuestions(new Set());
        const randomQ = perguntasCat[Math.floor(Math.random() * perguntasCat.length)];
        const shuffledOptions = [...randomQ.o].sort(() => Math.random() - 0.5);
        setPerguntaAtual({ ...randomQ, options: shuffledOptions });
      }

      setIsSpinning(false);
      setIsRunning(true);
    }, 3000);
  };

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((tempoAnterior) => {
          if (tempoAnterior <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            if (!isAnswered) {
              setIsAnswered(true);
              setFlashColor('bg-red-500/30');
            }
            return 0;
          }
          return tempoAnterior - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isAnswered]);

  useEffect(() => {
    if (timeLeft === 0 && categoriaSorteada && !isAnswered) {
      playDing();
    } else if (isRunning && timeLeft <= 10 && timeLeft > 0) {
      playBeep();
    }
  }, [timeLeft, isRunning, categoriaSorteada, isAnswered]);

  const handleOptionClick = (opcao: string) => {
    if (isAnswered) return;
    
    setOpcaoSelecionada(opcao);
    setIsAnswered(true);
    setIsRunning(false);

    // Mark question as answered
    setAnsweredQuestions(prev => new Set(prev).add(perguntaAtual.id));

    if (opcao === perguntaAtual.r) {
      setFlashColor('bg-green-500/30');
      playDing();
    } else {
      setFlashColor('bg-red-500/30');
    }
  };

  const handleContinuar = () => {
    setCategoriaSorteada(null);
    setPerguntaAtual(null);
    setOpcaoSelecionada(null);
    setIsAnswered(false);
    setFlashColor(null);
    setTimeLeft(TEMPO_INICIAL);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetRound = () => {
    setIsRunning(false);
    setTimeLeft(TEMPO_INICIAL);
    setCategoriaSorteada(null);
    setPerguntaAtual(null);
    setOpcaoSelecionada(null);
    setIsAnswered(false);
    setFlashColor(null);
  };

  const handlePlayerChange = (id: number, field: string, value: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayerScore = (id: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const pts = parseInt(p.roundScore) || 0;
        return { ...p, score: p.score + pts, roundScore: '' };
      }
      return p;
    }));
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const percentage = (timeLeft / TEMPO_INICIAL) * 100;
  const barColor = timeLeft <= 10 ? 'bg-red-500' : (timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500');

  const isShaking = isRunning && timeLeft <= 10 && timeLeft > 0;

  return (
    <div className={`min-h-screen bg-magical font-sans p-2 md:p-4 text-white transition-colors duration-300 ${flashColor || ''} ${isShaking ? 'animate-msn-shake' : ''}`}>
      
      <header className="text-center mb-4 mt-2 relative z-20">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-30 shadow-lg border border-white/10 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic text-orange-400">
          <span className="inline-block animate-bounce mr-2">❓</span>
          <span className="uppercase">
            PERGUNTADOS
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>🧠</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">Gire a roleta e responda à pergunta!</p>
      </header>

      <div className="max-w-[1400px] w-full mx-auto flex flex-col lg:flex-row gap-6 justify-center">
        
        {/* Painel Esquerdo (Roleta/Pergunta e Timer) */}
        <div className="w-full lg:w-2/3 bg-[#1a1a2e] p-6 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col relative overflow-hidden">
          
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 rounded-2xl flex flex-col items-center justify-center mb-6 border-4 border-indigo-500/30 min-h-[500px] shadow-inner relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50"></div>
            
            {!perguntaAtual ? (
              <>
                {/* Roleta */}
                <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] mb-8 mt-4 z-10">
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 w-0 h-0 border-l-[25px] border-r-[25px] border-t-[50px] border-l-transparent border-r-transparent border-t-yellow-400 z-30 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" style={{ filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.8))' }}></div>
                  
                  {/* Wheel */}
                  <div 
                    className="w-full h-full rounded-full border-[12px] border-slate-800 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]"
                    style={{
                      background: `conic-gradient(from -${360 / CATEGORIAS.length / 2}deg, ${CATEGORIAS.map((cat, i) => `${cat.color} ${i * (360/CATEGORIAS.length)}deg ${(i+1) * (360/CATEGORIAS.length)}deg`).join(', ')})`,
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                  >
                    {/* Inner shadow overlay */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(0,0,0,0.6)] pointer-events-none z-20"></div>
                    
                    {/* Segment separators */}
                    {CATEGORIAS.map((_, i) => (
                      <div 
                        key={`sep-${i}`}
                        className="absolute top-0 left-1/2 origin-bottom w-1.5 bg-slate-900/40 z-10"
                        style={{
                          height: '50%',
                          transform: `translateX(-50%) rotate(${(i + 0.5) * (360/CATEGORIAS.length)}deg)`,
                        }}
                      />
                    ))}

                    {CATEGORIAS.map((cat, i) => (
                      <div 
                        key={cat.id}
                        className="absolute top-0 left-1/2 origin-bottom flex items-start justify-center pt-2 sm:pt-3 md:pt-4 z-10"
                        style={{
                          height: '50%',
                          transform: `translateX(-50%) rotate(${i * (360/CATEGORIAS.length)}deg)`,
                          width: '140px'
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="block text-center font-black text-white drop-shadow-lg text-[10px] sm:text-xs md:text-sm leading-tight uppercase px-1 mb-1 sm:mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 0 rgba(0,0,0,0.5)' }}>
                            {cat.name}
                          </span>
                          <span className="text-4xl sm:text-5xl md:text-6xl drop-shadow-xl" style={{ filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.6))' }}>{cat.icon}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full z-30 shadow-[0_0_20px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center">
                    <span className="text-slate-900 font-black text-3xl sm:text-4xl md:text-5xl drop-shadow-sm">?</span>
                  </div>
                </div>

                <button
                  onClick={sortearCategoria}
                  className="w-full max-w-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-black text-2xl py-4 px-8 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:scale-105 active:scale-95 transition-all z-10 border-2 border-yellow-200"
                >
                  {isSpinning ? 'GIRANDO...' : 'GIRAR ROLETA!'}
                </button>
              </>
            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300 z-10">
                <div className="flex items-center gap-3 mb-6 bg-slate-900/80 backdrop-blur-sm px-8 py-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10">
                  <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{categoriaSorteada.icon}</span>
                  <span className="text-3xl font-black uppercase tracking-wider" style={{ color: categoriaSorteada.color, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {categoriaSorteada.name}
                  </span>
                </div>

                <div className="w-full bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/20 mb-8">
                  <h2 className="text-3xl md:text-4xl font-black text-white text-center leading-tight drop-shadow-md">
                    {perguntaAtual.p}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                  {perguntaAtual.options.map((opcao: string, index: number) => {
                    let btnClass = "bg-white/5 border-white/10 text-white hover:border-yellow-400 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(250,204,21,0.3)]";
                    
                    if (isAnswered) {
                      if (opcao === perguntaAtual.r) {
                        btnClass = "bg-green-500 border-green-400 text-white scale-105 shadow-[0_0_20px_rgba(34,197,94,0.6)] z-10"; 
                      } else if (opcao === opcaoSelecionada) {
                        btnClass = "bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]"; 
                      } else {
                        btnClass = "bg-white/5 border-white/10 text-white/30 opacity-50"; 
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(opcao)}
                        disabled={isAnswered}
                        className={`p-6 rounded-2xl border-2 font-black text-xl md:text-2xl transition-all duration-300 backdrop-blur-sm ${btnClass}`}
                      >
                        {opcao}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <button
                    onClick={handleContinuar}
                    className="mt-10 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-2xl py-4 px-12 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] hover:scale-105 active:scale-95 transition-all animate-bounce border-2 border-blue-300"
                  >
                    CONTINUAR ➔
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 text-center backdrop-blur-sm">
            <h2 className={`text-7xl font-display tracking-widest mb-4 drop-shadow-lg ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {timeString}
            </h2>
            
            <div className="w-full bg-slate-800 h-6 rounded-full mb-6 overflow-hidden shadow-inner border border-white/5">
              <div 
                className={`${barColor} h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_currentColor]`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={toggleTimer} 
                disabled={isAnswered || !perguntaAtual}
                className={`flex-1 py-4 rounded-xl font-black text-xl text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 ${isRunning ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'}`}
              >
                {isRunning ? 'PAUSAR' : 'PLAY'}
              </button>
              <button 
                onClick={resetRound} 
                className="flex-1 py-4 rounded-xl font-black text-xl bg-slate-700 text-white hover:bg-slate-600 shadow-lg active:scale-95 transition-all"
              >
                LIMPAR
              </button>
            </div>
          </div>
        </div>

        {/* Painel Direito (Ranking) */}
        <div className="w-full lg:w-1/3 bg-[#1a1a2e] p-6 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-display tracking-wide text-yellow-400 flex items-center justify-center gap-2 drop-shadow-md">
              🏆 Ranking da Turma
            </h2>
            <p className="text-xs text-slate-400 uppercase font-bold mt-2">Adicione os pontos na caixinha e clique em +</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            <div className="flex flex-col gap-3">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className={`flex items-center gap-2 p-3 rounded-2xl border ${player.score > 0 && index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : (player.score > 0 && index === 1 ? 'bg-slate-400/20 border-slate-400/50' : (player.score > 0 && index === 2 ? 'bg-orange-500/20 border-orange-500/50' : 'bg-white/5 border-white/10'))} transition-colors`}>
                  <span className={`font-black text-lg w-8 text-center ${index === 0 && player.score > 0 ? 'text-yellow-400 drop-shadow-md' : (index === 1 && player.score > 0 ? 'text-slate-300 drop-shadow-md' : (index === 2 && player.score > 0 ? 'text-orange-400 drop-shadow-md' : 'text-slate-500'))}`}>
                    {index + 1}º
                  </span>
                  <input 
                    type="text" 
                    value={player.name}
                    onChange={(e) => handlePlayerChange(player.id, 'name', e.target.value)}
                    placeholder={`Aluno ${player.id}`}
                    className="flex-1 w-0 p-2 text-sm font-bold rounded-xl border border-transparent outline-none focus:border-yellow-400/50 bg-black/20 text-white placeholder-slate-600 transition-colors"
                  />
                  <div className="font-black text-yellow-400 w-12 text-center text-xl drop-shadow-md" title="Pontuação Total">
                    {player.score}
                  </div>
                  <input 
                    type="number" 
                    value={player.roundScore}
                    onChange={(e) => handlePlayerChange(player.id, 'roundScore', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayerScore(player.id)}
                    placeholder="+pts"
                    className="w-16 p-2 text-sm font-bold rounded-xl border border-transparent outline-none focus:border-green-400/50 bg-black/20 text-white placeholder-slate-600 text-center transition-colors"
                    title="Pontos da rodada"
                  />
                  <button 
                    onClick={() => addPlayerScore(player.id)}
                    className="bg-green-500 hover:bg-green-400 text-slate-900 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] active:scale-95"
                    title="Adicionar pontos"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

