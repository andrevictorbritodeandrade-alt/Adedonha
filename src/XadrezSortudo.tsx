import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Coins, Zap, ChevronLeft, Info, Users, User, Circle, Square, Triangle, Hexagon, Diamond, Star, Heart, Shield, Sword } from 'lucide-react';

interface XadrezSortudoProps {
  onBack: () => void;
}

const PIECES = [
  { id: 'w_pawn', Icon: Circle, color: 'text-white', name: 'Peão Branco', weight: 50, value: 5 },
  { id: 'b_pawn', Icon: Circle, color: 'text-gray-800', name: 'Peão Preto', weight: 50, value: 5 },
  { id: 'w_knight', Icon: Triangle, color: 'text-white', name: 'Cavalo Branco', weight: 30, value: 15 },
  { id: 'b_knight', Icon: Triangle, color: 'text-gray-800', name: 'Cavalo Preto', weight: 30, value: 15 },
  { id: 'w_bishop', Icon: Square, color: 'text-white', name: 'Bispo Branco', weight: 25, value: 20 },
  { id: 'b_bishop', Icon: Square, color: 'text-gray-800', name: 'Bispo Preto', weight: 25, value: 20 },
  { id: 'w_rook', Icon: Hexagon, color: 'text-white', name: 'Torre Branca', weight: 15, value: 50 },
  { id: 'b_rook', Icon: Hexagon, color: 'text-gray-800', name: 'Torre Preta', weight: 15, value: 50 },
  { id: 'w_queen', Icon: Diamond, color: 'text-white', name: 'Rainha Branca', weight: 5, value: 200 },
  { id: 'b_queen', Icon: Diamond, color: 'text-gray-800', name: 'Rainha Preta', weight: 5, value: 200 },
  { id: 'w_king', Icon: Star, color: 'text-white', name: 'Rei Branco', weight: 1, value: 1000 },
  { id: 'b_king', Icon: Star, color: 'text-gray-800', name: 'Rei Preto', weight: 1, value: 1000 },
];

type GameMode = 'select' | 'single' | 'multi' | 'guide';

