import React, { useState, useEffect } from 'react';
import { 
  Hand, MessageSquareText, Skull, Hash, Brain, Flag, Map, 
  Gamepad2, Target, LayoutGrid, Crown, AirVent, Search, Bug, 
  Crosshair, Download, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
import JogoDosMapas from './JogoDosMapas';

// Lista de jogos com ícones do Lucide React e cores temáticas
const JOGOS = [
  { id: 'adedonha', nome: 'ADEDONHA INTERATIVA', Icon: Hand, color: 'text-purple-500' },
  { id: 'perguntados', nome: 'PERGUNTADOS', Icon: MessageSquareText, color: 'text-blue-500' },
  { id: 'forca', nome: 'JOGO DA FORCA', Icon: Skull, color: 'text-red-600' },
  { id: 'velha', nome: 'JOGO DA VELHA', Icon: Hash, color: 'text-yellow-500' },
  { id: 'memoria', nome: 'JOGO DO MEMÓRIA', Icon: Brain, color: 'text-pink-500' },
  { id: 'bandeiras', nome: 'JOGO DAS BANDEIRAS', Icon: Flag, color: 'text-green-500' },
  { id: 'mapas', nome: 'JOGO DOS MAPAS', Icon: Map, color: 'text-emerald-600' },
  { id: 'ludo', nome: 'LUDO', Icon: Gamepad2, color: 'text-green-600' },
  { id: 'uno', nome: 'UNO', Icon: LayoutGrid, color: 'text-orange-500' },
  { id: 'truco', nome: 'TRUCO', Icon: Target, color: 'text-orange-600' },
  { id: 'xadrez', nome: 'XADREZ SORTUDO', Icon: Crown, color: 'text-yellow-600' },
  { id: 'balaozinho', nome: 'JOGO DO BALÃOZINHO', Icon: AirVent, color: 'text-sky-400' },
  { id: 'vermelhinho', nome: 'ONDE ESTÁ O VERMELHINHO?', Icon: Search, color: 'text-red-500' },
  { id: 'tatuzin', nome: 'TATUZIN', Icon: Bug, color: 'text-amber-700' },
  { id: 'cruzaletras', nome: 'CRUZALETRAS', Icon: Crosshair, color: 'text-indigo-600' },
  { id: 'install', nome: 'BAIXAR APP', Icon: Download, color: 'text-yellow-400' },
  { id: 'qrcode', nome: 'COMPARTILHAR', Icon: QrCode, color: 'text-green-500' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [ndaAccepted, setNdaAccepted] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallInfo, setShowInstallInfo] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('nda_accepted');
    if (!accepted) {
      setNdaAccepted(false);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (!ndaAccepted) {
    return <NDA onAccept={() => setNdaAccepted(true)} />;
  }

  const renderScreen = () => {
    const ScreenComponent = ({ onBack }: { onBack: () => void }) => {
      switch (currentScreen) {
        case 'adedonha': return <AdedonhaGame onBack={onBack} />;
        case 'perguntados': return <Perguntados onBack={onBack} />;
        case 'forca': return <Forca onBack={onBack} />;
        case 'velha': return <Velha onBack={onBack} />;
        case 'memoria': return <Memoria onBack={onBack} />;
        case 'bandeiras': return <Bandeiras onBack={onBack} />;
        case 'ludo': return <Ludo onBack={onBack} />;
        case 'uno': return <Uno onBack={onBack} />;
        case 'truco': return <Truco onBack={onBack} />;
        case 'xadrez': return <XadrezSortudo onBack={onBack} />;
        case 'balaozinho': return <Balaozinho onBack={onBack} />;
        case 'vermelhinho': return <Vermelhinho onBack={onBack} />;
        case 'tatuzin': return <Tatuzin onBack={onBack} />;
        case 'cruzaletras': return <Cruzaletras onBack={onBack} />;
        case 'mapas': return <JogoDosMapas onBack={onBack} />;
        default: return null;
      }
    };

    return (
      <div className="min-h-screen bg-blue-900 text-white p-4">
        <button 
          onClick={() => setCurrentScreen('menu')}
          className="mb-6 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-3 px-6 rounded-full text-xl shadow-lg transition-transform hover:scale-105"
        >
          <Crosshair className="w-6 h-6" /> VOLTAR
        </button>
        <ScreenComponent onBack={() => setCurrentScreen('menu')} />
        
        {/* RODAPÉ NAS TELAS DE JOGO */}
        <footer className="mt-10 py-6 text-center text-white/50 font-sans text-xs border-t border-white/10">
          <p>Desenvolvido por André Victor Brito de Andrade © | © 2026 Todos os direitos reservados. | Versão 1.6.0</p>
        </footer>
      </div>
    );
  };

  if (currentScreen !== 'menu') {
    return renderScreen();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 font-sans text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fbbf24 0%, transparent 20%), radial-gradient(circle at 80% 70%, #ef4444 0%, transparent 20%)' }}></div>

      <div className="flex flex-col h-screen relative z-10">
        {/* BOTÃO DE INSTALAÇÃO */}
        {deferredPrompt && (
          <button 
            onClick={handleInstall}
            className="absolute top-4 left-4 z-50 bg-white text-blue-900 font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-100"
          >
            <Download className="w-5 h-5" /> Instalar App
          </button>
        )}

        {/* DIREITA: Lista/Grade para os jogos (agora full width) */}
        <div className="w-full h-screen flex flex-col overflow-y-auto custom-scrollbar p-6 lg:p-12">
          
          {/* Título */}
          <div className="flex flex-col items-center justify-center mb-10 w-full text-center px-2">
            <h1 className="font-display text-6xl md:text-9xl text-yellow-400 text-shadow-comic-lg tracking-wider transform -rotate-2 w-full">
              SALA DE JOGOS
            </h1>
          </div>

          {/* GRADE DE JOGOS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pb-20 max-w-6xl mx-auto w-full">
            {JOGOS.map(({ id, nome, Icon, color }) => (
              id === 'qrcode' ? (
                <div key={id} className="pixar-card flex flex-col items-center p-4 gap-2">
                  <QRCodeSVG value="https://saladejogos.vercel.app" size={80} />
                  <span className="font-display text-sm text-blue-900 text-center leading-tight">
                    {nome}
                  </span>
                </div>
              ) : id === 'install' ? (
                <button 
                  key={id} 
                  onClick={() => {
                    if (deferredPrompt) {
                      handleInstall();
                    } else {
                      setShowInstallInfo(true);
                    }
                  }} 
                  className={`pixar-card flex flex-col items-center p-4 gap-2 group ${!deferredPrompt ? 'opacity-80' : 'animate-bounce'}`}
                  title="Instalar App"
                >
                  <Icon className={`w-20 h-20 ${color} group-hover:scale-110 transition-transform`} />
                  <span className="font-display text-sm text-blue-900 text-center leading-tight">
                    {nome}
                  </span>
                </button>
              ) : (
                <button 
                  key={id} 
                  onClick={() => setCurrentScreen(id)} 
                  className="pixar-card flex flex-col items-center p-4 gap-2 group"
                >
                  <Icon className={`w-20 h-20 ${color} group-hover:scale-110 transition-transform`} />
                  <span className="font-display text-sm text-blue-900 text-center leading-tight">
                    {nome}
                  </span>
                </button>
              )
            ))}
          </div>
          
          {/* RODAPÉ */}
          <footer className="mt-auto py-6 text-center text-white/70 font-sans text-sm border-t border-white/10">
            <p>Desenvolvido por André Victor Brito de Andrade ©</p>
            <p>Contato: <a href="mailto:andrevictorbritodeandrade@gmail.com" className="underline">andrevictorbritodeandrade@gmail.com</a></p>
            <p>© 2026 Todos os direitos reservados. | Versão 1.6.0</p>
            <button onClick={() => setNdaAccepted(false)} className="mt-2 text-yellow-400 underline hover:text-yellow-300">
              Ver Termo de Confidencialidade (NDA)
            </button>
            <div className="mt-4 text-xs text-white/40 max-w-md mx-auto">
              Dica: Se o botão "BAIXAR APP" não aparecer, você pode instalar manualmente clicando nos três pontinhos do navegador e selecionando "Instalar aplicativo" ou "Adicionar à tela de início".
            </div>
          </footer>

          {/* MODAL DE INFORMAÇÃO DE INSTALAÇÃO */}
          {showInstallInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white text-blue-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4">Como Instalar</h3>
                <p className="text-sm mb-6 leading-relaxed">
                  Para instalar este aplicativo no seu Android:
                  <br /><br />
                  1. Clique nos <strong>três pontinhos</strong> (⋮) no canto superior do navegador.
                  <br />
                  2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela de início"</strong>.
                </p>
                <button 
                  onClick={() => setShowInstallInfo(false)}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  ENTENDI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}} />
    </div>
  );
}
