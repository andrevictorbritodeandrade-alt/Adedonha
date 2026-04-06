import React, { useState, useEffect } from 'react';

import { ArrowLeft } from 'lucide-react';

const ANIMAIS = ['🦁', '🐘', '🦒', '🦓', '🦏', '🦛', '🐆', '🐅', '🐊', '🐍', '🐢', '🦎', '🦜', '🦚', '🦋', '🐝'];

interface CardData {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Score {
  name: string;
  time: number;
}

export default function Memoria({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);

  const shuffleCards = () => {
    const deck = [...ANIMAIS, ...ANIMAIS].map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setIsRunning(true);
    setIsLocked(false);
  };

  useEffect(() => {
    const savedLeaderboard = JSON.parse(localStorage.getItem('memoriaLeaderboard') || '[]');
    setLeaderboard(savedLeaderboard);
    shuffleCards();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsLocked(true);
      setMoves((m) => m + 1);

      const [firstIndex, secondIndex] = newFlippedIndices;
      if (newCards[firstIndex].emoji === newCards[secondIndex].emoji) {
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);
        setMatches((m) => {
          const newMatches = m + 1;
          if (newMatches === ANIMAIS.length) {
            setIsRunning(false);
            saveScore(timer);
          }
          return newMatches;
        });
        setIsLocked(false);
      } else {
        setTimeout(() => {
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const saveScore = (time: number) => {
    const name = prompt('Parabéns! Digite seu nome para o ranking:') || 'Anônimo';
    const newScore = { name, time };
    const newLeaderboard = [...leaderboard, newScore].sort((a, b) => a.time - b.time).slice(0, 5);
    setLeaderboard(newLeaderboard);
    localStorage.setItem('memoriaLeaderboard', JSON.stringify(newLeaderboard));
  };

  return (
    <div className="min-h-screen bg-[#e8d5a5] font-sans p-4 flex flex-col items-center relative overflow-hidden">
      <header className="text-center mb-6 relative w-full max-w-4xl z-10 bg-white/80 p-4 rounded-2xl shadow-md border border-amber-200">
        <button 
          onClick={onBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-800 hover:text-amber-600 transition-all p-3 bg-amber-100 rounded-full z-30 shadow-md border border-amber-200 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-3xl md:text-5xl font-display mb-2 text-amber-800">JOGO DA MEMÓRIA</h1>
        <div className="flex justify-center gap-6 text-amber-900 font-bold text-lg">
          <span>Tempo: {timer}s</span>
          <span>Tentativas: {moves}</span>
        </div>
        <div className="mt-2 text-sm text-amber-800">
          <strong>Ranking:</strong> {leaderboard.map((s, i) => `${i+1}º ${s.name} (${s.time}s)`).join(' | ')}
        </div>
      </header>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 w-full max-w-4xl z-10">
        {cards.map((card, index) => (
          <div 
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`relative w-full aspect-square cursor-pointer transition-all duration-500 transform-style-3d ${
              card.isMatched 
                ? 'bg-amber-200 border-4 border-amber-600 rounded-lg' 
                : (card.isFlipped ? 'rotate-y-180' : 'hover:scale-105')
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {!card.isMatched && (
              <>
                <div className="absolute w-full h-full backface-hidden bg-[#556b2f] rounded-lg border-2 border-[#3a4a20] shadow-sm flex items-center justify-center">
                  <span className="text-2xl md:text-4xl opacity-30">🌿</span>
                </div>
                <div className="absolute w-full h-full backface-hidden bg-amber-50 rounded-lg border-2 border-amber-300 shadow-sm flex items-center justify-center rotate-y-180">
                  <span className="text-3xl md:text-5xl">{card.emoji}</span>
                </div>
              </>
            )}
            {card.isMatched && (
              <div className="w-full h-full flex items-center justify-center text-3xl md:text-5xl">
                {card.emoji}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