export default function XadrezSortudo({ onBack }: XadrezSortudoProps) {
  const [gameMode, setGameMode] = useState<GameMode>('select');
  const [reels, setReels] = useState<(typeof PIECES[0])[][]>([
    [PIECES[0], PIECES[1], PIECES[2]],
    [PIECES[3], PIECES[4], PIECES[5]],
    [PIECES[6], PIECES[7], PIECES[8]],
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [coinsP1, setCoinsP1] = useState(() => {
    const saved = localStorage.getItem('xadrez_coinsP1');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [coinsP2, setCoinsP2] = useState(() => {
    const saved = localStorage.getItem('xadrez_coinsP2');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('xadrez_coinsP1', coinsP1.toString());
  }, [coinsP1]);

  useEffect(() => {
    localStorage.setItem('xadrez_coinsP2', coinsP2.toString());
  }, [coinsP2]);
  const [winAmount, setWinAmount] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && gameMode !== 'select' && gameMode !== 'guide') {
      audioRef.current.volume = 0.2;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => console.log("Autoplay blocked."));
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [gameMode]);

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !isMuted;
    if (winAudioRef.current) winAudioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const getRandomPiece = () => {
    const totalWeight = PIECES.reduce((acc, p) => acc + p.weight, 0);
    let random = Math.random() * totalWeight;
    for (const piece of PIECES) {
      if (random < piece.weight) return piece;
      random -= piece.weight;
    }
    return PIECES[0];
  };

  const spin = () => {
    if (isSpinning || showWin) return;
    setIsSpinning(true);
    setShowWin(false);

    let spins = 0;
    const maxSpins = 20;
    const interval = setInterval(() => {
      setReels(prev => prev.map(reel => [getRandomPiece(), getRandomPiece(), getRandomPiece()]));
      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 100);
  };

  const finalizeSpin = () => {
    const finalReels = [
      [getRandomPiece(), getRandomPiece(), getRandomPiece()],
      [getRandomPiece(), getRandomPiece(), getRandomPiece()],
      [getRandomPiece(), getRandomPiece(), getRandomPiece()],
    ];
    setReels(finalReels);
    setIsSpinning(false);

    // Check center line (index 1 of each reel)
    const centerLine = [finalReels[0][1], finalReels[1][1], finalReels[2][1]];
    const isWin = centerLine[0].id === centerLine[1].id && centerLine[1].id === centerLine[2].id;

    if (isWin) {
      const wonCoins = centerLine[0].value;
      setWinAmount(wonCoins);
      setShowWin(true);
      if (winAudioRef.current) {
        winAudioRef.current.currentTime = 0;
        winAudioRef.current.play().catch(() => {});
      }
      
      if (currentPlayer === 1) setCoinsP1(prev => prev + wonCoins);
      else setCoinsP2(prev => prev + wonCoins);

      setTimeout(() => {
        setShowWin(false);
        if (gameMode === 'multi') {
          setCurrentPlayer(prev => prev === 1 ? 2 : 1);
        }
      }, 4000);
    } else {
      if (gameMode === 'multi') {
        setCurrentPlayer(prev => prev === 1 ? 2 : 1);
      }
    }
  };

  if (gameMode === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black pointer-events-none" />
        
        <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2 font-group-b text-white">
          <ChevronLeft size={18} /> Voltar
        </button>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
          <h1 className="font-group-a text-5xl md:text-7xl mb-12 text-yellow-500 drop-shadow-[0_5px_15px_rgba(234,179,8,0.5)]">XADREZ DA SORTE</h1>
          
          <div className="flex flex-col gap-4 w-full max-w-md">
            <button onClick={() => setGameMode('single')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-group-b text-xl text-white shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105">
              <User size={24} /> JOGAR SOZINHO
            </button>
            <button onClick={() => setGameMode('multi')} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-group-b text-xl text-white shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105">
              <Users size={24} /> MODO MULTIPLAYER
            </button>
            <button onClick={() => setGameMode('guide')} className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 rounded-2xl font-group-b text-xl text-white shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 mt-4">
              <Info size={24} /> TABELA DE PRÊMIOS
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'guide') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 relative overflow-hidden">
        <button onClick={() => setGameMode('select')} className="absolute top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2 font-group-b text-white">
          <ChevronLeft size={18} /> Voltar
        </button>
        
        <h1 className="font-group-a text-4xl mt-16 mb-8 text-yellow-500">TABELA DE PRÊMIOS</h1>
        
        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl overflow-y-auto max-h-[70vh] custom-scrollbar">
          <p className="font-group-b text-slate-300 text-center mb-6">Alinhe 3 peças idênticas na linha central para ganhar moedas! Acumule moedas para trocar por prêmios com seu professor.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PIECES.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <p.Icon className={`w-12 h-12 ${p.color}`} />
                  <span className="font-group-b text-white">{p.name}</span>
                </div>
                <div className="font-group-a text-yellow-500 text-xl">{p.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-900/10 to-black pointer-events-none" />

      <audio ref={audioRef} src="https://assets.mixkit.co/music/preview/mixkit-chinese-new-year-111.mp3" loop />
      <audio ref={winAudioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3" />

      <button onClick={toggleMute} className="absolute top-4 right-4 z-50 bg-slate-800/80 backdrop-blur-md p-3 rounded-full border border-slate-700 hover:bg-slate-700 transition-all text-yellow-400">
        {isMuted ? <Zap size={20} className="opacity-50" /> : <Zap size={20} className="animate-pulse" />}
      </button>

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        
        {/* Header / Coins */}
        <div className="flex w-full justify-between items-start mb-8 px-4">
          <div className={`flex flex-col items-center bg-black/60 backdrop-blur-md p-4 rounded-2xl border-2 ${gameMode === 'multi' && currentPlayer === 1 ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10'}`}>
            <span className="font-group-b text-xs text-slate-400 mb-1">{gameMode === 'multi' ? 'JOGADOR 1' : 'MOEDAS DA SORTE'}</span>
            <div className={`font-group-a text-4xl ${gameMode === 'multi' ? 'text-blue-500' : 'text-yellow-500'}`}>{coinsP1}</div>
          </div>

          {gameMode === 'multi' && (
            <div className="flex flex-col items-center">
              <span className="font-group-a text-2xl text-white mb-2">
                VEZ DO JOGADOR {currentPlayer}
              </span>
            </div>
          )}

          {gameMode === 'multi' && (
            <div className={`flex flex-col items-center bg-black/60 backdrop-blur-md p-4 rounded-2xl border-2 ${currentPlayer === 2 ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-white/10'}`}>
              <span className="font-group-b text-xs text-slate-400 mb-1">JOGADOR 2</span>
              <div className="font-group-a text-4xl text-red-500">{coinsP2}</div>
            </div>
          )}
        </div>

        {/* Slot Machine */}
        <div className="relative">
          <div className="bg-gradient-to-b from-[#d4af37] via-[#f9d71c] to-[#b8860b] p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-t-8 border-yellow-200 relative">
            <div className="bg-[#0f0f0f] rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-[inset_0_0_50px_rgba(0,0,0,1)] border-4 border-yellow-900/40 relative">
              
              {/* Payline Indicator */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 -translate-y-1/2 z-20 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <div className="absolute top-1/2 left-0 w-4 h-4 bg-red-500 rounded-full -translate-y-1/2 -translate-x-1/2 z-20 border-2 border-white" />
              <div className="absolute top-1/2 right-0 w-4 h-4 bg-red-500 rounded-full -translate-y-1/2 translate-x-1/2 z-20 border-2 border-white" />

              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {reels.map((reel, reelIndex) => (
                  <div key={reelIndex} className="flex flex-col gap-2 md:gap-4">
                    {reel.map((piece, rowIndex) => (
                      <div key={`${reelIndex}-${rowIndex}`} className={`relative w-20 h-24 md:w-32 md:h-36 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-xl shadow-inner border border-white/5 overflow-hidden flex items-center justify-center ${rowIndex === 1 ? 'ring-2 ring-yellow-500/30 bg-yellow-900/10' : 'opacity-50'}`}>
                        <motion.div
                          animate={isSpinning ? { y: [0, 100, -100, 0] } : { rotateY: [0, 10, -10, 0] }}
                          transition={isSpinning ? { repeat: Infinity, duration: 0.2 } : { repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          className="w-full h-full flex items-center justify-center p-2"
                        >
                          <piece.Icon className={`w-16 h-16 ${piece.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
                        </motion.div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Win Animation Overlay */}
            <AnimatePresence>
              {showWin && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem]"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(234,179,8,0.5),transparent)] rounded-[3rem]"
                  />
                  <h2 className="font-group-a text-6xl md:text-8xl text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,1)] z-10">VITÓRIA!</h2>
                  <p className="font-group-a text-4xl text-white mt-4 z-10">+{winAmount} MOEDAS</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spin Button */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={spin}
              disabled={isSpinning || showWin}
              className={`relative group transition-all duration-300 ${isSpinning || showWin ? 'opacity-50 grayscale' : 'hover:scale-105 active:scale-95'}`}
            >
              <div className="absolute -inset-4 bg-yellow-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition duration-500" />
              <div className="relative px-12 py-6 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-full border-4 border-yellow-200 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.8)] flex items-center justify-center">
                <span className="font-group-a text-3xl text-red-950 drop-shadow-sm">GIRAR A SORTE</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
