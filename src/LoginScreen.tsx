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
        
        <button 
          onClick={() => handleLogin('google')}
          className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105 mb-6 flex items-center justify-center gap-3 text-lg"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Conta Google
        </button>

        <div className="relative flex items-center py-4 mb-2">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Ou use senha de admin</span>
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
