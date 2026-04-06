import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

interface AccessLog {
  id: string;
  email: string;
  type: string;
  ip: string;
  location: string;
  timestamp: any;
}

export default function AdminHistory() {
  const [logs, setLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'accessLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccessLog[];
      setLogs(logsData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 bg-blue-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Histórico de Acessos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/20">
              <th className="p-3">Usuário</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">IP</th>
              <th className="p-3">Localização</th>
              <th className="p-3">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-white/10">
                <td className="p-3">{log.email}</td>
                <td className="p-3">{log.type}</td>
                <td className="p-3">{log.ip}</td>
                <td className="p-3">{log.location}</td>
                <td className="p-3">{log.timestamp?.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
