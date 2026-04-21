import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/storage'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'
import Login from './pages/Login'

function InstallBanner() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isStandalone) return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    if (isIOS) {
      setShow('ios')
      return
    }

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShow('android') }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    setShow(false)
  }

  const dismiss = () => { localStorage.setItem('pwa-dismissed', Date.now().toString()); setShow(false) }

  if (!show) return null

  return (
    <div style={{
      background: '#0f172a', color: '#f1f5f9', padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: 13, borderBottom: '2px solid #f59e0b', flexWrap: 'wrap'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>MP</span>
          </div>
        {show === 'ios' ? (
          <span>Instala la app: pulsa <strong style={{ color: '#f59e0b' }}>Compartir</strong> y luego <strong style={{ color: '#f59e0b' }}>Añadir a pantalla de inicio</strong></span>
        ) : (
          <span>Instala Finanzas Casa en tu dispositivo</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {show === 'android' && (
          <button onClick={install} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', background: '#f59e0b',
            color: '#0f172a', fontWeight: 600, fontSize: 12, cursor: 'pointer'
          }}>Instalar</button>
        )}
        <button onClick={dismiss} style={{
          padding: '6px 10px', borderRadius: 6, border: '1px solid #334155',
          background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer'
        }}>Ahora no</button>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = cargando, null = no autenticado

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return unsub
  }, [])

  // Pantalla de carga mientras Firebase comprueba la sesión
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 24
      }}>
        🏠
      </div>
    )
  }

  // Sin sesión → pantalla de login
  if (!user) return <Login />

  const linkStyle = ({ isActive }) => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#0f172a' : 'var(--text-secondary)',
    background: isActive ? '#f59e0b' : 'transparent',
    transition: 'all 0.15s',
  })

  return (
    <>
      <InstallBanner />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 16px' }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0', borderBottom: `1px solid var(--border)`, marginBottom: 20,
          flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>MP</span>
              </div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Meroño</div>
                <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>Paredes</div>
              </div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <NavLink to="/" end style={linkStyle}>Dashboard</NavLink>
            <NavLink to="/categorias" style={linkStyle}>Categorías</NavLink>
            <button
              onClick={() => signOut(auth)}
              style={{
                padding: '8px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
                cursor: 'pointer', marginLeft: 6,
              }}
            >
              Salir
            </button>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categorias" element={<Categorias />} />
        </Routes>
        <footer style={{
          textAlign: 'center', padding: '24px 0', marginTop: 32,
          borderTop: `1px solid var(--border)`, fontSize: 12, color: 'var(--text-tertiary)'
        }}>
          Finanzas Casa © {new Date().getFullYear()} — José & Ana Belén
        </footer>
      </div>
    </>
  )
}
