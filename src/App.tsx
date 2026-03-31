import React, { useState } from 'react';
import Adedonha from './Adedonha';
import Perguntados from './Perguntados';
import Forca from './Forca';
import Velha from './Velha';
import Memoria from './Memoria';
import Bandeiras from './Bandeiras';
import Ludo from './Ludo';
import Uno from './Uno';
import Truco from './Truco';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');

  if (currentScreen === 'adedonha') {
    return <Adedonha onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'perguntados') {
    return <Perguntados onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'forca') {
    return <Forca onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'velha') {
    return <Velha onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'memoria') {
    return <Memoria onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'bandeiras') {
    return <Bandeiras onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'ludo') {
    return <Ludo onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'uno') {
    return <Uno onBack={() => setCurrentScreen('menu')} />;
  }

  if (currentScreen === 'truco') {
    return <Truco onBack={() => setCurrentScreen('menu')} />;
  }

  return (
    <div className="min-h-screen bg-magical font-sans flex flex-col items-center justify-center p-4">
      
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-6xl md:text-8xl font-display mb-4 tracking-wider text-shadow-comic-lg text-yellow-400 uppercase">
          SALA DE JOGOS
        </h1>
        <p className="text-white/90 font-bold uppercase tracking-widest text-xl drop-shadow-md">Escolha a brincadeira de hoje!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full relative z-10">
        
        {/* Card Adedonha */}
        <button 
          onClick={() => setCurrentScreen('adedonha')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-indigo-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=adedonha&backgroundColor=c0aede" alt="Adedonha" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-indigo-700 uppercase mb-2 text-shadow-comic">EPIC ADEDONHA!</h2>
          <p className="text-slate-600 font-medium text-sm">Gire a roleta, descubra a letra e preencha todas as categorias antes que o tempo acabe!</p>
        </button>

        {/* Card Perguntados */}
        <button 
          onClick={() => setCurrentScreen('perguntados')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-orange-200">
             <img src="https://api.dicebear.com/7.x/bottts/svg?seed=perguntados&backgroundColor=ffdfbf" alt="Perguntados" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-orange-600 uppercase mb-2 text-shadow-comic">EPIC PERGUNTADOS!</h2>
          <p className="text-slate-600 font-medium text-sm">Gire a roleta das matérias, responda à pergunta do professor e suba no ranking!</p>
        </button>

        {/* Card Forca */}
        <button 
          onClick={() => setCurrentScreen('forca')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-emerald-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=forca&backgroundColor=b6e3f4" alt="Forca" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-emerald-600 uppercase mb-2 text-shadow-comic">EPIC FORCA!</h2>
          <p className="text-slate-600 font-medium text-sm">Meninos contra Meninas! Descubra a palavra oculta antes que o boneco seja enforcado!</p>
        </button>

        {/* Card Jogo da Velha */}
        <button 
          onClick={() => setCurrentScreen('velha')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-rose-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-rose-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=velha&backgroundColor=ffdfbf" alt="Velha" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-rose-600 uppercase mb-2 text-shadow-comic">EPIC VELHA!</h2>
          <p className="text-slate-600 font-medium text-sm">O clássico jogo da velha! Desafie seus colegas e veja quem faz a melhor estratégia!</p>
        </button>

        {/* Card Memoria */}
        <button 
          onClick={() => setCurrentScreen('memoria')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-amber-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=memoria&backgroundColor=c0aede" alt="Memoria" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-amber-600 uppercase mb-2 text-shadow-comic">EPIC MEMÓRIA</h2>
          <p className="text-slate-600 font-medium text-sm">Encontre os pares de animais da savana africana, mas cuidado com o Mico!</p>
        </button>

        {/* Card Bandeiras */}
        <button 
          onClick={() => setCurrentScreen('bandeiras')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-sky-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-sky-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=bandeiras&backgroundColor=b6e3f4" alt="Bandeiras" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-sky-600 uppercase mb-2 text-shadow-comic">EPIC BANDEIRAS!</h2>
          <p className="text-slate-600 font-medium text-sm">Teste seus conhecimentos de geografia adivinhando de qual país é a bandeira!</p>
        </button>

        {/* Card Ludo */}
        <button 
          onClick={() => setCurrentScreen('ludo')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-red-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ludo&backgroundColor=ffdfbf" alt="Ludo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-red-600 uppercase mb-2 text-shadow-comic">EPIC LUDO!</h2>
          <p className="text-slate-600 font-medium text-sm">O clássico jogo de tabuleiro para até 4 jogadores. Jogue os dados e chegue primeiro!</p>
        </button>

        {/* Card Uno */}
        <button 
          onClick={() => setCurrentScreen('uno')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-yellow-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=uno&backgroundColor=c0aede" alt="Uno" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-yellow-600 uppercase mb-2 text-shadow-comic">EPIC UNO!</h2>
          <p className="text-slate-600 font-medium text-sm">Jogue suas cartas na mesa de botequim e não se esqueça de gritar UNO!</p>
        </button>

        {/* Card Truco */}
        <button 
          onClick={() => setCurrentScreen('truco')}
          className="pixar-card group flex flex-col items-center text-center p-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden border-4 border-green-200">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=truco&backgroundColor=b6e3f4" alt="Truco" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-green-700 uppercase mb-2 text-shadow-comic">EPIC TRUCO!</h2>
          <p className="text-slate-600 font-medium text-sm">Truco Paulista 2v2! Peça truco, seis, nove e doze e vença a partida com 12 pontos!</p>
        </button>

      </div>

      <footer className="mt-16 text-center text-white/70 text-sm md:text-base relative z-10 w-full max-w-4xl mx-auto border-t border-white/20 pt-6 pb-4">
        <p className="font-bold mb-1">
          Desenvolvido por André Victor Brito de Andrade ®
        </p>
        <p className="mb-1">
          Contato: <a href="mailto:andrevictorbritodeandrade@gmail.com" className="hover:text-white transition-colors underline">andrevictorbritodeandrade@gmail.com</a>
        </p>
        <p className="mb-1">
          © 2026 Todos os direitos reservados.
        </p>
        <p className="text-xs mt-2 opacity-50">
          Versão 1.0.0
        </p>
      </footer>

    </div>
  );
}
