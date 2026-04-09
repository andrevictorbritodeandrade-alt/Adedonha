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
import QuemSouEu from './QuemSouEu';
import TouchHero from './TouchHero';
import IssoOuAquilo from './IssoOuAquilo';
import AgoraDigital from './AgoraDigital';
import { generateMenuBackground, generateGameAvatar } from './ImageGen';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, setDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { UserProfile } from './components/UserProfile';

const JOGOS_FALLBACK = [
  { id: 'adedonha', title: 'ADEDONHA INTERATIVA', subtitle: 'PROFESSOR E MÁGICO DE PALAVRAS', image_url: 'https://picsum.photos/seed/3d-roulette-letters-pixar/600/600', accent_color: '#107C10', path: 'adedonha', avatar_prompt: 'Professor negro, mestre das palavras, cercado por letras mágicas flutuantes' },
  { id: 'perguntados', title: 'PERGUNTADOS', subtitle: 'GÊNIO DO CONHECIMENTO', image_url: 'https://picsum.photos/seed/3d-question-marks-pixar/600/600', accent_color: '#0078D7', path: 'perguntados', avatar_prompt: 'Gênio negro, aura de sabedoria, segurando uma esfera de conhecimento brilhante' },
  { id: 'forca', title: 'JOGO DA FORCA', subtitle: 'INVESTIGADOR MISTERIOSO', image_url: 'https://picsum.photos/seed/3d-gallows-stickman-pixar/600/600', accent_color: '#D83B01', path: 'forca', avatar_prompt: 'Investigador negro, estilo detetive noir moderno, segurando uma lupa tecnológica' },
  { id: 'velha', title: 'JOGO DA VELHA', subtitle: 'DUELO ESTRATÉGICO X E O', image_url: 'https://picsum.photos/seed/3d-tic-tac-toe-pixar/600/600', accent_color: '#E81123', path: 'velha', avatar_prompt: 'Estrategista negro, mestre de jogos, segurando peças de X e O brilhantes' },
  { id: 'memoria', title: 'JOGO DO MEMÓRIA', subtitle: 'NOSTALGIA E MEMÓRIAS', image_url: 'https://picsum.photos/seed/3d-memory-cards-brain-pixar/600/600', accent_color: '#68217A', path: 'memoria', avatar_prompt: 'Sábio negro, com cartas de memória flutuando ao seu redor e uma aura de concentração' },
  { id: 'bandeiras', title: 'JOGO DAS BANDEIRAS', subtitle: 'EXPLORADOR DE CULTURAS', image_url: 'https://picsum.photos/seed/3d-world-flags-pixar/600/600', accent_color: '#00B294', path: 'bandeiras', avatar_prompt: 'Explorador negro, aventureiro moderno, segurando um globo terrestre brilhante' },
  { id: 'mapas', title: 'JOGO DOS MAPAS', subtitle: 'CARTÓGRAFO DE AVENTURAS', image_url: 'https://picsum.photos/seed/3d-world-maps-pixar/600/600', accent_color: '#E3008C', path: 'mapas', avatar_prompt: 'Cartógrafo negro, aventureiro, segurando um mapa do tesouro brilhante e uma bússola' },
  { id: 'ludo', title: 'LUDO', subtitle: 'MESTRE DO TABULEIRO', image_url: 'https://picsum.photos/seed/3d-ludo-board-pixar/600/600', accent_color: '#00CC6A', path: 'ludo', avatar_prompt: 'Mestre de tabuleiro negro, sorridente, com dados mágicos flutuando ao seu redor' },
  { id: 'uno', title: 'UNO', subtitle: 'ESTRATEGISTA DE CARTAS', image_url: 'https://picsum.photos/seed/3d-uno-cards-pixar/600/600', accent_color: '#5C2D91', path: 'uno', avatar_prompt: 'Estrategista de cartas negro, confiante, segurando um leque de cartas coloridas' },
  { id: 'truco', title: 'TRUCO', subtitle: 'DESAFIO DE TRUCO', image_url: 'https://picsum.photos/seed/3d-playing-cards-pixar/600/600', accent_color: '#00188F', path: 'truco', avatar_prompt: 'Jogador de cartas negro, astuto e sorridente, segurando cartas de baralho espanhol' },
  { id: 'xadrez', title: 'XADREZ SORTUDO', subtitle: 'MESTRE DE XADREZ', image_url: 'https://picsum.photos/seed/3d-chess-pieces-pixar/600/600', accent_color: '#A80000', path: 'xadrez', avatar_prompt: 'Personagem negro, mestre de xadrez, expressão focada e estratégica, peças de xadrez holográficas flutuando ao redor' },
  { id: 'balaozinho', title: 'JOGO DO BALÃOZINHO', subtitle: 'AVENTURA NAS ALTURAS', image_url: 'https://picsum.photos/seed/3d-hot-air-balloon-pixar/600/600', accent_color: '#008272', path: 'balaozinho', avatar_prompt: 'Aventureiro negro, sorridente, com óculos de aviador e um balão de ar quente ao fundo' },
  { id: 'vermelhinho', title: 'ONDE ESTÁ O VERMELHINHO?', subtitle: 'DETETIVE DE MARICÁ', image_url: 'https://picsum.photos/seed/3d-red-bus-london-pixar/600/600', accent_color: '#107C10', path: 'vermelhinho', avatar_prompt: 'Detetive negro, observador, com um ônibus vermelho de dois andares ao fundo' },
  { id: 'tatuzin', title: 'TATUZIN', subtitle: 'EXPLORADOR DA NATUREZA', image_url: 'https://picsum.photos/seed/3d-armadillo-mascot-pixar/600/600', accent_color: '#0078D7', path: 'tatuzin', avatar_prompt: 'Explorador negro da natureza, amigável, acompanhado de um tatu-bola mascote' },
  { id: 'cruzaletras', title: 'CRUZALETRAS', subtitle: 'MESTRE DAS LETRAS', image_url: 'https://picsum.photos/seed/3d-crossword-pixar/600/600', accent_color: '#D83B01', path: 'cruzaletras', avatar_prompt: 'Estudioso negro, decifrador de enigmas, montando um quebra-cabeça de palavras cruzadas flutuantes no ar' },
  { id: 'quemsoueu', title: 'QUEM SOU EU?', subtitle: 'SORTEADOR DE PALAVRAS', image_url: 'https://picsum.photos/seed/3d-who-am-i-pixar/600/600', accent_color: '#0078D7', path: 'quemsoueu', avatar_prompt: 'Jovem negro carismático, com um grande ponto de interrogação brilhante flutuando sobre a cabeça, expressão de dúvida divertida' },
  { id: 'touchhero', title: 'TOUCH HERO', subtitle: 'DESAFIO DE RITMO', image_url: 'https://picsum.photos/seed/3d-music-hero-pixar/600/600', accent_color: '#E81123', path: 'touchhero', avatar_prompt: 'Músico negro estiloso, herói do ritmo, tocando uma guitarra futurista com notas musicais neon ao redor' },
  { id: 'issoouaquilo', title: 'ISSO OU AQUILO?', subtitle: 'AMBIENTE DE DEBATE', image_url: 'https://picsum.photos/seed/3d-debate-pixar/600/600', accent_color: '#F59E0B', path: 'issoouaquilo', avatar_prompt: 'Juiz negro moderno e descolado, segurando uma balança brilhante ponderando duas escolhas mágicas' },
  { id: 'agoradigital', title: 'ÁGORA DIGITAL', subtitle: 'DEBATE E ARGUMENTAÇÃO', image_url: 'https://picsum.photos/seed/3d-agora-pixar/600/600', accent_color: '#D4AF37', path: 'agoradigital', avatar_prompt: 'Orador negro inspirador, líder de debates, em uma ágora grega futurista com hologramas de ideias ao redor' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [games, setGames] = useState<any[]>([]);
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
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false);

  // Seeding function to populate Firestore if empty or missing prompts
  const seedGames = async () => {
    const gamesRef = collection(db, 'games');
    const snapshot = await getDocs(gamesRef);
    
    // Always sync fallback data to ensure prompts and better default images are present
    console.log('Syncing games to Firestore...');
    for (const game of JOGOS_FALLBACK) {
      const gameDoc = doc(gamesRef, game.id);
      await setDoc(gameDoc, {
        title: game.title,
        subtitle: game.subtitle,
        image_url: game.image_url,
        path: game.path,
        accent_color: game.accent_color || '#107C10',
        order: JOGOS_FALLBACK.indexOf(game),
        avatar_prompt: (game as any).avatar_prompt
      }, { merge: true });
    }
  };

  const generateAllAvatars = async () => {
    if (!user || user.email !== 'andrevictorbritodeandrade@gmail.com') return;
    setIsGeneratingAvatars(true);
    try {
      const gamesRef = collection(db, 'games');
      const snapshot = await getDocs(gamesRef);
      
      for (const gameDoc of snapshot.docs) {
        const data = gameDoc.data();
        const prompt = data.avatar_prompt || data.title;
        console.log(`Gerando avatar para: ${data.title}...`);
        const newUrl = await generateGameAvatar(data.title, prompt);
        if (newUrl) {
          await updateDoc(doc(db, 'games', gameDoc.id), {
            image_url: newUrl
          });
        }
      }
      alert('Todos os avatares foram gerados com sucesso!');
    } catch (e) {
      console.error("Erro ao gerar avatares:", e);
      alert('Erro ao gerar avatares. Verifique o console.');
    } finally {
      setIsGeneratingAvatars(false);
    }
  };

  useEffect(() => {
    generateMenuBackground().then(setBackgroundImage);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Seed if admin
        if (currentUser.email === 'andrevictorbritodeandrade@gmail.com') {
          seedGames();
        }
      }
    });

    // Real-time games listener
    const q = query(collection(db, 'games'), orderBy('order', 'asc'));
    const unsubscribeGames = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const gamesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGames(gamesList);
      } else {
        // Fallback if DB is empty and not seeded yet
        setGames(JOGOS_FALLBACK.map(g => ({
          id: g.id,
          title: g.title,
          subtitle: g.subtitle,
          image_url: g.image_url,
          path: g.path,
          accent_color: g.accent_color
        })));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeGames();
    };
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
        case 'quemsoueu': return <QuemSouEu onBack={() => setCurrentScreen('menu')} />;
        case 'touchhero': return <TouchHero onBack={() => setCurrentScreen('menu')} />;
        case 'issoouaquilo': return <IssoOuAquilo onBack={() => setCurrentScreen('menu')} />;
        case 'agoradigital': return <AgoraDigital onBack={() => setCurrentScreen('menu')} />;
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
            <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-2">ARENA DE JOGOS</h1>
            <div className="flex gap-6 text-lg font-bold text-gray-400 uppercase tracking-wider">
              <span className="text-white border-b-4 border-[#107C10] pb-1">Jogos</span>
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

        {showProfile && (
        <UserProfile 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onGenerateAvatars={generateAllAvatars}
          isGenerating={isGeneratingAvatars}
        />
      )}

        {/* Xbox 360 Style Tile Grid */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1600px] mx-auto">
            {games.map((game, index) => {
              const { id, title, subtitle, image_url, path, accent_color } = game;
              // Metro UI style sizing logic
              const isLarge = index === 0 || index === 7;
              const isWide = id === 'mapas' || id === 'cruzaletras' || index === 3 || index === 10 || index === 13;
              
              let spanClass = "col-span-1 row-span-1 aspect-square";
              if (isLarge) spanClass = "col-span-2 row-span-2 aspect-square md:aspect-auto";
              if (isWide) spanClass = "col-span-2 row-span-1 aspect-[2/1]";

              return (
                <button 
                  key={id} 
                  onClick={() => navigateToGame(path)}
                  className={`relative overflow-hidden group ${spanClass} rounded-sm shadow-lg transition-all duration-300 hover:scale-[1.02] hover:z-10 focus:outline-none focus:ring-4 focus:ring-white border border-white/10`}
                  style={{ backgroundColor: accent_color || '#1a1a1a' }}
                >
                  {/* Full Card Avatar Image */}
                  <img 
                    src={image_url} 
                    alt={subtitle} 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Hover Highlight */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="absolute bottom-4 left-4 right-4 text-left z-10">
                    <h2 className={`font-display font-bold text-white tracking-wide leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:translate-x-1 transition-transform ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>{title}</h2>
                    <p className="text-white/90 text-xs font-bold mt-1 truncate uppercase tracking-wider drop-shadow-md">{subtitle}</p>
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
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center text-center gap-1 pointer-events-none">
          <p className="text-sm text-gray-400 font-medium pointer-events-auto">Desenvolvido por: André Victor Brito de Andrade</p>
          <p className="text-xs text-gray-500 pointer-events-auto">Contato: andrevictorbritodeandrade@gmail.com</p>
          <p className="text-xs text-gray-500 font-bold pointer-events-auto">Versão: 1.0.5</p>
        </div>
      </div>
    </div>
  );
}
