import React, { useState, useEffect, useRef } from 'react';

const temas = [
  { id: 1, name: "Nome de Pessoa", icon: "👧👦" },
  { id: 2, name: "Animal ou Bicho", icon: "🐶" },
  { id: 3, name: "Comida ou Doce", icon: "🍎" },
  { id: 4, name: "Cor", icon: "🎨" },
  { id: 5, name: "Cantor(a)/Banda", icon: "🎤" },
  { id: 6, name: "Desenho ou Filme", icon: "🎬" },
  { id: 7, name: "Minha sogra é", icon: "👵" },
  { id: 8, name: "Super-herói", icon: "🦸" },
  { id: 9, name: "Parte do Corpo", icon: "👃" },
  { id: 10, name: "Lugar", icon: "🏠" },
];

const TEMPO_INICIAL = 5 * 60; // 5 minutos em segundos
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const pointOptions = [
  { value: 0, label: "Branco", icon: "❌" },
  { value: 5, label: "Igual", icon: "🤝" },
  { value: 10, label: "Diferente", icon: "🌟" },
  { value: 15, label: "Único!", icon: "👑" }
];

export default function App() {
  const [timeLeft, setTimeLeft] = useState(TEMPO_INICIAL);
  const [isRunning, setIsRunning] = useState(false);
  const [scores, setScores] = useState({});
  const [respostas, setRespostas] = useState({});
  const [letraSorteada, setLetraSorteada] = useState("?");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const audioCtxRef = useRef(null);

  const playTick = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtxRef.current.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.05);
      
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.05);
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

  // Roleta segura
  const sortearLetra = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLetraSorteada("?");
    setIsRunning(false);
    setTimeLeft(TEMPO_INICIAL);
    
    const targetIndex = Math.floor(Math.random() * ALFABETO.length);
    const targetAngle = 360 - (targetIndex * (360 / 26));
    const extraSpins = 5 * 360; // 5 full spins
    
    const currentMod = rotation % 360;
    let diff = targetAngle - currentMod;
    if (diff < 0) diff += 360;
    
    const newRotation = rotation + extraSpins + diff;
    
    setRotation(newRotation);

    // Efeitos sonoros
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
    
    // Iniciar som
    tick();
    
    setTimeout(() => {
      setLetraSorteada(ALFABETO[targetIndex]);
      setIsSpinning(false);
      setIsRunning(true);
    }, 3000);
  };

  // MOTOR DO RELÓGIO CORRIGIDO: Não causa bloqueio no Android
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
    
    // Limpeza segura ao pausar ou desmontar
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]); // Só reage quando o isRunning muda (Play/Pausa), não a cada segundo!

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetRound = () => {
    setIsRunning(false);
    setTimeLeft(TEMPO_INICIAL);
    setScores({});
    setRespostas({});
    setLetraSorteada("?");
  };

  const handleScore = (themeId, points) => {
    setScores(prev => ({ ...prev, [themeId]: points }));
  };

  const handleResposta = (themeId, texto) => {
    setRespostas(prev => ({ ...prev, [themeId]: texto }));
  };

  const totalScore = temas.reduce((total, tema) => {
    return total + (scores[tema.id] || 0);
  }, 0);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const percentage = (timeLeft / TEMPO_INICIAL) * 100;
  const barColor = timeLeft <= 60 ? 'bg-red-500' : (timeLeft <= 120 ? 'bg-yellow-500' : 'bg-green-500');

  return (
    <div className="min-h-screen bg-slate-100 font-sans p-2 md:p-6 text-slate-800">
      
      <header className="text-center mb-4">
        <h1 className="text-3xl font-extrabold text-indigo-600 mb-1">🛑 Adedonha</h1>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4">
        
        {/* Painel Esquerdo */}
        <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow-md border border-slate-200">
          
          <div className="bg-indigo-50 p-4 rounded-lg flex flex-col items-center justify-center mb-4 border border-indigo-100">
            {/* Roleta */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 mb-6 mt-2">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-600 z-20 drop-shadow-md"></div>
              
              {/* Wheel */}
              <div 
                className="w-full h-full rounded-full border-4 border-indigo-600 relative overflow-hidden shadow-inner"
                style={{
                  background: `conic-gradient(from -${360 / 26 / 2}deg, ${ALFABETO.map((_, i) => `${i % 2 === 0 ? '#e0e7ff' : '#c7d2fe'} ${i * (360/26)}deg ${(i+1) * (360/26)}deg`).join(', ')})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                {ALFABETO.map((letra, i) => (
                  <div 
                    key={letra}
                    className="absolute top-0 left-1/2 origin-bottom"
                    style={{
                      height: '50%',
                      transform: `translateX(-50%) rotate(${i * (360/26)}deg)`,
                      width: '24px'
                    }}
                  >
                    <span className="block text-center font-bold text-indigo-800 text-xs sm:text-sm mt-1">
                      {letra}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-800 rounded-full z-10 shadow-md border-2 border-white"></div>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="text-center flex-1">
                <p className="text-xs font-bold text-indigo-400 uppercase">Sorteada</p>
                <p className={`text-4xl font-black text-indigo-600 h-10 flex items-center justify-center ${isSpinning ? 'opacity-50' : 'scale-110 transition-transform'}`}>
                  {letraSorteada}
                </p>
              </div>
              <button
                onClick={sortearLetra}
                disabled={isSpinning}
                className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg active:bg-indigo-700 disabled:bg-indigo-300 shadow-md transition-transform active:scale-95"
              >
                {isSpinning ? 'Girando...' : 'Girar Roleta'}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 text-center">
            <h2 className="text-4xl font-black font-mono text-slate-700 mb-2">{timeString}</h2>
            
            <div className="w-full bg-slate-200 h-4 rounded-full mb-4 overflow-hidden">
              <div 
                className={`${barColor} h-full transition-all duration-1000 ease-linear`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={toggleTimer} 
                className={`flex-1 py-2 rounded-lg font-bold text-white ${isRunning ? 'bg-orange-500' : 'bg-green-500'}`}
              >
                {isRunning ? 'Pausar' : 'Play'}
              </button>
              <button 
                onClick={resetRound} 
                className="flex-1 py-2 rounded-lg font-bold bg-slate-200 text-slate-700"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="bg-slate-800 text-white p-4 rounded-lg text-center">
            <p className="text-xs font-bold uppercase text-slate-300">Pontuação Total</p>
            <p className="text-4xl font-black">{totalScore}</p>
          </div>

        </div>

        {/* Painel Direito (Temas) */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {temas.map((tema, index) => (
            <div key={tema.id} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-slate-400 font-bold text-sm w-4">{index + 1}.</span>
                <span className="text-lg">{tema.icon}</span>
                <span className="text-sm font-bold text-slate-700 truncate">{tema.name}</span>
              </div>
              
              <input
                type="text"
                value={respostas[tema.id] || ''}
                onChange={(e) => handleResposta(tema.id, e.target.value)}
                placeholder="Escreva aqui..."
                className="w-full p-1.5 text-sm mb-2 rounded-lg border border-slate-300 bg-slate-50 outline-none focus:border-indigo-400"
              />
              
              <div className="grid grid-cols-4 gap-1">
                {pointOptions.map((opt) => {
                  const isSelected = scores[tema.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleScore(tema.id, opt.value)}
                      className={`py-0.5 flex flex-col items-center justify-center rounded-lg border ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-xs">{opt.icon}</span>
                      <span className="font-bold text-xs">{opt.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
