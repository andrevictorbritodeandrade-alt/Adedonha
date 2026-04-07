import React from 'react';
import { User } from 'lucide-react';

interface UserProfileProps {
  user: any;
  onClose: () => void;
  onGenerateAvatars?: () => void;
  isGenerating?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onGenerateAvatars, isGenerating }) => {
  if (!user) return null;

  const isAdmin = user.email === 'andrevictorbritodeandrade@gmail.com';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl">
        <h2 className="text-xl font-black mb-4">Perfil do Jogador</h2>
        <div className="flex flex-col items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-700" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={48} className="text-slate-500" />
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-bold">{user.displayName || 'Jogador'}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        {isAdmin && onGenerateAvatars && (
          <div className="mt-6 p-4 bg-slate-800 rounded-2xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ferramentas Admin</p>
            <button 
              onClick={onGenerateAvatars}
              disabled={isGenerating}
              className="w-full py-2 bg-blue-600 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Avatares dos Jogos'}
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full mt-6 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition-all">Fechar</button>
      </div>
    </div>
  );
};
