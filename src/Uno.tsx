import React, { useState, useEffect, useRef } from 'react';
import {
  Users, RotateCcw, VolumeX, Volume2, Hand, RefreshCw, AlertTriangle,
  UserPlus, Zap, ShieldAlert, Crown, Sparkles, BrainCircuit, MessageSquareQuote,
  Music, Music2, Palette, CheckCircle2, Play, MousePointer2, ArrowLeft
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const callGemini = async (prompt: string, systemInstruction = "") => {
  try {
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser: ${prompt}` : prompt;
    const result = await (genAI as any).models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });
    return result.candidates[0].content.parts[0].text || "IA processando...";
  } catch (e) { 
    console.error("Gemini Error:", e);
    return "Mestre IA offline."; 
  }
};

export default function Uno({ onBack }: { onBack: () => void }) {
  const [deck, setDeck] = useState<any[]>([]);
  const [discardPile, setDiscardPile] = useState<any[]>([]);
  const [players, setPlayers] = useState([
    { id: 0, name: "JOGADOR 1", hand: [], skipCount: 0 },
    { id: 1, name: "JOGADOR 2", hand: [], skipCount: 0 },
    { id: 2, name: "JOGADOR 3", hand: [], skipCount: 0 },
    { id: 3, name: "JOGADOR 4", hand: [], skipCount: 0 },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [direction, setDirection] = useState(1);
  const [gameState, setGameState] = useState('LOBBY');
  const [pendingEffect, setPendingEffect] = useState<string | null>(null);
  const [drawStack, setDrawStack] = useState(0);
  const [isSilence, setIsSilence] = useState(false);
  const [sevenCount, setSevenCount] = useState(0);
  const [message, setMessage] = useState("");
  const [slapOrder, setSlapOrder] = useState<number[]>([]);
  const [wildColor, setWildColor] = useState<string | null>(null);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [aiCommentary, setAiCommentary] = useState("Arena tradicional pronta!");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const melodyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMusic = () => {
    if (audioCtxRef.current) return;
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23];
    let step = 0;
    melodyIntervalRef.current = setInterval(() => {
      if (!isMusicEnabled || !audioCtxRef.current) return;
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[step % notes.length], audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.2);
      step++;
    }, 300);
  };

  useEffect(() => {
    if (isMusicEnabled) startMusic();
    return () => {
      if (melodyIntervalRef.current) clearInterval(melodyIntervalRef.current);
    };
  }, [isMusicEnabled]);

  const COLORS = ['red', 'blue', 'green', 'yellow'];
  const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'pular', 'inverter', 'mais2'];
  const SPECIALS = ['coringa', 'mais4'];

  const createDeck = () => {
    let newDeck: any[] = [];
    COLORS.forEach(color => {
      VALUES.forEach(val => {
        newDeck.push({ color, value: val, id: Math.random() });
        if (val !== '0') newDeck.push({ color, value: val, id: Math.random() });
      });
    });
    for (let i = 0; i < 4; i++) {
      SPECIALS.forEach(type => newDeck.push({ color: 'wild', value: type, id: Math.random() }));
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const sortHand = (hand: any[]) => {
    return [...hand].sort((a, b) => {
        if (a.value !== b.value) return a.value.localeCompare(b.value);
        return a.color.localeCompare(b.color);
    });
  };

  const startGame = () => {
    const freshDeck = createDeck();
    const newPlayers = players.map(p => ({ ...p, hand: sortHand(freshDeck.splice(0, 7)), skipCount: 0 }));
    let firstCard = freshDeck.splice(0, 1)[0];
    while (firstCard.color === 'wild') {
        freshDeck.push(firstCard);
        freshDeck.sort(() => Math.random() - 0.5);
        firstCard = freshDeck.splice(0, 1)[0];
    }
    setDeck(freshDeck);
    setPlayers(newPlayers);
    setDiscardPile([firstCard]);
    setCurrentPlayer(0);
    setGameState('TRANSITION');
    setAiCommentary("Partida Tradicional Iniciada!");
  };

  const updateAiCommentary = async (evt: string) => {
    const scores = players.map(p => `${p.name}: ${p.hand.length}`).join(", ");
    const msg = await callGemini(`Evento: ${evt}. Placar: ${scores}. Comente em português de forma irônica.`, "Mestre do UNO.");
    setAiCommentary(msg);
  };

  const nextTurn = (skipCount = 1) => {
    let nextIdx = (currentPlayer + (direction * skipCount) + 4) % 4;
    const newPlayers = [...players];
   
    if (newPlayers[nextIdx].skipCount > 0) {
        newPlayers[nextIdx].skipCount -= 1;
        setPlayers(newPlayers);
        showTemporaryMessage(`${newPlayers[nextIdx].name} pulado!`);
        setCurrentPlayer(nextIdx);
        setTimeout(() => nextTurn(1), 1200);
        return;
    }

    setCurrentPlayer(nextIdx);
    setSelectedIndices([]);
    setGameState('TRANSITION');
    setAiSuggestion("");
  };

  const toggleSelection = (index: number) => {
    if (gameState !== 'PLAYING') return;
    if (selectedIndices.includes(index)) {
        setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
        setSelectedIndices([...selectedIndices, index]);
    }
  };

  const playSelectedCards = () => {
    if (selectedIndices.length === 0) return;
    const hand = players[currentPlayer].hand;
    const selectedCards = selectedIndices.map(i => hand[i]);
    const topCard = discardPile[discardPile.length - 1];
   
    const firstValue = selectedCards[0].value;
    const allSameValue = selectedCards.every(c => c.value === firstValue);

    if (!allSameValue) {
        showTemporaryMessage("ERRO: Agrupe cartas de mesmo valor!");
        return;
    }

    if (drawStack > 0) {
        const canStackMais2 = topCard.value === 'mais2' && (firstValue === 'mais2' || firstValue === 'mais4');
        const canStackMais4 = topCard.value === 'mais4' && firstValue === 'mais4';
        if (!canStackMais2 && !canStackMais4) {
            showTemporaryMessage("Você precisa cobrir o castigo!");
            return;
        }
    } else {
        const hasPlayable = selectedCards.some(card => {
            const isSameValue = card.value === topCard.value;
            const isSameColor = card.color === topCard.color || card.color === 'wild' || (topCard.color === 'wild' && card.color === wildColor);
            return isSameColor || isSameValue || card.color === 'wild';
        });
        if (!hasPlayable) {
            showTemporaryMessage("Não combina com a mesa!");
            return;
        }
    }

    const newPlayers = [...players];
    const newHand = hand.filter((_, i) => !selectedIndices.includes(i));
    newPlayers[currentPlayer].hand = sortHand(newHand);
    setPlayers(newPlayers);
    setDiscardPile([...discardPile, ...selectedCards]);
    setWildColor(null);
    setSelectedIndices([]);

    let addedToStack = 0;
    selectedCards.forEach(c => {
        if (c.value === 'mais2') addedToStack += 2;
        if (c.value === 'mais4') addedToStack += 4;
    });
    setDrawStack(prev => prev + addedToStack);
   
    const lastCard = selectedCards[selectedCards.length - 1];
    applyEffect(lastCard, addedToStack > 0);
  };

  const showTemporaryMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const applyEffect = (card: any, isStackingPlay = false) => {
    let skip = 1;
    const isWildCard = ['coringa', 'mais4'].includes(card.value);
   
    switch (card.value) {
      case 'mais2': if (!isStackingPlay) setDrawStack(prev => prev + 2); break;
      case 'mais4': if (!isStackingPlay) setDrawStack(prev => prev + 4); break;
      case 'pular': skip = 2; break;
      case 'inverter': setDirection(d => d * -1); break;
      case '7': setSevenCount(s => s + 1); setIsSilence((sevenCount + 1) % 2 !== 0); break;
      case '0': setGameState('SELECT_PLAYER'); setPendingEffect('SWAP'); return;
      case '9': setGameState('SLAP_MODE'); setSlapOrder([]); return;
    }
   
    if (players[currentPlayer].hand.length === 0) { setGameState('WINNER'); return; }
    if (isWildCard) {
        setGameState('SELECT_COLOR');
    } else {
        nextTurn(skip);
    }
  };

  const handleDraw = () => {
    if (gameState !== 'PLAYING') return;
    const count = drawStack > 0 ? drawStack : 1;
    const newDeck = [...deck];
    if (newDeck.length < count) return;
    const drawn = newDeck.splice(0, count);
    const newPlayers = [...players];
    newPlayers[currentPlayer].hand = sortHand([...newPlayers[currentPlayer].hand, ...drawn]);
    setDeck(newDeck);
    setPlayers(newPlayers);
    setDrawStack(0);
    nextTurn();
  };

  const handlePlayerSelection = (targetId: number) => {
    const newPlayers = [...players];
    if (pendingEffect === 'SWAP') {
        const tempHand = [...newPlayers[currentPlayer].hand];
        newPlayers[currentPlayer].hand = [...newPlayers[targetId].hand];
        newPlayers[targetId].hand = tempHand;
    }
    setPlayers(newPlayers);
    setPendingEffect(null);
    setGameState('SELECT_COLOR');
  };

  const handleSlap = (pid: number) => {
    if (slapOrder.includes(pid)) return;
    const newOrder = [...slapOrder, pid];
    setSlapOrder(newOrder);
    if (newOrder.length === 4) {
      const loser = newOrder[3];
      const newP = [...players];
      newP[loser].hand = sortHand([...newP[loser].hand, deck[0]]);
      setDeck(deck.slice(1));
      setPlayers(newP);
      showTemporaryMessage(`${players[loser].name} bateu por último!`);
      setTimeout(() => nextTurn(), 1500);
    }
  };

  const UnoLogo = ({ size = "text-6xl", smallSize = "text-xl" }) => (
    <div className="flex flex-col items-center select-none drop-shadow-lg">
        <div className={`${size} font-group-a flex items-center`}>
            <span className="text-red-500 -rotate-12 -mr-2 drop-shadow-[0_4px_0_#fff]">U</span>
            <span className="text-yellow-400 rotate-6 -mr-1 drop-shadow-[0_4px_0_#fff]">N</span>
            <span className="text-blue-500 -rotate-6 drop-shadow-[0_4px_0_#fff]">O</span>
        </div>
        <div className={`${smallSize} font-group-b text-white tracking-[0.3em] mt-[-8px] uppercase`}>ARENA</div>
    </div>
  );

  const Card = ({ card, onClick, disabled, large, isSelected, handSize }: any) => {
    const isWild = card.color === 'wild';
    let scale = large ? 1 : handSize > 15 ? 0.45 : handSize > 10 ? 0.6 : 0.75;
    return (
      <div
        onClick={onClick}
        style={{ transform: `scale(${scale})` }}
        className={`
          flex-shrink-0 bg-${isWild ? 'zinc-900' : card.color + '-600'} border-[3px] rounded-xl shadow-lg flex items-center justify-center text-white cursor-pointer transition-all
          ${large ? 'w-40 h-56 border-white' : 'w-24 h-36'}
          ${isSelected ? 'border-yellow-400 ring-4 ring-yellow-400 -translate-y-4 z-50' : 'border-white'}
          ${disabled ? 'opacity-90 grayscale-[0.2]' : ''}
          relative overflow-hidden m-[-25px]
        `}
      >
        <div className="absolute top-1 left-2 font-group-a text-[9px] opacity-40 uppercase">{card.color}</div>
        <div className="absolute top-3 left-2 font-group-a text-[11px]">{card.value.replace('mais', '+')}</div>
        <div className="z-10 px-3 text-center">
            <div className="text-3xl font-group-a text-stroke drop-shadow-md uppercase">
                {card.value.replace('mais2', '+2').replace('mais4', '+4').replace('pular', '🚫').replace('inverter', '🔄').replace('coringa', '?')}
            </div>
        </div>
        {isSelected && <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5"><CheckCircle2 size={16} className="text-black" /></div>}
      </div>
    );
  };

  const Footer = () => (
    <div className="shrink-0 bg-black/40 py-1 px-4 flex flex-col items-center justify-center border-t border-white/5 backdrop-blur-sm z-50">
        <div className="flex gap-4 text-[8px] text-slate-400 font-medium">
            <span>Desenvolvido por André Victor Brito de Andrade ®</span>
            <span>Contato: andrevictorbritodeandrade@gmail.com</span>
        </div>
        <div className="flex gap-4 text-[8px] text-slate-500">
            <span>© 2026 Todos os direitos reservados.</span>
            <span>Versão 1.0.0</span>
        </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-sans overflow-hidden flex flex-col select-none touch-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black relative">
      <button 
        onClick={onBack}
        className="absolute left-4 top-4 text-yellow-400 hover:text-yellow-300 transition-all p-3 bg-yellow-400/10 rounded-full z-50 shadow-lg border border-yellow-400/20 flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft size={32} />
      </button>

      <div className="h-6 bg-purple-900/40 flex items-center px-4 border-b border-white/5 shrink-0 pl-32"><Sparkles size={12} className="text-purple-400 animate-pulse" /><p className="text-[9px] italic text-purple-100 truncate ml-2">{aiCommentary}</p></div>

      <div className="h-20 bg-black/60 flex justify-around items-center border-b border-white/5 shrink-0">
        {players.map((p, idx) => (
          <div key={p.id} className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${currentPlayer === idx ? 'bg-white/10 scale-105 border border-yellow-500/50 shadow-lg' : 'opacity-20'}`}>
            <p className="text-xl font-group-a text-white uppercase tracking-tighter">{p.name}</p>
            <div className="flex items-center gap-2">
                <Hand size={14} className={currentPlayer === idx ? 'text-yellow-400' : 'text-white'} />
                <span className="text-2xl font-group-a">{p.hand.length}</span>
            </div>
          </div>
        ))}
        <button onClick={() => setIsMusicEnabled(!isMusicEnabled)} className="p-2 bg-white/5 rounded-full">{isMusicEnabled ? <Music size={20} className="text-green-500" /> : <Music2 size={20} className="text-red-500" />}</button>
      </div>

      <div className="flex-1 relative flex items-center justify-center gap-10 min-h-0">
        <div onClick={() => gameState === 'PLAYING' && drawStack === 0 && handleDraw()} className={`w-28 h-40 bg-red-900 border-[3px] border-white rounded-xl shadow-2xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform rotate-[-6deg] shrink-0 ${drawStack > 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:rotate-0'}`}>
           <UnoLogo size="text-5xl" smallSize="text-[10px]" />
        </div>

        <div className="relative rotate-[6deg] shrink-0">
          {discardPile.length > 0 && <Card card={discardPile[discardPile.length-1]} large disabled />}
          {wildColor && <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-full border-[4px] border-white bg-${wildColor}-500 shadow-xl animate-pulse z-20`} />}
        </div>

        {message && (
          <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
            <div className="bg-white text-black px-6 py-4 rounded-3xl font-group-a text-xl shadow-2xl border-4 border-yellow-500 animate-in zoom-in duration-300 text-center">{message}</div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex justify-center pb-2">
         {isSilence ? <div className="bg-red-600 px-3 py-0.5 rounded-full text-[9px] font-group-a animate-pulse">🤐 SILÊNCIO</div> : <div className="bg-green-600 px-3 py-0.5 rounded-full text-[9px] font-group-a">🗣️ LIBERADO</div>}
      </div>

      <div className="h-[35%] bg-gradient-to-t from-black to-slate-900 p-2 border-t border-white/5 relative flex flex-col items-center justify-center shrink-0">
        {gameState === 'PLAYING' ? (
          <>
            <div className="no-scrollbar flex justify-center gap-0 overflow-x-auto w-full max-w-full touch-pan-x flex-wrap items-center content-center pb-2">
              {players[currentPlayer].hand.map((c, i) => (
                <Card key={c.id} card={c} onClick={() => toggleSelection(i)} isSelected={selectedIndices.includes(i)} handSize={players[currentPlayer].hand.length} />
              ))}
            </div>
           
            <div className="flex gap-4 items-center mb-1">
                {drawStack > 0 && (
                    <button onClick={handleDraw} className="bg-red-600 text-white px-8 py-2 rounded-xl font-group-a text-lg shadow-lg animate-bounce border-2 border-white">Pagar: Comprar +{drawStack}</button>
                )}
                {selectedIndices.length > 0 && (
                    <button onClick={playSelectedCards} className="bg-green-600 text-white px-8 py-2 rounded-xl font-group-a text-lg shadow-lg active:translate-y-1 border-2 border-white">JOGAR ({selectedIndices.length})</button>
                )}
                {drawStack === 0 && selectedIndices.length === 0 && (
                    <button onClick={handleDraw} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-group-a text-lg border-2 border-white">COMPRAR 1</button>
                )}
                <button onClick={() => setGameState('TRANSITION')} className="text-[10px] bg-white/5 px-4 py-2 rounded-full font-group-a uppercase text-slate-400">Esconder</button>
                <button onClick={() => { setIsAiLoading(true); callGemini(`Dica rápida em português.`, "Estrategista.").then(res => { setAiSuggestion(res); setIsAiLoading(false); }); }} className="bg-purple-600 px-4 py-2 rounded-full text-[10px] font-group-a flex items-center gap-2">{isAiLoading ? <RefreshCw size={12} className="animate-spin" /> : <BrainCircuit size={14}/>} IA</button>
                {aiSuggestion && <p className="text-[9px] text-yellow-400 font-group-b max-w-[100px] truncate">✨ {aiSuggestion}</p>}
            </div>
          </>
        ) : gameState === 'TRANSITION' ? (
          <div className="flex flex-col items-center gap-4">
             <h2 className="text-4xl font-group-a text-white uppercase tracking-tighter">{players[currentPlayer].name}</h2>
             <button onClick={() => setGameState('PLAYING')} className="bg-yellow-500 text-black px-12 py-3 rounded-2xl font-group-a text-2xl shadow-[0_6px_0_#ca8a04] active:translate-y-2 active:shadow-none border-2 border-white">MOSTRAR</button>
          </div>
        ) : gameState === 'SELECT_PLAYER' ? (
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-group-a uppercase text-yellow-400 animate-pulse">Trocar de mão com:</h2>
                <div className="flex gap-3">
                    {players.filter(p => p.id !== currentPlayer).map(p => (
                        <button key={p.id} onClick={() => handlePlayerSelection(p.id)} className="bg-slate-800 border border-white px-6 py-3 rounded-xl font-group-a text-base uppercase">
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>
        ) : gameState === 'SELECT_COLOR' ? (
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-xl font-group-a uppercase text-white">Nova cor:</h2>
              <div className="flex gap-4">
                {COLORS.map(c => <div key={c} onClick={() => { setWildColor(c); nextTurn(); }} className={`w-12 h-12 bg-${c === 'red' ? 'red' : c === 'blue' ? 'blue' : c === 'green' ? 'green' : 'yellow'}-600 rounded-xl border-2 border-white cursor-pointer active:scale-90`} />)}
              </div>
            </div>
        ) : null}
      </div>

      <Footer />

      {/* OVERLAYS ESPECIAIS */}
      {gameState === 'SLAP_MODE' && (
        <div className="fixed inset-0 bg-red-600/90 z-[400] flex flex-col items-center justify-center gap-12 backdrop-blur-xl">
          <h2 className="text-8xl font-group-a text-white animate-pulse">BATA!</h2>
          <div className="grid grid-cols-2 gap-4 w-full max-w-4xl px-8">
            {players.map(p => (<button key={p.id} disabled={slapOrder.includes(p.id)} onClick={() => handleSlap(p.id)} className={`py-12 rounded-[3rem] font-group-a text-4xl shadow-2xl transition-all ${slapOrder.includes(p.id) ? 'bg-black/60 text-white/20' : 'bg-white text-red-600 border-8 border-red-800 active:scale-90 scale-100 hover:scale-105'}`}>{slapOrder.includes(p.id) ? 'OK' : 'BATER!'}<p className="text-[10px] mt-2 uppercase font-bold">{p.name}</p></button>))}
          </div>
        </div>
      )}

      {gameState === 'LOBBY' && (
        <div className="fixed inset-0 bg-slate-950 z-[500] flex flex-col items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          <button onClick={onBack} className="absolute left-4 top-4 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-50 shadow-lg border border-white/10 flex items-center justify-center" aria-label="Voltar">
            <ArrowLeft size={32} />
          </button>
          <div className="relative mb-12"><UnoLogo size="text-[10rem]" smallSize="text-3xl" /></div>
          <button onClick={startGame} className="bg-yellow-500 text-black px-24 py-6 rounded-full font-group-a text-6xl shadow-[0_10px_0_#ca8a04] active:translate-y-3 active:shadow-none border-4 border-white">START</button>
        </div>
      )}

      {gameState === 'WINNER' && (
        <div className="fixed inset-0 bg-yellow-500 z-[600] flex flex-col items-center justify-center text-black p-8 text-center animate-in fade-in">
          <Crown size={150} className="mb-6 animate-bounce" /><h1 className="text-8xl font-group-a uppercase leading-none">VITÓRIA!</h1><h2 className="text-4xl font-group-a uppercase mt-4">{players[currentPlayer].name}</h2><button onClick={() => window.location.reload()} className="mt-12 bg-black text-white px-20 py-5 rounded-full font-group-a text-3xl active:scale-95 border-4 border-white">REINICIAR</button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .text-stroke { -webkit-text-stroke: 2px rgba(0,0,0,0.5); }
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .bg-red-600 { background-color: #dc2626; } .bg-blue-600 { background-color: #2563eb; } .bg-green-600 { background-color: #16a34a; } .bg-yellow-600 { background-color: #ca8a04; } .bg-red-500 { background-color: #ef4444; } .bg-blue-500 { background-color: #3b82f6; } .bg-green-500 { background-color: #22c55e; } .bg-yellow-500 { background-color: #eab308; } .bg-red-800 { background-color: #991b1b; } .bg-red-900 { background-color: #7f1d1d; }
        * { -webkit-tap-highlight-color: transparent; }
        body { touch-action: none; overflow: hidden; height: 100vh; position: fixed; width: 100%; }
      `}} />
    </div>
  );
}
