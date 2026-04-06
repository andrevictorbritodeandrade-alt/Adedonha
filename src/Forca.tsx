import React, { useState, useEffect } from 'react';

import { ArrowLeft } from 'lucide-react';

const PALAVRAS = [
  "ABACAXI", "CACHORRO", "BICICLETA", "COMPUTADOR", "ELEFANTE", 
  "GIRAFA", "MELANCIA", "ASTRONAUTA", "DINOSSAURO", "CHOCOLATE",
  "AQUARELA", "BORBOLETA", "CACHOEIRA", "DIAMANTE", "ESMERALDA",
  "FOGUETE", "GUITARRA", "HIPOPOTAMO", "IGREJA", "JABUTICABA",
  "AMIZADE", "BRINCADEIRA", "ESCOLA", "FUTEBOL", "HISTORIA",
  "KIWI", "LARANJA", "MACACO", "NATUREZA", "ONIBUS", "PIPOCA",
  "QUEIJO", "RESPEITO", "SORVETE", "TARTARUGA", "UNIVERSO",
  "VIOLAO", "XICARA", "ZEBRA"
];

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const Boneco = ({ erros, color, title, isTurn, onClickTurn }) => (
  <div 
    onClick={onClickTurn}
    className={`flex flex-col items-center p-4 rounded-2xl border-4 transition-all cursor-pointer ${
      isTurn 
        ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-xl' 
        : 'border-transparent bg-white hover:bg-slate-50 opacity-70 hover:opacity-100'
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      {isTurn && <span className="animate-bounce text-2xl">👇</span>}
      <h3 className={`text-3xl md:text-4xl font-display tracking-wide ${color}`}>{title}</h3>
      {isTurn && <span className="animate-bounce text-2xl">👇</span>}
    </div>
    
    <svg width="160" height="220" viewBox="0 0 200 250" className="stroke-current text-white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Forca Base */}
      <line x1="20" y1="240" x2="100" y2="240" />
      <line x1="60" y1="240" x2="60" y2="20" />
      <line x1="60" y1="20" x2="140" y2="20" />
      <line x1="140" y1="20" x2="140" y2="50" />
      
      {/* Corpo do Boneco */}
      {erros > 0 && <circle cx="140" cy="80" r="25" className={color} />} {/* Cabeça */}
      {erros > 1 && <line x1="140" y1="105" x2="140" y2="170" className={color} />} {/* Corpo */}
      {erros > 2 && <line x1="140" y1="120" x2="110" y2="160" className={color} />} {/* Braço Esq */}
      {erros > 3 && <line x1="140" y1="120" x2="170" y2="160" className={color} />} {/* Braço Dir */}
      {erros > 4 && <line x1="140" y1="170" x2="110" y2="220" className={color} />} {/* Perna Esq */}
      {erros > 5 && <line x1="140" y1="170" x2="170" y2="220" className={color} />} {/* Perna Dir */}
      
      {/* Olhos de morto se perdeu */}
      {erros > 5 && (
        <>
          <line x1="130" y1="75" x2="138" y2="83" className={color} strokeWidth="4" />
          <line x1="138" y1="75" x2="130" y2="83" className={color} strokeWidth="4" />
          <line x1="142" y1="75" x2="150" y2="83" className={color} strokeWidth="4" />
          <line x1="150" y1="75" x2="142" y2="83" className={color} strokeWidth="4" />
        </>
      )}
    </svg>
    <p className="mt-4 font-bold text-slate-500 text-xl">Erros: {erros}/6</p>
    {erros >= 6 && <p className="text-red-500 font-black text-2xl animate-pulse mt-2">ENFORCADO!</p>}
  </div>
);

export default function Forca({ onBack }: { onBack: () => void }) {
  const [palavra, setPalavra] = useState("");
  const [letrasAdivinhadas, setLetrasAdivinhadas] = useState<Set<string>>(new Set());
  const [errosMeninos, setErrosMeninos] = useState(0);
  const [errosMeninas, setErrosMeninas] = useState(0);
  const [turno, setTurno] = useState<'meninos' | 'meninas'>('meninos');
  const [status, setStatus] = useState<'jogando' | 'venceu' | 'perdeu'>('jogando');

  const sortearPalavra = () => {
    const novaPalavra = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
    setPalavra(novaPalavra);
    setLetrasAdivinhadas(new Set());
    setErrosMeninos(0);
    setErrosMeninas(0);
    setStatus('jogando');
  };

  useEffect(() => {
    sortearPalavra();
  }, []);

  const handleLetra = (letra: string) => {
    if (status !== 'jogando' || letrasAdivinhadas.has(letra)) return;

    const novasLetras = new Set(letrasAdivinhadas);
    novasLetras.add(letra);
    setLetrasAdivinhadas(novasLetras);

    let errou = false;
    if (!palavra.includes(letra)) {
      errou = true;
      if (turno === 'meninos') {
        const novosErros = errosMeninos + 1;
        setErrosMeninos(novosErros);
        if (novosErros >= 6) setStatus('perdeu');
      } else {
        const novosErros = errosMeninas + 1;
        setErrosMeninas(novosErros);
        if (novosErros >= 6) setStatus('perdeu');
      }
    }

    // Check win
    const venceu = palavra.split('').every(l => novasLetras.has(l));
    if (venceu) {
      setStatus('venceu');
    } else if (status === 'jogando') {
      // Switch turn automatically after every guess
      setTurno(turno === 'meninos' ? 'meninas' : 'meninos');
    }
  };

  return (
    <div className="min-h-screen bg-magical font-sans p-4 text-white flex flex-col items-center">
      
      <header className="text-center mb-6 relative w-full max-w-6xl z-20">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-30 shadow-lg border border-white/10 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic text-emerald-400">
          <span className="inline-block animate-bounce mr-2">🪢</span>
          <span className="uppercase">
            JOGO DA FORCA
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>😵</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">Meninos vs Meninas</p>
      </header>

      <div className="w-full max-w-6xl bg-white p-6 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center">
        
        {/* Bonecos */}
        <div className="flex flex-col md:flex-row gap-8 w-full justify-center mb-8">
          <Boneco 
            erros={errosMeninos} 
            color="text-blue-500" 
            title="👦 MENINOS" 
            isTurn={turno === 'meninos' && status === 'jogando'}
            onClickTurn={() => status === 'jogando' && setTurno('meninos')}
          />
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-display text-slate-300 italic">VS</div>
          </div>

          <Boneco 
            erros={errosMeninas} 
            color="text-pink-500" 
            title="👧 MENINAS" 
            isTurn={turno === 'meninas' && status === 'jogando'}
            onClickTurn={() => status === 'jogando' && setTurno('meninas')}
          />
        </div>

        {/* Palavra Oculta */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          {palavra.split('').map((letra, index) => (
            <div 
              key={index} 
              className={`w-12 h-16 md:w-16 md:h-20 border-b-8 flex items-center justify-center text-4xl md:text-5xl font-black transition-all ${
                letrasAdivinhadas.has(letra) || status === 'perdeu' 
                  ? 'border-emerald-500 text-emerald-500' 
                  : 'border-slate-300 text-transparent'
              } ${status === 'perdeu' && !letrasAdivinhadas.has(letra) ? 'text-red-500 opacity-50' : ''}`}
            >
              {letrasAdivinhadas.has(letra) || status === 'perdeu' ? letra : '_'}
            </div>
          ))}
        </div>

        {/* Status / Resultado */}
        {status !== 'jogando' && (
          <div className={`text-5xl font-display tracking-wide mb-8 animate-bounce ${status === 'venceu' ? 'text-emerald-500' : 'text-red-500'}`}>
            {status === 'venceu' ? '🎉 VOCÊS VENCERAM! 🎉' : '💀 FIM DE JOGO! 💀'}
          </div>
        )}

        {/* Teclado */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mb-8">
          {ALFABETO.map(letra => {
            const isGuessed = letrasAdivinhadas.has(letra);
            const isCorrect = isGuessed && palavra.includes(letra);
            const isWrong = isGuessed && !palavra.includes(letra);
            
            let btnClass = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300";
            if (isCorrect) btnClass = "bg-emerald-500 text-white border-emerald-600 scale-95 opacity-50";
            if (isWrong) btnClass = "bg-red-500 text-white border-red-600 scale-95 opacity-50";

            return (
              <button
                key={letra}
                onClick={() => handleLetra(letra)}
                disabled={isGuessed || status !== 'jogando'}
                className={`w-12 h-14 md:w-14 md:h-16 text-2xl font-black rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${btnClass}`}
              >
                {letra}
              </button>
            );
          })}
        </div>

        <button
          onClick={sortearPalavra}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-2xl py-4 px-10 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          🔄 NOVA PALAVRA
        </button>

      </div>
    </div>
  );
}
