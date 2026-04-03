import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Trophy, Coins, Zap, ChevronLeft } from 'lucide-react';

interface XadrezSortudoProps {
  onBack: () => void;
}

const PIECES = [
  { id: 'w_king', img: 'https://img.icons8.com/3d-fluency/200/chess-king.png', color: 'white', name: 'Rei', weight: 1 },
  { id: 'w_queen', img: 'https://img.icons8.com/3d-fluency/200/chess-queen.png', color: 'white', name: 'Rainha', weight: 2 },
  { id: 'w_rook', img: 'https://img.icons8.com/3d-fluency/200/chess-rook.png', color: 'white', name: 'Torre', weight: 3 },
  { id: 'b_king', img: 'https://img.icons8.com/3d-fluency/200/chess-king--v2.png', color: 'black', name: 'Rei', weight: 1 },
  { id: 'b_queen', img: 'https://img.icons8.com/3d-fluency/200/chess-queen--v2.png', color: 'black', name: 'Rainha', weight: 2 },
  { id: 'b_rook', img: 'https://img.icons8.com/3d-fluency/200/chess-rook--v2.png', color: 'black', name: 'Torre', weight: 3 },
  { id: 'knight_lucky', img: 'https://img.icons8.com/3d-fluency/200/chess-knight.png', color: '#4CAF50', name: 'Cavalo Sortudo', weight: 4 },
];

