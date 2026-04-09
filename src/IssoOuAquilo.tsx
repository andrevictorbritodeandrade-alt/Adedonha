import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Swords, 
  RefreshCw, 
  BookOpen, 
  Users, 
  Globe, 
  History, 
  Dribbble, 
  Palette, 
  Scale, 
  ShieldAlert,
  Loader2,
  Sparkles,
  Zap,
  ChevronLeft,
  Languages
} from 'lucide-react';

const apiKey = process.env.GEMINI_API_KEY;

const CATEGORIES = [
  { 
    id: 'portugues', 
    name: 'Português', 
    icon: <BookOpen className="w-6 h-6" />, 
    color: 'from-blue-600/80 to-blue-900/80',
    glow: 'shadow-blue-500/20',
    guideline: 'Literatura Brasileira vs Universal, Gêneros Textuais e debates sobre Variação Linguística.'
  },
  { 
    id: 'ingles', 
    name: 'Inglês', 
    icon: <Languages className="w-6 h-6" />, 
    color: 'from-red-600/80 to-red-900/80',
    glow: 'shadow-red-500/20',
    guideline: 'Vocabulário prático, expressões culturais, literatura clássica e debates sobre a hegemonia da língua no mundo.'
  },
  { 
    id: 'frances', 
    name: 'Francês', 
    icon: <Languages className="w-6 h-6" />, 
    color: 'from-indigo-600/80 to-indigo-900/80',
    glow: 'shadow-indigo-500/20',
    guideline: 'Cultura francófona, vocabulário e influência da língua francesa nas artes e história.'
  },
  { 
    id: 'matematica', 
    name: 'Matemática', 
    icon: <Scale className="w-6 h-6" />, 
    color: 'from-zinc-600/80 to-zinc-900/80',
    glow: 'shadow-zinc-500/20',
    guideline: 'Lógica vs Cálculo, Geometria vs Álgebra e aplicações reais de consumo.'
  },
  { 
    id: 'ciencias', 
    name: 'Ciências', 
    icon: <ShieldAlert className="w-6 h-6" />, 
    color: 'from-emerald-600/80 to-emerald-900/80',
    glow: 'shadow-emerald-500/20',
    guideline: 'Saúde vs Meio Ambiente, Biotecnologia vs Ética Natural e corpo humano.'
  },
  { 
    id: 'historia', 
    name: 'História', 
    icon: <History className="w-6 h-6" />, 
    color: 'from-amber-700/80 to-amber-950/80',
    glow: 'shadow-amber-500/20',
    guideline: 'Revolução vs Evolução, resistência de povos originários e figuras contra a desigualdade.'
  },
  { 
    id: 'geografia', 
    name: 'Geografia', 
    icon: <Globe className="w-6 h-6" />, 
    color: 'from-teal-600/80 to-teal-900/80',
    glow: 'shadow-teal-500/20',
    guideline: 'Urbanização vs Preservação, Geopolítica, Gentrificação e desigualdades socioespaciais.'
  },
  { 
    id: 'ed_fisica', 
    name: 'Ed. Física', 
    icon: <Dribbble className="w-6 h-6" />, 
    color: 'from-orange-600/80 to-orange-900/80',
    glow: 'shadow-orange-500/20',
    guideline: 'Desportos, Competição vs Cooperação, Saúde vs Estética. Inclua Xadrez.'
  },
  { 
    id: 'artes', 
    name: 'Artes', 
    icon: <Palette className="w-6 h-6" />, 
    color: 'from-pink-600/80 to-pink-900/80',
    glow: 'shadow-pink-500/20',
    guideline: 'Arte Clássica vs Arte Urbana, Expressão vs Técnica e cultura popular.'
  },
  { 
    id: 'sociopolitica', 
    name: 'Sociedade', 
    icon: <Users className="w-6 h-6" />, 
    color: 'from-purple-600/80 to-purple-900/80',
    glow: 'shadow-purple-500/20',
    guideline: 'Direitos Humanos, Ética na Internet, Ativismo Jovem e combate ao racismo.'
  },
];

