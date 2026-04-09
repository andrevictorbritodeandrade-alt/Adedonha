import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Timer, ChevronRight, Shuffle, Clock, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Banco de dados unificado para o sorteador
const TODAS_AS_PALAVRAS = {
  Geografia: ["Brasil", "Rio de Janeiro", "Maricá", "Monte Everest", "Rio Amazonas", "Japão", "Pão de Açúcar", "Antártida"],
  Xadrez: ["Rei", "Rainha", "Bispo", "Cavalo", "Torre", "Peão", "Roque", "Xeque-Mate"],
  Esportes: ["Futebol", "Basquete", "Vôlei", "Natação", "Atletismo", "Handebol", "Judô", "Ciclismo"],
  História: ["Pirâmides", "Império Romano", "Zumbi dos Palmares", "Descobrimento", "Vikings", "Grécia Antiga"],
  Animais: ["Elefante", "Girafa", "Leão", "Tubarão", "Águia", "Pinguim", "Baleia", "Cachorro"]
};

const LISTA_MESTRA = Object.values(TODAS_AS_PALAVRAS).flat();

const QuemSouEu = ({ onBack }: { onBack: () => void }) => {
  const [tela, setTela] = useState('menu'); 
  const [tempoInicial, setTempoInicial] = useState(60);
  const [tempoRestante, setTempoRestante] = useState(60);
  const [palavraAtual, setPalavraAtual] = useState('');
  const [palavrasUsadas, setPalavrasUsadas] = useState<string[]>([]);
  const [pontos, setPontos] = useState(0);
  const [ativo, setAtivo] = useState(false);

  const sortearQualquerPalavra = useCallback(() => {
    const disponiveis = LISTA_MESTRA.filter(p => !palavrasUsadas.includes(p));
    
    if (disponiveis.length === 0) {
      setTela('resultado');
      setAtivo(false);
      return;
    }

    const sorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    setPalavraAtual(sorteada);
    setPalavrasUsadas(prev => [...prev, sorteada]);
  }, [palavrasUsadas]);

  const iniciarJogo = () => {
    setPalavrasUsadas([]);
    setPontos(0);
    setTempoRestante(tempoInicial);
    const sorteada = LISTA_MESTRA[Math.floor(Math.random() * LISTA_MESTRA.length)];
    setPalavraAtual(sorteada);
    setPalavrasUsadas([sorteada]);
    setTela('jogando');
    setAtivo(true);
  };

  useEffect(() => {
    let intervalo: any = null;
    if (ativo && tempoRestante > 0) {
      intervalo = setInterval(() => {
        setTempoRestante(prev => prev - 1);
      }, 1000);
    } else if (tempoRestante === 0) {
      setAtivo(false);
      setTela('resultado');
    }
    return () => clearInterval(intervalo);
  }, [ativo, tempoRestante]);

  const acerto = () => {
    setPontos(prev => prev + 1);
    sortearQualquerPalavra();
  };

  return (
    <div className="w-full h-screen flex flex-col font-sans antialiased select-none overflow-hidden relative bg-slate-50">
      
      {/* Botão Voltar - Antônimo do fundo (Azul/Amarelo para fundo claro) */}
      <button 
        onClick={onBack}
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all border-2 border-blue-800 flex items-center justify-center"
      >
        <ChevronLeft size={24} />
      </button>

      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {tela === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-full p-6 text-center"
            >
              <h1 className="text-6xl md:text-8xl font-black text-blue-700 mb-4 uppercase tracking-tighter drop-shadow-sm">Quem Sou Eu?</h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-10 font-medium">Sorteador automático para sala de aula</p>
              
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border-2 border-slate-200">
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center justify-center gap-2">
                  <Clock className="text-blue-500" /> ESCOLHA O TEMPO DA RODADA:
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-10">
                  {[60, 90, 120].map(t => (
                    <button
                      key={t}
                      onClick={() => setTempoInicial(t)}
                      className={`py-6 rounded-2xl text-3xl font-black transition-all border-4 ${
                        tempoInicial === t 
                        ? 'bg-blue-600 text-white border-blue-800 scale-105 shadow-lg' 
                        : 'bg-slate-100 text-slate-400 border-transparent hover:border-blue-300'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>

                <button 
                  onClick={iniciarJogo}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-3xl md:text-4xl font-black py-8 rounded-2xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-4"
                >
                  <Shuffle size={40} /> SORTEAR E COMEÇAR!
                </button>
              </div>
            </motion.div>
          )}

          {tela === 'jogando' && (
            <motion.div 
              key="jogando"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full bg-slate-950 text-white"
            >
              <div className="flex justify-between items-center p-6 bg-slate-900 shadow-2xl z-10">
                <div className="flex items-center gap-4 bg-slate-800 px-6 py-3 rounded-2xl border border-white/10">
                   <Trophy className="text-yellow-400" size={32} />
                   <span className="text-3xl font-black">{pontos}</span>
                </div>
                <div className={`flex items-center gap-4 px-8 py-3 rounded-3xl border-4 transition-all ${tempoRestante < 15 ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-blue-900 border-blue-700'}`}>
                  <Timer size={40} />
                  <span className="text-5xl font-mono font-bold">{tempoRestante}s</span>
                </div>
                <div className="text-right px-6 py-3 bg-slate-800 rounded-2xl border border-white/10 hidden sm:block">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Modo</p>
                  <p className="text-lg font-bold text-blue-400">Sorteio Livre</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="text-center">
                  <p className="text-blue-500 text-2xl md:text-3xl font-bold uppercase tracking-[0.3em] mb-8">O aluno é um(a):</p>
                  <motion.h2 
                    key={palavraAtual}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[8rem] md:text-[14rem] font-black leading-none tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] text-white"
                  >
                    {palavraAtual}
                  </motion.h2>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border-t border-white/10">
                <button 
                  onClick={acerto}
                  className="w-full bg-green-600 hover:bg-green-500 text-white text-4xl md:text-5xl font-black py-10 rounded-[2.5rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-6"
                >
                  ADIVINHOU! <ChevronRight size={60} />
                </button>
              </div>
            </motion.div>
          )}

          {tela === 'resultado' && (
            <motion.div 
              key="resultado"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-full bg-blue-600 p-6 text-white text-center"
            >
              <div className="bg-white text-slate-900 p-12 md:p-16 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-2xl w-full">
                <Trophy size={100} className="text-yellow-500 mx-auto mb-6" />
                <h2 className="text-4xl md:text-5xl font-black mb-2 uppercase text-blue-700">Fim do Tempo!</h2>
                <p className="text-xl md:text-2xl text-slate-500 mb-8 font-bold">O aluno conseguiu identificar:</p>
                <div className="text-[8rem] md:text-[10rem] font-black text-blue-600 leading-none mb-2">{pontos}</div>
                <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-10">Palavras</p>
                <button 
                  onClick={() => setTela('menu')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-3xl font-black py-8 rounded-2xl shadow-xl transition-all active:scale-95"
                >
                  RECOMEÇAR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Rodapé fixo - Simplificado para o projeto */}
      <footer className={`w-full py-4 px-6 flex flex-col items-center justify-center text-center gap-1 text-[10px] font-bold uppercase tracking-widest ${tela === 'jogando' ? 'text-slate-500 bg-slate-950' : 'text-slate-400 bg-slate-50'}`}>
        <p>Desenvolvido por: André Victor Brito de Andrade</p>
        <p>Contato: andrevictorbritodeandrade@gmail.com</p>
        <p>Versão: 1.0.5</p>
      </footer>
      
    </div>
  );
};

export default QuemSouEu;
