import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCc4Ne13cDBeoLQxlXXl5o5-M9oxVSS6hY",
  authDomain: "finanzas-casa-4f1cc.firebaseapp.com",
  databaseURL: "https://finanzas-casa-4f1cc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "finanzas-casa-4f1cc",
  storageBucket: "finanzas-casa-4f1cc.firebasestorage.app",
  messagingSenderId: "545467706523",
  appId: "1:545467706523:web:13a1b55e75b15382faaa3e",
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
