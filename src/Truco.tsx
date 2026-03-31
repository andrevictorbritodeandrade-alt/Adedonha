import React, { useState } from 'react';

export default function Truco({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-magical font-sans p-4 flex flex-col items-center justify-center text-white">
      <header className="text-center mb-6 relative w-full max-w-4xl">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-emerald-600 font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-50 transition-colors border border-emerald-200"
        >
          ⬅ Voltar
        </button>
        <h1 className="text-4xl md:text-6xl font-display mb-2 tracking-wider text-shadow-comic text-emerald-400">
          <span className="inline-block animate-bounce mr-2">♠️</span>
          <span className="uppercase">
            EPIC TRUCO!
          </span>
          <span className="inline-block animate-bounce ml-2" style={{ animationDelay: '0.2s' }}>♥️</span>
        </h1>
      </header>
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
        <h2 className="text-3xl font-display text-slate-700 mb-4">Em Construção! 🚧</h2>
        <p className="text-xl text-slate-500 font-bold">O Truco Paulista está sendo preparado para você jogar com seus amigos.</p>
      </div>
    </div>
  );
}
