import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export const storage = {
  async get(key) {
    try {
      const snapshot = await get(ref(db, key))
      return snapshot.exists() ? snapshot.val() : null
    } catch (e) {
      console.error('Firebase get error:', e)
      // Fallback to localStorage
      try {
        const val = localStorage.getItem(key)
        return val ? JSON.parse(val) : null
      } catch { return null }
    }
  },

  async set(key, value) {
    try {
      await set(ref(db, key), value)
      // Also save locally as backup
      try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
      return true
    } catch (e) {
      console.error('Firebase set error:', e)
      // Fallback to localStorage
      try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
    }
  },

  subscribe(key, callback) {
    const dbRef = ref(db, key)
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val())
      }
    })
  }
}
