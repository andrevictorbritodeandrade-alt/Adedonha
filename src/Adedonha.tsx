import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Timer, Play, RotateCcw, Award, RefreshCw, Star, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Alfabeto sem K, W, Y
const LETTERS = "ABCDEFGHIJLMNOPQRSTUVXZ".split("");

const ROULETTE_COLORS = [
  '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', 
  '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#ffadad',
  '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'
];

// Funções de Áudio Sintetizado
const playBeep = (freq = 880, duration = 0.1) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) { console.error("Audio error", e); }
};

const playHorn = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(110, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 1.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1.5);
  } catch (e) { console.error("Audio error", e); }
};

// Ícones Estilo Disney (SVG)
const CartoonIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    adjetivo: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <circle cx="50" cy="50" r="35" fill="#fef08a" stroke="#333" strokeWidth="2" />
        <circle cx="40" cy="45" r="5" fill="#333" /><circle cx="60" cy="45" r="5" fill="#333" />
        <path d="M35 65s5 10 15 10 15-10 15-10" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M20 20l10 10M80 20L70 30" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    animal: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <path d="M30 40c0-10 20-20 20-20s20 10 20 20" fill="#fb923c" stroke="#333" strokeWidth="2" />
        <circle cx="50" cy="60" r="30" fill="#fb923c" stroke="#333" strokeWidth="2" />
        <path d="M35 30c-5-15 10-15 10 0M65 30c5-15-10-15-10 0" fill="#fdba74" stroke="#333" strokeWidth="2" />
      </svg>
    ),
    cep: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <circle cx="50" cy="50" r="35" fill="#93c5fd" stroke="#333" strokeWidth="2" />
        <path d="M50 20c-8 0-15 7-15 15 0 12 15 25 15 25s15-13 15-25c0-8-7-15-15-15z" fill="#ef4444" stroke="#333" strokeWidth="2" />
        <circle cx="50" cy="35" r="5" fill="#fff" />
      </svg>
    ),
    comida: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <path d="M15 45h70l-35 45z" fill="#fde047" stroke="#333" strokeWidth="2" />
        <path d="M15 45c0-12 15-25 35-25s35 13 35 25z" fill="#ef4444" stroke="#333" strokeWidth="2" />
      </svg>
    ),
    cor: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <path d="M20 60c0-25 25-45 55-30s25 45 0 55-55-5-55-25z" fill="#f8fafc" stroke="#333" strokeWidth="2" />
        <circle cx="40" cy="45" r="8" fill="#ef4444" stroke="#333" strokeWidth="1" />
        <circle cx="60" cy="40" r="8" fill="#3b82f6" stroke="#333" strokeWidth="1" />
        <circle cx="65" cy="65" r="8" fill="#10b981" stroke="#333" strokeWidth="1" />
      </svg>
    ),
    famoso: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <path d="M50 10l12 25h28l-22 18 8 27-26-18-26 18 8-27-22-18h28z" fill="#fde047" stroke="#333" strokeWidth="2" />
      </svg>
    ),
    fruta: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <circle cx="50" cy="55" r="35" fill="#ef4444" stroke="#333" strokeWidth="2" />
        <path d="M50 20c0-10 5-15 5-15" stroke="#4a2d1f" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 20s-10-5-15 5c0 0 5 10 15 0z" fill="#22c55e" stroke="#333" strokeWidth="1" />
      </svg>
    ),
    nome: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <circle cx="50" cy="40" r="25" fill="#ffd1ba" stroke="#333" strokeWidth="2" />
        <path d="M50 15c-10 0-15 5-15 12s5 10 15 10 15-3 15-10-5-12-15-12z" fill="#4a2d1f" />
        <path d="M25 85c0-15 10-25 25-25s25 10 25 25" fill="#3b82f6" stroke="#333" strokeWidth="2" />
      </svg>
    ),
    objeto: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect x="20" y="40" width="60" height="40" fill="#f97316" stroke="#333" strokeWidth="2" rx="5" />
        <path d="M20 40l30 20 30-20" fill="none" stroke="#333" strokeWidth="2" />
      </svg>
    ),
    profissao: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect x="25" y="60" width="50" height="20" fill="#333" rx="5" />
        <circle cx="50" cy="45" r="25" fill="#94a3b8" stroke="#333" strokeWidth="2" />
      </svg>
    )
  };
  return icons[type] || null;
};

const CATEGORIES = [
  { name: "ADJETIVO", type: "adjetivo" },
  { name: "ANIMAL", type: "animal" },
  { name: "CEP", type: "cep" },
  { name: "COMIDA", type: "comida" },
  { name: "COR", type: "cor" },
  { name: "FAMOSO(A)", type: "famoso" },
  { name: "FRUTA", type: "fruta" },
  { name: "NOME", type: "nome" },
  { name: "OBJETO", type: "objeto" },
  { name: "PROFISSÃO", type: "profissao" },
];

