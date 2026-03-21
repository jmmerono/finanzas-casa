import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'

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
  )
}
