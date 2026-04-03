import React, { useEffect, useRef, useState } from 'react';

// Configurações da Gemini API
const apiKey = "";

const Tatuzin = ({ onBack }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [countdown, setCountdown] = useState(10);
  const [currentBiome, setCurrentBiome] = useState('CERRADO');
  
  // Estados para a IA
  const [aiMessage, setAiMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioCtx = useRef(null);
  const bgMusic = useRef(null);
  const gameLoopRef = useRef(null);

  // --- Função Auxiliar Gemini ---
  const callGemini = async (prompt, systemInstruction = "") => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
    };

    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar conteúdo.";
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  };

  // --- Texto-para-Fala (TTS) ---
  const speakMessage = async (text) => {
    if (!text) return;
    setIsSpeaking(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: `Diga de forma animada: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const pcmData = result.candidates[0].content.parts[0].inlineData.data;
      const audioBlob = pcmToWavBlob(pcmData, 24000);
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => setIsSpeaking(false);
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.log("TTS Play Interrompido:", error));
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  const pcmToWavBlob = (base64Data, sampleRate) => {
    const byteCharacters = atob(base64Data);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
    const buffer = new ArrayBuffer(44 + byteArray.length);
    const view = new DataView(buffer);
    const writeString = (offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
    writeString(0, 'RIFF'); view.setUint32(4, 32 + byteArray.length, true);
    writeString(8, 'WAVE'); writeString(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    writeString(36, 'data'); view.setUint32(40, byteArray.length, true);
    new Uint8Array(buffer).set(byteArray, 44);
    return new Blob([buffer], { type: 'audio/wav' });
  };

  // --- Funções de Áudio ---
  const initAudio = () => {
    if (!audioCtx.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new AudioContext();
    }
    if (!bgMusic.current) {
      bgMusic.current = new Audio("http://googleusercontent.com/file_content/1");
      bgMusic.current.loop = true;
      bgMusic.current.onerror = () => {
        console.warn("Falha ao carregar a trilha sonora principal.");
      };
    }
  };

  const playJumpSound = () => {
    initAudio();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.current.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + 0.2);
    osc.connect(gain); gain.connect(audioCtx.current.destination);
    osc.start(); osc.stop(audioCtx.current.currentTime + 0.2);
  };

  // --- Lógica do Jogo ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const gravity = 0.6;
    const jumpPower = -17;
    const groundHeight = 150;
    const tatuSize = 85;

    let tatu = {
      x: 150,
      y: 0,
      dy: 0,
      jumping: false,
      invincible: 0,
      frame: 0,
      isHiding: false
    };

    let worldX = 0;
    let bgOffset = 0;
    let items = [];
    let pits = [];
    let obstacles = [];

    const initLevel = () => {
      items = []; pits = []; obstacles = [];
      for (let i = 1; i < 200; i++) {
        // Arcos de moedas
        if (i % 2 === 0) {
           for (let j = 0; j < 5; j++) {
             items.push({ 
               x: i * 600 + (j * 45), 
               y: height - groundHeight - 160 - Math.sin(j * 0.6) * 110,
               collected: false 
             });
           }
        }
        // Buracos (esconderijo)
        if (i % 5 === 0) pits.push(i * 600 + 300);
        // Obstáculos (Espinhos)
        if (i % 7 === 0 && !pits.includes(i * 600 + 300)) {
           obstacles.push({ x: i * 600 + 100, y: height - groundHeight - 40 });
        }
      }
    };

    const drawTatuzin3D = () => {
      ctx.save();
      if (tatu.invincible % 4 > 2) ctx.globalAlpha = 0.4;
      
      const visualY = tatu.y + (tatu.isHiding ? 25 : 0);
      ctx.translate(tatu.x + tatuSize/2, visualY + tatuSize/2);
      
      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, height - groundHeight - visualY - 45, 45, 14, 0, 0, Math.PI*2);
      ctx.fill();

      if (tatu.isHiding) {
        const grad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 40);
        grad.addColorStop(0, '#A0522D');
        grad.addColorStop(1, '#5D2E0A');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 4;
        for(let i=0; i<3; i++) {
          ctx.beginPath(); ctx.arc(0,0, 40, i, i+2.2); ctx.stroke();
        }
      } else {
        const shellGrad = ctx.createRadialGradient(-15, -15, 10, 0, 0, 45);
        shellGrad.addColorStop(0, '#8B4513');
        shellGrad.addColorStop(0.7, '#5D2E0A');
        shellGrad.addColorStop(1, '#3D1E07');
        ctx.fillStyle = shellGrad;
        ctx.beginPath(); ctx.ellipse(0, 0, 45, 40, 0, 0, Math.PI*2); ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for(let i=-3; i<=3; i++) {
          ctx.beginPath(); ctx.moveTo(-40, i*10); ctx.quadraticCurveTo(0, i*14, 40, i*10); ctx.stroke();
        }

        ctx.fillStyle = '#D2B48C';
        ctx.beginPath(); ctx.ellipse(35, 12, 20, 16, 0.3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(30, -5); ctx.lineTo(35, -35); ctx.lineTo(43, -5); ctx.fill();
        
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(45, 5, 9, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(48, 5, 4.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(49, 3, 2.5, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#3D1E07';
        if (tatu.jumping) {
          ctx.fillRect(-30, 25, 14, 22); ctx.fillRect(15, 25, 14, 22);
        } else {
          let move = Math.sin(tatu.frame * 0.4) * 18;
          ctx.fillRect(-22, 30 + move, 14, 18);
          ctx.fillRect(18, 30 - move, 14, 18);
        }
      }
      ctx.restore();
    };

    const drawScene = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#00BFFF');
      sky.addColorStop(1, '#E0FFFF');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      for (let i = -2; i < (width/160) + 2; i++) {
        let xPos = (i * 160) + (bgOffset % 160);
        let worldXPos = i * 160 - (bgOffset - (bgOffset % 160));
        let isPit = pits.some(p => worldXPos >= p && worldXPos < p + 320);
        
        if (!isPit) {
          ctx.fillStyle = (Math.floor(worldXPos/160) % 2 === 0) ? '#8B4513' : '#703A0F';
          ctx.fillRect(xPos, height - groundHeight, 160, groundHeight);
          ctx.fillStyle = '#228B22'; ctx.fillRect(xPos, height - groundHeight, 160, 35);
          ctx.fillStyle = '#32CD32'; ctx.fillRect(xPos, height - groundHeight, 160, 12);
        } else {
          ctx.fillStyle = '#1A0D04';
          ctx.fillRect(xPos, height - groundHeight, 160, groundHeight);
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath(); ctx.ellipse(xPos + 80, height - groundHeight, 80, 25, 0, 0, Math.PI*2); ctx.fill();
        }
      }
    };

    const update = () => {
      if (gameState !== 'PLAYING') return;

      tatu.dy += gravity;
      tatu.y += tatu.dy;

      let onPit = pits.some(p => (worldX + tatu.x) > p - 60 && (worldX + tatu.x) < p + 260);
      
      if (!onPit && tatu.y > height - groundHeight - tatuSize) {
        tatu.y = height - groundHeight - tatuSize;
        tatu.dy = 0;
        tatu.jumping = false;
        tatu.isHiding = false;
      }

      if (tatu.y > height - groundHeight/2) {
         tatu.isHiding = true;
         if (score > 0) {
            const loss = Math.ceil(score * 0.25);
            setScore(s => Math.max(0, s - loss));
            tatu.y = height - groundHeight - 120;
            tatu.dy = -12;
            tatu.invincible = 60;
         } else {
            die();
         }
      }

      bgOffset -= 14;
      worldX += 14;
      tatu.frame++;
      if (tatu.invincible > 0) tatu.invincible--;

      // Moedas
      items.forEach(m => {
        let sx = m.x - worldX;
        if (sx > -100 && sx < width + 100 && !m.collected) {
           ctx.save(); ctx.translate(sx, m.y);
           ctx.scale(Math.sin(tatu.frame * 0.25), 1);
           const coinGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
           coinGrad.addColorStop(0, '#FFF'); coinGrad.addColorStop(1, '#FFD700');
           ctx.fillStyle = coinGrad;
           ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill();
           ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 2; ctx.stroke();
           ctx.restore();

           if (Math.abs(tatu.x + tatuSize/2 - sx) < 55 && Math.abs(tatu.y + tatuSize/2 - m.y) < 55) {
             m.collected = true; setScore(s => s + 1);
             const o = audioCtx.current.createOscillator();
             const g = audioCtx.current.createGain();
             o.frequency.setValueAtTime(1300, audioCtx.current.currentTime);
             g.gain.setValueAtTime(0.06, audioCtx.current.currentTime);
             o.connect(g); g.connect(audioCtx.current.destination);
             o.start(); o.stop(audioCtx.current.currentTime + 0.1);
           }
        }
      });

      // Obstáculos (Espinhos)
      obstacles.forEach(obs => {
         let sx = obs.x - worldX;
         if (sx > -100 && sx < width + 100) {
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.moveTo(sx, obs.y + 40); ctx.lineTo(sx+20, obs.y); ctx.lineTo(sx+40, obs.y+40);
            ctx.fill();
            if (tatu.invincible === 0 && Math.abs(tatu.x + tatuSize/2 - (sx+20)) < 40 && Math.abs(tatu.y + tatuSize/2 - (obs.y+20)) < 40) {
               if (score > 0) {
                  setScore(0);
                  tatu.invincible = 60;
               } else {
                  die();
               }
            }
         }
      });
      
      // Mudança de bioma baseada no progresso
      if (worldX > 10000 && currentBiome === 'CERRADO') setCurrentBiome('MATA ATLÂNTICA');
      if (worldX > 20000 && currentBiome === 'MATA ATLÂNTICA') setCurrentBiome('CAATINGA');
    };

    const die = () => {
      setLives(l => {
        if (l <= 1) { setGameState('GAMEOVER'); startCountdown(); return 0; }
        setGameState('DYING');
        setTimeout(() => { 
          tatu.y = 0; tatu.dy = 0; worldX = 0; bgOffset = 0; initLevel(); 
          setGameState('PLAYING');
        }, 1000);
        return l - 1;
      });
    };

    const loop = () => {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,width,height);
      drawScene();
      update();
      drawTatuzin3D();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    const handleInput = () => {
      if (gameState === 'PLAYING' && !tatu.jumping) {
        tatu.dy = jumpPower; tatu.jumping = true; playJumpSound();
      } else if (gameState === 'START') {
        initLevel(); setGameState('PLAYING');
        initAudio(); 
        if (bgMusic.current) {
            const playPromise = bgMusic.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
      }
    };

    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(); }, {passive: false});

    if (gameState === 'PLAYING') loop();
    else { drawScene(); drawTatuzin3D(); }

    return () => { 
      cancelAnimationFrame(gameLoopRef.current); 
      window.removeEventListener('resize', resize);
      if (bgMusic.current) bgMusic.current.pause();
    };
  }, [gameState, currentBiome]);

  const startCountdown = () => {
    setCountdown(10);
    const id = setInterval(() => { 
      setCountdown(c => { 
        if (c <= 1) { clearInterval(id); setGameState('START'); return 0; } 
        return c - 1; 
      }); 
    }, 1000);
  };

  const resetGame = () => { 
    setLives(3); setScore(0); setGameState('PLAYING'); 
    if (bgMusic.current) {
        const p = bgMusic.current.play();
        if (p !== undefined) p.catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-500 overflow-hidden touch-none select-none font-sans flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="block w-full h-full absolute inset-0" />

      {/* Interface HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-6 left-6 right-6 flex flex-col gap-4 pointer-events-none">
          <div className="flex justify-between items-center w-full">
            <div className="bg-white/95 backdrop-blur-md px-4 sm:px-8 py-2 sm:py-4 rounded-2xl sm:rounded-3xl border-b-4 sm:border-b-8 border-green-700 flex items-center gap-4 sm:gap-10 shadow-2xl">
              <div className="flex flex-col">
                <span className="text-green-900 text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-40">MOEDAS</span>
                <span className="text-yellow-600 text-2xl sm:text-5xl font-black italic">{score}</span>
              </div>
              <div className="w-px h-8 sm:h-12 bg-black/10"></div>
              <div className="flex gap-1 sm:gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`text-xl sm:text-4xl transition-all duration-300 ${i < lives ? 'drop-shadow-lg scale-110' : 'opacity-10 grayscale'}`}>❤️</div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pointer-events-auto">
              <div className="bg-green-800 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg sm:rounded-xl font-black text-center mb-1 sm:mb-2 shadow-lg italic text-xs sm:text-base">
                BIOMA: {currentBiome}
              </div>
              <button onClick={async () => {
                setIsGenerating(true); setShowAiModal(true);
                const fact = await callGemini(`Conte uma curiosidade divertida sobre a fauna e a flora do bioma ${currentBiome} no Brasil.`);
                setAiMessage(fact); setIsGenerating(false); speakMessage(fact);
              }} className="bg-orange-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-black shadow-xl border-b-2 sm:border-b-4 border-orange-800 transition-all active:translate-y-1 active:border-b-0 text-[10px] sm:text-sm">Guia da Flora e Fauna ✨</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IA */}
      {showAiModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-t-8 border-orange-500 relative">
            <h3 className="text-orange-600 font-black text-xl sm:text-2xl mb-4 italic">Sabedoria do Tatuzin ✨</h3>
            {isGenerating ? (
              <div className="flex flex-col items-center py-6 sm:py-10">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold text-sm sm:text-base">Consultando a Natureza...</p>
              </div>
            ) : (
              <div className="text-gray-700 text-lg sm:text-xl font-bold leading-relaxed mb-6 sm:mb-8">{aiMessage}</div>
            )}
            <button onClick={() => setShowAiModal(false)} className="w-full py-3 sm:py-4 bg-green-600 text-white text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl shadow-lg">ENTENDI!</button>
          </div>
        </div>
      )}

      {/* Overlay Telas */}
      {gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-green-700/90 to-green-950 backdrop-blur-sm p-4 text-center overflow-hidden">
          <div className="flex flex-col items-center mb-6 sm:mb-10 w-full max-w-4xl">
            <h1 className="text-[6rem] sm:text-[10rem] md:text-[12rem] lg:text-[13rem] font-black italic text-white tracking-tighter leading-none drop-shadow-[0_15px_0_#0d2e0d]" style={{ textShadow: '4px 4px 0px #061f06, 8px 8px 0px #031103', transform: 'skewX(-16deg)' }}>TATUZIN</h1>
            <div className="bg-yellow-400 px-6 sm:px-12 py-2 sm:py-3 rounded-lg sm:rounded-xl -rotate-2 shadow-2xl mt-4 sm:mt-6">
               <span className="text-green-900 font-black text-xl sm:text-3xl md:text-4xl uppercase tracking-tighter italic">AVENTURA PELO BRASIL</span>
            </div>
          </div>
          
          <button onClick={() => setGameState('PLAYING')} className="px-16 sm:px-28 py-6 sm:py-10 bg-white rounded-full shadow-[0_10px_0_0_#ccc] active:translate-y-2 active:shadow-none transition-all group mb-8 sm:mb-12">
            <span className="text-green-800 text-4xl sm:text-6xl md:text-7xl font-black italic group-hover:scale-105 block transition-transform">START</span>
          </button>
          
          <p className="text-white/50 font-bold tracking-[0.2em] animate-pulse text-sm sm:text-lg uppercase mb-16 sm:mb-20">TOQUE PARA COMEÇAR A CORRER</p>
          
          {/* Rodapé de Créditos - Ajustado para não sobrepor */}
          <footer className="mt-auto flex flex-col items-center text-white/80 font-medium text-[10px] sm:text-xs md:text-sm gap-1 pb-4">
            <div className="flex items-center gap-1">
                Desenvolvido por André Victor Brito de Andrade ®
            </div>
            <div className="opacity-70">
                Contato: <a href="mailto:andrevictorbritodeandrade@gmail.com" className="underline hover:text-white transition-colors">andrevictorbritodeandrade@gmail.com</a>
            </div>
            <div className="text-[8px] sm:text-[10px] uppercase tracking-widest mt-1 sm:mt-2 flex flex-col items-center gap-1 opacity-50">
                <span>© 2026 Todos os direitos reservados.</span>
                <span>Versão 1.0.0</span>
            </div>
          </footer>
          <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 text-white px-4 py-2 rounded-lg font-bold">Voltar</button>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-4 text-center">
          <h2 className="text-5xl sm:text-8xl md:text-9xl font-black text-red-600 mb-4 sm:mb-6 italic tracking-tighter">FIM DE JOGO</h2>
          <div className="text-[10rem] sm:text-[14rem] md:text-[16rem] font-black text-white leading-none mb-8 sm:mb-12 drop-shadow-lg">{countdown}</div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 w-full max-w-xl">
            <button onClick={resetGame} className="flex-1 py-6 sm:py-10 bg-green-600 text-white text-3xl sm:text-5xl font-black rounded-2xl sm:rounded-3xl border-b-4 sm:border-b-8 border-green-900 shadow-2xl active:translate-y-2 active:shadow-none transition-all">SIM</button>
            <button onClick={() => setGameState('START')} className="flex-1 py-6 sm:py-10 bg-gray-800 text-white text-3xl sm:text-5xl font-black rounded-2xl sm:rounded-3xl border-b-4 sm:border-b-8 border-black shadow-2xl active:translate-y-2 active:shadow-none transition-all">NÃO</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tatuzin;
