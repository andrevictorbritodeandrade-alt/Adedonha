import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Trophy, RefreshCw, Bus, AlertCircle, Clock, ZoomIn, User, Medal, Move, Map as MapIcon, ChevronRight, Mail, Copyright, Sparkles, Skull, VolumeX, Volume2, ChevronLeft } from 'lucide-react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'marica-vermelhinho-game';
const apiKey = ""; 

const DISTRICTS = [
  { id: 1, name: '1º Centro', color: 'text-red-500' },
  { id: 2, name: '2º Ponta Negra', color: 'text-blue-500' },
  { id: 3, name: '3º Inoã', color: 'text-green-500' },
  { id: 4, name: '4º Itaipuaçu', color: 'text-yellow-500' }
];

const SCENARIOS = [
  // 1º DISTRITO - CENTRO
  { id: 'aracatiba', district: 1, name: 'Orla de Araçatiba', prompt: 'Wheres Waldo style illustration of Aracatiba Marica lagoon. Crowded park, bikes, thousands of tiny people.' },
  { id: 'estadio', district: 1, name: 'Estádio João Saldanha', prompt: 'Aerial view of Estádio João Saldanha in Marica Brazil. Blue bleachers, red buildings, parking lot with hundreds of tiny cars.' },
  { id: 'jacaroa', district: 1, name: 'Orla de Jacaroá', prompt: 'Crowded playground and boardwalk at Orla de Jacaroa, Marica Brazil. Cluttered lagoon shore, thousands of tiny children.' },
  { id: 'barra', district: 1, name: 'Barra de Maricá', prompt: 'Boardwalk of Barra de Marica beach. Sand packed with thousands of tiny colorful umbrellas and people.' },
  { id: 'henfil', district: 1, name: 'Cine-Teatro Henfil', prompt: 'The bright red building of Cine-Teatro Henfil in Marica city center. Busy street, hundreds of tiny pedestrians.' },
  { id: 'cultura', district: 1, name: 'Casa de Cultura', prompt: 'Historic Casa de Cultura building in Marica center. Cluttered square with many people.' },
  { id: 'pordosol', district: 1, name: 'Deck Pôr-do-sol', prompt: 'Wooden deck at Aracatiba Marica at sunset. Crowded silhouettes of people, lagoon background.' },
  { id: 'matriz', district: 1, name: 'Igreja Matriz', prompt: 'Marica central square and historic Matriz Church. Huge crowd, street vendors, colonial architecture.' },
  { id: 'nanci', district: 1, name: 'Parque Nanci', prompt: 'Busy park at night. Colorful lights, food trucks, children playing, very dense crowd.' },
  { id: 'itapeba', district: 1, name: 'Orla de Itapeba', prompt: 'Area near the Eu Amo Maricá sign. Tourists taking photos, kiosks, busy lagoon shore.' },
  { id: 'marine', district: 1, name: 'Orla do Marine', prompt: 'Boardwalk of Marine Marica. Thousands of joggers, palm trees, and tiny details near lagoon.' },
  { id: 'zacarias', district: 1, name: 'Vila de Zacarias', prompt: 'Traditional fishing village of Zacarias Marica. Cluttered nets, tiny boats, lush forest, and fishermen.' },
  { id: 'pedro', district: 1, name: 'Capela São Pedro', prompt: 'Small white chapel of São Pedro in Araçatiba. Busy religious festival, thousands of tiny details.' },
  { id: 'mesa', district: 1, name: 'Mesa dos Imortais', prompt: 'Square in Araçatiba with statues of writers. Tourists at tables, busy street life.' },

  // 2º DISTRITO - PONTA NEGRA
  { id: 'pontanegra', district: 2, name: 'Praia de Ponta Negra', prompt: 'Extremely crowded beach of Ponta Negra Marica. Thousands of tiny people near the lighthouse.' },
  { id: 'farol', district: 2, name: 'Farol de Ponta Negra', prompt: 'Lighthouse on the hill. Winding trails full of tiny tourists, blue sea background.' },
  { id: 'canal', district: 2, name: 'Canal de Ponta Negra', prompt: 'Narrow water canal at Ponta Negra. Busy banks with fishermen and tiny boats.' },
  { id: 'guaratiba', district: 2, name: 'Orla de Guaratiba', prompt: 'Orla de Guaratiba park. Soccer courts, thousands of people, beach side cluttered cartoon style.' },
  { id: 'cordeirinho', district: 2, name: 'Praia de Cordeirinho', prompt: 'Endless sandy beach of Cordeirinho. Cluttered with thousands of tiny colorful dots representing umbrellas.' },
  { id: 'jacone', district: 2, name: 'Orla de Jaconé', prompt: 'Jaconé beach boardwalk. Many houses, tourists, and cars near the sea, cluttered search style.' },
  { id: 'espraiado', district: 2, name: 'Cachoeira do Espraiado', prompt: 'Waterfalls in the green valley. Tiny hikers, horses, and a busy country festival.' },
  { id: 'sacristia', district: 2, name: 'Praia da Sacristia', prompt: 'Rocky coast of Sacristia. Tiny tide pools, explorers, and crashing waves, cluttered rocks.' },
  { id: 'darcy', district: 2, name: 'Casa Darcy Ribeiro', prompt: 'Modern circular building in Ponta Negra. Coastal garden, tiny tourists and hikers.' },
  { id: 'grutas', district: 2, name: 'Grutas de Ponta Negra', prompt: 'Sea caves at Ponta Negra rocks. People with flashlights, crashing waves, complex textures.' },
  { id: 'castelo', district: 2, name: 'Castelo Shlachticas', prompt: 'Medieval style castle in Bambuí Marica. Curious tourists and unique chaotic architecture.' },
  { id: 'ilha_pedra', district: 2, name: 'Ilha de Pedra', prompt: 'Rocky island near Ponta Negra. Tiny birds, splashing waves, and hikers on the rocks.' },
  { id: 'bertha', district: 2, name: 'Ecomuseu Bertha Lutz', prompt: 'Environmental center in Espraiado forest. Cluttered forest trails, tiny hikers.' },

  // 3º DISTRITO - INOÃ
  { id: 'aldeia', district: 3, name: 'Aldeia Indígena', prompt: 'Indigenous village in Inoã. Huts, traditional attire, dense forest, extremely detailed cartoon.' },
  { id: 'transmarica', district: 3, name: 'Transmaricá', prompt: 'The long hiking trail. Forest sections, hundreds of tiny backpackers and trail markers.' },
  { id: 'caxito', district: 3, name: 'Capela N.S. da Saúde', prompt: 'Historic chapel in Caxito. Rural setting, local festival, old trees and tiny characters.' },

  // 4º DISTRITO - ITAIPUAÇU
  { id: 'itaipuacu', district: 4, name: 'Orla de Itaipuaçu', prompt: 'Modern boardwalk of Itaipuaçu beach. Red bike paths, thousands of people, sunset, chaotic.' },
  { id: 'recanto', district: 4, name: 'Praia do Recanto', prompt: 'Beach area at foot of hill. Crowded with kiosks, boats, and sunbathers in Itaipuaçu.' },
  { id: 'elefante', district: 4, name: 'Pedra do Elefante', prompt: 'Mountain trails of Elephant Rock. Vertical landscape full of tiny climbers and hikers.' },
  { id: 'camburi', district: 4, name: 'Serra do Camburi', prompt: 'Mountain top view with paragliders. Panoramic view of Marica from above, tiny trails.' },
  { id: 'silvado', district: 4, name: 'Pico do Silvado', prompt: 'Rocky peak of Silvado. Hikers, clouds, and a complex green landscape full of tiny details.' },
  { id: 'lagoinha', district: 4, name: 'Pico da Lagoinha', prompt: 'Hills of Pico da Lagoinha. Dense vegetation, hidden trails, and many explorers.' },
  { id: 'macaco', district: 4, name: 'Pedra do Macaco', prompt: 'Rock formation in São José. Climbers, hikers, and a bird-eye view of town.' },
  { id: 'mirante', district: 4, name: 'Mirante de Itaipuaçu', prompt: 'Viewing deck on the mountain road. Hundreds of tiny cars and people looking at coast.' }
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Fácil', scale: 100, zoom: 1.5, label: 'Passageiro Comum' },
  { id: 'medium', name: 'Médio', scale: 60, zoom: 2.5, label: 'Nível Sinistro' },
  { id: 'hard', name: 'Difícil', scale: 30, zoom: 4, label: 'Expert Impossível' }
];

