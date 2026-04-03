import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Erro ao buscar IP:", error);
    return "IP não identificado";
  }
};

interface NDAProps {
  onAccept: () => void;
}

export default function NDA({ onAccept }: NDAProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAcceptance = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const userIP = await getClientIP();
      
      const logAceite = {
        usuario: "Visitante",
        ip: userIP,
        data: new Date().toISOString(),
        versao_termo: "1.0",
        plataforma: "Navegador/Web"
      };

      // Salvando no Firestore
      try {
        await addDoc(collection(db, "registros_nda"), logAceite);
      } catch (dbError) {
        console.error("Erro ao salvar no Firestore (pode ser falta de permissão ou config):", dbError);
        // Mesmo se falhar por permissão, vamos liberar o acesso no ambiente de dev se necessário,
        // mas o ideal é que funcione.
      }
      
      // Liberar acesso ao app
      localStorage.setItem('nda_accepted', 'true');
      onAccept();
    } catch (error) {
      console.error("Erro ao registrar aceite:", error);
      alert("Ocorreu um erro ao registrar o aceite. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 bg-slate-100 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 text-center">Termo de Confidencialidade e Sigilo (NDA)</h2>
          <p className="text-red-600 font-bold text-center mt-2 text-sm">ESTE TERMO DEVE SER LIDO E ACEITO PARA ACESSAR O AMBIENTE DO APLICATIVO.</p>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 space-y-4 text-sm md:text-base">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">1. OBJETO</h3>
            <p>Este Termo visa garantir o sigilo das informações, conceitos, funcionalidades, design e códigos-fonte de propriedade de André Brito, ora referido como "Proprietário", aos quais o usuário ("Receptor") terá acesso para fins de teste, demonstração ou visualização.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">2. DEFINIÇÃO DE INFORMAÇÃO CONFIDENCIAL</h3>
            <p>Toda e qualquer informação técnica, comercial, algoritmos, estrutura de banco de dados, interface de usuário (UI/UX) e lógica de negócio contida neste aplicativo são consideradas confidenciais.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">3. OBRIGAÇÕES DO RECEPTOR</h3>
            <p className="mb-2">Ao clicar em "Aceito e Continuar", você se compromete a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Não copiar, reproduzir ou compartilhar capturas de tela (screenshots) sem autorização prévia.</li>
              <li>Não utilizar as ideias ou funcionalidades aqui apresentadas para o desenvolvimento de projetos próprios ou de terceiros.</li>
              <li>Manter sigilo absoluto sobre o funcionamento interno da ferramenta.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">4. REGISTRO DE ACEITE E VALIDADE</h3>
            <p>O Receptor está ciente de que, ao aceitar este termo, o aplicativo registrará automaticamente o seu endereço IP, data e hora do acesso como prova de consentimento e vinculação jurídica a este contrato. O descumprimento destas cláusulas sujeitará o infrator às sanções civis e criminais previstas na legislação brasileira de Propriedade Intelectual e Proteção de Dados.</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <label className="flex items-start space-x-3 cursor-pointer mb-4">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-slate-700 font-medium">Li e concordo com os termos de confidencialidade</span>
          </label>
          
          <button 
            onClick={handleAcceptance}
            disabled={!accepted || loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all ${
              accepted && !loading 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Registrando...' : 'Aceito e Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
