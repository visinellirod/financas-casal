import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─── Configuração do Firebase ──────────────────────────────────────────────────
// Defina as variáveis de ambiente no arquivo .env
// Veja .env.example para referência
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'AIzaSyCk61sNFUdA2HFq9fkDcaC5PaXpZb1DqKk',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'financas-34c49.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'financas-34c49',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'financas-34c49.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '154936145346',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '1:154936145346:web:93ae9ce30b5b5ee1d9d25b',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
