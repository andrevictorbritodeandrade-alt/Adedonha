import React, { useState, useEffect } from 'react';
import NDA from './NDA';
import AdedonhaGame from './Adedonha';
import Perguntados from './Perguntados';
import Forca from './Forca';
import Velha from './Velha';
import Memoria from './Memoria';
import Bandeiras from './Bandeiras';
import Ludo from './Ludo';
import Uno from './Uno';
import Truco from './Truco';
import XadrezSortudo from './XadrezSortudo';
import Balaozinho from './Balaozinho';
import Vermelhinho from './Vermelhinho';
import Tatuzin from './Tatuzin';
import Cruzaletras from './Cruzaletras';

// Lista exata de jogos solicitada, configurada para receber as imagens exatas do usuário
const JOGOS = [
  { id: 'adedonha', nome: 'ADEDONHA INTERATIVA', iconeSrc: '/adedonha.png', isNew: true },
  { id: 'perguntados', nome: 'PERGUNTADOS', iconeSrc: '/perguntados.png' },
  { id: 'memoria', nome: 'JOGO DO MEMÓRIA', iconeSrc: '/memoria.png' },
  { id: 'forca', nome: 'JOGO DA FORCA', iconeSrc: '/forca.png' },
  
  { id: 'velha', nome: 'JOGO DA VELHA', iconeSrc: '/velha.png' },
  { id: 'ludo', nome: 'LUDO', iconeSrc: '/ludo.png' },
  { id: 'bandeiras', nome: 'JOGO DAS BANDEIRAS', iconeSrc: '/bandeiras.png' },
  
  { id: 'mapas', nome: 'JOGO DOS MAPAS', iconeSrc: '/mapas.png' },
  { id: 'xadrez', nome: 'XADREZ SORTUDO', iconeSrc: '/xadrez.png' },
  { id: 'uno', nome: 'UNO', iconeSrc: '/uno.png' },
  
  { id: 'truco', nome: 'TRUCO', iconeSrc: '/truco.png' },
  { id: 'tatuzin', nome: 'TATUZIN', iconeSrc: '/tatuzin.png' },
  { id: 'balaozinho', nome: 'JOGO DO BALÃOZINHO', iconeSrc: '/balaozinho.png' },
  
  { id: 'vermelhinho', nome: 'ONDE ESTÁ O VERMELHINHO?', iconeSrc: '/vermelhinho.png' },
  { id: 'cruzaletras', nome: 'CRUZALETRAS', iconeSrc: '/cruzaletras.png' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [ndaAccepted, setNdaAccepted] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem('nda_accepted');
    if (!accepted) {
      setNdaAccepted(false);
    }
  }, []);

  if (!ndaAccepted) {
    return <NDA onAccept={() => setNdaAccepted(true)} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'adedonha': return <AdedonhaGame onBack={() => setCurrentScreen('menu')} />;
      case 'perguntados': return <Perguntados onBack={() => setCurrentScreen('menu')} />;
      case 'forca': return <Forca onBack={() => setCurrentScreen('menu')} />;
      case 'velha': return <Velha onBack={() => setCurrentScreen('menu')} />;
      case 'memoria': return <Memoria onBack={() => setCurrentScreen('menu')} />;
      case 'bandeiras': return <Bandeiras onBack={() => setCurrentScreen('menu')} />;
      case 'ludo': return <Ludo onBack={() => setCurrentScreen('menu')} />;
      case 'uno': return <Uno onBack={() => setCurrentScreen('menu')} />;
      case 'truco': return <Truco onBack={() => setCurrentScreen('menu')} />;
      case 'xadrez': return <XadrezSortudo onBack={() => setCurrentScreen('menu')} />;
      case 'balaozinho': return <Balaozinho onBack={() => setCurrentScreen('menu')} />;
      case 'vermelhinho': return <Vermelhinho onBack={() => setCurrentScreen('menu')} />;
      case 'tatuzin': return <Tatuzin onBack={() => setCurrentScreen('menu')} />;
      case 'cruzaletras': return <Cruzaletras onBack={() => setCurrentScreen('menu')} />;
      case 'mapas': return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col"><h1 className="text-4xl font-group-a mb-4 text-[#d4af37]">JOGO DOS MAPAS</h1><p className="font-group-b">Em construção...</p><button onClick={() => setCurrentScreen('menu')} className="mt-8 bg-blue-600 px-6 py-2 rounded-full font-group-b">Voltar</button></div>;
      default: return null;
    }
  };

  if (currentScreen !== 'menu') {
    return renderScreen();
  }

  return (
    <div className="min-h-screen bg-[#0f1115] font-sans flex flex-col lg:flex-row text-white overflow-hidden relative">
      {/* Background glow effects - simulando o fundo da imagem */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* ESQUERDA: Área para o personagem dinâmico */}
      <div className="lg:w-[40%] h-[40vh] lg:h-screen flex items-center justify-center relative z-10 p-4 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-b lg:bg-gradient-to-r from-black/40 to-transparent">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group bg-transparent flex flex-col items-center justify-center text-center p-0">
          
          {/* IMAGEM DO PERSONAGEM */}
          <img 
            src="/readme-image.png" 
            alt="Personagem Principal" 
            className="w-full h-full object-cover object-top drop-shadow-[0_0_30px_rgba(20,184,166,0.2)]"
            onError={(e) => {
              // Fallback visual caso a imagem ainda não tenha sido enviada
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('bg-slate-800/50', 'p-6');
              const fallback = document.getElementById('fallback-personagem');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          
          {/* Fallback caso a imagem não exista */}
          <div id="fallback-personagem" className="hidden flex-col items-center gap-4 relative z-20">
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center mb-4">
              <span className="text-white/50 text-sm">Sua Arte Aqui</span>
            </div>
            <h2 className="font-serif font-bold italic text-2xl text-[#d4af37]">PERSONAGEM PRINCIPAL</h2>
            <p className="font-sans font-bold italic text-sm text-slate-400 max-w-xs">
              Faça o upload da imagem "readme-image.png" no painel de arquivos.
            </p>
          </div>

        </div>
      </div>

      {/* DIREITA: Lista/Grade para os jogos */}
      <div className="lg:w-[60%] h-[60vh] lg:h-screen flex flex-col relative z-10 overflow-y-auto custom-scrollbar px-4 lg:px-12 py-8 lg:py-12">
        
        {/* TOPO DIREITA: Título "SALA DE JOGOS" */}
        <div className="flex flex-col items-center justify-center mb-12 relative">
          {/* Ícone de coroa decorativo acima do título */}
          <svg className="w-12 h-12 text-[#d4af37] mb-2 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
          </svg>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-black italic text-[#d4af37] tracking-widest text-center" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.3)' }}>
            SALA DE JOGOS
          </h1>
        </div>

        {/* GRADE DE JOGOS (3 Colunas) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12 max-w-4xl mx-auto w-full pb-20">
          {JOGOS.map(jogo => (
            <button 
              key={jogo.id} 
              onClick={() => setCurrentScreen(jogo.id)} 
              className={`flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-300 ${jogo.isNew ? 'animate-pulse border-2 border-yellow-400 rounded-xl p-1' : ''}`}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all">
                {/* IMAGEM DO ÍCONE */}
                <img 
                  src={jogo.iconeSrc} 
                  alt={jogo.nome} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback visual caso a imagem do ícone não exista
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-slate-800/80', 'rounded-3xl', 'border-2', 'border-slate-700/50');
                  }}
                />
              </div>
              
              {/* Nome do Jogo com fonte itálica e grossa */}
              <span className={`font-sans font-bold italic text-xs md:text-sm text-center uppercase tracking-wider max-w-[140px] leading-tight drop-shadow-md ${jogo.id === 'adedonha' || jogo.id === 'tatuzin' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-black' : 'text-[#e5c158]'}`}>
                {jogo.nome}
              </span>
            </button>
          ))}
        </div>
        
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.5); }
        
        /* Animação de pulso para o novo card */
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}} />
    </div>
  );
}
