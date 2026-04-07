import React, { useState, useEffect, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { Trophy, Swords, RotateCw, User, CheckCircle2, Play, Crown, Zap, Star, Search, Clock } from 'lucide-react';
import { auth, db } from './firebase';

// --- BANCO DE PALAVRAS ---
const wordBank = {
  "Linguagens": ["METAFORA", "SINTAXE", "POESIA", "VERBO", "SUJEITO", "ADJETIVO", "ARTIGO", "LITERATURA", "PROSA", "RIMA", "IRONIA", "LIVRO", "DRAMA", "TEXTO", "FRASE"],
  "Matemática": ["ALGEBRA", "CALCULO", "GEOMETRIA", "SENO", "COSENO", "MATRIZ", "VETOR", "FUNCAO", "RAIZ", "LOGICA", "NUMERO", "SOMA", "DIVISAO", "FRACAO", "ANGULO"],
  "Ciências da Natureza": ["ATOMO", "CELULA", "GENETICA", "FISICA", "QUIMICA", "PROTON", "ENERGIA", "FOTON", "BIO", "PLASMA", "REACAO", "SOLVENTE", "INERCIA", "FORCA", "MASSA"],
  "Ciências Humanas": ["HISTORIA", "GEOGRAFIA", "POLITICA", "CULTURA", "SOCIEDADE", "GUERRA", "ESTADO", "POVO", "NACAO", "PODER", "DIREITO", "EPOCA", "CIDADE", "MUNDO", "BRASIL"]
};

const categories = [
  { id: "Linguagens", color: "#ec4899", icon: "📚", gradient: "from-pink-500 to-rose-600" },
  { id: "Matemática", color: "#3b82f6", icon: "📐", gradient: "from-blue-500 to-indigo-600" },
  { id: "Ciências da Natureza", color: "#10b981", icon: "🧪", gradient: "from-emerald-500 to-teal-600" },
  { id: "Ciências Humanas", color: "#f59e0b", icon: "🌍", gradient: "from-amber-500 to-orange-600" }
];

const GRID_SIZE = 12;
const TURN_TIME = 20;

const Cruzaletras = ({ onBack }) => {
  const [gameState, setGameState] = useState('menu');
  const [activePlayer, setActivePlayer] = useState(1);
  const [p1Name, setP1Name] = useState('JOGADOR 1');
  const [p2Name, setP2Name] = useState('JOGADOR 2');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  
  const [currentCategory, setCurrentCategory] = useState(null);
  const [grid, setGrid] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]); 
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const wheelCanvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
        await signInWithCustomToken(auth, (window as any).__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && !winner) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setActivePlayer((curr) => (curr === 1 ? 2 : 1));
            return TURN_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, activePlayer, winner]);

  const generatePuzzle = (category) => {
    const allWords = [...wordBank[category]].sort(() => Math.random() - 0.5);
    const targetWords = allWords.slice(0, 13);
    
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const placedWords = [];

    const canPlace = (word, row, col, dr, dc) => {
      for (let i = 0; i < word.length; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
        if (newGrid[r][c] !== '' && newGrid[r][c] !== word[i]) return false;
      }
      return true;
    };

    targetWords.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 200) {
        const dr = Math.random() > 0.5 ? 1 : 0;
        const dc = dr === 0 ? 1 : 0;
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);

        if (canPlace(word, r, c, dr, dc)) {
          for (let i = 0; i < word.length; i++) {
            newGrid[r + i * dr][c + i * dc] = word[i];
          }
          placedWords.push({ 
            word, 
            foundBy: null, 
            coords: Array.from({length: word.length}, (_, i) => ({r: r + i * dr, c: c + i * dc})) 
          });
          placed = true;
        }
        attempts++;
      }
    });

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setGrid(newGrid);
    setWordsToFind(placedWords);
    setTimeLeft(TURN_TIME);
  };

  useEffect(() => {
    if (gameState === 'setup' || gameState === 'spinning' || gameState === 'menu') drawWheel();
  }, [rotation, gameState]);

  const drawWheel = () => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 40; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    categories.forEach((cat, i) => {
      const angle = (2 * Math.PI) / categories.length;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, i * angle + rotation, (i + 1) * angle + rotation);
      ctx.fillStyle = cat.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // --- DESENHAR NOME E FIGURA ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * angle + angle / 2 + rotation);
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      
      // Ícone
      ctx.font = "bold 26px Arial";
      ctx.fillText(cat.icon, radius * 0.62, -5);
      
      // Nome da Categoria (com quebra opcional ou fonte menor para caber)
      ctx.font = "900 11px Montserrat, sans-serif";
      const words = cat.id.split(" ");
      if (words.length > 2) {
        // Para nomes longos como "Ciências da Natureza"
        ctx.fillText(words[0], radius * 0.62, 12);
        ctx.fillText(words.slice(1).join(" "), radius * 0.62, 24);
      } else {
        ctx.fillText(cat.id.toUpperCase(), radius * 0.62, 15);
      }
      
      ctx.restore();
    });

    // SETA INDICADORA
    ctx.fillStyle = "white";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(cx + radius - 5, cy); 
    ctx.lineTo(cx + radius + 35, cy - 25); 
    ctx.lineTo(cx + radius + 35, cy + 25); 
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setGameState('spinning');
    const extra = 25 + Math.random() * 20;
    let v = extra;
    let r = rotation;
    const anim = () => {
      r += v * 0.01;
      v *= 0.985;
      setRotation(r);
      if (v > 0.1) requestAnimationFrame(anim);
      else {
        setIsSpinning(false);
        const angle = (2 * Math.PI) / categories.length;
        const norm = (2 * Math.PI - (r % (2 * Math.PI))) % (2 * Math.PI);
        const idx = Math.floor(norm / angle);
        const picked = categories[idx];
        setTimeout(() => {
          setCurrentCategory(picked);
          generatePuzzle(picked.id);
          setGameState('playing');
        }, 800);
      }
    };
    anim();
  };

  useEffect(() => {
    if (gameState === 'playing') drawGrid();
  }, [grid, wordsToFind, selection]);

  const drawGrid = () => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cellSize = canvas.width / GRID_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    wordsToFind.forEach(wf => {
      if (wf.foundBy) {
        ctx.fillStyle = wf.foundBy === 1 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        wf.coords.forEach(c => {
          ctx.beginPath();
          ctx.roundRect(c.c * cellSize + 2, c.r * cellSize + 2, cellSize - 4, cellSize - 4, 10);
          ctx.fill();
        });
      }
    });

    if (selection) {
      ctx.strokeStyle = activePlayer === 1 ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.5;
      const s = selection.start;
      const e = selection.end;
      ctx.beginPath();
      ctx.moveTo(s.c * cellSize + cellSize/2, s.r * cellSize + cellSize/2);
      ctx.lineTo(e.c * cellSize + cellSize/2, e.r * cellSize + cellSize/2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.font = "bold 24px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    grid.forEach((row, r) => {
      row.forEach((char, c) => {
        ctx.fillText(char, c * cellSize + cellSize/2, r * cellSize + cellSize/2);
      });
    });
  };

  const getCellFromCoords = (e) => {
    const rect = gridCanvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    const scaleX = gridCanvasRef.current.width / rect.width;
    const scaleY = gridCanvasRef.current.height / rect.height;
    const cellSize = gridCanvasRef.current.width / GRID_SIZE;
    return { 
      r: Math.floor((offsetY * scaleY) / cellSize), 
      c: Math.floor((offsetX * scaleX) / cellSize) 
    };
  };

  const handleMouseDown = (e) => {
    if (gameState !== 'playing' || winner) return;
    const cell = getCellFromCoords(e);
    if (cell.r >= 0 && cell.r < GRID_SIZE && cell.c >= 0 && cell.c < GRID_SIZE) {
      setSelection({ start: cell, end: cell });
    }
  };

  const handleMouseMove = (e) => {
    if (!selection) return;
    const cell = getCellFromCoords(e);
    if (cell.r >= 0 && cell.r < GRID_SIZE && cell.c >= 0 && cell.c < GRID_SIZE) {
      if (cell.r === selection.start.r || cell.c === selection.start.c) {
        setSelection({ ...selection, end: cell });
      }
    }
  };

  const handleMouseUp = () => {
    if (!selection) return;
    const s = selection.start;
    const e = selection.end;
    let selectedStr = "";
    if (s.r === e.r) { 
      const startC = Math.min(s.c, e.c);
      const endC = Math.max(s.c, e.c);
      for (let c = startC; c <= endC; c++) selectedStr += grid[s.r][c];
    } else if (s.c === e.c) {
      const startR = Math.min(s.r, e.r);
      const endR = Math.max(s.r, e.r);
      for (let r = startR; r <= endR; r++) selectedStr += grid[r][s.c];
    }
    const reversed = selectedStr.split('').reverse().join('');
    const wordIdx = wordsToFind.findIndex(wf => !wf.foundBy && (wf.word === selectedStr || wf.word === reversed));
    if (wordIdx !== -1) {
      const newWords = [...wordsToFind];
      newWords[wordIdx].foundBy = activePlayer;
      setWordsToFind(newWords);
      const newScores = { ...scores, [activePlayer === 1 ? 'p1' : 'p2']: scores[activePlayer === 1 ? 'p1' : 'p2'] + 1 };
      setScores(newScores);
      if (newScores[activePlayer === 1 ? 'p1' : 'p2'] >= 7) {
        setWinner(activePlayer);
        setGameState('gameover');
      } else {
        setActivePlayer(activePlayer === 1 ? 2 : 1);
        setTimeLeft(TURN_TIME);
      }
    } else {
      setActivePlayer(activePlayer === 1 ? 2 : 1);
      setTimeLeft(TURN_TIME);
    }
    setSelection(null);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col items-center select-none overflow-x-hidden relative">
      <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400/20 border border-yellow-400/20 shadow-lg">Voltar</button>

      {/* SCOREBOARD */}
      {gameState !== 'menu' && (
        <div className="w-full max-w-4xl mt-16 px-6 z-10">
          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-5 flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className={`flex items-center gap-4 transition-all duration-500 ${activePlayer === 1 ? 'scale-105' : 'opacity-30'}`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500 flex items-center justify-center text-blue-400">
                <User size={32} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-blue-400">{p1Name}</p>
                <p className="text-4xl font-black">{scores.p1} <span className="text-xs text-slate-500">/ 7</span></p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Clock size={28} className={timeLeft < 6 ? 'text-red-500 animate-pulse' : 'text-slate-500'} />
              <p className={`text-2xl font-black tabular-nums ${timeLeft < 6 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</p>
            </div>
            <div className={`flex items-center gap-4 transition-all duration-500 ${activePlayer === 2 ? 'scale-105' : 'opacity-30'}`}>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-red-500">{p2Name}</p>
                <p className="text-4xl font-black">{scores.p2} <span className="text-xs text-slate-500">/ 7</span></p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-500">
                <User size={32} />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1.5 transition-all duration-700 ${activePlayer === 1 ? 'w-1/2 bg-blue-500' : 'translate-x-full w-1/2 bg-red-500'}`} />
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center p-6 z-10">
        
        {/* MENU */}
        {gameState === 'menu' && (
          <div className="text-center space-y-12 animate-in zoom-in duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 mb-4">
                <Search size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Word Search Battle</span>
              </div>
              <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter uppercase leading-none">
                CRUZA<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500">LETRAS</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Duelo 1v1 Offline • 20s por jogada</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
              <input 
                type="text" 
                value={p1Name} 
                onFocus={() => p1Name === 'JOGADOR 1' && setP1Name('')}
                onBlur={() => p1Name.trim() === '' && setP1Name('JOGADOR 1')}
                onChange={e => setP1Name(e.target.value.toUpperCase())} 
                className="w-full bg-slate-900 border-2 border-blue-500/20 p-5 rounded-2xl text-center font-black text-blue-400 uppercase outline-none focus:border-blue-500" 
              />
              <input 
                type="text" 
                value={p2Name} 
                onFocus={() => p2Name === 'JOGADOR 2' && setP2Name('')}
                onBlur={() => p2Name.trim() === '' && setP2Name('JOGADOR 2')}
                onChange={e => setP2Name(e.target.value.toUpperCase())} 
                className="w-full bg-slate-900 border-2 border-red-500/20 p-5 rounded-2xl text-center font-black text-red-500 uppercase outline-none focus:border-red-500" 
              />
            </div>
            <button onClick={() => setGameState('setup')} className="px-20 py-8 bg-white text-slate-950 rounded-full font-black text-2xl uppercase italic tracking-tighter hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4 mx-auto">
              <Play fill="currentColor" /> INICIAR DUELO
            </button>
          </div>
        )}

        {/* ROLETA */}
        {(gameState === 'setup' || gameState === 'spinning') && (
          <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in">
            <h2 className="text-3xl font-black italic uppercase text-slate-400">Gire para o Tema</h2>
            <div className="relative p-10 rounded-full bg-slate-800 border-[15px] border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.6)]">
               <canvas ref={wheelCanvasRef} width={420} height={420} className="rounded-full shadow-inner" />
               <button onClick={spinWheel} disabled={isSpinning} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-slate-950 border-4 border-white flex items-center justify-center shadow-2xl z-20 group hover:scale-110 active:scale-90 transition-all disabled:scale-100 disabled:opacity-50">
                  <RotateCw size={40} className={isSpinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
               </button>
            </div>
          </div>
        )}

        {/* JOGANDO */}
        {gameState === 'playing' && (
          <div className="w-full flex flex-col md:flex-row gap-10 items-center justify-center animate-in slide-in-from-bottom-12">
            <div className="relative p-2 bg-slate-800/40 rounded-[3rem] border-4 border-white/5 shadow-2xl">
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-8 py-2 rounded-full font-black uppercase text-xs tracking-[0.3em] shadow-xl ${activePlayer === 1 ? 'bg-blue-600' : 'bg-red-600'}`}>
                TURNO: {activePlayer === 1 ? p1Name : p2Name}
              </div>
              <canvas 
                ref={gridCanvasRef} 
                width={550} 
                height={550} 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                className="max-w-full h-auto rounded-[2.5rem] cursor-crosshair touch-none p-0"
              />
            </div>
            <div className="w-full md:w-80 space-y-6">
              <div className={`p-6 rounded-[2rem] bg-gradient-to-br ${currentCategory.gradient} shadow-2xl border border-white/10`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{currentCategory.icon}</span>
                  <p className="text-[10px] font-black uppercase opacity-60">TEMA ATUAL</p>
                </div>
                <p className="text-3xl font-black italic uppercase tracking-tighter">{currentCategory.id}</p>
              </div>
              <div className="bg-slate-900/80 p-8 rounded-[2rem] border border-white/5 max-h-[420px] overflow-y-auto shadow-inner">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex justify-between">
                  <span>RESTANTES</span>
                  <span>{wordsToFind.filter(w => !w.foundBy).length} / 13</span>
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {wordsToFind.map((wf, i) => (
                    <div key={i} className={`flex items-center gap-4 text-sm font-bold transition-all duration-300 ${wf.foundBy ? 'opacity-20 line-through scale-95' : 'opacity-100'}`}>
                      <div className={`w-3 h-3 rounded-full shadow-lg ${wf.foundBy === 1 ? 'bg-blue-500' : wf.foundBy === 2 ? 'bg-red-500' : 'bg-slate-700'}`} />
                      <span className="uppercase tracking-tight font-black">{wf.word}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VITÓRIA */}
        {gameState === 'gameover' && (
          <div className="text-center space-y-12 animate-in zoom-in duration-500">
            <div className="relative inline-block">
               <div className={`absolute inset-0 ${winner === 1 ? 'bg-blue-500' : 'bg-red-500'} blur-[100px] opacity-30 rounded-full`} />
               <Crown size={160} className="mx-auto text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-bounce" />
               <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest border-2 border-white/20 shadow-2xl ${winner === 1 ? 'bg-blue-600' : 'bg-red-600'}`}>
                  VENCEDOR!
               </div>
            </div>
            <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase leading-none">
              {winner === 1 ? p1Name : p2Name}
            </h2>
            <button onClick={() => window.location.reload()} className="px-20 py-8 bg-white text-slate-950 rounded-full font-black text-2xl uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all">
              <RotateCw size={32} /> JOGAR NOVAMENTE
            </button>
          </div>
        )}
      </main>

      {/* RODAPÉ CENTRALIZADO */}
      <footer className="w-full bg-slate-950/95 border-t border-white/5 py-8 px-10 flex flex-col items-center justify-center text-center text-[11px] font-medium text-slate-500 z-20 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3 w-full max-w-xl">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 mb-2">
            <span className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-slate-400">
              <Star size={12} className="text-yellow-500 fill-yellow-500" /> CRUZALETRAS v2.1
            </span>
            <span className="hidden md:inline text-slate-800">|</span>
            <span className="font-black uppercase tracking-[0.2em] text-slate-400">ACHE 7 PALAVRAS PARA VENCER!</span>
          </div>
          
          <div className="space-y-1.5 w-full flex flex-col items-center">
            <p className="text-slate-400">Desenvolvido por <span className="text-slate-300 font-bold">André Victor Brito de Andrade ®</span></p>
            <p className="flex items-center gap-1 justify-center">
              Contato: <a href="mailto:andrevictorbritodeandrade@gmail.com" className="text-blue-400/80 hover:text-blue-400 transition-colors underline decoration-blue-400/30 underline-offset-2">andrevictorbritodeandrade@gmail.com</a>
            </p>
            <p className="text-slate-500 italic">© 2026 Todos os direitos reservados.</p>
            <p className="text-slate-600 text-[9px] mt-2 font-black tracking-widest uppercase bg-white/5 px-3 py-1 rounded-full border border-white/5">Versão 1.0.0</p>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Cruzaletras;
