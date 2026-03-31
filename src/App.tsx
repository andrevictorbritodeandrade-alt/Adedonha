import React, { useState } from 'react';
import Adedonha from './Adedonha';
import Perguntados from './Perguntados';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');

  if (currentScreen === 'adedonha') {
    return <Adedonha onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'perguntados') {
    return <Perguntados onBack={() => setCurrentScreen('menu')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col items-center justify-center p-4">
      
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight drop-shadow-md">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 uppercase">
            SALA DE JOGOS
          </span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-lg">Escolha a brincadeira de hoje!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        
        {/* Card Adedonha */}
        <button 
          onClick={() => setCurrentScreen('adedonha')}
          className="group bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-100 hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
        >
          <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-6xl">🛑</span>
          </div>
          <h2 className="text-3xl font-black text-indigo-600 uppercase mb-3">SUPER ADEDONHA!</h2>
          <p className="text-slate-500 font-medium">Gire a roleta, descubra a letra e preencha todas as categorias antes que o tempo acabe!</p>
        </button>

        {/* Card Perguntados */}
        <button 
          onClick={() => setCurrentScreen('perguntados')}
          className="group bg-white rounded-3xl p-8 shadow-xl border-4 border-orange-100 hover:border-orange-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
        >
          <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-6xl">❓</span>
          </div>
          <h2 className="text-3xl font-black text-orange-600 uppercase mb-3">SUPER PERGUNTADOS!</h2>
          <p className="text-slate-500 font-medium">Gire a roleta das matérias, responda à pergunta do professor e suba no ranking!</p>
        </button>

      </div>

    </div>
  );
}
