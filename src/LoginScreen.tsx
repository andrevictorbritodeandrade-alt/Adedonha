import React from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from './firebase';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = React.useState('');

  const handleLogin = async (type: 'google' | 'email', email?: string, pass?: string) => {
    try {
      let user;
      if (type === 'google') {
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;
      } else if (email && pass) {
        if (pass === '100889') {
          // Admin login (mocking for now, in real app use custom claims or firestore)
          // For now, just sign in as a special user or handle in state
          console.log("Admin login attempted");
          // ...
          return;
        }
        const result = await signInWithEmailAndPassword(auth, email, pass);
        user = result.user;
      }

      if (user) {
        // Save user profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          type: type,
          createdAt: serverTimestamp()
        }, { merge: true });

        // Log access and capture IP/Location
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        await setDoc(doc(collection(db, 'accessLogs')), {
          userId: user.uid,
          email: user.email,
          type: type,
          ip: ipData.ip,
          location: `${ipData.city}, ${ipData.region}, ${ipData.country_name}`,
          timestamp: serverTimestamp()
        });

        onLogin();
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao entrar');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background decoration to simulate blurred games */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 blur-xl pointer-events-none">
        <div className="flex gap-8">
          <div className="w-64 h-80 bg-purple-500 rounded-2xl transform -rotate-12"></div>
          <div className="w-64 h-80 bg-blue-500 rounded-2xl transform -rotate-6"></div>
          <div className="w-64 h-80 bg-green-500 rounded-2xl"></div>
          <div className="w-64 h-80 bg-yellow-500 rounded-2xl transform rotate-6"></div>
          <div className="w-64 h-80 bg-red-500 rounded-2xl transform rotate-12"></div>
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#121212]/80 to-[#121212]" />

      <div className="bg-[#1e1e1e]/90 backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5 w-full max-w-md text-center relative z-10">
        <h1 className="text-5xl font-display text-yellow-400 tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] mb-10">ARENA DE JOGOS</h1>
        
        <div className="relative flex items-center py-4 mb-2">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Use senha de admin</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="****"
          className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-center text-xl tracking-widest"
        />
        <button 
          onClick={() => handleLogin('email', 'admin@admin.com', password)}
          className="w-full bg-yellow-500 text-black font-bold py-4 rounded-2xl shadow-lg hover:bg-yellow-400 transition-all transform hover:scale-105 text-lg"
        >
          Entrar como Admin
        </button>
      </div>
    </div>
  );
}
