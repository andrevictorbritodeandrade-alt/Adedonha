import React, { useState, useEffect, useRef } from 'react';
import { Coins, Heart, Trophy, Play, RotateCcw, FastForward, Map, Target, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- CONFIGURAÇÕES DE 20 FASES (BIOMAS DO BRASIL) ---
const LEVELS = [
  { name: "Cerrado (Maricá)", sky: ["#0284c7", "#7dd3fc"], ground: "#166534", speed: 8, distance: 3000 },
  { name: "Pantanal", sky: ["#075985", "#38bdf8"], ground: "#15803d", speed: 8.5, distance: 3200 },
  { name: "Pampa Gaúcho", sky: ["#0ea5e9", "#7dd3fc"], ground: "#4ade80", speed: 9, distance: 3400 },
  { name: "Praia de Itaipuaçu", sky: ["#0284c7", "#bae6fd"], ground: "#fde047", speed: 9.5, distance: 3600 },
  { name: "Cachoeiras de Lumiar", sky: ["#0369a1", "#7dd3fc"], ground: "#065f46", speed: 10, distance: 3800 },
  { name: "Floresta Amazônica", sky: ["#064e3b", "#10b981"], ground: "#14532d", speed: 10.5, distance: 4000 },
  { name: "Semi Árido", sky: ["#ea580c", "#fdba74"], ground: "#a16207", speed: 11, distance: 4200 },
  { name: "Caatinga", sky: ["#c2410c", "#fed7aa"], ground: "#78350f", speed: 11.5, distance: 4400 },
  { name: "Avenida Paulista", sky: ["#1e293b", "#64748b"], ground: "#334155", speed: 12, distance: 4600 },
  { name: "Praia de Copacabana", sky: ["#0369a1", "#bae6fd"], ground: "#fef08a", speed: 12.5, distance: 4800 },
  { name: "Salvador (Pelourinho)", sky: ["#f97316", "#fdba74"], ground: "#fbbf24", speed: 13, distance: 5000 },
  { name: "Serra de Urupema", sky: ["#475569", "#cbd5e1"], ground: "#ffffff", speed: 13.5, distance: 5200 },
  { name: "São Joaquim (Gelo)", sky: ["#334155", "#f1f5f9"], ground: "#e2e8f0", speed: 14, distance: 5400 },
  { name: "Lençóis Maranhenses", sky: ["#0284c7", "#e0f2fe"], ground: "#ffffff", speed: 14.5, distance: 5600 },
  { name: "Ouro Preto", sky: ["#7c2d12", "#fb923c"], ground: "#451a03", speed: 15, distance: 5800 },
  { name: "Cataratas do Iguaçu", sky: ["#075985", "#7dd3fc"], ground: "#166534", speed: 15.5, distance: 6000 },
  { name: "Eixo Monumental (DF)", sky: ["#0ea5e9", "#bae6fd"], ground: "#94a3b8", speed: 16, distance: 6500 },
  { name: "Jalapão", sky: ["#d97706", "#fef3c7"], ground: "#b45309", speed: 16.5, distance: 7000 },
  { name: "Fernando de Noronha", sky: ["#0369a1", "#2dd4bf"], ground: "#5eead4", speed: 17, distance: 7500 },
  { name: "Maricá: O Final", sky: ["#1e1b4b", "#4338ca"], ground: "#1e293b", speed: 19, distance: 10000 },
];

const GRAVITY = 0.75;
const JUMP_FORCE = -17;

const Tatuzin = ({ onBack }: { onBack: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState('START'); 
  const [mumbucas, setMumbucas] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [levelIdx, setLevelIdx] = useState(0);
  const [continueCountdown, setContinueCountdown] = useState(10);
  
  const gameRef = useRef({
    player: { y: 0, vy: 0, w: 85, h: 75, grounded: false, animFrame: 0, invul: 0 },
    platforms: [] as { x: number, y: number, w: number }[],
    objects: [] as { x: number, y: number, type: string, collected?: boolean }[],
    particles: [] as { x: number, y: number, vx: number, vy: number, life: number, size: number, color: string }[], // Metal Slug explosions
    boss: { active: false, x: 0, y: 0, hp: 5, state: 'HIDDEN' },
    distance: 0,
    nextPlatformX: 0,
    mumbucaCount: 0,
    lifeCount: 3,
  });

  const startGame = (idx = 0, resetLives = true) => {
    const level = LEVELS[idx];
    const startY = window.innerHeight * 0.8 - 75;
    gameRef.current = {
      player: { y: startY, vy: 0, w: 85, h: 75, grounded: true, animFrame: 0, invul: 0 },
      platforms: [{ x: 0, y: window.innerHeight * 0.8, w: window.innerWidth + 800 }],
      objects: [],
      particles: [],
      boss: { active: false, x: 0, y: window.innerHeight * 0.4, hp: 5 + idx, state: 'HIDDEN' },
      distance: 0,
      nextPlatformX: window.innerWidth + 800,
      mumbucaCount: resetLives ? 0 : gameRef.current.mumbucaCount,
      lifeCount: resetLives ? 3 : vidas,
    };
    if (resetLives) {
      setMumbucas(0);
      setVidas(3);
    }
    setLevelIdx(idx);
    setGameState('PLAYING');
    setContinueCountdown(10);
  };

  const handleDeath = () => {
    const newVidas = vidas - 1;
    setVidas(newVidas);
    gameRef.current.lifeCount = newVidas;
    
    if (newVidas > 0) {
      // Respawn at current level start
      const startY = window.innerHeight * 0.8 - 75;
      gameRef.current.player.y = startY;
      gameRef.current.player.vy = 0;
      gameRef.current.player.invul = 120;
      gameRef.current.distance = Math.max(0, gameRef.current.distance - 500); // Voltar um pouco
    } else {
      setGameState('GAMEOVER');
    }
  };

  const jump = (e?: React.PointerEvent | PointerEvent) => {
    // Captura o evento imediatamente para evitar lag
    if (e && 'preventDefault' in e) e.preventDefault();
    if ((gameState === 'PLAYING' || gameState === 'BOSS') && gameRef.current.player.grounded) {
      gameRef.current.player.vy = JUMP_FORCE;
      gameRef.current.player.grounded = false;
    }
  };

  const createExplosion = (x: number, y: number, color = '#f97316') => {
    for (let i = 0; i < 20; i++) {
      gameRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18,
        life: 1.0,
        size: Math.random() * 8 + 4,
        color
      });
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;

    const update = () => {
      const state = gameRef.current;
      const level = LEVELS[levelIdx];
      const groundY = canvas.height * 0.8;

      // 1. Física
      state.player.vy += GRAVITY;
      state.player.y += state.player.vy;
      state.player.animFrame += 0.45;
      if (state.player.invul > 0) state.player.invul--;

      // 2. Geração de Buracos e Chão
      state.distance += level.speed;
      if (state.nextPlatformX < state.distance + canvas.width + 600) {
        const isHole = Math.random() > 0.65;
        const gap = isHole ? 220 + (levelIdx * 4) : 0;
        const width = 800 + Math.random() * 1200;
        
        state.platforms.push({ x: state.nextPlatformX + gap, y: groundY, w: width });
        
        // Spawn Mumbucas
        if (!isHole) {
          const count = 5;
          for(let i=0; i<count; i++) {
            state.objects.push({
              x: state.nextPlatformX + gap + 150 + (i * 70),
              y: groundY - 140 - Math.sin(i * 0.8) * 60,
              type: 'MUMBUCA', collected: false
            });
          }
          // Inimigo Metal Slug ocasional
          if (Math.random() > 0.8) {
            state.objects.push({
              x: state.nextPlatformX + gap + width/2,
              y: groundY - 60,
              type: 'ENEMY'
            });
          }
        }
        state.nextPlatformX += gap + width;
      }

      // 3. Colisões
      let onPlatform = false;
      const px = state.distance + canvas.width * 0.2 + state.player.w / 2;
      
      state.platforms.forEach(p => {
        if (px > p.x && px < p.x + p.w) {
          if (state.player.y + state.player.h >= p.y && state.player.y + state.player.h <= p.y + 60 && state.player.vy >= 0) {
            state.player.y = p.y - state.player.h;
            state.player.vy = 0;
            onPlatform = true;
          }
        }
      });
      state.player.grounded = onPlatform;

      // 4. Lógica de Morte
      if (state.player.y > canvas.height) {
        handleDeath();
      }

      // 5. Coleta e Danos
      state.objects.forEach(obj => {
        if (obj.type === 'MUMBUCA' && !obj.collected) {
          const dx = px - (obj.x + 20);
          const dy = (state.player.y + 40) - (obj.y + 20);
          if (Math.sqrt(dx*dx + dy*dy) < 55) {
            obj.collected = true;
            state.mumbucaCount++;
            setMumbucas(state.mumbucaCount);
          }
        }
        if (obj.type === 'ENEMY' && state.player.invul === 0) {
           const dx = px - (obj.x + 35);
           const dy = (state.player.y + 40) - (obj.y + 30);
           if (Math.sqrt(dx*dx + dy*dy) < 65) {
             if (state.mumbucaCount > 0) {
               state.mumbucaCount = Math.max(0, state.mumbucaCount - 10);
               setMumbucas(state.mumbucaCount);
               state.player.invul = 60;
               createExplosion(px, state.player.y + 40, '#fbbf24');
             } else {
               handleDeath();
             }
           }
        }
      });

      // Partículas
      state.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      });
      state.particles = state.particles.filter(p => p.life > 0);

      // Boss Fight Logic (ao chegar no fim da distância do bioma)
      if (state.distance > level.distance && !state.boss.active) {
        state.boss.active = true;
        state.boss.x = state.distance + canvas.width;
      }
      if (state.boss.active) {
        state.boss.x -= (level.speed - 1);
        if (px > state.boss.x && state.player.invul === 0) {
           if (state.mumbucaCount > 0) {
             state.mumbucaCount = Math.max(0, state.mumbucaCount - 20); 
             setMumbucas(state.mumbucaCount); 
             state.player.invul = 60;
           } else { handleDeath(); }
        }
        // Se pular no boss
        if (state.player.vy > 0 && Math.abs(px - (state.boss.x + 60)) < 80 && state.player.y + state.player.h > state.boss.y) {
           state.boss.hp--;
           state.player.vy = JUMP_FORCE;
           createExplosion(state.boss.x + 60, state.boss.y + 50);
           if (state.boss.hp <= 0) {
              if (levelIdx + 1 < LEVELS.length) setGameState('LEVEL_UP');
              else setGameState('VICTORY');
           }
        }
      }

      render(ctx, canvas, state);
      animationId = requestAnimationFrame(update);
    };

    const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any) => {
      const level = LEVELS[levelIdx];
      
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, level.sky[0]);
      skyGrad.addColorStop(1, level.sky[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-state.distance, 0);

      // Chão Xbox 360 Style
      state.platforms.forEach((p: any) => {
        ctx.fillStyle = '#1a0d02';
        ctx.fillRect(p.x, p.y + 20, p.w, canvas.height);
        const earthGrad = ctx.createLinearGradient(0, p.y, 0, p.y + 150);
        earthGrad.addColorStop(0, '#78350f'); earthGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = earthGrad; ctx.fillRect(p.x, p.y + 15, p.w, 150);
        ctx.fillStyle = level.ground; ctx.fillRect(p.x, p.y, p.w, 25);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(p.x, p.y, p.w, 5);
      });

      // Mumbucas
      state.objects.forEach((obj: any) => {
        if (obj.type === 'MUMBUCA' && !obj.collected) {
          ctx.save();
          ctx.translate(obj.x + 20, obj.y + 20);
          ctx.rotate(state.distance * 0.1);
          ctx.shadowBlur = 15; ctx.shadowColor = "yellow";
          ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        } else if (obj.type === 'ENEMY') {
          ctx.fillStyle = '#334155'; ctx.fillRect(obj.x, obj.y + 20, 70, 40);
          ctx.fillStyle = '#1e293b'; ctx.fillRect(obj.x + 15, obj.y, 40, 25);
        }
      });

      // Boss Fight
      if (state.boss.active) {
        ctx.fillStyle = '#1e1b4b'; ctx.fillRect(state.boss.x, state.boss.y, 120, 120);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(state.boss.x, state.boss.y - 20, state.boss.hp * 15, 10);
      }

      // Explosions
      state.particles.forEach((p: any) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      ctx.restore();

      // --- TATUZIN FULECO ELITE ---
      const tx = canvas.width * 0.2;
      const ty = state.player.y;
      ctx.save();
      if (state.player.invul % 4 > 2) ctx.globalAlpha = 0.4;

      // Corpo Amarelo Ouro
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.ellipse(tx + 42, ty + 40, 45, 35, 0, 0, Math.PI*2); ctx.fill();
      
      // Carapaça Azul Vibrante (Fuleco Style)
      ctx.fillStyle = '#2563eb';
      ctx.beginPath(); ctx.arc(tx + 42, ty + 40, 45, Math.PI, 0); ctx.fill();
      
      // Detalhes carapaça
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
      for(let i=0; i<3; i++) {
        ctx.beginPath(); ctx.arc(tx + 42, ty + 42, 43 - (i*13), Math.PI, 0); ctx.stroke();
      }

      // Cabeça
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.ellipse(tx + 85, ty + 45, 28, 20, 0, 0, Math.PI*2); ctx.fill(); 
      ctx.beginPath(); ctx.ellipse(tx + 70, ty + 25, 7, 20, 0.3, 0, Math.PI*2); ctx.fill(); // Orelha 1
      ctx.beginPath(); ctx.ellipse(tx + 85, ty + 30, 7, 16, -0.2, 0, Math.PI*2); ctx.fill(); // Orelha 2

      // Olhos Nintendo
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(tx + 92, ty + 40, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(tx + 96, ty + 40, 5, 0, Math.PI*2); ctx.fill();

      // Patas animadas
      const legOffset = Math.sin(state.player.animFrame * 3.5) * 22;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(tx + 15, ty + 65, 18, 20 + legOffset);
      ctx.fillRect(tx + 60, ty + 65, 18, 20 - legOffset);

      ctx.restore();
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, levelIdx]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'GAMEOVER' && continueCountdown > 0) {
      timer = setInterval(() => {
        setContinueCountdown(prev => {
          if (prev <= 1) {
            onBack();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, continueCountdown, onBack]);

  return (
    <div 
      className="w-screen h-screen bg-black overflow-hidden font-sans select-none touch-none relative" 
      onPointerDown={(e) => jump(e as unknown as PointerEvent)}
    >
      {/* Botão Voltar */}
      <button 
        onPointerDown={(e) => { e.stopPropagation(); onBack(); }}
        className="absolute left-4 top-4 text-white hover:text-yellow-400 transition-all p-3 bg-white/5 rounded-full z-50 shadow-lg border border-white/10 flex items-center justify-center"
        aria-label="Voltar"
      >
        <ArrowLeft size={32} />
      </button>

      {/* HUD PREMIUM */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-4 ml-16">
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 p-5 rounded-[2.5rem] flex items-center gap-5 shadow-2xl">
            <div className="bg-amber-400 p-2 rounded-full shadow-lg"><Coins className="text-amber-900" size={32} /></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-amber-200 uppercase tracking-widest leading-none mb-1">Mumbucas</span>
              <span className="text-5xl font-black text-white italic drop-shadow-xl leading-none">{mumbucas}</span>
            </div>
          </div>
          <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
             <span className="text-white font-black italic text-lg uppercase tracking-widest opacity-80">
               {LEVELS[levelIdx].name}
             </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 p-5 rounded-full shadow-2xl relative">
          <Heart className="text-rose-500" size={45} fill="currentColor" />
          <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">{vidas}</span>
        </div>
      </div>

      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="w-full h-full block" />

      {/* TELAS DE ESTADO */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-yellow-500">
            <motion.h1 
              initial={{ rotate: -5, scale: 0.8 }}
              animate={{ rotate: -5, scale: 1 }}
              className="text-[5rem] sm:text-[10rem] font-black italic text-white uppercase drop-shadow-[12px_12px_0px_rgba(0,0,0,1)] leading-none mb-12 select-none text-center px-4"
            >
              TATUZIN
            </motion.h1>
            <button 
              onPointerDown={(e) => { e.stopPropagation(); startGame(0); }} 
              className="bg-white text-green-700 px-16 sm:px-28 py-8 sm:py-12 rounded-[5rem] font-black text-4xl sm:text-6xl shadow-[0_20px_0_#15803d] hover:scale-105 transition-transform active:translate-y-4 active:shadow-none"
            >
              JOGAR
            </button>
            <p className="mt-14 text-green-900 font-black text-xl sm:text-2xl uppercase tracking-[0.4em] animate-pulse text-center px-4">Toque na tela para pular os buracos!</p>
          </motion.div>
        )}

        {gameState === 'LEVEL_UP' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-amber-400/30 backdrop-blur-2xl p-10 text-center">
            <Trophy size={180} className="text-amber-400 mb-8 animate-bounce" />
            <h2 className="text-5xl sm:text-9xl font-black italic text-white uppercase mb-10 drop-shadow-2xl">BIOMA CONCLUÍDO!</h2>
            <button onPointerDown={(e) => { e.stopPropagation(); startGame(levelIdx + 1); }} className="bg-white text-slate-900 px-16 sm:px-24 py-6 sm:py-10 rounded-[3rem] font-black text-3xl sm:text-5xl shadow-2xl uppercase">Próxima Fase</button>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-xl text-center p-6">
            <h2 className="text-6xl sm:text-[10rem] font-black italic text-white uppercase mb-4 drop-shadow-2xl">MORREU!</h2>
            <p className="text-2xl sm:text-4xl font-black text-red-500 uppercase mb-12 tracking-widest">Deseja continuar? {continueCountdown}s</p>
            
            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
              <button 
                onPointerDown={(e) => { e.stopPropagation(); startGame(levelIdx, true); }} 
                className="flex-1 bg-white text-red-600 px-8 py-6 rounded-[2rem] font-black text-2xl sm:text-4xl shadow-2xl uppercase hover:scale-105 transition-transform"
              >
                Continuar
              </button>
              <button 
                onPointerDown={(e) => { e.stopPropagation(); onBack(); }} 
                className="flex-1 bg-red-600 text-white px-8 py-6 rounded-[2rem] font-black text-2xl sm:text-4xl shadow-2xl uppercase hover:scale-105 transition-transform"
              >
                Sair
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'VICTORY' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-yellow-400 text-center p-4">
            <Trophy size={200} className="text-white mb-10 animate-bounce" />
            <h1 className="text-6xl sm:text-9xl font-black italic text-white uppercase drop-shadow-2xl">LENDA DO BRASIL!</h1>
            <p className="text-2xl sm:text-4xl font-bold text-yellow-900 mt-6">Você coletou as mumbucas em todos os 20 biomas!</p>
            <button onPointerDown={(e) => { e.stopPropagation(); onBack(); }} className="mt-20 bg-white text-yellow-600 px-16 sm:px-24 py-6 sm:py-10 rounded-full font-black text-3xl sm:text-5xl">Menu Inicial</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@1,900&display=swap');
        body { margin: 0; padding: 0; background: #000; overflow: hidden; user-select: none; }
        .font-sans { font-family: 'Montserrat', sans-serif; }
      `}} />
    </div>
  );
};

export default Tatuzin;
