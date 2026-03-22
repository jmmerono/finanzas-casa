import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'

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
        <span style={{ fontSize: 20 }}>🏠</span>
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
            <span style={{ fontSize: 24 }}>🏠</span>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Finanzas casa</h1>
          </div>
          <nav style={{ display: 'flex', gap: 6 }}>
            <NavLink to="/" end style={linkStyle}>Dashboard</NavLink>
            <NavLink to="/categorias" style={linkStyle}>Categorías</NavLink>
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
