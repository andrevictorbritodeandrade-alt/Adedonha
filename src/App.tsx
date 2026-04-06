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
  { id: 'adedonha', nome: 'ADEDONHA INTERATIVA', category: 'Mickey Mouse', image: 'https://picsum.photos/seed/mickey-mouse/600/600' },
  { id: 'perguntados', nome: 'PERGUNTADOS', category: 'Gênio (Aladdin)', image: 'https://picsum.photos/seed/disney-genie/600/600' },
  { id: 'forca', nome: 'JOGO DA FORCA', category: 'Capitão Gancho', image: 'https://picsum.photos/seed/captain-hook/600/600' },
  { id: 'velha', nome: 'JOGO DA VELHA', category: 'Olaf (Frozen)', image: 'https://picsum.photos/seed/olaf-disney/600/600' },
  { id: 'memoria', nome: 'JOGO DO MEMÓRIA', category: 'Dory (Nemo)', image: 'https://picsum.photos/seed/dory-fish/600/600' },
  { id: 'bandeiras', nome: 'JOGO DAS BANDEIRAS', category: 'Castelo Disney', image: 'https://picsum.photos/seed/disney-castle/600/600' },
  { id: 'mapas', nome: 'JOGO DOS MAPAS', category: 'Woody (Toy Story)', image: 'https://picsum.photos/seed/woody-toy-story/600/600' },
  { id: 'ludo', nome: 'LUDO', category: 'Sininho', image: 'https://picsum.photos/seed/tinkerbell/600/600' },
  { id: 'uno', nome: 'UNO', category: 'Elsa (Frozen)', image: 'https://picsum.photos/seed/elsa-frozen/600/600' },
  { id: 'truco', nome: 'TRUCO', category: 'Scar (Rei Leão)', image: 'https://picsum.photos/seed/scar-lion-king/600/600' },
  { id: 'xadrez', nome: 'XADREZ SORTUDO', category: 'Malévola', image: 'https://picsum.photos/seed/maleficent/600/600' },
  { id: 'balaozinho', nome: 'JOGO DO BALÃOZINHO', category: 'Carl (Up)', image: 'https://picsum.photos/seed/up-movie/600/600' },
  { id: 'vermelhinho', nome: 'ONDE ESTÁ O VERMELHINHO?', category: 'Mickey Detetive', image: 'https://picsum.photos/seed/detective-mickey/600/600' },
  { id: 'tatuzin', nome: 'TATUZIN', category: 'Pumba (Rei Leão)', image: 'https://picsum.photos/seed/pumbaa/600/600' },
  { id: 'cruzaletras', nome: 'CRUZALETRAS', category: 'Bela', image: 'https://picsum.photos/seed/belle-disney/600/600' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [user, setUser] = useState<any>({
    uid: 'guest',
    email: 'visitante@arena.com',
    displayName: 'Visitante',
    photoURL: null
  });
  const [ndaAccepted, setNdaAccepted] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    generateMenuBackground().then(setBackgroundImage);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
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

  /* 
  if (!user) {
    return <LoginScreen onLogin={() => setCurrentScreen('menu')} />;
  }
  */

  // ... (renderScreen and Main Menu remain, but need to add UserProfile)

  const renderScreen = () => {
    const ScreenComponent = ({ onBack }: { onBack: () => void }) => {
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
        case 'mapas': return <JogoDosMapas onBack={() => setCurrentScreen('menu')} />;
        default: return null;
      }
    };

    return <ScreenComponent onBack={() => setCurrentScreen('menu')} />;
  };

  const getTileColor = (index: number) => {
    const colors = [
      '#107C10', // Xbox Green
      '#0078D7', // Windows Blue
      '#D83B01', // Orange
      '#E81123', // Red
      '#68217A', // Purple
      '#00B294', // Teal
      '#E3008C', // Magenta
      '#00CC6A', // Light Green
      '#5C2D91', // Deep Purple
      '#00188F', // Deep Blue
      '#A80000', // Dark Red
      '#008272', // Dark Teal
    ];
    return colors[index % colors.length];
  };

  if (currentScreen !== 'menu') {
    return renderScreen();
  }

  return (
    <div className="min-h-screen font-sans text-white overflow-y-auto overflow-x-hidden relative flex flex-col bg-[#1a1a1a]">
      {/* Xbox 360 Style Background Waves */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#107C10]/30 via-[#1a1a1a]/80 to-[#1a1a1a] transform -rotate-12 blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#107C10]/20 via-transparent to-transparent transform rotate-12 blur-3xl"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent blur-3xl"></div>
        {/* Animated scanlines effect */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0Pgo8cGF0aCBkPSJNIDAgMCBMIDQgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50 pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="flex flex-col min-h-screen relative z-10 p-6 md:p-12">
        {/* Header/Nav area */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="font-display text-5xl md:text-7xl text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-2">ARENA DE JOGOS</h1>
            <div className="flex gap-6 text-lg font-bold text-gray-400 uppercase tracking-wider">
              <span className="text-white border-b-4 border-[#107C10] pb-1">Jogos</span>
              <span className="hover:text-white cursor-pointer transition-colors">Aplicativos</span>
              <span className="hover:text-white cursor-pointer transition-colors">Configurações</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-black/30 backdrop-blur-md p-2 pr-6 rounded-full border border-white/10 shadow-lg">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-full border-2 border-[#107C10] cursor-pointer hover:scale-105 transition-transform" />
            ) : (
              <div onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-full bg-[#107C10] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border-2 border-white/20">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{user.displayName || 'Visitante'}</span>
              <span className="text-xs text-[#107C10] font-bold flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#107C10] animate-pulse"></div> Online
              </span>
            </div>
            {user.email === 'admin@admin.com' && (
              <button className="ml-4 bg-[#FFC107] text-black px-3 py-1 rounded-md text-xs font-bold hover:bg-[#FFD54F] transition-colors">Admin</button>
            )}
          </div>
        </div>

        {showProfile && <UserProfile user={user} onClose={() => setShowProfile(false)} />}

        {/* Xbox 360 Style Tile Grid */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1600px] mx-auto">
            {JOGOS.map(({ id, nome, category, image }, index) => {
              // Metro UI style sizing logic
              const isLarge = index === 0 || index === 7;
              const isWide = index === 3 || index === 10 || index === 13;
              
              let spanClass = "col-span-1 row-span-1 aspect-square";
              if (isLarge) spanClass = "col-span-2 row-span-2 aspect-square md:aspect-auto";
              if (isWide) spanClass = "col-span-2 row-span-1 aspect-[2/1]";

              return (
                <button 
                  key={id} 
                  onClick={() => navigateToGame(id)}
                  className={`relative overflow-hidden group ${spanClass} rounded-sm shadow-lg transition-all duration-300 hover:scale-[1.02] hover:z-10 focus:outline-none focus:ring-4 focus:ring-white border border-white/10`}
                >
                  {/* Full Card Avatar Image */}
                  <img 
                    src={image} 
                    alt={category} 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Hover Highlight */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="absolute bottom-4 left-4 right-4 text-left z-10">
                    <h2 className={`font-display text-white tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:translate-x-1 transition-transform ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>{nome}</h2>
                    <p className="text-white/90 text-xs font-bold mt-1 truncate uppercase tracking-wider drop-shadow-md">{category}</p>
                  </div>
                </button>
              );
            })}

            {/* CARD INSTALAR APP */}
            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className="relative overflow-hidden group col-span-2 row-span-1 aspect-[2/1] rounded-sm shadow-lg transition-all duration-300 hover:scale-[1.02] hover:z-10 focus:outline-none focus:ring-4 focus:ring-white border border-white/10"
                style={{ backgroundColor: '#008272' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4">
                  <Download className="w-8 h-8 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h2 className="font-display text-2xl text-white tracking-wide leading-tight drop-shadow-md group-hover:translate-x-1 transition-transform">BAIXAR APP</h2>
                  <p className="text-white/80 text-xs font-medium mt-1 truncate">Instale no seu dispositivo</p>
                </div>
              </button>
            )}

            {/* CARD QR CODE */}
            <div className="relative overflow-hidden col-span-2 row-span-2 aspect-square md:aspect-auto rounded-sm shadow-lg border border-white/10 bg-[#1a1a1a] flex flex-col items-center justify-center p-6">
              <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
                <QRCodeSVG value="https://saladejogos.vercel.app" size={160} />
              </div>
              <h2 className="font-display text-2xl text-white tracking-wide leading-tight drop-shadow-md">COMPARTILHAR</h2>
              <p className="text-gray-400 text-xs font-medium mt-1">saladejogos.vercel.app</p>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-end pointer-events-none">
          <div className="text-left pointer-events-auto">
            <p className="text-sm text-gray-400 font-medium">Desenvolvido por André Victor Brito de Andrade</p>
            <p className="text-xs text-gray-500">Contato: {user.email}</p>
          </div>
          <div className="text-right pointer-events-auto">
            <p className="text-xs text-gray-500 font-bold">V 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
