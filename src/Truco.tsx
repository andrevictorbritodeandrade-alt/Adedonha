import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, RefreshCw, Eye, EyeOff, AlertCircle, Play, Lock, ShieldAlert, XCircle, CheckCircle, ArrowUpCircle, Layers, Info, ArrowRight, ChevronRight, ArrowLeft } from 'lucide-react';

const SUITS = [
  { name: 'Paus', symbol: '♣', color: 'text-slate-950', order: 4, label: 'Zap' },
  { name: 'Copas', symbol: '♥', color: 'text-red-600', order: 3, label: 'Copeta' },
  { name: 'Espadas', symbol: '♠', color: 'text-slate-800', order: 2, label: 'Espadilha' },
  { name: 'Ouros', symbol: '♦', color: 'text-red-500', order: 1, label: 'Mole' },
];

const CARD_VALUES = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const VALUE_STRENGTH: Record<string, number> = { '4': 1, '5': 2, '6': 3, '7': 4, 'Q': 5, 'J': 6, 'K': 7, 'A': 8, '2': 9, '3': 10 };

export default function Truco({ onBack }: { onBack: () => void }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerNames, setPlayerNames] = useState(['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4']);
  const [scores, setScores] = useState({ team1: 0, team2: 0 });
  const [isDealing, setIsDealing] = useState(false);
  const [flyingCard, setFlyingCard] = useState<any>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [teacherMode, setTeacherMode] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [hands, setHands] = useState<any[]>([[], [], [], []]);
  const [vira, setVira] = useState<any>(null);
  const [manilhaValue, setManilhaValue] = useState<string | null>(null);
  const [turn, setTurn] = useState(0);
  const [table, setTable] = useState<any[]>([]);
  const [vazas, setVazas] = useState<number[]>([]);
  const [roundPoints, setRoundPoints] = useState(1);
  const [message, setMessage] = useState('Bem-vindo ao TRUCO!');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState<string | null>(null);
  const [trucoState, setTrucoState] = useState({
    isPending: false,
    proposer: null as number | null,
    challengedTeam: null as number | null,
    valueProposed: 1
  });

  const createDeck = () => {
    let newDeck: any[] = [];
    CARD_VALUES.forEach(val => {
      SUITS.forEach(suit => {
        newDeck.push({ value: val, suit: suit });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const getManilha = (viraCard: any) => {
    const viraIdx = CARD_VALUES.indexOf(viraCard.value);
    const manilhaIdx = (viraIdx + 1) % CARD_VALUES.length;
    return CARD_VALUES[manilhaIdx];
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startNewHand = useCallback(async (starter = 0) => {
    setIsDealing(true);
    setFlyingCard(null);
    setVira(null);
    setManilhaValue(null);
    setHands([[], [], [], []]);
    setTable([]);
    setVazas([]);
    setRoundPoints(1);
    setIsRevealed(false);
    setTrucoState({ isPending: false, proposer: null, challengedTeam: null, valueProposed: 1 });
    setMessage("Embaralhando cartas...");

    await sleep(600);
    const fullDeck = createDeck();
   
    for (let round = 0; round < 3; round++) {
        for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
            const card = fullDeck.pop();
            setFlyingCard({ to: playerIdx });
            await sleep(150);
            setHands(prev => {
                const newHands = [...prev];
                newHands[playerIdx] = [...newHands[playerIdx], card];
                return newHands;
            });
            setFlyingCard(null);
        }
    }

    setFlyingCard({ to: 'center' });
    await sleep(400);
    const newVira = fullDeck.pop();
    const mValue = getManilha(newVira);
    setVira(newVira);
    setManilhaValue(mValue);
    setFlyingCard(null);
    setIsDealing(false);
    setTurn(starter);
    setMessage(`Vira: ${newVira.value}. Manilha: ${mValue}.`);
  }, [playerNames]);

  const getCardStrength = (card: any) => {
    if (!manilhaValue) return 0;
    if (card.value === manilhaValue) {
      return 1000 + card.suit.order;
    }
    return (VALUE_STRENGTH[card.value] * 10) + card.suit.order;
  };

  const playCard = (playerIdx: number, cardIdx: number) => {
    if (isDealing || playerIdx !== turn || isGameOver || !isRevealed || trucoState.isPending) return;
    const card = hands[playerIdx][cardIdx];
    const newHands = [...hands];
    newHands[playerIdx] = newHands[playerIdx].filter((_, i) => i !== cardIdx);
    const newTable = [...table, { player: playerIdx, card }];
    setHands(newHands);
    setTable(newTable);
    setIsRevealed(false);
    if (newTable.length === 4) setTimeout(() => resolveVaza(newTable), 700);
    else {
      const nextPlayer = (playerIdx + 1) % 4;
      setTurn(nextPlayer);
      setMessage(`Vez de ${playerNames[nextPlayer]}.`);
    }
  };

  const resolveVaza = (playedCards: any[]) => {
    let bestPlay = playedCards[0];
    for (let i = 1; i < playedCards.length; i++) {
      const cur = getCardStrength(playedCards[i].card);
      const best = getCardStrength(bestPlay.card);
      if (cur > best) { bestPlay = playedCards[i]; }
    }
    const winnerTeamId = (bestPlay.player === 0 || bestPlay.player === 2 ? 1 : 2);
    const newVazas = [...vazas, winnerTeamId];
    setVazas(newVazas);
    setTable([]);
    checkHandWinner(newVazas, bestPlay.player);
  };

  const finalizeHand = (winTeam: number, pts: number) => {
    const nS = { ...scores };
    if (winTeam === 1) nS.team1 += pts; else nS.team2 += pts;
    setScores(nS);
    if (nS.team1 >= 12 || nS.team2 >= 12) { setWinnerTeam(nS.team1 >= 12 ? 'Dupla 1' : 'Dupla 2'); setIsGameOver(true); }
    else setTimeout(() => startNewHand((turn + 1) % 4), 1200);
  };

  const checkHandWinner = (curVazas: number[], nT: number) => {
    const t1 = curVazas.filter(v => v === 1).length;
    const t2 = curVazas.filter(v => v === 2).length;
    let hW = null;
    if (t1 === 2) hW = 1; else if (t2 === 2) hW = 2;
    else if (curVazas.length === 3) hW = t1 > t2 ? 1 : 2;
    if (hW) finalizeHand(hW, roundPoints); else { setTurn(nT); setMessage(`Vez de ${playerNames[nT]}.`); }
  };

  const handleTrucoRequest = () => {
    const nV = roundPoints === 1 ? 3 : roundPoints + 3;
    if (nV > 12) return;
    const pT = (turn === 0 || turn === 2) ? 1 : 2;
    setTrucoState({ isPending: true, proposer: turn, challengedTeam: pT === 1 ? 2 : 1, valueProposed: nV });
    setIsRevealed(false);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white font-sans relative">
        <button onClick={onBack} className="absolute left-4 top-4 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-50 shadow-lg border border-white/10 flex items-center justify-center" aria-label="Voltar">
          <ArrowLeft size={32} />
        </button>
        <div className="bg-slate-800 p-10 rounded-[50px] shadow-2xl w-full max-w-2xl border-4 border-yellow-500">
          <div className="text-center mb-10">
            <h1 className="text-7xl font-group-a text-yellow-500 mb-4 tracking-tighter">TRUCO</h1>
            <p className="text-slate-400 text-xl font-group-b uppercase tracking-widest text-center">Escola Interativa</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-700/50 p-6 rounded-3xl border-b-8 border-blue-600">
                <p className="text-blue-400 font-group-b mb-4 uppercase text-center tracking-widest text-sm">Dupla Azul</p>
                <input className="w-full bg-slate-800 p-4 rounded-2xl mb-3 text-center text-xl font-group-b border border-white/10" value={playerNames[0]} onChange={e => {const n=[...playerNames]; n[0]=e.target.value; setPlayerNames(n);}} />
                <input className="w-full bg-slate-800 p-4 rounded-2xl text-center text-xl font-group-b border border-white/10" value={playerNames[2]} onChange={e => {const n=[...playerNames]; n[2]=e.target.value; setPlayerNames(n);}} />
            </div>
            <div className="bg-slate-700/50 p-6 rounded-3xl border-b-8 border-red-600">
                <p className="text-red-400 font-group-b mb-4 uppercase text-center tracking-widest text-sm">Dupla Vermelha</p>
                <input className="w-full bg-slate-800 p-4 rounded-2xl mb-3 text-center text-xl font-group-b border border-white/10" value={playerNames[1]} onChange={e => {const n=[...playerNames]; n[1]=e.target.value; setPlayerNames(n);}} />
                <input className="w-full bg-slate-800 p-4 rounded-2xl text-center text-xl font-group-b border border-white/10" value={playerNames[3]} onChange={e => {const n=[...playerNames]; n[3]=e.target.value; setPlayerNames(n);}} />
            </div>
          </div>
          <button onClick={() => {setGameStarted(true); startNewHand();}} className="w-full bg-yellow-500 text-slate-950 font-group-a py-6 rounded-3xl text-4xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl uppercase">INICIAR TRUCO</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-emerald-950 text-white flex flex-col select-none overflow-hidden relative font-sans">
      <button 
        onClick={onBack}
        className="absolute left-4 top-4 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-50 shadow-lg border border-white/10 flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft size={32} />
      </button>
     
      {/* BARRA DE HIERARQUIA ATUALIZADA */}
      <div className={`transition-all duration-500 overflow-hidden shrink-0 ${showRules ? 'h-28 opacity-100 p-2 pl-32' : 'h-0 opacity-0'}`}>
        <div className="bg-black/60 border border-white/20 rounded-[25px] h-full flex items-center justify-between shadow-2xl backdrop-blur-xl px-4">
            <div className="flex-[1.5] border-r border-white/10 px-2 h-full flex flex-col justify-center">
                <p className="text-[10px] font-group-b uppercase text-yellow-500 mb-1 tracking-[0.1em] flex items-center gap-2">
                    <Info size={12} /> VALOR DAS CARTAS
                </p>
                <div className="flex items-center gap-2 text-lg font-group-a">
                    {CARD_VALUES.map((v, i) => (
                        <div key={v} className="flex items-center gap-1">
                            <span className={v === '3' ? 'text-yellow-400 scale-110' : 'text-white/60'}>{v}</span>
                            {i < CARD_VALUES.length - 1 && <span className="text-white/20 text-[10px]">➔</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 px-4 border-r border-white/10 h-full flex flex-col justify-center">
                <p className="text-[10px] font-group-b uppercase text-yellow-500 mb-1 tracking-[0.1em] text-center">FORÇA DOS NAIPES</p>
                <div className="flex justify-center gap-3">
                    {SUITS.slice().sort((a,b) => b.order - a.order).map((s, idx) => (
                        <div key={s.name} className="flex flex-col items-center gap-0.5 group relative">
                            <div className="bg-white rounded-xl p-1 w-9 h-9 flex items-center justify-center shadow-lg border-2 border-white">
                                <span className={`text-2xl ${s.color} font-black`}>{s.symbol}</span>
                            </div>
                            <span className="text-[8px] font-group-b text-white/90 uppercase tracking-tighter bg-black/50 px-1.5 rounded-full mt-0.5">
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 px-4 flex flex-col items-center justify-center">
                <p className="text-[10px] font-group-b uppercase text-yellow-500 mb-1 tracking-[0.1em]">MANILHA</p>
                <div className="flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs text-white/50 font-group-b italic">Vira</span>
                    <ArrowRight size={16} className="text-yellow-500" />
                    <span className="text-sm font-group-a text-white uppercase bg-yellow-500/20 px-2 rounded-lg">Vira+1</span>
                </div>
            </div>
        </div>
      </div>

      {/* PLACAR E HUD */}
      <div className="flex justify-between items-center bg-black/50 p-2 mx-2 rounded-[20px] border border-white/10 shadow-2xl relative z-30 shrink-0 mt-2">
        <div className="flex gap-2">
          <div className="bg-blue-600 px-4 py-1.5 rounded-xl text-center border-b-4 border-blue-800 shadow-lg min-w-[80px]">
            <p className="text-[8px] font-group-b opacity-60 uppercase tracking-tighter">Equipa A</p>
            <p className="text-xl font-group-a">{scores.team1}</p>
          </div>
          <div className="bg-red-600 px-4 py-1.5 rounded-xl text-center border-b-4 border-red-800 shadow-lg min-w-[80px]">
            <p className="text-[8px] font-group-b opacity-60 uppercase tracking-tighter">Equipa B</p>
            <p className="text-xl font-group-a">{scores.team2}</p>
          </div>
        </div>

        <div className="flex-1 px-2 text-center">
          <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-inner">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
            <span className="font-group-a text-lg tracking-[0.2em] uppercase drop-shadow-md">TRUCO</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(!showRules)} className={`p-2 rounded-xl transition-all shadow-lg border-2 ${showRules ? 'bg-yellow-500 border-yellow-600 text-black' : 'bg-slate-700 border-slate-600 text-white'}`}>
            <Info size={20} />
          </button>
          <div className="bg-amber-500 text-slate-950 px-4 py-1.5 rounded-xl font-group-a text-lg shadow-lg border-b-4 border-amber-700 min-w-[100px] text-center">VALE: {roundPoints}</div>
          <button onClick={() => setTeacherMode(!teacherMode)} className={`p-2 rounded-xl transition-all shadow-lg border-2 ${teacherMode ? 'bg-purple-600 border-purple-400' : 'bg-slate-700 border-slate-600'}`}>
            {teacherMode ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </div>

      {/* MESA CENTRAL */}
      <div className="flex-1 relative mx-2 my-1 bg-emerald-900/10 rounded-[50px] border-[10px] border-amber-900/10 shadow-inner flex items-center justify-center min-h-0">
        <div className="absolute z-10">
            <div className="relative w-20 h-32 flex items-center justify-center">
                <div className="absolute top-0 left-0"><CardComponent card={{}} hidden={true} size="md" /></div>
                {flyingCard && (
                    <div className="absolute z-50 transition-all duration-300 ease-in-out"
                        style={{
                            top: flyingCard.to === 2 ? '-200px' : flyingCard.to === 0 ? '200px' : '0',
                            left: flyingCard.to === 3 ? '-300px' : flyingCard.to === 1 ? '300px' : '0',
                            transform: `scale(${flyingCard.to === 'center' ? 1.2 : 0.8}) rotate(${Math.random() * 360}deg)`
                        }}>
                        <CardComponent card={{}} hidden={true} size="md" />
                    </div>
                )}
            </div>
        </div>

        {vira && (
            <div className="absolute left-6 flex flex-col items-center gap-1 animate-in zoom-in duration-500">
                <p className="text-[9px] font-group-b uppercase text-yellow-500/50 tracking-tighter italic">Vira</p>
                <CardComponent card={vira} size="md" />
                <div className="bg-yellow-500 text-slate-950 px-4 py-1 rounded-full font-group-a text-xl shadow-lg border-2 border-slate-900 -rotate-3">
                    {manilhaValue}
                </div>
            </div>
        )}

        <div className="relative w-64 h-64 flex items-center justify-center">
            {table.map((play, idx) => (
                <div key={idx} className="absolute transition-all duration-500 animate-in slide-in-from-bottom" style={{
                    top: play.player === 2 ? '0' : play.player === 0 ? '120px' : '60px',
                    left: play.player === 3 ? '0' : play.player === 1 ? '120px' : '60px',
                    rotate: `${(play.player * 90) + (idx * 10)}deg`
                }}>
                    <CardComponent card={play.card} size="md" />
                </div>
            ))}
        </div>

        <div className="absolute bottom-6 right-8 bg-black/40 p-3 rounded-2xl border border-white/5 shadow-2xl text-center">
            <p className="text-[8px] font-group-b opacity-40 uppercase mb-2 tracking-widest leading-none">Vazas</p>
            <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 shadow-inner transition-all duration-700 flex items-center justify-center font-group-a text-xs ${vazas[i] === 1 ? 'bg-blue-600 border-blue-400 text-white' : vazas[i] === 2 ? 'bg-red-600 border-red-400 text-white' : 'bg-white/5 border-white/10 opacity-20 text-transparent'}`}>
                        {vazas[i] ? vazas[i] : ''}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* ÁREA DOS JOGADORES */}
      <div className="shrink-0 grid grid-cols-4 gap-2 h-44 relative z-20 px-4 mb-1">
        {playerNames.map((name, pIdx) => (
            <div key={pIdx} className={`relative flex flex-col items-center p-2 rounded-[25px] border-2 transition-all duration-500 ${
                turn === pIdx && !isDealing ? 'bg-white/10 border-yellow-500 scale-105 shadow-xl' : 'bg-black/40 border-transparent opacity-40'
            }`}>
                <div className="flex items-center gap-2 mb-2 bg-black/50 px-3 py-0.5 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${pIdx === 0 || pIdx === 2 ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <span className="font-group-b text-[10px] uppercase truncate max-w-[80px]">{name}</span>
                </div>

                <div className="flex -space-x-8 h-24 items-center">
                    {hands[pIdx].map((card, cIdx) => (
                        <div key={cIdx} onClick={() => playCard(pIdx, cIdx)} className={`relative transition-all duration-300 ${turn === pIdx && isRevealed && !isDealing && !trucoState.isPending ? 'hover:-translate-y-4 cursor-pointer hover:z-50' : ''}`}>
                            <CardComponent card={card} hidden={!teacherMode && (pIdx !== turn || !isRevealed || isDealing)} size="sm" />
                        </div>
                    ))}
                </div>

                {turn === pIdx && !isRevealed && !trucoState.isPending && !isDealing && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/95 rounded-[22px] backdrop-blur-sm p-2 text-center border-2 border-white/5">
                        <Lock className="text-yellow-500 mb-1" size={18} />
                        <button onClick={() => setIsRevealed(true)} className="bg-yellow-500 text-slate-950 px-4 py-1 rounded-lg font-group-a text-[10px] hover:bg-yellow-400 transition-all uppercase tracking-tighter">Revelar</button>
                    </div>
                )}

                {turn === pIdx && isRevealed && !trucoState.isPending && !isDealing && roundPoints < 12 && (
                    <button onClick={handleTrucoRequest} className="absolute -top-4 bg-orange-600 text-white px-5 py-1.5 rounded-full font-group-a text-[10px] shadow-xl hover:bg-orange-500 transition-all border-b-2 border-orange-800 active:translate-y-0.5 uppercase tracking-tighter">TRUCO!</button>
                )}
            </div>
        ))}
      </div>

      {/* RODAPÉ COM CRÉDITOS - CENTRALIZADO E OTIMIZADO */}
      <footer className="shrink-0 py-2 text-center text-white/30 text-[9px] font-medium border-t border-white/5 bg-black/20">
        <div className="flex flex-col items-center justify-center gap-0.5">
            <p className="flex items-center gap-2">
                <span>Desenvolvido por André Victor Brito de Andrade ®</span>
                <span className="opacity-50 text-[7px]">•</span>
                <span className="font-bold text-white/40">Contato: andrevictorbritodeandrade@gmail.com</span>
            </p>
            <div className="flex items-center gap-3 opacity-60 text-[8px]">
                <span>© 2026 Todos os direitos reservados.</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span className="italic">Versão 1.0.0</span>
            </div>
        </div>
      </footer>

      {/* MODAL DE DESAFIO (TRUCO) */}
      {trucoState.isPending && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-800 border-8 border-orange-500 p-8 rounded-[40px] shadow-[0_0_100px_rgba(249,115,22,0.5)] max-w-xl w-full text-center">
                  <ShieldAlert size={60} className="text-orange-500 mx-auto mb-4 animate-bounce" />
                  <h1 className="text-6xl font-group-a text-white mb-4 tracking-tighter uppercase drop-shadow-lg">
                      {trucoState.valueProposed === 3 ? 'TRUCO!' :
                       trucoState.valueProposed === 6 ? 'SEIS!' :
                       trucoState.valueProposed === 9 ? 'NOVE!' : 'DOZE!'}
                  </h1>
                  <p className="text-slate-300 text-xl mb-8 font-group-b uppercase tracking-widest leading-snug">
                      Equipa <span className={trucoState.challengedTeam === 1 ? 'text-blue-500 underline underline-offset-4' : 'text-red-500 underline underline-offset-4'}>{trucoState.challengedTeam === 1 ? 'Azul' : 'Vermelha'}</span>: Aceitam?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
                      <button onClick={() => { setRoundPoints(trucoState.valueProposed); setTrucoState({ ...trucoState, isPending: false }); setMessage("Desafio aceito!"); }} className="bg-green-600 hover:bg-green-500 text-white py-6 rounded-[25px] font-group-a text-3xl shadow-xl transition-all border-b-8 border-green-800 uppercase">Aceito</button>
                      <button onClick={() => finalizeHand(trucoState.challengedTeam === 1 ? 2 : 1, roundPoints)} className="bg-red-600 hover:bg-red-500 text-white py-6 rounded-[25px] font-group-a text-3xl shadow-xl transition-all border-b-8 border-red-800 uppercase text-sm">Corro</button>
                      {trucoState.valueProposed < 12 && (
                          <button onClick={() => setTrucoState({ ...trucoState, challengedTeam: trucoState.challengedTeam === 1 ? 2 : 1, valueProposed: trucoState.valueProposed + 3 })} className="bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[25px] font-group-a text-3xl shadow-xl transition-all border-b-8 border-blue-800 uppercase italic text-sm">Subo</button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE VITÓRIA FINAL */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-[15px] z-[200] flex items-center justify-center p-4 text-center font-black">
            <div className="bg-slate-800 p-10 rounded-[50px] border-[10px] border-yellow-500 shadow-2xl max-w-lg w-full">
                <Trophy size={100} className="text-yellow-500 mx-auto mb-6 animate-bounce" />
                <h1 className="text-7xl text-white mb-2 font-group-a tracking-tighter uppercase">{winnerTeam}</h1>
                <p className="text-xl uppercase text-yellow-500 font-group-b tracking-[0.3em] mb-10">Vencedores do TRUCO</p>
                <button onClick={() => window.location.reload()} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-group-a py-6 rounded-[35px] text-3xl flex items-center justify-center gap-4 transition-all shadow-xl uppercase tracking-tighter">Novo Jogo</button>
            </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTE DE CARTA REDIMENSIONÁVEL
const CardComponent = ({ card, size = 'md', hidden = false }: any) => {
  const sizeClasses: any = {
      sm: 'w-14 h-22 text-lg',
      md: 'w-20 h-30 text-2xl',
      lg: 'w-24 h-36 text-3xl'
  };
  if (hidden || !card.value) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-100 rounded-[14px] shadow-lg border-[3px] border-white flex flex-col items-center justify-center shrink-0`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 rounded-[11px] flex items-center justify-center border-2 border-blue-600/50 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
            <div className={`text-blue-200/20 font-group-a select-none ${size === 'sm' ? 'text-lg' : 'text-3xl'} transform -rotate-45`}>ARENA</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${sizeClasses[size]} bg-white rounded-[14px] shadow-xl border-[2px] border-slate-200 flex flex-col justify-between p-2 shrink-0 relative transition-transform ring-1 ring-black/5`}>
      <div className={`flex justify-between items-start ${card.suit.color}`}>
        <span className="font-black leading-none tracking-tighter">{card.value}</span>
        <span className="text-[10px] font-bold">{card.suit.symbol}</span>
      </div>
      <div className={`flex justify-center items-center ${card.suit.color} transform scale-110`}>
        <span className={size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-4xl' : 'text-2xl'}>{card.suit.symbol}</span>
      </div>
      <div className={`flex justify-between items-end ${card.suit.color} rotate-180`}>
        <span className="font-black leading-none tracking-tighter">{card.value}</span>
        <span className="text-[10px] font-bold">{card.suit.symbol}</span>
      </div>
      {card.suit.label && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-black font-black px-2 py-0.5 rounded-full border-2 border-black uppercase shadow-xl z-20 whitespace-nowrap rotate-[-5deg] ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'}`}>
            {card.suit.label}
        </div>
      )}
    </div>
  );
};
