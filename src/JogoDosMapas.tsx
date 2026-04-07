import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Clock, Globe, Map as MapIcon, RefreshCw, User, CheckCircle, AlertCircle, XCircle, LayoutGrid, MapPin, BookOpen, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// URLs de dados geográficos estáveis e com metadados de continente
const URL_MUNDO = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const URL_BRASIL = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

// Dicionário de traduções expandido
const TRADUCOES: Record<string, string> = {
  "brazil": "Brasil", "united states of america": "Estados Unidos", "france": "França", "russia": "Rússia",
  "argentina": "Argentina", "south africa": "África do Sul", "china": "China", "australia": "Austrália",
  "canada": "Canadá", "india": "Índia", "mexico": "México", "germany": "Alemanha", "italy": "Itália",
  "japan": "Japão", "portugal": "Portugal", "norway": "Noruega", "bulgaria": "Bulgária",
  "united kingdom": "Reino Unido", "spain": "Espanha", "egypt": "Egito", "nigeria": "Nigéria",
  "ukraine": "Ucrânia", "poland": "Polónia", "turkey": "Turquia", "thailand": "Tailândia",
  "acre": "Acre", "bahia": "Bahia", "rio de janeiro": "Rio de Janeiro", "são paulo": "São Paulo",
  "scarborough reef": "Recife de Scarborough", "mozambique": "Moçambique"
};

const REGIOES = [
  { id: 'brazil', nome: 'Brasil (Estados)', icon: '🇧🇷' },
  { id: 'south_america', nome: 'América do Sul', icon: '🌎' },
  { id: 'central_america', nome: 'América Central e Caribe', icon: '🏝️' },
  { id: 'north_america', nome: 'América do Norte', icon: '🏔️' },
  { id: 'europe', nome: 'Europa', icon: '🏰' },
  { id: 'africa', nome: 'África', icon: '🦁' },
  { id: 'asia', nome: 'Ásia', icon: '🏮' },
  { id: 'oceania', nome: 'Oceania', icon: '🐨' },
  { id: 'full_world', nome: 'Mundo Inteiro + Brasil', icon: '🪐' },
];