interface VermelhinhoProps {
  onBack: () => void;
}

export default function Vermelhinho({ onBack }: VermelhinhoProps) {
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState('menu'); 
  const [selectedDistrict, setSelectedDistrict] = useState(1);
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [busData, setBusData] = useState({ x: 0, y: 0, rotation: 0, opacity: 1 });
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState('Geral');
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const initAuth = async () => {
      // @ts-ignore
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // @ts-ignore
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const leaderboardRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
    const unsubscribe = onSnapshot(leaderboardRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data);
    });
    return () => unsubscribe();
  }, [user]);

  const generateScene = async () => {
    setGameState('loading');
    setError(null);
    setOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: { prompt: `${scenario.prompt}. High resolution search and find style illustration.` },
          parameters: { sampleCount: 1 }
        })
      });
      const result = await response.json();
      if (!result.predictions?.[0]?.bytesBase64Encoded) throw new Error();
      setBackgroundImage(`data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`);
    } catch (err) {
      // Silent Retry: Fallback para imagem estática (cache offline simulado)
      console.warn("API de imagem falhou, usando imagem de fallback offline.");
      setBackgroundImage(`https://picsum.photos/seed/${scenario.id}/1920/1080?blur=2`);
    }
    
    setBusData({
      x: Math.random() * 88 + 6,
      y: Math.random() * 88 + 6,
      rotation: Math.random() * 360,
      opacity: difficulty.id === 'hard' ? 0.75 : 0.95
    });
    setGameState('playing');
    setTimer(0);
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel === 1) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleZoom = () => {
    if (zoomLevel > 1) {
      setZoomLevel(1);
      setOffset({ x: 0, y: 0 });
    } else {
      setZoomLevel(difficulty.zoom);
    }
  };

  const handleBusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return; 
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('found');
  };

  const saveScore = async () => {
    if (!playerName.trim() || !user) return;
    setIsSaving(true);
    try {
      const leaderboardRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
      await addDoc(leaderboardRef, {
        name: playerName.toUpperCase(),
        time: timer,
        scenario: scenario.name,
        difficulty: difficulty.name,
        timestamp: new Date().toISOString()
      });
      setGameState('menu');
      setPlayerName('');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredScenarios = SCENARIOS.filter(s => s.district === selectedDistrict);
  
  // Filtrar Leaderboard
  const sortedLeaderboard = leaderboard
    .filter(entry => leaderboardFilter === 'Geral' || entry.difficulty === leaderboardFilter)
    .sort((a, b) => a.time - b.time)
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center p-4 select-none overflow-hidden relative">
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 hover:bg-slate-700 transition-all shadow-xl flex items-center gap-2 font-group-b text-white"
      >
        <ChevronLeft size={18} /> Voltar
      </button>

      <header className="py-2 text-center mt-12 w-full px-4">
        <h1 className="font-group-a text-3xl md:text-5xl flex items-center justify-center gap-2 w-full break-words">
          <Bus size={40} className="animate-pulse text-red-600 shrink-0" /> ONDE ESTÁ O VERMELHINHO?
        </h1>
      </header>

      <main className="w-full max-w-6xl bg-slate-900 rounded-[2rem] p-4 md:p-8 shadow-2xl border border-slate-800 relative mb-2">
        
        {gameState === 'menu' && (
          <div className="grid lg:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-300">
            <div className="lg:col-span-3 space-y-6">
              {error && <div className="p-3 bg-red-950 border border-red-500 rounded-xl text-center text-xs font-black">{error}</div>}
              
              {/* DISTRITO SELECTOR */}
              <div>
                <h2 className="font-group-b text-lg mb-3 flex items-center gap-2 text-white"><MapIcon className="text-red-500" size={18}/> Escolha o distrito</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DISTRICTS.map(d => (
                    <button 
                      key={d.id} 
                      onClick={() => setSelectedDistrict(d.id)}
                      className={`p-3 rounded-xl border-2 transition-all font-group-b text-sm ${selectedDistrict === d.id ? 'border-red-600 bg-red-600/20 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'}`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCENARIO LIST (FILTERED) */}
              <div>
                <h2 className="font-group-b text-lg mb-3 flex items-center gap-2 text-white"><MapPin className="text-red-500" size={18}/> Próxima parada</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredScenarios.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => setScenario(s)} 
                      className={`p-3 rounded-xl border-2 transition-all font-group-b text-xs h-16 leading-tight ${scenario.id === s.id ? 'border-red-600 bg-red-600/20 text-white shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-group-b text-lg mb-3 flex items-center gap-2 text-white"><AlertCircle className="text-yellow-500" size={18}/> Nível</h2>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d.id} onClick={() => setDifficulty(d)} className={`p-3 rounded-xl border-2 transition-all text-left ${difficulty.id === d.id ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-slate-800 bg-slate-800/40 text-slate-400'}`}>
                      <div className="font-group-b text-sm text-white">{d.name}</div>
                      <div className="text-[10px] opacity-80">{d.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generateScene} className="w-full py-6 bg-red-600 hover:bg-red-500 rounded-3xl text-3xl font-group-a shadow-xl active:scale-95 transition-all">PEGAR O VERMELHINHO</button>
            </div>
            
            <div className="bg-black/30 rounded-3xl p-4 border border-white/5 space-y-3 flex flex-col">
              <h2 className="text-sm font-black flex items-center gap-2 text-yellow-500 uppercase italic tracking-tighter"><Medal size={16} /> Hall da Fama</h2>
              
              {/* FILTRO DO PLACAR */}
              <div className="flex flex-wrap gap-1 mb-2 border-b border-white/5 pb-2">
                {['Geral', 'Fácil', 'Médio', 'Difícil'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setLeaderboardFilter(f)}
                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${leaderboardFilter === f ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {sortedLeaderboard.map((entry, i) => (
                  <div key={entry.id} className="p-2 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div className="truncate pr-2">
                      <div className="text-[10px] font-black truncate flex items-center gap-1">
                        <span className="text-red-500">{i+1}º</span> {entry.name}
                      </div>
                      <div className="text-[8px] text-slate-500 uppercase leading-none flex items-center gap-1">
                         <span>{entry.difficulty}</span> • <span>{entry.scenario}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-yellow-500">{formatTime(entry.time)}</div>
                  </div>
                ))}
                {sortedLeaderboard.length === 0 && (
                  <p className="text-[10px] text-slate-600 italic text-center py-4">Nenhum recorde neste nível ainda!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {gameState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <Bus size={80} className="text-red-600 animate-bounce" />
            <h3 className="text-3xl font-group-a text-center">VIAJANDO PARA {scenario.name.toUpperCase()}...</h3>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="bg-black px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-yellow-400 font-mono font-black text-xl">
                  <Clock size={20}/> {formatTime(timer)}
                </div>
                <div className="text-left">
                  <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 leading-none">Local Atual</div>
                  <div className="text-sm font-black text-white uppercase italic leading-none">{scenario.name} • {difficulty.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleZoom} 
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black uppercase text-sm transition-all shadow-lg ${zoomLevel > 1 ? 'bg-yellow-500 text-black scale-105' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                >
                  {zoomLevel > 1 ? <><Move size={18}/> Arrastar Mapa</> : <><ZoomIn size={18}/> Activar Lupa</>}
                </button>
                <button onClick={() => setGameState('menu')} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><RefreshCw size={24}/></button>
              </div>
            </div>
            
            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative w-full aspect-[16/10] bg-black rounded-[2rem] overflow-hidden border-4 border-slate-800 shadow-2xl transition-all ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
            >
              <div 
                className="w-full h-full transition-transform duration-300 ease-out"
                style={{ 
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center'
                }}
              >
                {backgroundImage && <img src={backgroundImage} alt="Map" className="w-full h-full object-cover select-none pointer-events-none" draggable="false" />}
                <div onClick={handleBusClick} style={{ left: `${busData.x}%`, top: `${busData.y}%`, width: `${difficulty.scale}px`, height: `${difficulty.scale * 0.6}px`, transform: `translate(-50%, -50%) rotate(${busData.rotation}deg)`, opacity: busData.opacity }} className="absolute cursor-pointer transition-all hover:scale-[1.5] z-10">
                  <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
                     <rect x="5" y="10" width="90" height="40" rx="8" fill="#dc2626" />
                     <rect x="70" y="15" width="20" height="15" rx="2" fill="#bae6fd" />
                     <rect x="10" y="15" width="55" height="15" rx="2" fill="#bae6fd" />
                     <circle cx="25" cy="50" r="8" fill="#000" />
                     <circle cx="75" cy="50" r="8" fill="#000" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'found' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center animate-in zoom-in">
            <div className="bg-yellow-500 p-10 rounded-full shadow-2xl animate-bounce">
              <Trophy size={80} className="text-black" />
            </div>
            <h2 className="text-5xl font-group-a text-center">CHEGOU AO DESTINO!</h2>
            <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-white/10 w-full max-w-md shadow-2xl">
              <div className="text-3xl font-group-a mb-2 opacity-80">{difficulty.name.toUpperCase()}</div>
              <div className="text-5xl font-black text-red-500 mb-6 font-mono">{formatTime(timer)}</div>
              <input type="text" placeholder="SEU NOME" maxLength={12} value={playerName} onChange={(e) => setPlayerName(e.target.value.toUpperCase())} className="w-full p-4 bg-black border-2 border-slate-700 rounded-2xl text-center font-black outline-none mb-4 uppercase" />
              <button disabled={!playerName.trim() || isSaving} onClick={saveScore} className="w-full py-4 bg-red-600 disabled:opacity-50 rounded-2xl text-2xl font-group-a shadow-lg transition-all">REGISTRAR MARCA</button>
            </div>
            <button onClick={() => setGameState('menu')} className="text-slate-400 hover:text-white font-group-b text-sm transition-colors">Voltar ao Menu</button>
          </div>
        )}
      </main>

      {/* RODAPÉ ATUALIZADO E TOTALMENTE CENTRALIZADO */}
      <footer className="w-full max-w-6xl mt-6 pb-12 border-t border-slate-900 pt-8 flex flex-col items-center text-center gap-3 text-slate-500">
        <div className="space-y-1">
          <p className="text-[13px] md:text-sm font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 leading-none">
            DESENVOLVIDO POR ANDRÉ VICTOR BRITO DE ANDRADE <span className="text-[11px] leading-none select-none">®</span>
          </p>
          
          <div className="flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition-colors py-1">
            <Mail size={14} className="shrink-0" />
            <a href="mailto:andrevictorbritodeandrade@gmail.com" className="text-[11px] md:text-xs font-mono tracking-tight leading-none">
              andrevictorbritodeandrade@gmail.com
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] uppercase font-black tracking-[0.2em] opacity-50">
            <Copyright size={12} className="shrink-0" />
            <span>2026 Todos os direitos reservados</span>
          </div>
          
          <span className="hidden md:inline opacity-20 text-slate-700">•</span>
          
          <div className="bg-slate-800/50 px-3 py-1 rounded-md border border-white/5">
            <span className="text-[10px] md:text-[11px] text-slate-300 italic font-black uppercase tracking-widest">
              VERSÃO 1.0.0
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
      `}</style>
    </div>
  );
}
