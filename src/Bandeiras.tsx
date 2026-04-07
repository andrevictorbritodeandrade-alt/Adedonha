import React, { useState, useEffect } from 'react';
import { ITEMS } from './bandeirasData';
import { ArrowLeft } from 'lucide-react';

type GameMode = 'continent' | 'world' | 'brazil';

export default function Bandeiras({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<GameMode>('world');
  const [currentCountry, setCurrentCountry] = useState(ITEMS[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generateQuestion = () => {
    let pool = ITEMS;
    if (mode === 'brazil') pool = ITEMS.filter(i => i.type === 'state');
    else if (mode === 'world') pool = ITEMS.filter(i => i.type === 'country');
    // continent mode could be expanded here
    
    // Filter out recently seen flags to prevent repetition
    let availablePool = pool.filter(item => !history.includes(item.code));
    
    // If pool is too small after filtering, reset history
    if (availablePool.length < 5) {
      availablePool = pool;
      setHistory([]);
    }

    const target = availablePool[Math.floor(Math.random() * availablePool.length)];
    setCurrentCountry(target);
    setHistory(prev => [target.code, ...prev].slice(0, 15));

    const wrongOptions = pool
      .filter(c => c.code !== target.code)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(c => c.name);

    const allOptions = [...wrongOptions, target.name].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsFlashing(false);
  };

  useEffect(() => {
    generateQuestion();
  }, [round, mode]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    if (answer === currentCountry.name) {
      setScore(s => s + 1);
      setIsFlashing(true);
    }
  };

  const nextRound = () => setRound(r => r + 1);

  return (
    <div className={`min-h-screen font-sans p-4 flex flex-col items-center transition-colors duration-300 ${isFlashing ? 'bg-green-400' : 'bg-sky-100'}`}>
      <header className="text-center mb-6 relative w-full max-w-4xl">
        <button 
          onClick={onBack} 
          className="absolute left-0 top-4 text-orange-600 hover:text-orange-500 transition-all p-3 bg-orange-100 rounded-full z-30 shadow-lg border border-orange-200 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic text-sky-400">JOGO DAS BANDEIRAS</h1>
        <div className="flex justify-center gap-2 mb-4">
          {(['continent', 'world', 'brazil'] as GameMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-full font-bold ${mode === m ? 'bg-sky-600 text-white' : 'bg-white text-sky-600'}`}>
              {m === 'continent' ? 'Continente' : m === 'world' ? 'Mundo + BR' : 'Apenas Brasil'}
            </button>
          ))}
        </div>
      </header>

      <div className="w-full max-w-3xl bg-white p-6 md:p-10 rounded-3xl shadow-xl border-4 border-sky-200 flex flex-col items-center">
        <div className="flex justify-center mb-8">
          <div className="w-64 aspect-[3/2] rounded-xl overflow-hidden shadow-lg border-4 border-slate-100 bg-slate-50">
            <img src={`https://flagcdn.com/w640/${currentCountry.code}.png`} alt="Bandeira" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {options.map((option, index) => (
            <button key={index} onClick={() => handleAnswer(option)} disabled={selectedAnswer !== null} className={`p-4 rounded-2xl border-b-4 font-black text-xl md:text-2xl transition-all duration-300 ${selectedAnswer ? (option === currentCountry.name ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400') : 'bg-slate-100 text-slate-700'}`}>
              {option}
            </button>
          ))}
        </div>

        {selectedAnswer && <button onClick={nextRound} className="mt-8 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-black text-2xl py-4 px-12 rounded-full shadow-lg hover:scale-105 transition-all animate-bounce">CONTINUAR ➡️</button>}
      </div>
    </div>
  );
}
