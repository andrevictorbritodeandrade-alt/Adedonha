import React, { useState, useEffect } from 'react';

const COUNTRIES = [
  { code: 'br', name: 'Brasil' },
  { code: 'us', name: 'Estados Unidos' },
  { code: 'ar', name: 'Argentina' },
  { code: 'jp', name: 'Japão' },
  { code: 'fr', name: 'França' },
  { code: 'it', name: 'Itália' },
  { code: 'de', name: 'Alemanha' },
  { code: 'es', name: 'Espanha' },
  { code: 'pt', name: 'Portugal' },
  { code: 'cn', name: 'China' },
  { code: 'ru', name: 'Rússia' },
  { code: 'za', name: 'África do Sul' },
  { code: 'au', name: 'Austrália' },
  { code: 'ca', name: 'Canadá' },
  { code: 'mx', name: 'México' },
  { code: 'gb', name: 'Reino Unido' },
  { code: 'in', name: 'Índia' },
  { code: 'kr', name: 'Coreia do Sul' },
  { code: 'eg', name: 'Egito' },
  { code: 'uy', name: 'Uruguai' },
  { code: 'co', name: 'Colômbia' },
  { code: 'pe', name: 'Peru' },
  { code: 'cl', name: 'Chile' },
  { code: 've', name: 'Venezuela' },
  { code: 'ch', name: 'Suíça' },
  { code: 'se', name: 'Suécia' },
  { code: 'no', name: 'Noruega' },
  { code: 'fi', name: 'Finlândia' },
  { code: 'dk', name: 'Dinamarca' },
  { code: 'nl', name: 'Holanda' },
  { code: 'be', name: 'Bélgica' },
  { code: 'gr', name: 'Grécia' },
  { code: 'tr', name: 'Turquia' },
  { code: 'sa', name: 'Arábia Saudita' },
  { code: 'ae', name: 'Emirados Árabes' },
  { code: 'nz', name: 'Nova Zelândia' }
];

export default function Bandeiras({ onBack }: { onBack: () => void }) {
  const [currentCountry, setCurrentCountry] = useState(COUNTRIES[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);

  const generateQuestion = () => {
    const target = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    setCurrentCountry(target);

    const wrongOptions = COUNTRIES
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
  }, [round]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks
    
    setSelectedAnswer(answer);
    
    if (answer === currentCountry.name) {
      setScore(s => s + 1);
      setIsFlashing(true);
      
      // Play success sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch(e) {}
    } else {
      // Play error sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch(e) {}
    }
  };

  const nextRound = () => {
    setRound(r => r + 1);
  };

  return (
    <div className={`min-h-screen font-sans p-4 flex flex-col items-center transition-colors duration-300 ${isFlashing ? 'bg-green-400' : 'bg-sky-100'}`}>
      
      <header className="text-center mb-6 relative w-full max-w-4xl">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-sky-600 font-bold py-2 px-4 rounded-lg shadow hover:bg-sky-50 transition-colors border border-sky-200"
        >
          ⬅ Voltar
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic text-sky-400">
          <span className="inline-block animate-bounce mr-2">🌍</span>
          <span className="uppercase">
            EPIC BANDEIRAS!
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>🗺️</span>
        </h1>
        <div className="flex justify-center gap-6 text-sky-900 font-bold text-lg md:text-xl bg-white/50 py-2 px-6 rounded-full inline-flex backdrop-blur-sm border border-sky-200/50">
          <span>Rodada: {round}</span>
          <span>Acertos: {score}</span>
        </div>
      </header>

      <div className="w-full max-w-3xl bg-white p-6 md:p-10 rounded-3xl shadow-xl border-4 border-sky-200 flex flex-col items-center">
        
        <h2 className="text-2xl md:text-3xl font-display text-slate-700 mb-6 text-center tracking-wide">
          De qual país é esta bandeira?
        </h2>

        <div className="w-full max-w-md aspect-[3/2] mb-8 rounded-xl overflow-hidden shadow-lg border-4 border-slate-100 relative bg-slate-50 flex items-center justify-center">
          <img 
            src={`https://flagcdn.com/w640/${currentCountry.code}.png`} 
            alt="Bandeira"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {options.map((option, index) => {
            let btnClass = "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:scale-105";
            
            if (selectedAnswer) {
              if (option === currentCountry.name) {
                btnClass = "bg-green-500 text-white border-green-600 scale-105 shadow-lg animate-pulse";
              } else if (option === selectedAnswer) {
                btnClass = "bg-red-500 text-white border-red-600 opacity-70";
              } else {
                btnClass = "bg-slate-100 text-slate-400 border-slate-200 opacity-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                className={`p-4 rounded-2xl border-b-4 font-black text-xl md:text-2xl transition-all duration-300 ${btnClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <button
            onClick={nextRound}
            className="mt-8 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-black text-2xl py-4 px-12 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all animate-bounce"
          >
            CONTINUAR ➡️
          </button>
        )}

      </div>
    </div>
  );
}
