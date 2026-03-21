export const storage = {
  get(key) {
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : null
    } catch { return null }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch { return false }
  },
  remove(key) {
    try { localStorage.removeItem(key); return true } catch { return false }
  }
}
