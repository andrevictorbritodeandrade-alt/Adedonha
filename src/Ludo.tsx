import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Users, Dices, RotateCcw, Info, Play,
  UserCircle2, AlertCircle, Move, History,
  Volume2, VolumeX, ArrowLeft
} from 'lucide-react';

// --- Constantes do Jogo ---
const BOARD_SIZE = 15;
const COLORS: any = {
  RED: { name: 'Vermelho', hex: '#ef4444', secondary: '#fee2e2', pathStart: 0, homeEntry: 50, basePos: { r: 0, c: 0 } },
  GREEN: { name: 'Verde', hex: '#22c55e', secondary: '#f0fdf4', pathStart: 13, homeEntry: 11, basePos: { r: 0, c: 9 } },
  YELLOW: { name: 'Amarelo', hex: '#eab308', secondary: '#fefce8', pathStart: 26, homeEntry: 24, basePos: { r: 9, c: 9 } },
  BLUE: { name: 'Azul', hex: '#3b82f6', secondary: '#eff6ff', pathStart: 39, homeEntry: 37, basePos: { r: 9, c: 0 } }
};

const COLOR_ORDER = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

const MAIN_PATH = [
  {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
  {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
  {r: 0, c: 7}, {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8},
  {r: 5, c: 8}, {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13},
  {r: 6, c: 14}, {r: 7, c: 14}, {r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11},
  {r: 8, c: 10}, {r: 8, c: 9}, {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8},
  {r: 13, c: 8}, {r: 14, c: 8}, {r: 14, c: 7}, {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6},
  {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6}, {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3},
  {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0}, {r: 7, c: 0}
];

const HOME_PATHS: any = {
  RED: [{r: 7, c: 1}, {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5}],
  GREEN: [{r: 1, c: 7}, {r: 2, c: 7}, {r: 3, c: 7}, {r: 4, c: 7}, {r: 5, c: 7}],
  YELLOW: [{r: 7, c: 13}, {r: 7, c: 12}, {r: 7, c: 11}, {r: 7, c: 10}, {r: 7, c: 9}],
  BLUE: [{r: 13, c: 7}, {r: 12, c: 7}, {r: 11, c: 7}, {r: 10, c: 7}, {r: 9, c: 7}]
};

const SAFE_SPOTS = [1, 9, 14, 22, 27, 35, 40, 48];

export default function Ludo({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState('SETUP');
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [turnPhase, setTurnPhase] = useState('ROLL');
  const [gameLog, setGameLog] = useState('Bem-vindo ao Ludo!');
  const [history, setHistory] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const [dragInfo, setDragInfo] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializa o áudio de fundo (Arcade)
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-arcade-retro-changing-over-121.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Controla o silenciamento do áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const addHistory = (msg: string, color: string) => {
    setHistory(prev => [{ msg, color, id: Date.now() }, ...prev].slice(0, 5));
  };

  const getCoords = useCallback((player: any, pieceIdx: number, pos: number) => {
    let r, c;
    if (pos === -1) {
      const baseOffsets = [[1.5, 1.5], [1.5, 4.5], [4.5, 1.5], [4.5, 4.5]];
      r = player.basePos.r + baseOffsets[pieceIdx][0];
      c = player.basePos.c + baseOffsets[pieceIdx][1];
    } else if (pos < 52) {
      const pathIdx = (player.pathStart + pos) % 52;
      r = MAIN_PATH[pathIdx].r + 0.5;
      c = MAIN_PATH[pathIdx].c + 0.5;
    } else if (pos < 57) {
      const homeIdx = pos - 52;
      r = HOME_PATHS[player.colorKey][homeIdx].r + 0.5;
      c = HOME_PATHS[player.colorKey][homeIdx].c + 0.5;
    } else {
      r = 7.5; c = 7.5;
    }
    return { r, c };
  }, []);

  const startGame = () => {
    const shuffledColors = [...COLOR_ORDER].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, playerCount);
   
    const newPlayers = selectedColors.map((colorKey) => ({
      colorKey,
      ...COLORS[colorKey],
      pieces: [-1, -1, -1, -1],
    }));
   
    setPlayers(newPlayers);
    setCurrentPlayer(0);
    setHistory([]);
    setGameState('PLAYING');
    setTurnPhase('ROLL');
    setGameLog(`${COLORS[selectedColors[0]].name.toUpperCase()} COMEÇA O JOGO!`);

    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Áudio bloqueado pelo navegador até interação."));
    }
  };

  const rollDice = () => {
    if (turnPhase !== 'ROLL' || isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        handlePostRoll(finalValue);
      }
    }, 50);
  };

  const handlePostRoll = (value: number) => {
    const player = players[currentPlayer];
    const canMove = player.pieces.some((pos: number) => {
      if (pos === -1) return value === 6;
      if (pos === 57) return false;
      return pos + value <= 57;
    });

    if (!canMove) {
      addHistory(`${player.name} tirou ${value} (Sem movimento)`, player.hex);
      setGameLog(`NENHUMA PEÇA PODE ANDAR.`);
      setTimeout(() => nextTurn(), 1500);
    } else {
      setTurnPhase('MOVE');
      setGameLog(`TIRASTE ${value}! ARRASTA A TUA PEÇA!`);
    }
  };

  const movePiece = (pieceIndex: number) => {
    const newPlayers = [...players];
    const player = newPlayers[currentPlayer];
    let pos = player.pieces[pieceIndex];
    let actionLabel = "";

    if (pos === -1) {
      player.pieces[pieceIndex] = 0;
      actionLabel = "saiu da base";
    } else {
      const newPos = pos + (diceValue || 0);
      player.pieces[pieceIndex] = newPos;
      actionLabel = `andou ${diceValue} casas`;
     
      if (newPos < 52) {
        const globalPos = (player.pathStart + newPos) % 52;
        if (!SAFE_SPOTS.includes(globalPos)) {
          newPlayers.forEach((otherPlayer, pIdx) => {
            if (pIdx === currentPlayer) return;
            otherPlayer.pieces.forEach((otherPos: number, oIdx: number) => {
              if (otherPos >= 0 && otherPos < 52) {
                const otherGlobalPos = (otherPlayer.pathStart + otherPos) % 52;
                if (globalPos === otherGlobalPos) {
                  otherPlayer.pieces[oIdx] = -1;
                  addHistory(`${player.name} capturou ${otherPlayer.name}!`, player.hex);
                }
              }
            });
          });
        }
      }
    }

    addHistory(`${player.name} ${actionLabel}`, player.hex);
    setPlayers(newPlayers);

    if (player.pieces.every((p: number) => p === 57)) {
      setWinner(player);
      setGameState('WINNER');
      return;
    }

    if (diceValue === 6) {
      setTurnPhase('ROLL');
      setDiceValue(null);
      setGameLog(`TIRASTE 6! JOGA DE NOVO.`);
    } else {
      nextTurn();
    }
  };

  const nextTurn = () => {
    const nextIdx = (currentPlayer + 1) % players.length;
    setCurrentPlayer(nextIdx);
    setTurnPhase('ROLL');
    setDiceValue(null);
    setGameLog(`${players[nextIdx].name.toUpperCase()} É A TUA VEZ!`);
  };

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cellSize = size / BOARD_SIZE;
    const activePlayer = players[currentPlayer];

    ctx.clearRect(0, 0, size, size);

    // Desenha as células do tabuleiro
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let color = '#ffffff';
        let belongsToCurrent = false;

        // Atribui cores às bases e caminhos
        if (r < 6 && c < 6) { color = COLORS.RED.hex; if(activePlayer?.colorKey === 'RED') belongsToCurrent = true; }
        else if (r < 6 && c > 8) { color = COLORS.GREEN.hex; if(activePlayer?.colorKey === 'GREEN') belongsToCurrent = true; }
        else if (r > 8 && c > 8) { color = COLORS.YELLOW.hex; if(activePlayer?.colorKey === 'YELLOW') belongsToCurrent = true; }
        else if (r > 8 && c < 6) { color = COLORS.BLUE.hex; if(activePlayer?.colorKey === 'BLUE') belongsToCurrent = true; }
       
        if (r === 7 && c > 0 && c < 6) { color = COLORS.RED.hex; if(activePlayer?.colorKey === 'RED') belongsToCurrent = true; }
        else if (c === 7 && r > 0 && r < 6) { color = COLORS.GREEN.hex; if(activePlayer?.colorKey === 'GREEN') belongsToCurrent = true; }
        else if (r === 7 && c > 8 && c < 14) { color = COLORS.YELLOW.hex; if(activePlayer?.colorKey === 'YELLOW') belongsToCurrent = true; }
        else if (c === 7 && r > 8 && r < 14) { color = COLORS.BLUE.hex; if(activePlayer?.colorKey === 'BLUE') belongsToCurrent = true; }

        if (r === 6 && c === 1) { color = COLORS.RED.hex; if(activePlayer?.colorKey === 'RED') belongsToCurrent = true; }
        else if (r === 1 && c === 8) { color = COLORS.GREEN.hex; if(activePlayer?.colorKey === 'GREEN') belongsToCurrent = true; }
        else if (r === 8 && c === 13) { color = COLORS.YELLOW.hex; if(activePlayer?.colorKey === 'YELLOW') belongsToCurrent = true; }
        else if (r === 13 && c === 6) { color = COLORS.BLUE.hex; if(activePlayer?.colorKey === 'BLUE') belongsToCurrent = true; }

        ctx.save();
        // Efeito de destaque para o jogador ativo
        if (!belongsToCurrent && gameState === 'PLAYING') {
          ctx.globalAlpha = 0.35;
        } else if (belongsToCurrent && gameState === 'PLAYING') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
        }

        ctx.fillStyle = color;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        ctx.restore();
      }
    }

    // Desenha os triângulos centrais
    const center = 7.5 * cellSize;
    const inner = 6 * cellSize;
    const outer = 9 * cellSize;
    const drawTriangle = (p1: any, p2: any, p3: any, color: string, isActive: boolean) => {
        ctx.save();
        if (!isActive && gameState === 'PLAYING') ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
        ctx.fillStyle = color; ctx.fill();
        ctx.restore();
    };

    drawTriangle({x:inner, y:inner}, {x:outer, y:inner}, {x:center, y:center}, COLORS.GREEN.hex, activePlayer?.colorKey === 'GREEN');
    drawTriangle({x:outer, y:inner}, {x:outer, y:outer}, {x:center, y:center}, COLORS.YELLOW.hex, activePlayer?.colorKey === 'YELLOW');
    drawTriangle({x:outer, y:outer}, {x:inner, y:outer}, {x:center, y:center}, COLORS.BLUE.hex, activePlayer?.colorKey === 'BLUE');
    drawTriangle({x:inner, y:outer}, {x:inner, y:inner}, {x:center, y:center}, COLORS.RED.hex, activePlayer?.colorKey === 'RED');

    // Destaque do destino durante o arrasto
    if (dragInfo) {
        const player = players[currentPlayer];
        const targetCoord = getCoords(player, dragInfo.pieceIdx, dragInfo.targetPos);
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.hex;
        ctx.fillStyle = player.hex + '66';
        ctx.fillRect((targetCoord.c - 0.5) * cellSize, (targetCoord.r - 0.5) * cellSize, cellSize, cellSize);
        ctx.restore();
    }

    // Desenha as peças (pinos)
    players.forEach((player, pIdx) => {
      player.pieces.forEach((pos: number, pieceIdx: number) => {
        if (pos === 57) return;
        let r, c;
        if (dragInfo && pIdx === currentPlayer && pieceIdx === dragInfo.pieceIdx) {
            r = dragInfo.currentY / cellSize;
            c = dragInfo.currentX / cellSize;
        } else {
            const coords = getCoords(player, pieceIdx, pos);
            r = coords.r; c = coords.c;
        }
        const isMyTurn = pIdx === currentPlayer;
        const canMoveThis = turnPhase === 'MOVE' && isMyTurn && ((pos === -1 && diceValue === 6) || (pos >= 0 && pos + (diceValue || 0) <= 57));
        ctx.save();
        if (canMoveThis && !dragInfo) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = "white";
          ctx.beginPath(); ctx.arc(c * cellSize, r * cellSize, cellSize * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; ctx.fill();
        }
        ctx.fillStyle = player.hex;
        ctx.beginPath(); ctx.arc(c * cellSize, r * cellSize, cellSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      });
    });
  }, [players, currentPlayer, diceValue, turnPhase, dragInfo, getCoords, gameState]);

  useEffect(() => {
    if (gameState !== 'SETUP') drawBoard();
  }, [gameState, drawBoard, dragInfo]);

  // Gestão de eventos de clique e toque para arrastar as peças
  const handleStart = (clientX: number, clientY: number) => {
    if (turnPhase !== 'MOVE' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cellSize = canvasRef.current.width / BOARD_SIZE;
    const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);
    const clickedC = Math.floor(x / cellSize);
    const clickedR = Math.floor(y / cellSize);
    const player = players[currentPlayer];
    let foundIdx = -1;
    player.pieces.forEach((pos: number, idx: number) => {
      const coords = getCoords(player, idx, pos);
      const dist = Math.sqrt(Math.pow(clickedC + 0.5 - coords.c, 2) + Math.pow(clickedR + 0.5 - coords.r, 2));
      const canMove = (pos === -1 && diceValue === 6) || (pos >= 0 && pos + (diceValue || 0) <= 57);
      if (dist < 1.2 && canMove) foundIdx = idx;
    });
    if (foundIdx !== -1) {
        setDragInfo({
            pieceIdx: foundIdx,
            currentX: x,
            currentY: y,
            targetPos: player.pieces[foundIdx] === -1 ? 0 : player.pieces[foundIdx] + (diceValue || 0)
        });
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragInfo || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);
    setDragInfo((prev: any) => ({ ...prev, currentX: x, currentY: y }));
  };

  const handleEnd = () => {
    if (!dragInfo || !canvasRef.current) return;
    const player = players[currentPlayer];
    const cellSize = canvasRef.current.width / BOARD_SIZE;
    const targetCoord = getCoords(player, dragInfo.pieceIdx, dragInfo.targetPos);
    const distToTarget = Math.sqrt(Math.pow(dragInfo.currentX / cellSize - targetCoord.c, 2) + Math.pow(dragInfo.currentY / cellSize - targetCoord.r, 2));
    if (distToTarget < 1.8) movePiece(dragInfo.pieceIdx);
    setDragInfo(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-6 font-sans flex flex-col items-center select-none overflow-x-hidden relative">
      <button 
        onClick={onBack}
        className="absolute left-4 top-4 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-50 shadow-lg border border-white/10 flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft size={32} />
      </button>

      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {gameState === 'SETUP' ? (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border-t-[12px] border-red-500 animate-in fade-in zoom-in duration-500">
            <h1 className="text-5xl font-group-a text-slate-800 mb-2 tracking-tighter uppercase">LUDO</h1>
            <p className="text-slate-400 mb-10 font-group-b uppercase tracking-[0.3em] text-xs text-center">Clássico Escolar</p>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-group-b text-slate-500 mb-4 flex items-center justify-center gap-2">
                  <Users size={20} /> NÚMERO DE JOGADORES
                </label>
                <div className="flex justify-center gap-4">
                  {[2, 3, 4].map(num => (
                    <button key={num} onClick={() => setPlayerCount(num)} className={`w-16 h-16 rounded-3xl font-group-a text-2xl transition-all duration-300 ${playerCount === num ? 'bg-red-500 text-white scale-110 shadow-xl shadow-red-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <button onClick={startGame} className="w-full bg-red-500 hover:bg-red-600 text-white font-group-a py-5 rounded-[2rem] shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-4 text-xl">
                <Play fill="currentColor" size={24} /> COMEÇAR SORTEIO
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-6xl mx-auto justify-center mt-12">
           
            {/* Tabuleiro Expandido */}
            <div className="w-full flex justify-center">
              <div className="bg-white p-2 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border-b-[12px] border-slate-200 relative w-full flex justify-center">
                  <canvas
                      ref={canvasRef}
                      width={800}
                      height={800}
                      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                      onMouseUp={handleEnd}
                      onMouseLeave={handleEnd}
                      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
                      onTouchEnd={handleEnd}
                      className="max-w-full h-auto cursor-grab active:cursor-grabbing rounded-xl"
                      style={{ width: 'min(98vw, 750px)', height: 'min(98vw, 750px)', touchAction: 'none' }}
                  />
              </div>
            </div>

            {/* Painel de Controlo */}
            <div className="w-full max-w-[750px] bg-white rounded-[2.5rem] shadow-2xl p-6 border-b-4 border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               
                <div className="flex flex-col items-center md:items-start gap-1 order-2 md:order-1">
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-group-b text-slate-400 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: players[currentPlayer].hex}}></div>
                    <span>{gameLog}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-group-a text-sm" style={{backgroundColor: players[currentPlayer].hex}}>
                      {players[currentPlayer].name[0]}
                    </div>
                    <span className="font-group-a text-slate-800 text-sm md:text-base">{players[currentPlayer].name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 order-1 md:order-2 w-full md:w-auto">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-50 border-4 border-slate-100 flex items-center justify-center transition-all duration-300 ${isRolling ? 'rotate-12 scale-110 shadow-lg' : 'shadow-inner'}`}>
                    {diceValue ? (
                        <div className="text-3xl md:text-4xl font-group-a text-slate-800 animate-in zoom-in">{diceValue}</div>
                    ) : (
                        <Dices size={36} className="text-slate-200" />
                    )}
                  </div>

                  <button
                    disabled={turnPhase !== 'ROLL' || isRolling}
                    onClick={rollDice}
                    className={`flex-1 md:w-64 py-4 md:py-5 rounded-full font-group-a text-base md:text-xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${turnPhase === 'ROLL' ? 'bg-[#1e293b] text-white hover:bg-black' : 'bg-slate-100 text-slate-300'}`}
                  >
                    {isRolling ? 'SORTEANDO...' : 'LANÇAR DADO'}
                  </button>
                </div>

                <div className="order-3 flex items-center gap-4">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-full bg-slate-50 text-slate-400 hover:text-slate-800 transition-colors"
                    title={isMuted ? "Ativar Música" : "Silenciar Música"}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <button onClick={() => setGameState('SETUP')} className="flex items-center gap-2 text-[10px] font-group-b text-slate-300 hover:text-red-400 transition-colors uppercase tracking-[0.2em]">
                    <RotateCcw size={12} /> Reiniciar
                  </button>
                </div>
              </div>
            </div>

            {/* Histórico */}
            <div className="w-full max-w-[750px] flex gap-2 overflow-x-auto pb-4 custom-scrollbar px-4">
              {history.map((item) => (
                <div key={item.id} className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm flex items-center gap-2 shrink-0 animate-in fade-in">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                  <p className="text-[10px] font-group-b text-slate-500 uppercase">{item.msg}</p>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Rodapé de Créditos */}
      <footer className="w-full py-8 text-center text-slate-400 flex flex-col gap-1 border-t border-slate-200/50 mt-10">
        <p className="text-sm font-group-b text-slate-600 tracking-tight">Desenvolvido por André Victor Brito de Andrade ®</p>
        <p className="text-xs">Contato: <a href="mailto:andrevictorbritodeandrade@gmail.com" className="text-blue-400 hover:underline">andrevictorbritodeandrade@gmail.com</a></p>
        <p className="text-[10px] mt-1 font-group-b">© 2026 Todos os direitos reservados.</p>
        <p className="text-[9px] uppercase tracking-widest opacity-50">Versão 1.0.0</p>
      </footer>

      {/* Modal de Vitória */}
      {gameState === 'WINNER' && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center max-w-md w-full animate-in zoom-in duration-500 border-t-[15px] border-yellow-400">
            <Trophy size={60} className="mx-auto text-yellow-500 mb-6" />
            <h2 className="text-4xl font-group-a text-slate-800 mb-2">VENCESTE!</h2>
            <p className="text-lg font-group-b mb-10" style={{color: winner.hex}}>O Aluno {winner.name} completou o desafio!</p>
            <button onClick={() => setGameState('SETUP')} className="w-full bg-slate-800 text-white py-5 rounded-full font-group-a text-xl shadow-2xl transition-all">JOGAR NOVAMENTE</button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
