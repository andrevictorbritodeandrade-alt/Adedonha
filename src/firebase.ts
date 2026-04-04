import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getAnalytics, isSupported } from 'firebase/analytics';
import * as firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = (firebaseConfigJson as any).default || firebaseConfigJson;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Inicializa o Analytics apenas se for suportado no ambiente atual
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Inicializa o Messaging (Notificações Push) apenas se estiver no navegador
export let messaging: any = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.error("Erro ao inicializar o Firebase Messaging:", e);
  }
}

// Chave VAPID para Web Push (extraída da captura de tela do usuário)
export const vapidKey = "BP5I2vVtQnp-WP64hGV_O9aPJagIDEVk4aUgZ6ZsmqrBR8Lxq8bvvnLsuOCKMwEilWqG2Xzkc9pyhl1B9w_XB3k";
