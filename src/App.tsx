import React, { useState, useEffect } from 'react';
import { 
  Hand, MessageSquareText, Skull, Hash, Brain, Flag, Map, 
  Gamepad2, Target, LayoutGrid, Crown, AirVent, Search, Bug, 
  Crosshair, Download, QrCode, User as UserIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import NDA from './NDA';
import LoginScreen from './LoginScreen';
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
import { generateMenuBackground } from './ImageGen';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from './components/UserProfile';

const JOGOS = [
  { id: 'adedonha', nome: 'ADEDONHA INTERATIVA', category: 'Palavras & Raciocínio', Icon: Hand, color: 'text-purple-500' },
  { id: 'perguntados', nome: 'PERGUNTADOS', category: 'Quiz & Conhecimento', Icon: MessageSquareText, color: 'text-blue-500' },
  { id: 'forca', nome: 'JOGO DA FORCA', category: 'Palavras & Clássico', Icon: Skull, color: 'text-red-600' },
  { id: 'velha', nome: 'JOGO DA VELHA', category: 'Estratégia Rápida', Icon: Hash, color: 'text-yellow-500' },
  { id: 'memoria', nome: 'JOGO DO MEMÓRIA', category: 'Foco & Concentração', Icon: Brain, color: 'text-pink-500' },
  { id: 'bandeiras', nome: 'JOGO DAS BANDEIRAS', category: 'Geografia & Mundo', Icon: Flag, color: 'text-green-500' },
  { id: 'mapas', nome: 'JOGO DOS MAPAS', category: 'Geografia & Localização', Icon: Map, color: 'text-emerald-600' },
  { id: 'ludo', nome: 'LUDO', category: 'Tabuleiro Clássico', Icon: Gamepad2, color: 'text-green-600' },
  { id: 'uno', nome: 'UNO', category: 'Cartas & Diversão', Icon: LayoutGrid, color: 'text-orange-500' },
  { id: 'truco', nome: 'TRUCO', category: 'Cartas & Blefe', Icon: Target, color: 'text-orange-600' },
  { id: 'xadrez', nome: 'XADREZ SORTUDO', category: 'Estratégia & Sorte', Icon: Crown, color: 'text-yellow-600' },
  { id: 'balaozinho', nome: 'JOGO DO BALÃOZINHO', category: 'Ação Rápida', Icon: AirVent, color: 'text-sky-400' },
  { id: 'vermelhinho', nome: 'ONDE ESTÁ O VERMELHINHO?', category: 'Atenção Visual', Icon: Search, color: 'text-red-500' },
  { id: 'tatuzin', nome: 'TATUZIN', category: 'Aventura Plataforma', Icon: Bug, color: 'text-amber-700' },
  { id: 'cruzaletras', nome: 'CRUZALETRAS', category: 'Palavras Cruzadas', Icon: Crosshair, color: 'text-indigo-600' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [user, setUser] = useState<any>(null);
  const [ndaAccepted, setNdaAccepted] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    generateMenuBackground().then(setBackgroundImage);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentScreen('menu');
    };
    window.addEventListener('popstate', handlePopState);

    const accepted = localStorage.getItem('nda_accepted');
    if (!accepted) {
      setNdaAccepted(false);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const navigateToGame = (id: string) => {
    history.pushState(null, '', null);
    setCurrentScreen(id);
  };

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

  if (!user) {
    return <LoginScreen onLogin={() => setCurrentScreen('menu')} />;
  }

  // ... (renderScreen and Main Menu remain, but need to add UserProfile)

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
      <div className="min-h-screen bg-[#121212] text-white p-4 overflow-y-auto">
        <ScreenComponent onBack={() => setCurrentScreen('menu')} />
        
        {/* RODAPÉ NAS TELAS DE JOGO */}
        <footer className="mt-auto pt-6 flex flex-col items-center gap-2 border-t border-white/10 text-center pb-8">
          <p className="text-sm text-gray-300 font-medium">Desenvolvido por André Victor Brito de Andrade</p>
          <p className="text-xs text-gray-500">Contato: {user.email}</p>
          <p className="text-xs text-gray-600">Versão 1.0.0</p>
        </footer>
      </div>
    );
  };

  if (currentScreen !== 'menu') {
    return renderScreen();
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white overflow-y-auto overflow-x-hidden relative flex flex-col">
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 transition-opacity duration-1000"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#121212]/80 to-[#121212]" />

      <div className="flex flex-col min-h-screen relative z-10 p-8">
        {/* Header/Nav area */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="font-display text-5xl text-yellow-400 tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">ARENA DE JOGOS</h1>
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform" />
            ) : (
              <UserIcon onClick={() => setShowProfile(true)} className="w-12 h-12 p-2 rounded-full bg-white/10 cursor-pointer hover:bg-white/20 transition-colors" />
            )}
            {user.email === 'admin@admin.com' && (
              <button className="btn-admin px-4 py-2 rounded-lg text-sm">Dashboard Admin</button>
            )}
          </div>
        </div>

        {showProfile && <UserProfile user={user} onClose={() => setShowProfile(false)} />}

        {/* Vertical Game List */}
        <div className="flex-1 -mx-4 px-4 overflow-y-auto hide-scrollbar">
          <div className="flex flex-col gap-6 pb-[120px]">
            {JOGOS.map(({ id, nome, category, Icon, color }, index) => {
              const isFocused = index === 2; // Mocking focus for demonstration
              const neonClass = isFocused ? 'neon-border-green focused' : 'neon-border-purple';
              return (
                <button 
                  key={id} 
                  onClick={() => navigateToGame(id)}
                  className={`neon-card w-full max-w-[400px] mx-auto h-64 flex flex-col items-center justify-between p-6 group ${neonClass}`}
                >
                  <div className="flex-1 flex items-center justify-center w-full">
                    <div className={`w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-16 h-16" />
                    </div>
                  </div>
                  <div className="w-full text-center mt-4">
                    <h2 className="font-display text-2xl text-yellow-400 tracking-wide mb-1 leading-tight">{nome}</h2>
                    <p className="text-gray-300 text-sm font-medium">{category}</p>
                  </div>
                </button>
              );
            })}

            {/* CARD INSTALAR APP */}
            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className="neon-card w-full max-w-[400px] mx-auto h-64 flex flex-col items-center justify-between p-6 group neon-border-green"
              >
                <div className="flex-1 flex items-center justify-center w-full">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform duration-300">
                    <Download className="w-16 h-16" />
                  </div>
                </div>
                <div className="w-full text-center mt-4">
                  <h2 className="font-display text-2xl text-yellow-400 tracking-wide mb-1 leading-tight">BAIXAR APP</h2>
                  <p className="text-gray-300 text-sm font-medium">Instale no seu celular</p>
                </div>
              </button>
            )}

            {/* CARD QR CODE */}
            <div className="neon-card w-full max-w-[400px] mx-auto h-80 flex flex-col items-center justify-between p-6 neon-border-purple">
              <div className="flex-1 flex items-center justify-center w-full bg-white p-4 rounded-2xl">
                <QRCodeSVG value="https://saladejogos.vercel.app" size={180} />
              </div>
              <div className="w-full text-center mt-4">
                <h2 className="font-display text-2xl text-yellow-400 tracking-wide mb-1 leading-tight">COMPARTILHAR</h2>
                <p className="text-gray-300 text-sm font-medium">saladejogos.vercel.app</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto pt-6 flex flex-col items-center gap-2 border-t border-white/10 text-center">
          <p className="text-sm text-gray-300 font-medium">Desenvolvido por André Victor Brito de Andrade</p>
          <p className="text-xs text-gray-500">Contato: {user.email}</p>
          <p className="text-xs text-gray-600">Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