const IssoOuAquilo = ({ onBack }: { onBack: () => void }) => {
  const [screen, setScreen] = useState('menu'); 
  const [category, setCategory] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState<any>(null);
  const [challenger, setChallenger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(1);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const maxRounds = 15;

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const generateImage = async (name: string) => {
    if (imageCache[name]) return imageCache[name];
    try {
      // Usando o modelo disponível no ambiente se o específico falhar
      const model = 'gemini-2.5-flash-image';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Cinematic educational high detail photography of ${name}, vivid and clear, 16:9` }] }],
            config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
          })
        }
      );
      const data = await response.json();
      const b64 = `data:image/png;base64,${data.candidates[0].content.parts[0].inlineData.data}`;
      setImageCache(prev => ({ ...prev, [name]: b64 }));
      return b64;
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      return `https://picsum.photos/seed/${encodeURIComponent(name)}/1280/720`;
    }
  };

  const fetchItems = async (cat: any) => {
    setLoading(true);
    const systemPrompt = `Você é um mestre em gamificação educacional. Gere 20 termos desafiadores para ${cat.name}. Diretriz: ${cat.guideline}. Retorne JSON: { "items": [ { "name": "Termo", "hint": "Gancho para debate" } ] }`;

    try {
      const model = 'gemini-1.5-flash';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Gere os itens seguindo as diretrizes." }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const itemsList = JSON.parse(data.candidates[0].content.parts[0].text).items;

      setItems(itemsList);
      setWinner({ ...itemsList[0], image: null });
      setChallenger({ ...itemsList[1], image: null });
      setCurrentIndex(2);
      setScreen('game');
      setLoading(false);

      const [img1, img2] = await Promise.all([generateImage(itemsList[0].name), generateImage(itemsList[1].name)]);
      setWinner((prev: any) => ({ ...prev, image: img1 }));
      setChallenger((prev: any) => ({ ...prev, image: img2 }));
    } catch (err) {
      console.error("Erro ao buscar itens:", err);
      setLoading(false);
    }
  };

  const handleChoice = async (choice: any) => {
    if (round >= maxRounds) {
      setWinner(choice);
      setScreen('summary');
      return;
    }
    const nextItem = items[currentIndex];
    setWinner({ ...choice });
    setChallenger({ ...nextItem, image: null });
    setRound(prev => prev + 1);
    setCurrentIndex(prev => prev + 1);

    const nextImg = await generateImage(nextItem.name);
    setChallenger((prev: any) => ({ ...prev, image: nextImg }));
  };

  const resetGame = () => {
    setScreen('menu');
    setCategory(null);
    setItems([]);
    setRound(1);
    setWinner(null);
    setChallenger(null);
    setCurrentIndex(0);
  };

  return (
    <div className="h-screen w-screen bg-[#000000] text-white font-sans flex flex-col items-center overflow-hidden no-scrollbar relative">
      {/* Background Cinza Escuro Suave com brilho dourado lateral */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full" />
      </div>

      <header className="w-full max-w-7xl p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 text-black fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tight text-lg leading-none uppercase italic text-amber-500">Isso ou Aquilo</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Ambiente de Debate</span>
          </div>
        </div>
        
        {screen === 'game' && (
          <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 px-5 py-1.5 rounded-full flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
              RODADA {round} / {maxRounds}
            </span>
          </div>
        )}

        <button 
          onClick={screen === 'menu' ? onBack : resetGame} 
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-white text-amber-500 transition-all bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/20 shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {screen === 'menu' ? 'Voltar' : 'Menu'}
        </button>
      </header>

      <main className="flex-1 w-full max-w-7xl flex flex-col justify-center p-6 z-10 overflow-hidden no-scrollbar">
        {screen === 'menu' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-amber-600 leading-relaxed uppercase py-4">
                QUAL É O SEU <br /> <span className="text-amber-500 italic">OLHAR CRÍTICO?</span>
              </h1>
              <p className="text-zinc-500 font-medium max-w-xl mx-auto uppercase text-[10px] tracking-[0.2em]">
                Professor, selecione a área para começar o desafio de hoje com seus alunos.
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 max-h-[50vh] overflow-y-auto no-scrollbar p-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat); fetchItems(cat); }}
                  className={`relative group h-36 rounded-[28px] transition-all duration-300 overflow-hidden shadow-2xl border border-white/5 hover:border-amber-500/50 active:scale-95`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <div className="absolute inset-0 bg-zinc-950/80 group-hover:bg-transparent transition-colors" />
                  
                  <div className="relative z-10 h-full p-4 flex flex-col items-center justify-center gap-2 text-white text-center">
                    <div className="bg-amber-500/10 p-2 rounded-xl backdrop-blur-md group-hover:rotate-6 transition-transform text-amber-500">
                      {loading && category?.id === cat.id ? <Loader2 className="animate-spin w-6 h-6" /> : cat.icon}
                    </div>
                    <span className="font-black text-xs md:text-sm uppercase tracking-tighter leading-none group-hover:text-amber-500 transition-colors">{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'game' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[70vh] relative items-center px-4">
            <GameCard item={winner} onClick={() => handleChoice(winner)} side="left" />
            <GameCard item={challenger} onClick={() => handleChoice(challenger)} side="right" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
              <div className="bg-amber-500 text-black w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] border-4 border-[#000000] animate-in zoom-in duration-300">
                <Swords className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>
        )}

        {screen === 'summary' && (
          <div className="text-center animate-in zoom-in duration-500 h-[70vh] flex flex-col justify-center">
            <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h2 className="text-xl font-bold text-zinc-500 uppercase tracking-widest mb-4 italic text-center leading-tight">A Turma Escolheu:</h2>
            
            <div className="max-w-xl mx-auto rounded-[32px] overflow-hidden border-[4px] border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)] relative group">
              <img src={winner.image} className="w-full aspect-video object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black flex flex-col justify-end p-8 text-left">
                <h3 className="text-[26px] font-black leading-relaxed uppercase italic text-amber-500 drop-shadow-[0_2px_10px_rgba(0,0,0,1)] py-2">{winner.name}</h3>
                <p className="text-white font-bold uppercase text-[10px] mt-2 tracking-[0.3em] opacity-60">{category.name}</p>
              </div>
            </div>
            
            <button 
              onClick={resetGame} 
              className="mt-8 group bg-amber-500 text-black px-12 py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-4 mx-auto text-xs"
            >
              Novo Debate <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        )}
      </main>

      <footer className="w-full max-w-7xl px-8 py-6 border-t border-white/5 flex flex-col items-center justify-center gap-1 z-50 text-center">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
          Desenvolvido por: <span className="text-amber-500">André Victor Brito de Andrade</span>
        </p>
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
          Contato: <span className="text-amber-600/80 lowercase tracking-normal italic font-medium">andrevictorbritodeandrade@gmail.com</span>
        </p>
        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.1em] italic">
          versão: 1.0.5
        </p>
      </footer>
    </div>
  );
};

