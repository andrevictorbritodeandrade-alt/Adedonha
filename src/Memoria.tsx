import React, { useState, useEffect } from 'react';

const ANIMAIS = ['🦁', '🐘', '🦒', '🦓', '🦏', '🦛', '🐆'];
const MICO = '🐒';

interface CardData {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  isMico: boolean;
}

export default function Memoria({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showMicoAlert, setShowMicoAlert] = useState(false);

  const shuffleCards = () => {
    // 7 pares de animais + 2 micos = 16 cartas
    const deck = [...ANIMAIS, ...ANIMAIS, MICO, MICO].map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
      isMico: emoji === MICO,
    }));

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setShowMicoAlert(false);
    setIsLocked(false);
  };

  useEffect(() => {
    shuffleCards();
  }, []);

  const playMonkeySound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

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
      const card1 = newCards[firstIndex];
      const card2 = newCards[secondIndex];

      // Regra do Mico
      if (card1.isMico || card2.isMico) {
        playMonkeySound();
        setShowMicoAlert(true);
        
        setTimeout(() => {
          // Embaralha apenas as cartas não combinadas
          const unmatchedCards = newCards.filter(c => !c.isMatched);
          for (let i = unmatchedCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unmatchedCards[i].emoji, unmatchedCards[j].emoji] = [unmatchedCards[j].emoji, unmatchedCards[i].emoji];
            [unmatchedCards[i].isMico, unmatchedCards[j].isMico] = [unmatchedCards[j].isMico, unmatchedCards[i].isMico];
          }
          
          const finalCards = newCards.map(c => {
            if (!c.isMatched) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          
          setCards(finalCards);
          setFlippedIndices([]);
          setShowMicoAlert(false);
          setIsLocked(false);
        }, 2000);
        return;
      }

      // Combinação normal
      if (card1.emoji === card2.emoji) {
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches((m) => m + 1);
          setIsLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const isWin = matches === 7; // 7 pares de animais (os micos não formam par para vencer, eles atrapalham)

  return (
    <div className="min-h-screen bg-[#e8d5a5] font-sans p-4 flex flex-col items-center relative overflow-hidden">
      {/* Elementos decorativos de savana no fundo */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#8b4513 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
      </div>

      <header className="text-center mb-6 relative w-full max-w-4xl z-10">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-amber-700 font-bold py-2 px-4 rounded-lg shadow hover:bg-amber-50 transition-colors border border-amber-200"
        >
          ⬅ Voltar
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic">
          <span className="inline-block animate-bounce mr-2">🦁</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 uppercase">
            MEMÓRIA SAVANA
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>🐘</span>
        </h1>
        <div className="flex justify-center gap-6 text-amber-900 font-bold text-lg md:text-xl bg-white/50 py-2 px-6 rounded-full inline-flex backdrop-blur-sm border border-amber-200/50">
          <span>Tentativas: {moves}</span>
          <span>Pares: {matches}/7</span>
        </div>
      </header>

      {showMicoAlert && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white p-8 rounded-3xl shadow-2xl border-8 border-red-700 animate-bounce text-center">
          <div className="text-8xl mb-4">🐒</div>
          <h2 className="text-4xl font-display tracking-widest text-shadow-comic">O MICO APARECEU!</h2>
          <p className="text-xl font-bold mt-2">As cartas vão embaralhar!</p>
        </div>
      )}

      {isWin && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white p-8 rounded-3xl shadow-2xl border-8 border-green-700 animate-bounce text-center w-11/12 max-w-md">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-display tracking-widest text-shadow-comic">PARABÉNS!</h2>
          <p className="text-xl font-bold mt-2">Você encontrou todos os animais em {moves} tentativas!</p>
          <button 
            onClick={shuffleCards}
            className="mt-6 bg-white text-green-600 font-black text-2xl py-3 px-8 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform w-full"
          >
            JOGAR NOVAMENTE
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 md:gap-4 w-full max-w-2xl z-10 perspective-1000">
        {cards.map((card, index) => (
          <div 
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`relative w-full aspect-[3/4] cursor-pointer transition-transform duration-500 transform-style-3d ${
              card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
            } ${card.isMatched ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Verso da Carta (Folha/Baobá) */}
            <div className="absolute w-full h-full backface-hidden bg-[#556b2f] rounded-xl md:rounded-2xl border-4 border-[#3a4a20] shadow-lg flex items-center justify-center overflow-hidden">
              <div className="text-4xl md:text-6xl opacity-30">🌿</div>
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Frente da Carta (Animal) */}
            <div className="absolute w-full h-full backface-hidden bg-amber-50 rounded-xl md:rounded-2xl border-4 border-amber-300 shadow-lg flex items-center justify-center rotate-y-180">
              <span className="text-5xl md:text-7xl drop-shadow-md">{card.emoji}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
