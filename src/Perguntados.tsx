import React, { useState, useEffect, useRef } from 'react';

const CATEGORIAS = [
  { id: 1, name: "Português", icon: "📚", color: "#1982C4" },
  { id: 2, name: "Matemática", icon: "🔢", color: "#FF595E" },
  { id: 3, name: "Geografia", icon: "🌍", color: "#8AC926" },
  { id: 4, name: "História", icon: "🏛️", color: "#FFCA3A" },
  { id: 5, name: "Ciências", icon: "🔬", color: "#2A9D8F" },
  { id: 6, name: "Entretenimento", icon: "🍿", color: "#FF99C8" },
  { id: 7, name: "Educação Física", icon: "⚽", color: "#F4A261" },
  { id: 8, name: "Artes", icon: "🎨", color: "#6A4C93" },
  { id: 9, name: "Inglês", icon: "🇺🇸", color: "#264653" },
  { id: 10, name: "Francês", icon: "🇫🇷", color: "#E76F51" },
];

const TEMPO_INICIAL = 60; // 1 minuto para responder

export default function Perguntados({ onBack }: { onBack: () => void }) {
  const [timeLeft, setTimeLeft] = useState(TEMPO_INICIAL);
  const [isRunning, setIsRunning] = useState(false);
  const [categoriaSorteada, setCategoriaSorteada] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const audioCtxRef = useRef(null);
  
  const [players, setPlayers] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: '', score: 0, roundScore: '' }))
  );

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
      setCategoriaSorteada(CATEGORIAS[targetIndex]);
      setIsSpinning(false);
      setIsRunning(true);
    }, 3000);
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((tempoAnterior) => {
          if (tempoAnterior <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            return 0;
          }
          return tempoAnterior - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && categoriaSorteada) {
      playDing();
    } else if (isRunning && timeLeft <= 10 && timeLeft > 0) {
      playBeep();
    }
  }, [timeLeft, isRunning, categoriaSorteada]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetRound = () => {
    setIsRunning(false);
    setTimeLeft(TEMPO_INICIAL);
    setCategoriaSorteada(null);
  };

  const handlePlayerChange = (id, field, value) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayerScore = (id) => {
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
  const barColor = timeLeft <= 10 ? 'bg-red-500' : (timeLeft <= 30 ? 'bg-yellow-500' : 'bg-green-500');

  const isShaking = isRunning && timeLeft <= 10 && timeLeft > 0;

  return (
    <div className={`min-h-screen bg-slate-100 font-sans p-2 md:p-4 text-slate-800 ${isShaking ? 'animate-msn-shake' : ''}`}>
      
      <header className="text-center mb-4 mt-2 relative">
        <button 
          onClick={onBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white text-orange-600 font-bold py-2 px-4 rounded-lg shadow hover:bg-orange-50 transition-colors border border-orange-200"
        >
          ⬅ Voltar
        </button>
        <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-sm">
          <span className="inline-block animate-bounce mr-2">❓</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 uppercase">
            SUPER PERGUNTADOS!
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>🧠</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">Gire a roleta e responda à pergunta!</p>
      </header>

      <div className="max-w-[1200px] w-full mx-auto flex flex-col lg:flex-row gap-6 justify-center">
        
        {/* Painel Esquerdo (Roleta e Timer) */}
        <div className="w-full lg:w-1/2 bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col">
          
          <div className="bg-orange-50 p-6 rounded-lg flex flex-col items-center justify-center mb-6 border border-orange-100">
            {/* Roleta */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-8 mt-4">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-0 h-0 border-l-[16px] border-r-[16px] border-t-[32px] border-l-transparent border-r-transparent border-t-red-600 z-20 drop-shadow-md"></div>
              
              {/* Wheel */}
              <div 
                className="w-full h-full rounded-full border-8 border-white relative overflow-hidden shadow-xl"
                style={{
                  background: `conic-gradient(from -${360 / CATEGORIAS.length / 2}deg, ${CATEGORIAS.map((cat, i) => `${cat.color} ${i * (360/CATEGORIAS.length)}deg ${(i+1) * (360/CATEGORIAS.length)}deg`).join(', ')})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                {CATEGORIAS.map((cat, i) => (
                  <div 
                    key={cat.id}
                    className="absolute top-0 left-1/2 origin-bottom flex flex-col items-center pt-2"
                    style={{
                      height: '50%',
                      transform: `translateX(-50%) rotate(${i * (360/CATEGORIAS.length)}deg)`,
                      width: '60px'
                    }}
                  >
                    <span className="text-2xl drop-shadow-md mb-1">{cat.icon}</span>
                    <span className="block text-center font-black text-white drop-shadow-md text-[10px] leading-tight uppercase" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-orange-600 rounded-full z-10 shadow-lg border-4 border-white flex items-center justify-center">
                <span className="text-white font-black text-xl">?</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center w-full gap-4">
              <button
                onClick={sortearCategoria}
                disabled={isSpinning}
                className="w-full max-w-xs bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-xl py-4 px-8 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSpinning ? 'GIRANDO...' : 'GIRAR ROLETA!'}
              </button>

              <div className="w-full bg-white p-4 rounded-xl border-2 border-orange-200 text-center min-h-[100px] flex flex-col justify-center items-center">
                <p className="text-sm font-bold text-orange-400 uppercase mb-1">Categoria Sorteada</p>
                {categoriaSorteada ? (
                  <div className={`flex items-center gap-3 ${isSpinning ? 'opacity-50' : 'animate-bounce'}`}>
                    <span className="text-4xl">{categoriaSorteada.icon}</span>
                    <span className="text-3xl font-black uppercase" style={{ color: categoriaSorteada.color }}>
                      {categoriaSorteada.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-black text-slate-300">???</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
            <h2 className="text-6xl font-black font-mono text-slate-700 mb-4">{timeString}</h2>
            
            <div className="w-full bg-slate-200 h-6 rounded-full mb-6 overflow-hidden shadow-inner">
              <div 
                className={`${barColor} h-full transition-all duration-1000 ease-linear`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={toggleTimer} 
                className={`flex-1 py-3 rounded-xl font-black text-xl text-white shadow-md active:scale-95 transition-transform ${isRunning ? 'bg-orange-500' : 'bg-green-500'}`}
              >
                {isRunning ? 'PAUSAR' : 'PLAY'}
              </button>
              <button 
                onClick={resetRound} 
                className="flex-1 py-3 rounded-xl font-black text-xl bg-slate-200 text-slate-700 shadow-md active:scale-95 transition-transform"
              >
                LIMPAR
              </button>
            </div>
          </div>
        </div>

        {/* Painel Direito (Ranking) */}
        <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow-md border border-slate-200 flex flex-col">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-orange-600 flex items-center justify-center gap-2">
              🏆 Ranking da Turma
            </h2>
            <p className="text-xs text-slate-500 uppercase font-bold mt-1">Adicione os pontos na caixinha e clique em +</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className="flex flex-col gap-2">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className={`flex items-center gap-2 p-2 rounded-xl border-2 ${player.score > 0 && index === 0 ? 'bg-yellow-50 border-yellow-300' : (player.score > 0 && index === 1 ? 'bg-slate-100 border-slate-300' : (player.score > 0 && index === 2 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'))}`}>
                  <span className={`font-black text-sm w-6 text-center ${index === 0 && player.score > 0 ? 'text-yellow-600' : (index === 1 && player.score > 0 ? 'text-slate-500' : (index === 2 && player.score > 0 ? 'text-orange-600' : 'text-slate-400'))}`}>
                    {index + 1}º
                  </span>
                  <input 
                    type="text" 
                    value={player.name}
                    onChange={(e) => handlePlayerChange(player.id, 'name', e.target.value)}
                    placeholder={`Aluno ${player.id}`}
                    className="flex-1 w-0 p-2 text-sm font-bold rounded-lg border border-slate-300 outline-none focus:border-orange-400 bg-white"
                  />
                  <div className="font-black text-orange-600 w-10 text-center text-lg" title="Pontuação Total">
                    {player.score}
                  </div>
                  <input 
                    type="number" 
                    value={player.roundScore}
                    onChange={(e) => handlePlayerChange(player.id, 'roundScore', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayerScore(player.id)}
                    placeholder="+pts"
                    className="w-14 p-2 text-sm font-bold rounded-lg border border-slate-300 outline-none focus:border-orange-400 bg-white text-center"
                    title="Pontos da rodada"
                  />
                  <button 
                    onClick={() => addPlayerScore(player.id)}
                    className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg transition-colors shadow-sm active:scale-95"
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