export default function XadrezSortudo({ onBack }: XadrezSortudoProps) {
  const [grid, setGrid] = useState<(typeof PIECES[0] | null)[]>(Array(9).fill(null));
  const [isSpinning, setIsSpinning] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [totalBalas, setTotalBalas] = useState(0);
  const [message, setMessage] = useState('SORTEIE PARA GANHAR!');
  
  // Reaction state
  const [reactionActive, setReactionActive] = useState(false);
  const [currentReactionValue, setCurrentReactionValue] = useState(0);
  const [targetBalas, setTargetBalas] = useState(0);
  const [showPlane, setShowPlane] = useState(false);
  const [gameStatus, setGameStatus] = useState<'idle' | 'spinning' | 'reaction' | 'win' | 'fail'>('idle');
  const [isMuted, setIsMuted] = useState(false);

  const reactionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log("Autoplay blocked. User interaction required.");
        });
      }
    }
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getRandomPiece = () => {
    const totalWeight = PIECES.reduce((acc, p) => acc + p.weight, 0);
    let random = Math.random() * totalWeight;
    for (const piece of PIECES) {
      if (random < piece.weight) return piece;
      random -= piece.weight;
    }
    return PIECES[PIECES.length - 1];
  };

  const startReaction = (target: number) => {
    setReactionActive(true);
    setGameStatus('reaction');
    setTargetBalas(target);
    setCurrentReactionValue(0);
    setMessage('APERTE NO TEMPO CERTO!');

    let val = 0;
    reactionIntervalRef.current = setInterval(() => {
      val += 0.1;
      setCurrentReactionValue(val);
      
      // If user takes too long (e.g., 2 seconds past target or just too slow)
      if (val > target + 1.5) {
        failReaction();
      }
    }, 50);
  };

  const failReaction = () => {
    if (reactionIntervalRef.current) clearInterval(reactionIntervalRef.current);
    setReactionActive(false);
    setShowPlane(true);
    setGameStatus('fail');
    setMessage('O AVIÃO VOOU! VOCÊ PERDEU!');
    
    setTimeout(() => {
      setShowPlane(false);
      setGameStatus('idle');
    }, 3000);
  };

  const claimBalas = () => {
    if (!reactionActive) return;
    if (reactionIntervalRef.current) clearInterval(reactionIntervalRef.current);
    
    const earned = Math.floor(currentReactionValue);
    if (earned > 0 && earned <= targetBalas) {
      setTotalBalas(prev => prev + earned);
      setGameStatus('win');
      setMessage(`GANHOU ${earned} BALAS!`);
    } else {
      failReaction();
      return;
    }

    setReactionActive(false);
    setTimeout(() => setGameStatus('idle'), 2000);
  };

  const spin = () => {
    if (isSpinning || reactionActive) return;
    
    setIsSpinning(true);
    setGameStatus('spinning');
    setMessage('SORTEANDO...');
    const nextRound = roundCount + 1;
    setRoundCount(nextRound);

    // Falling animation simulation
    let count = 0;
    const interval = setInterval(() => {
      setGrid(prev => prev.map(() => getRandomPiece()));
      count++;
      if (count > 15) {
        clearInterval(interval);
        finalizeSpin(nextRound);
      }
    }, 80);
  };

  const finalizeSpin = (round: number) => {
    const finalGrid = Array(9).fill(null).map(() => getRandomPiece());
    setGrid(finalGrid);
    setIsSpinning(false);

    // Check winning schedule
    let target = 0;
    if (round % 11 === 0) target = 4;
    else if (round % 9 === 0) target = 3;
    else if (round % 10 === 0) target = 2;
    else if (round % 7 === 0) target = 1;

    if (target > 0) {
      setTimeout(() => startReaction(target), 500);
    } else {
      setGameStatus('idle');
      setMessage('TENTE NOVAMENTE!');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0505] font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* 4K Realistic Background Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Golden Particles/Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-900/10 to-black pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        <button 
          onClick={onBack}
          className="absolute top-0 left-0 text-yellow-400 font-bold flex items-center gap-2 hover:scale-105 transition-transform bg-black/60 px-6 py-3 rounded-full border border-yellow-600/50 backdrop-blur-md shadow-2xl"
        >
          <ChevronLeft size={24} /> Voltar
        </button>

        <button 
          onClick={toggleMute}
          className="absolute top-0 right-0 text-yellow-400 font-bold flex items-center gap-2 hover:scale-105 transition-transform bg-black/60 p-3 rounded-full border border-yellow-600/50 backdrop-blur-md shadow-2xl"
        >
          {isMuted ? <Zap size={24} className="opacity-50" /> : <Zap size={24} className="animate-pulse" />}
        </button>

        <div className="text-center mb-8 mt-12 lg:mt-0">
          <h1 className="text-6xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-red-500 to-red-700 drop-shadow-[0_8px_20px_rgba(220,38,38,0.8)] uppercase tracking-tighter text-center">
            XADREZ SORTUDO
          </h1>
          <div className="h-1.5 w-48 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mt-4" />
        </div>

        <audio ref={audioRef} src="https://assets.mixkit.co/music/preview/mixkit-chinese-new-year-111.mp3" loop />

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">
          
          {/* Left Side: Balance Display */}
          <div className="flex flex-col items-center gap-6 order-2 lg:order-1">
            <div className="bg-gradient-to-b from-slate-800 to-black p-1 rounded-3xl shadow-2xl border border-yellow-600/30">
              <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[1.4rem] border border-white/5 flex flex-col items-center min-w-[200px]">
                <div className="flex items-center gap-3 text-yellow-500 mb-4">
                  <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                    <Coins size={32} className="animate-pulse" />
                  </div>
                </div>
                <span className="font-bold uppercase text-xs tracking-[0.3em] text-yellow-500/70 mb-1">SALDO TOTAL</span>
                <div className="text-6xl font-display text-white drop-shadow-lg">{totalBalas}</div>
                <div className="text-xs text-white/40 mt-2 font-medium">BALAS COLETADAS</div>
              </div>
            </div>

            {/* Current Win Display */}
            <AnimatePresence>
              {gameStatus === 'win' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 px-8 py-4 rounded-2xl flex flex-col items-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest">VOCÊ GANHOU</span>
                  <span className="text-4xl font-display text-white">+{Math.floor(currentReactionValue)} BALAS</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Slot Machine */}
          <div className="relative order-1 lg:order-2">
            {/* Machine Frame - Ultra Realistic Metallic Look */}
            <div className="bg-gradient-to-b from-[#d4af37] via-[#f9d71c] to-[#b8860b] p-6 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.5)] border-t-8 border-yellow-200 relative">
              
              {/* Decorative Glass Reflection */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[3rem] pointer-events-none" />

              <div className="bg-[#0f0f0f] rounded-[2rem] p-6 shadow-[inset_0_0_50px_rgba(0,0,0,1)] border-4 border-yellow-900/40">
                <div className="grid grid-cols-3 gap-4">
                  {grid.map((piece, index) => (
                    <div key={index} className="relative w-24 h-28 md:w-32 md:h-40 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-2xl shadow-2xl border border-white/5 overflow-hidden flex items-center justify-center group">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={piece ? `${piece.id}-${index}` : `empty-${index}`}
                          initial={{ y: -150, opacity: 0, scale: 0.5 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          exit={{ y: 150, opacity: 0, scale: 0.5 }}
                          transition={{ type: 'spring', damping: 12, stiffness: 120 }}
                          className="w-full h-full flex items-center justify-center p-2"
                        >
                          {piece?.img ? (
                            <img 
                              src={piece.img} 
                              alt={piece.name} 
                              className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-yellow-500/5 border border-yellow-500/10 animate-pulse" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                      {/* Slot Inner Shadow */}
                      <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
                      {/* Realistic Glass Shine */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reaction Overlay */}
              <AnimatePresence>
                {reactionActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 rounded-[3rem] backdrop-blur-xl"
                  >
                    <motion.div 
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="text-yellow-400 font-display text-3xl mb-8 tracking-tighter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                    >
                      REALIZE A JOGADA!
                    </motion.div>
                    
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="112"
                          cy="112"
                          r="90"
                          stroke="currentColor"
                          strokeWidth="16"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <circle
                          cx="112"
                          cy="112"
                          r="90"
                          stroke="url(#goldGradient)"
                          strokeWidth="16"
                          fill="transparent"
                          strokeDasharray={565.5}
                          strokeDashoffset={565.5 - (565.5 * (currentReactionValue / (targetBalas + 1.5)))}
                          strokeLinecap="round"
                          className="transition-all duration-50 ease-linear"
                        />
                        <defs>
                          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#b45309" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                          key={Math.floor(currentReactionValue)}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-7xl font-display text-white"
                        >
                          {Math.floor(currentReactionValue)}
                        </motion.span>
                        <span className="text-sm text-yellow-500 font-bold uppercase tracking-widest">Balas</span>
                      </div>
                    </div>

                    <button
                      onClick={claimBalas}
                      className="mt-10 bg-gradient-to-b from-yellow-400 to-yellow-600 text-red-950 font-display text-2xl px-16 py-5 rounded-full shadow-[0_8px_0_#92400e,0_15px_30px_rgba(0,0,0,0.5)] active:translate-y-2 active:shadow-none transition-all hover:brightness-110"
                    >
                      CAPTURAR!
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Airplane Fail Overlay */}
              <AnimatePresence>
                {showPlane && (
                  <motion.div 
                    initial={{ x: -300, y: 200, opacity: 0, rotate: -20, scale: 0.5 }}
                    animate={{ x: 600, y: -600, opacity: 1, rotate: -45, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeIn" }}
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                  >
                    <div className="flex flex-col items-center">
                      <Plane size={150} className="text-white fill-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]" />
                      <div className="bg-red-600 text-white px-8 py-3 rounded-2xl font-display text-2xl shadow-2xl mt-6 border-4 border-white/20">
                        PERDEU A VEZ! ✈️
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spin Button Section */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <button
                onClick={spin}
                disabled={isSpinning || reactionActive}
                className={`relative group transition-all duration-300 ${isSpinning || reactionActive ? 'opacity-50 grayscale' : 'hover:scale-110 active:scale-95'}`}
              >
                <div className="absolute -inset-6 bg-yellow-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative w-28 h-28 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 rounded-full border-8 border-yellow-100/30 flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.8)]">
                  <Zap size={50} className="text-red-900 fill-red-900 drop-shadow-md" />
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-yellow-500 font-bold uppercase text-xs tracking-[0.4em] opacity-60">
                  {isSpinning ? 'PROCESSANDO...' : 'GIRAR AGORA'}
                </div>
              </button>
            </div>
          </div>

          {/* Right Side: Round Info */}
          <div className="hidden lg:flex flex-col items-center gap-4 order-3">
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-yellow-500/50 uppercase font-bold tracking-[0.3em] mb-1">RODADA ATUAL</span>
              <span className="text-4xl font-display text-white">#{roundCount}</span>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-yellow-500/50 to-transparent" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-yellow-500/30 flex items-center justify-center text-yellow-500">
                <Trophy size={24} />
              </div>
              <span className="text-[10px] text-yellow-500/50 uppercase font-bold tracking-widest">PREMIAÇÃO</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