export default function JogoDosMapas({ onBack }: { onBack: () => void }) {
  const [dbRaw, setDbRaw] = useState({ world: [], brazil: [] });
  const [gamePool, setGamePool] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<any>(null);
  const [opcoes, setOpcoes] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timer, setTimer] = useState(20);
  const [gameState, setGameState] = useState('start'); 
  const [nome, setNome] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null); 
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<any>(null);
  const [atlasIndex, setAtlasIndex] = useState(0);

  const canvasReal = useRef<HTMLCanvasElement>(null);
  const canvasContexto = useRef<HTMLCanvasElement>(null);
  const usedTargetsRef = useRef(new Set()); // SISTEMA ANTI-REPETIÇÃO

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, bRes] = await Promise.all([fetch(URL_MUNDO), fetch(URL_BRASIL)]);
        const worldData = await wRes.json();
        const brazilData = await bRes.json();
        setDbRaw({ world: worldData.features, brazil: brazilData.features });
        setLoading(false);
      } catch (err) { console.error("Erro no carregamento:", err); }
    };
    fetchData();
  }, []);

  const filtrarRegiao = useCallback((id: string) => {
    const world = dbRaw.world;
    let pool: any[] = [];

    const getVal = (f: any, key: string) => (f.properties[key] || f.properties[key.toLowerCase()] || "").toString();

    switch (id) {
      case 'brazil': 
        pool = dbRaw.brazil; 
        break;
      case 'africa': 
        pool = world.filter((f: any) => getVal(f, 'CONTINENT') === 'Africa'); 
        break;
      case 'europe': 
        pool = world.filter((f: any) => getVal(f, 'CONTINENT') === 'Europe'); 
        break;
      case 'asia': 
        pool = world.filter((f: any) => getVal(f, 'CONTINENT') === 'Asia'); 
        break;
      case 'oceania': 
        pool = world.filter((f: any) => getVal(f, 'CONTINENT') === 'Oceania'); 
        break;
      case 'south_america': 
        pool = world.filter((f: any) => getVal(f, 'CONTINENT') === 'South America'); 
        break;
      case 'central_america': 
        pool = world.filter((f: any) => getVal(f, 'REGION_UN') === 'Americas' && (getVal(f, 'SUBREGION') === 'Central America' || getVal(f, 'SUBREGION') === 'Caribbean'));
        break;
      case 'north_america': 
        pool = world.filter((f: any) => getVal(f, 'CONTINENT') === 'North America' && getVal(f, 'SUBREGION') !== 'Central America' && getVal(f, 'SUBREGION') !== 'Caribbean');
        break;
      case 'full_world': 
        pool = [...world, ...dbRaw.brazil]; 
        break;
      default: 
        pool = world;
    }

    return pool.length > 0 ? pool : world;
  }, [dbRaw]);

  const handleNextRound = useCallback((currentPool?: any[]) => {
    const pool = currentPool || gamePool;
    if (!pool || pool.length === 0) return;
    
    // FILTRO ANTI-REPETIÇÃO: Pega apenas locais que ainda não foram jogados
    const availablePool = pool.filter(p => !usedTargetsRef.current.has(p));

    // Se o jogador explorou todos os mapas sem repetir nenhum, o jogo encerra (pode ser considerado vitória máxima)
    if (availablePool.length === 0) {
      setGameState('gameover');
      return;
    }

    const sorteado = availablePool[Math.floor(Math.random() * availablePool.length)];
    usedTargetsRef.current.add(sorteado); // Salva o novo mapa para ele nunca mais repetir nesta partida

    // As opções erradas podem continuar vindo do pool total
    const errados = pool.filter(p => p !== sorteado).sort(() => 0.5 - Math.random()).slice(0, 3);
    
    setTarget(sorteado);
    setOpcoes([sorteado, ...errados].sort(() => 0.5 - Math.random()));
    setTimer(20);
  }, [gamePool]);

  const selectChallenge = (regiao: any, mode = 'playing') => {
    const pool = filtrarRegiao(regiao.id);
    setGamePool(pool);
    setRegiaoSelecionada(regiao);
    
    if (mode === 'playing') {
      setScore(0);
      usedTargetsRef.current.clear(); // Limpa o registro de repetidos quando inicia uma nova partida
      setGameState('playing');
      handleNextRound(pool);
    } else {
      setAtlasIndex(0);
      setTarget(pool[0]);
      setGameState('atlas');
    }
  };

  const handleAnswer = (opt: any) => {
    if (feedback || gameState !== 'playing') return;
    if (opt === target) {
      setFeedback('correct');
      setTimeout(() => {
        setScore(s => s + 10);
        setFeedback(null);
        handleNextRound();
      }, 1000);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setHighScore(prev => score > prev ? score : prev);
        setGameState('gameover');
      }, 1000);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timer > 0 && !feedback) {
      const t = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(t);
    } else if (timer === 0 && gameState === 'playing') {
      setHighScore(prev => score > prev ? score : prev);
      setGameState('gameover');
    }
  }, [timer, gameState, feedback, score]);

  useEffect(() => {
    if (gameState === 'atlas' && gamePool.length > 0) {
      setTarget(gamePool[atlasIndex]);
    }
  }, [atlasIndex, gameState, gamePool]);

  const drawMaps = useCallback(() => {
    if (!target || !canvasReal.current || !canvasContexto.current) return;
    const ctxL = canvasReal.current.getContext('2d');
    const ctxR = canvasContexto.current.getContext('2d');
    if (!ctxL || !ctxR) return;
    const w = 400, h = 400;

    const getBounds = (f: any) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const check = (c: any) => {
        if (typeof c[0] === 'number') {
          if (c[0] < minX) minX = c[0]; if (c[0] > maxX) maxX = c[0];
          if (c[1] < minY) minY = c[1]; if (c[1] > maxY) maxY = c[1];
        } else { c.forEach(check); }
      };
      check(f.geometry.coordinates);
      return { minX, maxX, minY, maxY };
    };

    const drawPath = (ctx: CanvasRenderingContext2D, feat: any, proj: any) => {
      const type = feat.geometry.type;
      const coords = feat.geometry.coordinates;
      const poly = (p: any) => {
        p.forEach((ring: any) => {
          if (!ring || !ring[0]) return;
          const s = proj(ring[0][0], ring[0][1]);
          ctx.moveTo(s[0], s[1]);
          ring.forEach((c: any) => { const pt = proj(c[0], c[1]); ctx.lineTo(pt[0], pt[1]); });
        });
      };
      ctx.beginPath();
      if (type === "Polygon") poly(coords); else coords.forEach(poly);
      ctx.closePath();
    };

    const bounds = getBounds(target);
    const scale = Math.min(320 / (bounds.maxX - bounds.minX), 320 / (bounds.maxY - bounds.minY));
    const proj = (ln: number, lt: number) => [
      (ln - bounds.minX) * scale + (w - (bounds.maxX - bounds.minX) * scale) / 2, 
      h - ((lt - bounds.minY) * scale + (h - (bounds.maxY - bounds.minY) * scale) / 2)
    ];

    ctxL.clearRect(0, 0, w, h);
    ctxL.save();
    ctxL.shadowColor = 'rgba(0,0,0,0.8)'; ctxL.shadowBlur = 25; ctxL.shadowOffsetY = 15;
    drawPath(ctxL, target, proj);
    const g = ctxL.createRadialGradient(w/2, h/2, 10, w/2, h/2, w);
    g.addColorStop(0, '#FFD700'); g.addColorStop(1, '#996515');
    ctxL.fillStyle = g; ctxL.fill();
    ctxL.strokeStyle = 'white'; ctxL.lineWidth = 2; ctxL.stroke();
    ctxL.restore();

    ctxR.fillStyle = '#023047'; ctxR.fillRect(0, 0, w, h);
    
    let cBounds;
    if (regiaoSelecionada?.id === 'brazil') {
      cBounds = { minX: -74, maxX: -34, minY: -34, maxY: 6 };
    } else {
      cBounds = { minX: bounds.minX - 35, maxX: bounds.maxX + 35, minY: bounds.minY - 25, maxY: bounds.maxY + 25 };
    }
    
    const wSc = Math.min(380 / (cBounds.maxX - cBounds.minX), 380 / (cBounds.maxY - cBounds.minY));
    const prC = (ln: number, lt: number) => [
      (ln - cBounds.minX) * wSc + (w - (cBounds.maxX - cBounds.minX) * wSc) / 2, 
      h - ((lt - cBounds.minY) * wSc + (h - (cBounds.maxY - cBounds.minY) * wSc) / 2)
    ];

    ctxR.fillStyle = '#1b4332';
    const poolForContext = (regiaoSelecionada?.id === 'brazil') ? dbRaw.brazil : dbRaw.world;

    poolForContext.forEach(f => {
      ctxR.beginPath();
      drawPath(ctxR, f, prC);
      ctxR.fill();
    });

    ctxR.save();
    ctxR.shadowBlur = 20;
    ctxR.shadowColor = '#FFFF00';
    ctxR.fillStyle = '#FFFF00';
    ctxR.beginPath();
    drawPath(ctxR, target, prC);
    ctxR.fill();
    ctxR.strokeStyle = 'white'; ctxR.lineWidth = 1; ctxR.stroke();
    ctxR.restore();

  }, [target, dbRaw, gamePool, regiaoSelecionada]);

  useEffect(() => {
    if ((gameState === 'playing' || gameState === 'atlas') && target) {
      const t = setTimeout(drawMaps, 50);
      return () => clearTimeout(t);
    }
  }, [drawMaps, gameState, target]);

  const getLabel = (f: any) => {
    if (!f || !f.properties) return "---";
    const p = f.properties;
    const raw = (p.NAME || p.name || p.ADMIN || p.NM_ESTADO || "").toLowerCase().trim();
    return TRADUCOES[raw] || raw.toUpperCase();
  };

  if (loading) return (
    <div className="h-screen bg-[#023047] flex flex-col items-center justify-center text-white gap-4">
      <RefreshCw className="w-12 h-12 animate-spin text-[#ffb703]" />
      <h2 className="font-black tracking-widest uppercase">A carregar Atlas...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001219] text-white font-sans flex flex-col relative overflow-hidden">
      <header className="bg-[#023047] p-4 flex justify-between items-center border-b-4 border-[#219ebc] shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-white/10 p-2 rounded-xl active:scale-90 transition-all">
            <ArrowLeft className="w-6 h-6 text-[#ffb703]" />
          </button>
          <div className="bg-[#fb8500] p-2 rounded-xl">
            <Globe className="w-6 h-6 text-[#023047]" />
          </div>
          <h1 className="text-xl font-black italic uppercase hidden sm:block">Jogo dos Mapas</h1>
        </div>

        <div className="flex gap-3 items-center">
          <div className="hidden md:flex flex-col items-end px-4 border-r border-white/10 text-xs">
            <p className="opacity-60 uppercase font-bold text-[9px]">Melhor Pontuação</p>
            <p className="font-black text-[#fb8500]">{highScore} pts</p>
          </div>
          {gameState === 'playing' && (
            <>
              <div className="bg-[#ffb703] text-[#023047] px-4 py-2 rounded-xl font-black flex items-center gap-2 shadow-lg">
                <Trophy className="w-4 h-4" /> {score}
              </div>
              <div className={`px-4 py-2 rounded-xl font-black shadow-lg transition-all ${timer < 6 ? 'bg-red-600 animate-pulse' : 'bg-white text-[#023047]'}`}>
                {timer}s
              </div>
            </>
          )}
          {gameState === 'atlas' && <div className="bg-[#219ebc] px-4 py-2 rounded-xl font-black shadow-lg">MODO ATLAS</div>}
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center justify-center gap-4 overflow-y-auto">
        {gameState === 'start' && (
          <div className="bg-[#023047] p-10 rounded-[50px] border-8 border-[#219ebc] text-center w-full max-w-md animate-in zoom-in shadow-2xl">
            <MapPin className="w-16 h-16 text-[#ffb703] mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-6 uppercase">Explorador</h2>
            <input 
              type="text" placeholder="O TEU NOME..." value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#001219] border-4 border-[#219ebc] p-4 rounded-2xl mb-8 text-center text-xl font-black focus:border-[#ffb703] outline-none"
            />
            <div className="flex flex-col gap-4">
              <button onClick={() => setGameState('menu')} className="bg-[#fb8500] p-5 rounded-2xl text-xl font-black uppercase shadow-[0_6px_0_#b35c00] active:translate-y-1">Jogar Desafio</button>
              <button onClick={() => setGameState('atlas_menu')} className="bg-[#219ebc] p-5 rounded-2xl text-xl font-black uppercase shadow-[0_6px_0_#023047] active:translate-y-1 text-white">Modo Atlas</button>
            </div>
          </div>
        )}

        {(gameState === 'menu' || gameState === 'atlas_menu') && (
          <div className="w-full max-w-4xl p-6 bg-[#023047] rounded-[40px] border-8 border-[#219ebc] text-center shadow-2xl animate-in fade-in">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Onde queres explorar?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REGIOES.map((reg) => (
                <button key={reg.id} onClick={() => selectChallenge(reg, gameState === 'menu' ? 'playing' : 'atlas')} className="bg-[#001219] border-4 border-[#219ebc] hover:border-[#ffb703] p-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all group">
                  <span className="text-2xl group-hover:scale-125 transition-transform">{reg.icon}</span> {reg.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'atlas') && target && (
          <div className="w-full max-w-7xl flex flex-col items-center gap-4 animate-in fade-in">
            <div className="bg-[#023047] px-6 py-2 rounded-full border-2 border-[#219ebc] font-black uppercase text-xs">
              {regiaoSelecionada?.icon} {regiaoSelecionada?.nome}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-[#023047] rounded-[40px] p-8 border-4 border-[#219ebc] relative flex flex-col items-center min-h-[420px] shadow-2xl overflow-hidden">
                <span className="absolute top-6 left-8 bg-[#219ebc] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Formato Real</span>
                <canvas ref={canvasReal} width="400" height="400" className="w-full h-auto max-w-[320px] mt-4 filter drop-shadow-2xl" />
                {gameState === 'atlas' && <div className="mt-4 p-3 bg-[#001219] rounded-xl border-2 border-[#ffb703] text-xl font-black text-[#ffb703] uppercase w-full text-center">{getLabel(target)}</div>}
              </div>

              <div className="bg-[#023047] rounded-[40px] p-8 border-4 border-[#219ebc] flex flex-col items-center justify-center min-h-[420px] shadow-2xl relative overflow-hidden">
                <span className="absolute top-6 left-8 bg-[#219ebc] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Localização Regional</span>
                <canvas ref={canvasContexto} width="400" height="400" className="w-full h-auto max-w-[350px] rounded-3xl border-4 border-[#001219]" />
                <div className="absolute bottom-6 right-8 flex items-center gap-2 bg-[#001219]/60 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">Alvo em Destaque</span>
                </div>
              </div>
            </div>

            {gameState === 'playing' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-2">
                {opcoes.map((opt, i) => (
                  <button key={i} disabled={!!feedback} onClick={() => handleAnswer(opt)} className={`bg-white text-[#023047] p-6 rounded-[30px] font-black uppercase text-lg shadow-[0_6px_0_#ddd] active:translate-y-1 transition-all ${feedback ? 'opacity-50' : 'hover:bg-[#ffb703] hover:shadow-[0_6px_0_#cc9900]'}`}>
                    {getLabel(opt)}
                  </button>
                ))}
              </div>
            )}

            {gameState === 'atlas' && (
              <div className="flex gap-6 items-center mt-4">
                <button onClick={() => setAtlasIndex(i => i > 0 ? i - 1 : gamePool.length - 1)} className="bg-white text-[#023047] p-5 rounded-full shadow-lg hover:bg-[#ffb703] transition-all active:scale-90"><ChevronLeft className="w-8 h-8" /></button>
                <div className="bg-[#023047] px-8 py-4 rounded-3xl border-4 border-[#219ebc] font-black text-xl min-w-[150px] text-center">
                  {atlasIndex + 1} / {gamePool.length}
                </div>
                <button onClick={() => setAtlasIndex(i => i < gamePool.length - 1 ? i + 1 : 0)} className="bg-white text-[#023047] p-5 rounded-full shadow-lg hover:bg-[#ffb703] transition-all active:scale-90"><ChevronRight className="w-8 h-8" /></button>
              </div>
            )}
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="bg-red-900/40 backdrop-blur-md p-12 rounded-[60px] border-8 border-red-600 text-center max-w-md w-full animate-in zoom-in shadow-2xl">
            <XCircle className="w-20 h-20 text-white mx-auto mb-4" />
            <h2 className="text-4xl font-black mb-4 uppercase text-white">Fim de Jogo!</h2>
            <div className="bg-black/20 p-6 rounded-2xl mb-8">
               <p className="text-xs font-bold uppercase text-red-200 tracking-widest">Pontuação Final</p>
               <p className="text-6xl font-black text-white">{score}</p>
            </div>
            <button onClick={() => setGameState('menu')} className="bg-white text-red-600 p-6 rounded-3xl w-full font-black uppercase shadow-lg active:scale-95 transition-all text-xl">Novo Desafio</button>
          </div>
        )}
      </main>

      <footer className="p-8 bg-[#023047] text-center border-t border-[#219ebc]/30 flex flex-col gap-1 text-[11px] font-medium text-white/70 relative z-10">
        <p className="text-[#8ecae6] font-bold uppercase tracking-[4px] opacity-40 mb-2">Apoio Visual • Mapas Geográficos Reais</p>
        <p>Desenvolvido por André Victor Brito de Andrade ®</p>
        <p>Contato: <a href="mailto:andrevictorbritodeandrade@gmail.com" className="underline hover:text-[#ffb703]">andrevictorbritodeandrade@gmail.com</a></p>
        <p>© 2026 Todos os direitos reservados. | Versão 1.6.0</p>
      </footer>

      {feedback && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in">
          <div className={`p-12 rounded-[40px] text-5xl font-black uppercase animate-bounce text-white border-8 shadow-2xl ${feedback === 'correct' ? 'bg-green-500 border-green-300' : 'bg-red-500 border-red-300'}`}>
            {feedback === 'correct' ? <><CheckCircle className="inline w-16 h-16 mr-4" /> ACERTOU!</> : <><XCircle className="inline w-16 h-16 mr-4" /> ERROU!</>}
          </div>
        </div>
      )}
    </div>
  );
}
