import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';

// Configurações do Jogo
const GAME_DURATION = 90; 
const LANES_COUNT = 5;
const COLORS = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7']; 
const SYMBOLS = ['↑', '↓', '←', '→', '●'];

const TouchHero = ({ onBack }: { onBack: () => void }) => {
  const [gameState, setGameState] = useState('menu'); 
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('André Brito');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const notesRef = useRef<any[]>([]);
  const lastNoteTime = useRef(0);
  const hitEffects = useRef(new Array(LANES_COUNT).fill(0)); 

  // Refs para Áudio (Sintetizador)
  const audioCtx = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const beatCount = useRef(0);

  // Variáveis de dificuldade
  const currentSpeed = useRef(4);
  const spawnInterval = useRef(1000);

  // Inicializa o Áudio Context (Precisa de interação do usuário)
  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  // Função para tocar um "Beat" de suspense (Estilo Tubarão/Missão Impossível)
  const playPulse = (time: number, frequency: number, type: OscillatorType = 'triangle', volume = 0.1) => {
    if (isMuted || !audioCtx.current) return;
    
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
  };

  // Sequenciador da trilha sonora adaptativa
  const scheduleAudio = useCallback(() => {
    if (gameState !== 'playing' || isMuted || !audioCtx.current) return;

    const elapsed = GAME_DURATION - timeLeft;
    const progress = elapsed / GAME_DURATION;
    
    const bpm = 60 + (progress * 120);
    const secondsPerBeat = 60 / bpm;

    while (nextNoteTime.current < audioCtx.current.currentTime + 0.1) {
      const time = nextNoteTime.current;
      
      const isEven = beatCount.current % 2 === 0;
      const baseFreq = isEven ? 41.20 : 43.65; // E1 e F1
      
      const tensionFreq = baseFreq * (1 + Math.floor(progress * 3));
      
      playPulse(time, tensionFreq, 'triangle', 0.15);

      if (beatCount.current % 4 === 0) {
        playPulse(time, 220 * (1 + progress), 'sawtooth', 0.05);
      }

      nextNoteTime.current += secondsPerBeat;
      beatCount.current++;
    }
  }, [gameState, timeLeft, isMuted]);

  const startGame = () => {
    initAudio();
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(GAME_DURATION);
    notesRef.current = [];
    currentSpeed.current = 4;
    spawnInterval.current = 1000;
    if (audioCtx.current) {
      nextNoteTime.current = audioCtx.current.currentTime;
    }
    beatCount.current = 0;
    setGameState('playing');
  };

  const updateDifficulty = useCallback(() => {
    const elapsed = GAME_DURATION - timeLeft;
    const tier = Math.floor(elapsed / 15); 
    currentSpeed.current = 4 + (tier * 1.8);
    spawnInterval.current = Math.max(150, 1000 - (tier * 150));
    
    scheduleAudio();
  }, [timeLeft, scheduleAudio]);

  const handleInput = (laneIndex: number) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const strikeZoneY = canvas.height - 100;
    const tolerance = 80;

    let found = false;
    notesRef.current = notesRef.current.filter(note => {
      if (!found && note.lane === laneIndex && Math.abs(note.y - strikeZoneY) < tolerance) {
        setScore(prev => prev + 15);
        setHits(prev => prev + 1);
        found = true;
        hitEffects.current[laneIndex] = 15; 
        
        if (!isMuted && audioCtx.current) playPulse(audioCtx.current.currentTime, 880, 'sine', 0.1);
        
        return false;
      }
      return true;
    });

    if (!found) {
      setScore(prev => Math.max(0, prev - 5));
      setMisses(prev => prev + 1);
      if (!isMuted && audioCtx.current) playPulse(audioCtx.current.currentTime, 110, 'square', 0.1);
    }
  };

  const createNote = useCallback((timestamp: number) => {
    if (timestamp - lastNoteTime.current > spawnInterval.current) {
      const lane = Math.floor(Math.random() * LANES_COUNT);
      notesRef.current.push({
        id: Date.now() + Math.random(),
        lane,
        y: -50,
        color: COLORS[lane],
        symbol: SYMBOLS[lane]
      });
      lastNoteTime.current = timestamp;
    }
  }, []);

  const update = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    const laneWidth = width / LANES_COUNT;

    for (let i = 0; i < LANES_COUNT; i++) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(i * laneWidth, 0, laneWidth, height);
      
      const targetY = height - 100;
      const targetX = i * laneWidth + laneWidth / 2;

      if (hitEffects.current[i] > 0) {
        const opacity = hitEffects.current[i] / 15;
        const scale = (15 - hitEffects.current[i]) * 5;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 35 + scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        hitEffects.current[i]--;
      }

      ctx.beginPath();
      ctx.arc(targetX, targetY, 40, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS[i];
      ctx.lineWidth = 6;
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
    }

    updateDifficulty();
    createNote(timestamp);
    
    notesRef.current.forEach(note => {
      note.y += currentSpeed.current;
      ctx.beginPath();
      ctx.arc(note.lane * laneWidth + laneWidth / 2, note.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = note.color;
      ctx.shadowBlur = 25;
      ctx.shadowColor = note.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.symbol, note.lane * laneWidth + laneWidth / 2, note.y);
    });

    notesRef.current = notesRef.current.filter(n => n.y < height + 50);
    requestRef.current = requestAnimationFrame(update);
  }, [createNote, updateDifficulty]);

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setGameState('finished');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = Math.min(window.innerWidth * 0.95, 500);
        canvasRef.current.height = window.innerHeight * 0.6; 
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center overflow-hidden touch-none select-none relative">
      
      {/* Botão Voltar */}
      <button 
        onClick={onBack}
        className="absolute left-4 top-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/20"
      >
        <ChevronLeft size={24} />
      </button>

      {/* HUD - Cabeçalho TOUCH HERO */}
      <header className="w-full bg-zinc-900/50 backdrop-blur-md p-4 pl-16 flex justify-between items-center border-b-2 border-red-600/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center overflow-hidden bg-slate-800">
             <span className="text-[10px] font-bold">HERO</span>
          </div>
          <div>
            <h2 className="text-xs font-black text-blue-400 uppercase tracking-tighter italic">Touch Hero v1.0</h2>
            <p className="text-lg font-black leading-none">{playerName}</p>
          </div>
        </div>
        
        <div className="flex gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 bg-white/5 rounded-lg border border-white/10"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <div className="text-right">
                <span className="block text-[10px] text-zinc-500 font-bold uppercase">Tempo</span>
                <span className={`text-3xl font-mono font-black ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
                    {timeLeft}s
                </span>
            </div>
            <div className="text-right">
                <span className="block text-[10px] text-zinc-500 font-bold uppercase">Pontos</span>
                <span className="text-3xl font-black text-red-600">{score}</span>
            </div>
        </div>
      </header>

      <main className="relative flex-grow flex items-center justify-center w-full max-w-lg overflow-hidden">
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-8 text-center">
            <div className="mb-6 w-24 h-24 border-4 border-red-600 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-4xl">⚡</span>
            </div>
            <h1 className="text-6xl font-black mb-2 italic tracking-tighter">TOUCH <span className="text-red-600 underline">HERO</span></h1>
            <p className="text-zinc-400 mb-8 max-w-xs text-sm uppercase tracking-widest font-bold">
                Desafio de Atenção Máxima
            </p>
            <button 
              onClick={startGame}
              className="bg-red-600 hover:bg-red-700 text-white px-16 py-6 rounded-none font-black text-3xl skew-x-[-10deg] shadow-[10px_10px_0_white] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              INICIAR DESAFIO
            </button>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-2xl p-8 text-center">
            <h2 className="text-5xl font-black mb-8 tracking-tighter text-white italic">TOUCH HERO FINALIZADO</h2>
            
            <div className="bg-zinc-900 border-l-8 border-red-600 p-8 w-full max-w-sm shadow-2xl space-y-4 text-left">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
                    <span className="text-zinc-500 uppercase text-xs font-bold">Herói Operacional:</span>
                    <span className="font-bold text-xl">{playerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-[10px] text-zinc-500 uppercase">Acertos</span>
                        <span className="text-3xl font-black text-emerald-500">{hits}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-zinc-500 uppercase">Falhas</span>
                        <span className="text-3xl font-black text-red-600">{misses}</span>
                    </div>
                </div>
                <div className="pt-4">
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold">Ranking Final (Pontos):</span>
                    <span className="text-6xl font-black text-white">{score}</span>
                </div>
            </div>

            <button 
              onClick={startGame}
              className="mt-12 border-2 border-white px-12 py-4 font-black text-xl hover:bg-white hover:text-black transition-all"
            >
              REINICIAR DESAFIO
            </button>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          className="bg-zinc-900/40 cursor-crosshair border-x border-white/5"
          onPointerDown={(e) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const laneWidth = canvasRef.current.width / LANES_COUNT;
            handleInput(Math.floor(x / laneWidth));
          }}
        />
      </main>

      {/* Rodapé Centralizado e Empilhado */}
      <footer className="w-full bg-red-600 p-4 flex flex-col items-center justify-center text-center gap-1 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <p className="text-[12px] text-white font-black uppercase tracking-tight">
          Desenvolvido por: André Victor Brito de Andrade
        </p>
        <p className="text-[11px] text-white font-bold opacity-90 italic">
          Contato: andrevictorbritodeandrade@gmail.com
        </p>
        <p className="text-[10px] text-white font-black opacity-80">
          Versão: 1.0.5
        </p>
      </footer>
    </div>
  );
};

export default TouchHero;