const RouletteCanvas = ({ onFinished, isSpinning, selectedLetter }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      LETTERS.forEach((letter, i) => {
        const sliceAngle = (2 * Math.PI) / LETTERS.length;
        const startAngle = i * sliceAngle + angle;
        const endAngle = (i + 1) * sliceAngle + angle;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = ROULETTE_COLORS[i % ROULETTE_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#333";
        ctx.font = 'bold 32px "Bangers", cursive';
        ctx.fillText(letter, radius - 10, 10);
        ctx.restore();
      });
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius - 5);
      ctx.lineTo(centerX - 20, centerY - radius - 35);
      ctx.lineTo(centerX + 20, centerY - radius - 35);
      ctx.closePath();
      ctx.fillStyle = "#1e293b";
      ctx.fill();
    };
    draw();
  }, [angle]);

  useEffect(() => {
    if (isSpinning) {
      let start: number | null = null;
      const duration = 5000;
      const extraSpins = 20 + Math.random() * 10;
      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const easeOut = 1 - Math.pow(1 - Math.min(progress / duration, 1), 3);
        setAngle(easeOut * extraSpins);
        if (progress < duration) requestAnimationFrame(animate);
        else {
          const finalAngle = (easeOut * extraSpins) % (2 * Math.PI);
          const sliceSize = (2 * Math.PI) / LETTERS.length;
          const normalizedAngle = (1.5 * Math.PI - finalAngle) % (2 * Math.PI);
          const index = Math.floor((normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle) / sliceSize);
          onFinished(LETTERS[index % LETTERS.length]);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isSpinning]);

  return (
    <div className="relative flex items-center justify-center w-full max-w-[320px] aspect-square mx-auto">
      <canvas ref={canvasRef} width={420} height={420} className="w-full h-full rounded-full shadow-2xl bg-white p-2" />
      <div className="absolute flex items-center justify-center">
         {selectedLetter && !isSpinning && (
            <motion.div initial={{scale:0}} animate={{scale:1.2}} className="bg-white/95 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-8 border-slate-800">
               <span className="text-8xl font-display text-slate-800">{selectedLetter}</span>
            </motion.div>
         )}
      </div>
    </div>
  );
};

const AdedonhaGame = ({ onBack }: { onBack: () => void }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showLargeLetter, setShowLargeLetter] = useState(false);
  const [showParou, setShowParou] = useState(false);
  const [letterHistory, setLetterHistory] = useState<string[]>([]);
  const [timer, setTimer] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isMSNShake, setIsMSNShake] = useState(false);
  
  const [ranking, setRanking] = useState(() => {
    const saved = localStorage.getItem('adedonha_ranking');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing ranking", e);
      }
    }
    return Array.from({ length: 34 }, (_, i) => ({ id: `player-${i}`, name: '', score: 0 }));
  });

  useEffect(() => {
    localStorage.setItem('adedonha_ranking', JSON.stringify(ranking));
  }, [ranking]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => {
          const newTime = t - 1;
          if (newTime <= 10 && newTime > 0) playBeep(880, 0.1); 
          if (newTime === 0) {
            playHorn();
            setIsMSNShake(true);
            setShowParou(true);
            setTimeout(() => setIsMSNShake(false), 2000);
            setTimeout(() => setShowParou(false), 6000);
          }
          return newTime;
        });
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSpin = () => {
    if (isSpinning) return;
    
    // Ativa o AudioContext no primeiro clique
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtx.resume();
    } catch (e) {}

    setIsSpinning(true);
    setSelectedLetter(null);
    setShowParou(false);
    setTimer(300);
    setIsTimerActive(false);
  };

  const onSpinFinished = (letter: string) => {
    setIsSpinning(false);
    setSelectedLetter(letter);
    setShowLargeLetter(true);
    setLetterHistory(prev => !prev.includes(letter) ? [...prev, letter] : prev);
    setIsTimerActive(true);
    setTimeout(() => setShowLargeLetter(false), 5000);
  };

  const updateRankingScore = (id: string, value: string) => {
    const newScore = parseInt(value) || 0;
    setRanking((prev: any[]) => {
      const updated = prev.map(p => p.id === id ? { ...p, score: newScore } : p);
      return [...updated].sort((a, b) => b.score - a.score);
    });
  };

  const updateRankingName = (id: string, value: string) => {
    setRanking((prev: any[]) => prev.map(p => p.id === id ? { ...p, name: value } : p));
  };

  const resetGame = () => {
    setTimer(300);
    setIsTimerActive(false);
    setSelectedLetter(null);
    setLetterHistory([]);
    setIsMSNShake(false);
    setShowParou(false);
  };

  const rankingCol1 = ranking.slice(0, 17);
  const rankingCol2 = ranking.slice(17, 34);

  const screenVariants = {
    shake: {
      x: [0, -20, 20, -20, 20, -15, 15, -10, 10, 0],
      y: [0, 10, -10, 10, -10, 5, -5, 5, -5, 0],
      transition: { duration: 0.4, repeat: 4 }
    },
    jitter: {
      x: [0, -3, 3, -3, 3, 0],
      transition: { duration: 0.1, repeat: Infinity }
    }
  };

  return (
    <motion.div 
      animate={isMSNShake ? "shake" : (timer <= 10 && timer > 0 ? "jitter" : {})}
      variants={screenVariants}
      className="min-h-screen bg-[#121212] text-white p-4 flex flex-col gap-6 font-sans relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#121212]/80 to-[#121212] pointer-events-none" />

      {/* OVERLAY LETRA GIGANTE */}
      <AnimatePresence>
        {showLargeLetter && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 2 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <h1 className="text-[20rem] font-display text-yellow-400 leading-none select-none drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">{selectedLetter}</h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY PAROU! */}
      <AnimatePresence>
        {showParou && (
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1.5 }} exit={{ opacity: 0, scale: 5 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-red-900/50 backdrop-blur-xl">
             <h1 className="text-[10rem] font-display text-red-500 select-none drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">PAROU!</h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Cabeçalho */}
      <header className="flex flex-col items-center justify-center relative z-20 pt-4 px-12">
        <button 
          onClick={onBack} 
          className="absolute left-0 top-4 text-yellow-400 hover:text-yellow-300 transition-all p-3 bg-yellow-400/10 rounded-full z-30 shadow-lg border border-yellow-400/20 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-5xl font-display text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center">ADEDONHA INTERATIVA</h1>
        <div className="flex items-center gap-4 mt-4 bg-white/5 px-6 py-2 rounded-full border border-white/10">
          <button onClick={() => setIsTimerActive(!isTimerActive)} className="text-green-500 hover:text-green-400 transition-colors">
            <Play size={24} fill="currentColor" className={isTimerActive ? 'animate-pulse' : ''} />
          </button>
          <span className="text-4xl font-sans font-bold text-yellow-400 tracking-wider">{formatTime(timer)}</span>
          <button onClick={resetGame} className="text-red-500 hover:text-red-400 transition-colors ml-2">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* 2. Elemento Superior (Roleta e Botão) */}
      <section className="relative z-10 flex flex-col items-center w-full max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-[0_0_30px_rgba(138,43,226,0.2)] p-6 w-full flex flex-col items-center">
          <div className="w-full aspect-square relative mb-6">
            <RouletteCanvas onFinished={onSpinFinished} isSpinning={isSpinning} selectedLetter={selectedLetter} />
          </div>
          <button 
            onClick={handleSpin} 
            disabled={isSpinning} 
            className="w-full py-5 bg-[#107C10] text-white rounded-2xl text-4xl font-display tracking-widest shadow-[0_0_20px_rgba(16,124,16,0.5)] hover:bg-[#128c12] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            GIRAR
          </button>
        </div>
      </section>

      {/* 3. Elemento Central (Categorias) */}
      <section className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-4">
        <h2 className="text-3xl font-display text-yellow-400 tracking-widest text-center drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">CATEGORIAS</h2>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
               <div className="w-8 h-8 rounded-full bg-[#8A2BE2] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-[0_0_10px_rgba(138,43,226,0.5)]">
                 {i + 1}
               </div>
               <div className="bg-white/10 p-2 rounded-xl flex-shrink-0">
                 <CartoonIcon type={cat.type} />
               </div>
               <span className="text-white text-xl font-sans font-bold uppercase tracking-wider">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Elemento Inferior (Ranking Dinâmico) */}
      <section className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-4 pb-12">
        <h2 className="text-3xl font-display text-yellow-400 tracking-widest text-center drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">RANKING DINÂMICO</h2>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col gap-2">
          <div className="flex text-xs text-gray-400 font-bold uppercase tracking-wider px-2 pb-2 border-b border-white/10">
            <div className="w-12 text-center">Pos</div>
            <div className="flex-1">Nome</div>
            <div className="w-16 text-center">Pts</div>
          </div>
          {ranking.slice(0, 10).map((player: any, idx: number) => (
            <motion.div key={player.id} layout className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg ${idx < 3 ? 'bg-[#f97316] text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-white/10 text-gray-300'}`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="NOME" 
                  value={player.name} 
                  onChange={(e) => updateRankingName(player.id, e.target.value)} 
                  className="w-full bg-transparent border-b border-white/10 focus:border-[#8A2BE2] outline-none text-lg font-sans font-bold uppercase text-white placeholder-gray-600 transition-colors"
                />
              </div>
              <input 
                type="number" 
                placeholder="0" 
                value={player.score === 0 ? '' : player.score} 
                onChange={(e) => updateRankingScore(player.id, e.target.value)} 
                className="w-16 bg-black/30 rounded-lg text-center text-yellow-400 outline-none py-2 text-lg font-bold border border-white/5 focus:border-[#107C10] transition-colors"
              />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default AdedonhaGame;