const GameCard = ({ item, onClick, side }: any) => {
  if (!item) return null;
  const hasImage = !!item.image;

  return (
    <button
      onClick={onClick}
      className={`relative group w-full h-full overflow-hidden rounded-[40px] border-[3px] border-white/5 hover:border-amber-500/50 transition-all duration-500 bg-zinc-950 shadow-2xl flex flex-col items-center justify-end active:scale-95`}
    >
      {!hasImage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 opacity-20" />
        </div>
      ) : (
        <img src={item.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 opacity-60 group-hover:opacity-100" alt={item.name} />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      
      <div className="relative z-20 w-full pb-16 px-10 flex flex-col items-center justify-center">
        <h2 className="text-[26px] font-black uppercase tracking-tight leading-relaxed transition-all duration-300 italic text-white group-hover:text-amber-500 drop-shadow-[0_4px_12px_rgba(0,0,0,1)] break-words w-full text-center flex items-center justify-center min-h-[90px] py-2 overflow-visible">
          {item.name}
        </h2>
        
        <div className="h-0.5 w-0 group-hover:w-16 bg-amber-500 transition-all duration-500 mt-3 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        
        <p className="mt-4 text-[10px] font-bold text-zinc-300 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 max-w-xs uppercase tracking-widest leading-relaxed line-clamp-2 text-center drop-shadow-md">
          {item.hint}
        </p>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 bg-amber-500 text-black px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-2xl z-30">
        <Sparkles className="w-3 h-3" /> Escolher este
      </div>
    </button>
  );
};

export default IssoOuAquilo;
