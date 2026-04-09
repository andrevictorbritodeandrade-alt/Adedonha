import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  RotateCw, 
  History, 
  Users, 
  Clock, 
  Loader2,
  Trophy,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { auth, db } from './firebase';

const appId = 'agora-digital-andre';
const apiKey = process.env.GEMINI_API_KEY; 

const CATEGORIES: Record<string, { icon: string; color: string; topics: string[] }> = {
  "Língua Portuguesa": { icon: "📚", color: "#FF5252", topics: ["A evolução das gírias", "Preconceito linguístico", "Literatura periférica", "O papel da poesia", "Fake news e gramática", "Redação e cidadania", "Variação regional", "Influência do digital na escrita", "Clássicos x Contemporâneos", "O poder da oratória", "Letras de música como poesia", "Gênero neutro na língua", "Acordo ortográfico", "Contestação de cânones", "Intertextualidade"] },
  "Francês": { icon: "🇫🇷", color: "#00BFA5", topics: ["Cultura francófona na África", "A Revolução Francesa hoje", "Gastronomia e identidade", "Paris x Interior", "A língua francesa no mundo", "Cinema francês clássico", "Iluminismo e direitos", "Expressões de cortesia", "Música (Zaz, Stromae)", "Símbolos da República", "O Louvre e a história", "Moda e sustentabilidade", "Francofonia no Canadá", "Esportes na França", "Juventude francesa"] },
  "Inglês": { icon: "🌐", color: "#00B0FF", topics: ["Globalização e inglês", "Gírias da internet", "Cultura pop e debates", "Inglês como língua franca", "Diferenças UK x USA", "Música e protesto", "Tecnologia e vocabulário", "O futuro da língua", "Cinema de Hollywood", "Intercâmbio cultural", "Literatura de Shakespeare", "Negócios internacionais", "Mídias sociais em inglês", "Turismo consciente", "Inovação no Vale do Silão"] },
  "Matemática": { icon: "➗", color: "#7C4DFF", topics: ["Matemática no Xadrez", "Estatística e eleições", "Criptografia básica", "Geometria na natureza", "A lógica de Alan Turing", "Matemática financeira jovem", "Probabilidade em jogos", "Fractais e arte", "O número de ouro", "História do Zero", "Pitágoras e a música", "Algoritmos das redes", "Matemática e esportes", "Arquitetura e cálculos", "Mulheres na matemática"] },
  "Ciências": { icon: "🔬", color: "#FFC107", topics: ["Crise climática", "Energias renováveis", "Ética na IA", "Saúde mental na escola", "Vacinas e ciência", "Biodiversidade brasileira", "Exploração espacial", "Microplásticos nos oceanos", "O corpo humano e estresse", "Evolução das espécies", "Genética e sociedade", "Física quântica simples", "Química dos alimentos", "Sustentabilidade urbana", "Cérebro e aprendizagem"] },
  "História": { icon: "🏛️", color: "#FF4081", topics: ["Revolução Haitiana", "Heróis negros brasileiros", "Guerra de Canudos", "Ditadura e memória", "Povos originários", "Imperialismo na África", "Antigo Egito e ciência", "Movimento sufragista", "Grécia: Mito x Realidade", "Revolução Industrial", "Cangaço e sociologia", "Era Vargas", "Guerra Fria", "História da África", "Maio de 68"] },
  "Geografia": { icon: "🌍", color: "#4CAF50", topics: ["Urbanização e favelas", "Geopolítica do petróleo", "Fome no mundo", "Migrações forçadas", "Biomas em perigo", "Cartografia e poder", "Globalização econômica", "Conflitos de fronteira", "Meio ambiente e lucro", "Cidades inteligentes", "Geografia do racismo", "Agronegócio x Familiar", "Oceanografia", "Demografia brasileira", "Recursos hídricos"] },
  "Artes": { icon: "🎨", color: "#2196F3", topics: ["Grafite e pichação", "Arte como protesto", "Semana de Arte Moderna", "Bauhaus e design", "Renascimento", "Arte digital (NFTs)", "Teatro do oprimido", "Fotografia social", "Música clássica e elite", "Cinema nacional", "Folclore e identidade", "Expressionismo", "Arte africana", "Patrimônio histórico", "Dança contemporânea"] },
  "Educação Física": { icon: "⚽", color: "#FF9800", topics: ["Ética nos esportes", "Doping e performance", "Xadrez como esporte", "Corpo e padrões de beleza", "Inclusão no esporte", "História das Olimpíadas", "Saúde x Estética", "Esportes radicais", "Yoga e mindfulness", "Violência nas torcidas", "E-sports são esportes?", "Sedentarismo digital", "Jogos de tabuleiro", "Anatomia do exercício", "Esporte e política"] },
  "Interpretação": { icon: "📝", color: "#9C27B0", topics: ["Subtextos em anúncios", "Discurso político", "Ironia", "Letras de rap", "Fake news", "Intenção comunicativa", "Ambiguidade", "Coerência", "Textos científicos", "Crônicas", "Editoriais", "Memes", "Poesia concreta", "Roteiros", "Manifestos"] },
  "Política Jovem": { icon: "✊", color: "#00BCD4", topics: ["Voto aos 16 anos", "Grêmios", "Ativismo digital", "Cotas", "Representatividade", "Democracia", "Direito à cidade", "Movimentos sociais", "Jovens e clima", "Políticas públicas", "Estado", "Corrupção", "Liberdade", "Ideologias", "Cidadania"] },
  "Guerras": { icon: "🛡️", color: "#607D8B", topics: ["Ciberguerra", "Recursos", "Drones", "ONU", "Ucrânia", "Israel-Palestina", "Refugiados", "Narcotráfico", "Indústria bélica", "Terrorismo", "Paz", "Impacto ambiental", "Jornalismo", "Memórias", "Propaganda"] },
  "Internet": { icon: "📱", color: "#8BC34A", topics: ["Algoritmos", "Saúde mental", "Influenciadores", "Privacidade", "Cyberbullying", "Economia da atenção", "Deepfakes", "Cancelamento", "Nomadismo", "Anonimato", "Marketing", "Jogos online", "IA", "Democratização", "Vício em telas"] },
  "Direito": { icon: "⚖️", color: "#E91E63", topics: ["Consumidor", "ECA", "Direitos Humanos", "Maria da Penha", "Direito autoral", "CF/88", "Prisional", "Trabalho", "Crimes digitais", "Legítima defesa", "Pena de morte", "Ética", "Animais", "Intelectual", "Minorias"] },
  "Variados": { icon: "💡", color: "#3F51B5", topics: ["Minimalismo", "Tempo", "Extraterrestres", "Religião", "Trabalho", "Emoções", "Ética", "Felicidade", "Tradição", "Habilidades", "Finanças", "Solidão", "Enigmas"] },
  "Entretenimento": { icon: "🎬", color: "#CDDC39", topics: ["Streaming", "RPG", "Geek", "Realities", "K-pop", "Ficção científica", "Evolução dos games", "Festivais", "Comédia", "Cosplay", "Podcasts", "HQs", "Turismo", "Indústria", "Fandoms"] },
  "Mundo": { icon: "🗺️", color: "#FF5722", topics: ["BRICS", "Pobreza", "Trabalho escravo", "Espacial", "Pandemias", "ONU", "Mulheres", "Crise hídrica", "Educação", "Globalização", "Línguas", "Paris", "Cidades globais", "Fórum", "Paz mundial"] }
};

const AgoraIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c0-4.5 3.5-8 8-8s8 3.5 8 8" />
    <path d="M6 21c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
    <circle cx="11" cy="9" r="2" />
    <path d="M11 13v1" />
    <rect x="2" y="21" width="18" height="1" rx="0.5" />
  </svg>
);

const callGemini = async (prompt: string, systemPrompt: string) => {
  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json", responseSchema: {
            type: "OBJECT",
            properties: { introduction: { type: "STRING" } }
          }}
        })
      });
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) { await new Promise(r => setTimeout(r, delay)); delay *= 2; }
  }
  throw new Error("Erro na IA");
};

const AgoraDigital = ({ onBack }: { onBack: () => void }) => {
  const [user, setUser] = useState<any>(null);
  const [className, setClassName] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [appState, setAppState] = useState('idle');
  
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [introData, setIntroData] = useState({ text: '' });
  
  const [rotation, setRotation] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200);
  const [debateStartTime, setDebateStartTime] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const categoriesList = Object.keys(CATEGORIES);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !className) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'history');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => item.className === className);
      setHistory(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, [user, className]);

  useEffect(() => {
    let interval: any = null;
    if (appState === 'debating' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && appState === 'debating') { finishDebate(); }
    return () => clearInterval(interval);
  }, [appState, timeLeft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const angleStep = (2 * Math.PI) / categoriesList.length;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1e1e1e";
      ctx.fill();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2;
      ctx.stroke();

      categoriesList.forEach((cat, i) => {
        const startAngle = i * angleStep + rotation;
        const endAngle = startAngle + angleStep;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = CATEGORIES[cat].color;
        ctx.fill();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.font = "900 16px sans-serif"; 
        ctx.fillStyle = "#fff";
        ctx.textAlign = "right"; 
        let label = cat.toUpperCase();
        if (label.length > 18) label = label.substring(0, 16) + "..";
        ctx.fillText(label, radius * 0.95, 6);
        ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + radius - 5, centerY);
      ctx.lineTo(centerX + radius + 30, centerY - 20);
      ctx.lineTo(centerX + radius + 30, centerY + 20);
      ctx.closePath();
      ctx.fillStyle = "#D4AF37";
      ctx.fill();
    };
    draw();
  }, [rotation, categoriesList]);

  const spin = () => {
    if (appState !== 'idle' || !className) return;
    setAppState('spinning');
    const extraSpins = 7 + Math.random() * 5;
    const targetRotation = rotation + extraSpins * 2 * Math.PI;
    const duration = 3500;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setRotation(rotation + (targetRotation - rotation) * easeOut);
      if (progress < 1) requestAnimationFrame(animate);
      else finalizeSpin(rotation + (targetRotation - rotation));
    };
    requestAnimationFrame(animate);
  };

  const finalizeSpin = async (finalRot: number) => {
    const angleStep = (2 * Math.PI) / categoriesList.length;
    const normalizedRot = (2 * Math.PI - (finalRot % (2 * Math.PI))) % (2 * Math.PI);
    const index = Math.floor(normalizedRot / angleStep);
    const category = categoriesList[index];
    const usedTopics = history.filter(h => h.category === category).map(h => h.topic);
    const availableTopics = CATEGORIES[category].topics.filter(t => !usedTopics.includes(t));
    const pickedTopic = availableTopics.length > 0 
      ? availableTopics[Math.floor(Math.random() * availableTopics.length)]
      : CATEGORIES[category].topics[Math.floor(Math.random() * CATEGORIES[category].topics.length)];

    setCurrentCategory(category);
    setCurrentTopic(pickedTopic);
    setAppState('announcing');

    const sysPrompt = "Você é o assistente do Prof. André Brito. Gere uma introdução de 3 frases para debate baseada em fatos reais. REGRAS: SEMPRE apresente uma fonte explícita (Autor, Ano, ou Veículo) no final no padrão de concurso (ex: Fonte: Adaptado de Folha de S. Paulo, 2024). Retorne JSON { introduction: string }.";
    const prompt = `Tema: ${pickedTopic}. Disciplina: ${category}.`;

    try {
      const aiResponse = await callGemini(prompt, sysPrompt);
      setIntroData({ text: aiResponse.introduction });
      setTimeout(() => {
        setAppState('debating');
        setTimeLeft(1200);
        setDebateStartTime(Date.now());
      }, 5000);
    } catch (e) {
      setTimeout(() => {
        setAppState('debating');
        setTimeLeft(1200);
        setDebateStartTime(Date.now());
      }, 5000);
    }
  };

  const finishDebate = async () => {
    if (appState !== 'debating') return;
    const durationSec = Math.floor((Date.now() - (debateStartTime || 0)) / 1000);
    const durationStr = `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), {
        className, category: currentCategory, topic: currentTopic, duration: durationStr, timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
    setAppState('idle');
  };

  const adjustTime = (amount: number) => setTimeLeft(prev => Math.max(0, Math.min(1800, prev + amount)));

  return (
    <div className="h-screen flex flex-col bg-black text-slate-200 font-sans p-3 overflow-hidden selection:bg-amber-600">
      
      {/* CABEÇALHO */}
      <header className="flex-none flex flex-row items-center justify-between gap-3 bg-[#121212] px-6 py-2 rounded-2xl border border-[#D4AF37]/20 mb-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-[#D4AF37]/10 p-2 rounded-xl text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all mr-2">
            <ChevronLeft size={20} />
          </button>
          <div className="bg-[#D4AF37] p-2.5 rounded-xl text-black shadow-lg flex items-center justify-center">
            <AgoraIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">Ágora <span className="text-[#D4AF37]">Digital</span></h1>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sistema Ativo</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl border border-[#D4AF37]/20 shadow-inner">
          <Users size={14} className="text-[#D4AF37]" />
          <input 
            type="text" 
            placeholder="CÓDIGO TURMA" 
            className="bg-transparent border-none focus:ring-0 text-xs font-black w-32 placeholder:text-slate-700 text-white uppercase"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-row gap-4 overflow-hidden min-h-0">
        
        {/* ÁREA CENTRAL */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-between bg-[#121212] rounded-[32px] border border-[#D4AF37]/10 shadow-2xl relative overflow-hidden p-6">
            
            {/* ESTADO INICIAL / ROLETA */}
            {(appState === 'idle' || appState === 'spinning') && (
              <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-hidden">
                <div className="flex-1 flex items-center justify-center w-full min-h-0">
                  <div className="relative p-4 rounded-full bg-white/[0.01] border border-[#D4AF37]/10 max-h-full flex items-center justify-center aspect-square">
                    <canvas ref={canvasRef} width={420} height={420} className="max-w-full max-h-full h-auto w-auto drop-shadow-[0_0_30px_rgba(212,175,55,0.2)]" />
                  </div>
                </div>
                <div className="flex-none w-full flex flex-col items-center mt-6">
                  <button
                    onClick={spin}
                    disabled={appState === 'spinning' || !className}
                    className="w-full max-w-sm py-4 rounded-3xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:to-[#D4AF37] text-black font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20"
                  >
                    {appState === 'spinning' ? <RotateCw className="animate-spin mx-auto text-black" /> : 'LANÇAR DESAFIO'}
                  </button>
                  {!className && (
                    <p className="mt-3 text-[10px] font-bold text-[#D4AF37] uppercase animate-pulse tracking-[0.2em]">Identifique a turma para começar</p>
                  )}
                </div>
              </div>
            )}

            {/* ANÚNCIO GIGANTE */}
            {appState === 'announcing' && (
              <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-500 overflow-hidden">
                <span className="text-[#D4AF37] text-2xl font-black uppercase tracking-[0.5em] mb-4 animate-pulse">{currentCategory}</span>
                <h2 className="text-[60px] md:text-[100px] font-black text-white leading-none uppercase tracking-tighter drop-shadow-[0_0_50px_rgba(212,175,55,0.3)] break-words w-full">
                  {currentTopic}
                </h2>
                <div className="mt-12 flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-lg">
                  <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
                  Buscando Fontes Acadêmicas...
                </div>
              </div>
            )}

            {/* DEBATE ATIVO */}
            {appState === 'debating' && (
              <div className="flex flex-col h-full w-full justify-between animate-in zoom-in duration-500 overflow-hidden">
                <div className="flex-none flex flex-row justify-between items-center gap-4 bg-white/[0.03] p-4 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
                   <div className="flex items-center gap-4">
                      <div className="bg-[#D4AF37]/10 p-3 rounded-2xl text-4xl border border-[#D4AF37]/20">{CATEGORIES[currentCategory || ""]?.icon}</div>
                      <div className="min-w-0">
                        <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] block">{currentCategory}</span>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight truncate">{currentTopic}</h3>
                      </div>
                   </div>
                   <Sparkles size={32} className="text-[#D4AF37] animate-pulse" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden py-4">
                   <div className="bg-white/5 backdrop-blur-md px-8 py-3 rounded-3xl border border-[#D4AF37]/10 mb-4 max-w-2xl text-center shadow-xl overflow-y-auto max-h-[30%] custom-scrollbar">
                      <p className="text-sm text-[#D4AF37] font-bold italic leading-relaxed">"{introData.text}"</p>
                   </div>
                   <div className="relative group flex-1 flex items-center justify-center">
                     <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-[120px] opacity-10"></div>
                     <span className={`text-[100px] md:text-[140px] font-mono font-black leading-none tracking-tighter relative ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                   </div>
                  <div className="flex gap-4 mt-4 flex-none">
                    <button onClick={() => adjustTime(-300)} className="px-6 py-2 bg-white/5 hover:bg-[#D4AF37]/10 rounded-2xl font-black text-xs uppercase border border-[#D4AF37]/20 text-[#D4AF37] transition-all"> -5 MIN </button>
                    <button onClick={() => adjustTime(300)} className="px-6 py-2 bg-white/5 hover:bg-[#D4AF37]/10 rounded-2xl font-black text-xs uppercase border border-[#D4AF37]/20 text-[#D4AF37] transition-all"> +5 MIN </button>
                  </div>
                </div>

                <button onClick={finishDebate} className="flex-none w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-3xl font-black text-2xl uppercase tracking-widest shadow-2xl transition-all hover:brightness-110">
                  CONCLUIR DISCUSSÃO
                </button>
              </div>
            )}
          </div>
        </div>

        {/* HISTÓRICO (SIDEBAR) */}
        <div className="flex-none w-72 flex flex-col h-full bg-[#121212] rounded-3xl border border-[#D4AF37]/10 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
              <History size={16} /> LOG DE DEBATES
            </h2>
            <div className="bg-[#D4AF37]/20 px-2 py-0.5 rounded text-[8px] font-black text-[#D4AF37] uppercase">
               {history.length} EXP
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10 p-10">
                <Trophy size={40} className="mb-4 text-[#D4AF37]" />
                <p className="font-black uppercase text-[10px] text-white tracking-widest">Nenhum Registro</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={item.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all group overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full uppercase border border-[#D4AF37]/20">
                      {item.category.substring(0, 10)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-600">#{history.length - idx}</span>
                  </div>
                  <p className="font-black text-white text-[10px] leading-tight uppercase mb-2 truncate group-hover:text-[#D4AF37] transition-colors">{item.topic}</p>
                  <div className="flex items-center justify-between text-[8px] font-black text-[#D4AF37] uppercase opacity-70">
                    <div className="flex items-center gap-1"><Clock size={10} /> {item.duration}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="flex-none mt-3 bg-[#121212] py-4 rounded-2xl border border-[#D4AF37]/10 flex flex-col items-center justify-center text-center gap-1 shadow-inner">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Desenvolvido por: André Victor Brito de Andrade</p>
         <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">Contato: andrevictorbritodeandrade@gmail.com</p>
         <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-600 italic">versão: 1.0.5</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.4); }
      `}</style>
    </div>
  );
}

export default AgoraDigital;
