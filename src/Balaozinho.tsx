import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, Candy, RotateCcw, Trophy, AlertTriangle, Timer, History, Wind, Volume2, VolumeX, ChevronLeft } from 'lucide-react';

// --- Motor de Áudio Sintetizado ---
const createAudioEngine = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  let ctx: AudioContext | null = null;
  let mainGain: GainNode | null = null;
  let musicOsc: NodeJS.Timeout | null = null;

  const init = () => {
    if (!ctx) {
      ctx = new AudioContext();
      mainGain = ctx.createGain();
      mainGain.connect(ctx.destination);
      mainGain.gain.value = 0.3;
    }
    if (ctx.state === 'suspended') ctx.resume();
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.2) => {
    if (!ctx || !mainGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(mainGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  return {
    init,
    setVolume: (v: number) => { if (mainGain) mainGain.gain.value = v; },
    playTick: () => playTone(880, 'sine', 0.1),
    playStart: () => playTone(440, 'triangle', 0.5, 0.4),
    playSuccess: () => {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sine', 0.4, 0.2), i * 100);
      });
    },
    playCrash: () => {
      if (!ctx || !mainGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.connect(g);
      g.connect(mainGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    },
    startMusic: () => {
      if (!ctx || musicOsc) return;
      const notes = [261.63, 329.63, 392.00, 523.25];
      let step = 0;
      musicOsc = setInterval(() => {
        playTone(notes[step % notes.length], 'triangle', 0.3, 0.05);
        step++;
      }, 200);
    },
    stopMusic: () => {
      if (musicOsc) {
        clearInterval(musicOsc);
        musicOsc = null;
      }
    }
  };
};

const audio = createAudioEngine();

interface BalaozinhoProps {
  onBack: () => void;
}

export default function Balaozinho({ onBack }: BalaozinhoProps) {
  const [gameState, setGameState] = useState('IDLE');
  const [multiplier, setMultiplier] = useState(1.0);
  const [attempts, setAttempts] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [crashAt, setCrashAt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState([1.54, 1.02, 3.50, 4.20, 1.10]);
  const [isMuted, setIsMuted] = useState(false);
  const [lastResult, setLastResult] = useState({ multiplier: 0, won: false, active: false });
  
  // Ciclo de vitória: a cada 6 a 10 tentativas permite 1 bala
  const [winCycle, setWinCycle] = useState(Math.floor(Math.random() * 5) + 6);
  const [currentCycleStep, setCurrentCycleStep] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // CORREÇÃO: 10.1x = 1 bala
  const CANDY_RATE = 10.1;
  const calculateCandies = (m: number) => Math.floor(m / CANDY_RATE);

  const toggleMute = () => {
    audio.init();
    setIsMuted(!isMuted);
    audio.setVolume(!isMuted ? 0 : 0.3);
  };

  const getNextCrashPoint = useCallback(() => {
    const isWinRound = currentCycleStep >= winCycle;
    
    if (isWinRound) {
      // Rodada de vitória: 1 bala (garante passar de 10.1x)
      setWinCycle(Math.floor(Math.random() * 5) + 6);
      setCurrentCycleStep(1);
      
      // Raramente deixa ganhar 2 balas (acima de 20.2x)
      if (Math.random() > 0.985) return parseFloat((Math.random() * 2 + 20.5).toFixed(2));
      
      // Vitoria comum de 1 bala (entre 10.5x e 12.5x)
      return parseFloat((Math.random() * 2.0 + 10.5).toFixed(2));
    } else {
      // Derrota: foge antes de 10.1x
      setCurrentCycleStep(prev => prev + 1);
      return parseFloat((Math.random() * 8.5 + 1.2).toFixed(2));
    }
  }, [currentCycleStep, winCycle]);

  const startSequence = () => {
    audio.init();
    audio.stopMusic();
    setCountdown(5);
    setGameState('COUNTDOWN');
    audio.playTick();
  };

  const startFlight = useCallback(() => {
    const nextCrash = getNextCrashPoint();
    setCrashAt(nextCrash);
    setMultiplier(1.0);
    setGameState('FLYING');
    setAttempts(prev => prev + 1);
    startTimeRef.current = Date.now();
    audio.playStart();
    audio.startMusic();
  }, [getNextCrashPoint]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'COUNTDOWN' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => {
          if (prev > 1) audio.playTick();
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'COUNTDOWN' && countdown === 0) {
      startFlight();
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown, startFlight]);

  const addToHistory = (val: number) => {
    setHistory(prev => [val, ...prev].slice(0, 10));
  };

  const stopGame = () => {
    if (gameState !== 'FLYING') return;
    const earned = calculateCandies(multiplier);
    setLastWin(earned);
    addToHistory(multiplier);
    setLastResult({ multiplier, won: earned > 0, active: true });
    setGameState('WON');
    audio.stopMusic();
    audio.playSuccess();
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const drawHotAirBalloon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    const sway = Math.sin(Date.now() * 0.003) * 0.05;
    ctx.rotate(sway);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, size * 0.3); ctx.lineTo(-size * 0.2, size * 0.6);
    ctx.moveTo(size * 0.3, size * 0.3); ctx.lineTo(size * 0.2, size * 0.6);
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.beginPath(); ctx.roundRect(-size * 0.25, size * 0.6, size * 0.5, size * 0.3, 4); ctx.fill();
    const gradient = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * 0.7);
    gradient.addColorStop(0, '#f472b6'); gradient.addColorStop(1, '#db2777'); 
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.bezierCurveTo(-size * 0.7, size * 0.4, -size * 0.7, -size * 0.8, 0, -size * 0.8);
    ctx.bezierCurveTo(size * 0.7, -size * 0.8, size * 0.7, size * 0.4, 0, size * 0.4);
    ctx.fill();
    ctx.restore();
  };

  const drawCanvas = useCallback((m: number, elapsed: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = '#1e2129'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const margin = height * 0.1;
    const startX = 50;
    const startY = height - margin;

    if (elapsed < 2.5) {
      const shake = Math.sin(Date.now() * 0.2) * 2;
      drawHotAirBalloon(ctx, startX, startY, height * 0.07);
      return;
    }

    const progressX = Math.min((m - 1) / 25, 0.9);
    const progressY = Math.min((m - 1) / 25, 0.8);
    const currentX = startX + progressX * (width - 100);
    const currentY = startY - progressY * (height - margin * 1.5);

    const areaGradient = ctx.createLinearGradient(startX, currentY, startX, startY);
    areaGradient.addColorStop(0, 'rgba(236, 72, 153, 0.25)'); areaGradient.addColorStop(1, 'rgba(236, 72, 153, 0.01)');
    ctx.beginPath(); ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (currentX - startX) * 0.4, startY, currentX, currentY);
    ctx.lineTo(currentX, startY); ctx.closePath(); ctx.fillStyle = areaGradient; ctx.fill();

    ctx.beginPath(); ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (currentX - startX) * 0.4, startY, currentX, currentY);
    ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 4; ctx.stroke();
    
    drawHotAirBalloon(ctx, currentX, currentY, height * 0.09);
  }, []);

  const animate = useCallback(() => {
    if (gameState !== 'FLYING' || !startTimeRef.current) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    let nextMultiplier = 1.0;
    if (elapsed < 2.5) {
      nextMultiplier = 1.0;
    } else {
      const flightTime = elapsed - 2.5;
      nextMultiplier = parseFloat((1.0 + Math.pow(flightTime, 1.4) * 1.2).toFixed(2));
    }

    if (nextMultiplier >= crashAt) {
      setMultiplier(crashAt);
      addToHistory(crashAt);
      setLastResult({ multiplier: crashAt, won: false, active: true });
      setGameState('CRASHED');
      audio.stopMusic();
      audio.playCrash();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      setMultiplier(nextMultiplier);
      drawCanvas(nextMultiplier, elapsed);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [gameState, crashAt, drawCanvas]);

  useEffect(() => {
    if (gameState === 'FLYING') {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        drawCanvas(multiplier, gameState === 'FLYING' && startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas, multiplier, gameState]);

  return (
    <div className="h-screen w-screen bg-[#0b0c10] text-white font-sans flex flex-col overflow-hidden select-none relative">
      <style>{` ::-webkit-scrollbar { display: none; } * { -ms-overflow-style: none; scrollbar-width: none; } `}</style>
      
      <button 
        onClick={onBack}
        className="fixed top-3 left-3 z-50 bg-yellow-400/10 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-400/20 hover:bg-yellow-400/20 transition-all shadow-xl flex items-center gap-2 font-bold text-yellow-400"
      >
        <ChevronLeft size={18} /> Voltar
      </button>

      <button 
        onClick={toggleMute}
        className="fixed bottom-3 right-3 z-50 bg-[#1b1d25]/80 backdrop-blur-md p-2 rounded-full border border-gray-800 hover:bg-gray-800 transition-all shadow-xl"
      >
        {isMuted ? <VolumeX size={18} className="text-gray-500" /> : <Volume2 size={18} className="text-pink-500" />}
      </button>

      <div className="w-full bg-[#14151b] border-b border-gray-800 p-1 flex items-center gap-2 overflow-hidden shrink-0 pt-14">
        <div className="flex items-center gap-1 text-[8px] text-gray-500 font-bold uppercase ml-1 px-2 border-r border-gray-800 shrink-0">
           <History size={10} />
        </div>
        <div className="flex gap-1 overflow-hidden">
          {history.map((h, i) => (
            <div key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${
              h >= 10.1 ? 'bg-purple-900/30 border-purple-500 text-purple-400' :
              h >= 5 ? 'bg-pink-900/30 border-pink-500 text-pink-400' :
              'bg-gray-800 border-gray-700 text-gray-400'
            }`}>{h.toFixed(2)}x</div>
          ))}
        </div>
      </div>

      <header className="w-full max-w-5xl mx-auto flex justify-between items-center px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-pink-600 p-1.5 rounded-lg">
            <Wind size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black uppercase tracking-tighter italic leading-none">JOGO DO <span className="text-pink-500">BALÃOZINHO</span></h1>
            <p className="text-[7px] font-bold text-gray-600 uppercase tracking-widest leading-none mt-1">Voo Pedagógico</p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="bg-[#1b1d25] border border-gray-800 px-3 py-1 rounded-xl flex flex-col items-center min-w-[60px] shadow-sm">
            <span className="text-[6px] text-gray-500 font-black uppercase leading-none mb-0.5">Rodada</span>
            <span className="text-xs font-mono font-black text-pink-500 leading-none">#{attempts + 1}</span>
          </div>
          {lastResult.active && (
            <div className={`border px-3 py-1 rounded-xl flex flex-col items-center min-w-[70px] shadow-sm animate-in fade-in duration-300 ${
              lastResult.won ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-red-900/20 border-red-500 text-red-500'
            }`}>
              <span className="text-[6px] font-black uppercase leading-none mb-0.5 opacity-70">Último</span>
              <span className="text-xs font-mono font-black leading-none">{lastResult.multiplier.toFixed(2)}x</span>
            </div>
          )}
          <div className="bg-[#1b1d25] border border-yellow-500/20 px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm">
            <Candy size={14} className="text-yellow-500" />
            <span className="text-[10px] font-black leading-none">10.1x = 1🍬</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-2 px-3 min-h-0 overflow-hidden">
        <div ref={containerRef} className="relative bg-[#0d0e12] rounded-[1.5rem] overflow-hidden border border-gray-800/50 shadow-2xl flex-1">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              {gameState === 'FLYING' && multiplier === 1.0 && (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse italic">Aquecendo...</span>
                </div>
              )}
              
              {(gameState === 'FLYING' && multiplier > 1.0) || gameState === 'CRASHED' ? (
                <div className="flex flex-col items-center leading-none">
                  <h2 className={`text-7xl md:text-9xl font-black italic tracking-tighter transition-all duration-75 ${gameState === 'CRASHED' ? 'text-pink-600 scale-90' : 'text-white'}`}>
                    {multiplier.toFixed(2)}x
                  </h2>
                  {gameState === 'FLYING' && (
                    <div className="mt-2 flex items-center gap-2 bg-black/40 backdrop-blur-md px-5 py-1.5 rounded-lg border border-white/5 animate-bounce shadow-xl">
                      <Candy size={18} className="text-yellow-500" />
                      <span className="text-base font-black text-yellow-400">{calculateCandies(multiplier)} DOCES</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <canvas ref={canvasRef} className="w-full h-full" />

          {gameState === 'COUNTDOWN' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30">
              <div key={countdown} className="text-center">
                <span className="text-[10rem] font-black text-white leading-none animate-ping drop-shadow-2xl">{countdown > 0 ? countdown : 'VAI!'}</span>
              </div>
            </div>
          )}

          {gameState === 'CRASHED' && (
            <div className="absolute inset-0 bg-pink-950/20 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in duration-300">
              <div className="text-center p-6 bg-[#181a21] border border-pink-500/30 rounded-[2rem] shadow-2xl w-[250px]">
                <AlertTriangle size={32} className="mx-auto text-pink-500 mb-3" />
                <h3 className="text-xl font-black text-white uppercase italic leading-tight mb-4">O BALÃO FUGIU!</h3>
                <button onClick={startSequence} className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg"><RotateCcw size={18} /> TENTAR NOVO</button>
              </div>
            </div>
          )}

          {gameState === 'WON' && (
            <div className="absolute inset-0 bg-green-950/20 backdrop-blur-md flex items-center justify-center z-20 animate-in zoom-in duration-300">
              <div className="text-center p-6 bg-[#181a21] border border-green-500/30 rounded-[2rem] shadow-2xl w-[260px]">
                <Trophy size={40} className="mx-auto text-green-500 mb-3 animate-pulse" />
                <h3 className="text-2xl font-black text-white uppercase italic mb-4 leading-none text-center">POUSOU!</h3>
                <div className="bg-green-500/10 py-3 px-5 rounded-2xl border border-green-500/20 mb-6">
                   <div className="flex items-center justify-center gap-3"><span className="text-4xl font-black text-green-400">{lastWin}</span><Candy size={36} className="text-yellow-500" /></div>
                   <p className="text-[8px] font-black text-green-500/60 uppercase mt-1 tracking-widest">Doces Coletados</p>
                </div>
                <button onClick={startSequence} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black text-base shadow-lg">PRÓXIMO VOO</button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 shrink-0 mb-1">
          <div className="bg-[#14151b] border border-gray-800 px-4 py-2 rounded-[1.2rem] flex justify-around items-center shadow-md">
            <div className="text-center">
              <span className="text-[6px] text-gray-500 font-black uppercase block mb-0.5 tracking-widest opacity-50">Meta</span>
              <span className="text-[10px] font-black text-white px-2 py-0.5 bg-gray-900 border border-gray-800 rounded-full flex items-center gap-1"><Candy size={10} className="text-pink-500" /> 10.1x</span>
            </div>
            <div className="w-[1px] h-5 bg-gray-800"></div>
            <div className="text-center">
              <span className="text-[6px] text-gray-500 font-black uppercase block mb-0.5 tracking-widest opacity-50">Tipo</span>
              <span className="text-[10px] font-black text-white px-2 py-0.5 bg-gray-900 border border-gray-800 rounded-full">Reflexos</span>
            </div>
          </div>

          <div className="h-16">
            {gameState === 'FLYING' ? (
              <button 
                onClick={stopGame}
                disabled={multiplier < 1.1}
                className={`w-full h-full rounded-[1.2rem] flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl border-b-4 ${
                  multiplier < 10.1 ? 'bg-orange-600 border-orange-800' : 'bg-green-600 border-green-800'
                } ${multiplier < 1.1 && 'opacity-50 grayscale cursor-not-allowed'}`}
              >
                <span className="text-xl font-black uppercase italic tracking-tighter">COLETAR</span>
                <span className="text-[8px] font-black bg-black/20 px-3 py-0.5 rounded-full uppercase tracking-widest">{calculateCandies(multiplier)} DOCES</span>
              </button>
            ) : (
              <button 
                onClick={startSequence}
                disabled={gameState === 'COUNTDOWN'}
                className="w-full h-full bg-[#ec4899] border-b-4 border-[#be185d] hover:brightness-110 disabled:bg-gray-800 disabled:border-gray-950 rounded-[1.2rem] flex flex-col items-center justify-center transition-all active:scale-95 active:border-b-0 shadow-lg"
              >
                <span className="text-xl font-black uppercase italic tracking-tighter">SUBIR BALÃO</span>
                <span className="text-[8px] font-black opacity-70 uppercase tracking-[0.2em]">Clique para iniciar</span>
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="text-gray-700 text-[8px] py-1.5 shrink-0 flex flex-col items-center text-center w-full border-t border-gray-900/50 bg-[#0b0c10]">
        <p className="font-semibold leading-none">Desenvolvido por André Victor Brito de Andrade ®</p>
        <p className="opacity-70 mt-0.5 leading-none">
          <a href="mailto:andrevictorbritodeandrade@gmail.com" className="hover:text-pink-500">andrevictorbritodeandrade@gmail.com</a> • © 2026 Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
