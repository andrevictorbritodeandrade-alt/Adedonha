import React, { useState } from 'react';

import { ArrowLeft } from 'lucide-react';

type Player = 'X' | 'O' | null;

export default function Velha({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const winInfo = calculateWinner(board);
  const winner = winInfo?.winner;
  const winningLine = winInfo?.line || [];
  const isDraw = !winner && board.every(square => square !== null);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    const newWinInfo = calculateWinner(newBoard);
    if (newWinInfo?.winner === 'X') setScoreX(s => s + 1);
    if (newWinInfo?.winner === 'O') setScoreO(s => s + 1);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    // Loser goes first, or X if draw
    if (winner === 'X') setXIsNext(false);
    else if (winner === 'O') setXIsNext(true);
  };

  const resetScores = () => {
    setScoreX(0);
    setScoreO(0);
    resetGame();
    setXIsNext(true);
  };

  return (
    <div className="min-h-screen bg-magical font-sans p-4 text-white flex flex-col items-center">
      
      <header className="text-center mb-6 relative w-full max-w-4xl z-20">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-30 shadow-lg border border-white/10 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic text-rose-400">
          <span className="inline-block animate-bounce mr-2">⭕</span>
          <span className="uppercase">
            JOGO DA VELHA
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>❌</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">O clássico jogo da velha</p>
      </header>

      <div className="w-full max-w-4xl bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center">
        
        {/* Placar */}
        <div className="flex justify-center items-center gap-8 mb-8 w-full">
          <div className={`flex flex-col items-center p-4 rounded-2xl border-4 transition-all w-32 md:w-40 ${xIsNext && !winner && !isDraw ? 'border-blue-400 bg-blue-50 scale-110 shadow-lg' : 'border-transparent bg-slate-50'}`}>
            <span className="text-6xl font-display text-blue-500 mb-2">X</span>
            <span className="text-4xl font-display text-slate-700">{scoreX}</span>
          </div>
          
          <div className="text-4xl font-display text-slate-300">VS</div>

          <div className={`flex flex-col items-center p-4 rounded-2xl border-4 transition-all w-32 md:w-40 ${!xIsNext && !winner && !isDraw ? 'border-rose-400 bg-rose-50 scale-110 shadow-lg' : 'border-transparent bg-slate-50'}`}>
            <span className="text-6xl font-display text-rose-500 mb-2">O</span>
            <span className="text-4xl font-display text-slate-700">{scoreO}</span>
          </div>
        </div>

        {/* Status */}
        <div className="h-12 mb-4 flex items-center justify-center">
          {winner ? (
            <div className={`text-4xl font-display tracking-wide animate-bounce ${winner === 'X' ? 'text-blue-500' : 'text-rose-500'}`}>
              🎉 {winner} VENCEU! 🎉
            </div>
          ) : isDraw ? (
            <div className="text-4xl font-display tracking-wide text-slate-500 animate-pulse">
              🤝 DEU VELHA! 🤝
            </div>
          ) : (
            <div className="text-3xl font-display tracking-wide text-slate-500">
              Vez do <span className={`font-display ${xIsNext ? 'text-blue-500' : 'text-rose-500'}`}>{xIsNext ? 'X' : 'O'}</span>
            </div>
          )}
        </div>

        {/* Tabuleiro */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 bg-slate-300 p-3 md:p-4 rounded-2xl mb-8">
          {board.map((square, i) => {
            const isWinningSquare = winningLine.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl text-6xl md:text-7xl font-display flex items-center justify-center transition-all ${
                  !square && !winner ? 'hover:bg-slate-50 active:scale-95' : ''
                } ${isWinningSquare ? 'bg-yellow-100 scale-105 shadow-lg z-10' : ''}`}
              >
                <span className={`${square === 'X' ? 'text-blue-500' : 'text-rose-500'} ${isWinningSquare ? 'animate-pulse' : ''}`}>
                  {square}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controles */}
        <div className="flex gap-4">
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl py-4 px-8 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            🔄 NOVA PARTIDA
          </button>
          <button
            onClick={resetScores}
            className="bg-slate-200 text-slate-600 font-black text-xl py-4 px-8 rounded-full shadow hover:bg-slate-300 active:scale-95 transition-all"
          >
            ZERAR PLACAR
          </button>
        </div>

      </div>
    </div>
  );
}
