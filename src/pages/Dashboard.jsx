import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { storage } from '../lib/storage'

const SK = "cc-dashboard-v2"
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const CAT_COLS = {"Hogar":"#10b981","Educación":"#3b82f6","Ocio":"#ec4899","Inmobiliario":"#6366f1","Salud":"#ef4444","Movilidad-Coche":"#f97316","Casa":"#8b5cf6","Retirada Efectivo":"#78716c","REVISAR":"#eab308"}

const JAN25 = {
  id:"2025-01",mes:"Ene",año:2025,mesN:"Enero",
  ingresos:14519.89,gastos:12978.40,
  cats:{"Hogar":9128.78,"Educación":984,"Ocio":878.63,"Retirada Efectivo":390,"Inmobiliario":363.94,"Salud":123.25,"Movilidad-Coche":67.09,"Casa":100,"REVISAR":942.71}
}

const fmt = n => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:0}).format(n)
const fmt2 = n => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:2}).format(n)
const pct = n => (n*100).toFixed(1)+"%"

export default function Dashboard() {
  const [data, setData] = useState([])
  const [view, setView] = useState("dash")
  const [paste, setPaste] = useState("")
  const [selMonth, setSelMonth] = useState(null)
  const [toast, setToast] = useState(null)

  const msg = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    const load = async () => {
      const d = await storage.get(SK)
      if (d) setData(d.months || [])
      else { setData([JAN25]); await storage.set(SK, { months: [JAN25] }) }
    }
    load()
    const unsub = storage.subscribe(SK, (d) => {
      if (d && d.months) setData(d.months)
    })
    return () => { if (unsub) unsub() }
  }, [])

  const sv = useCallback(async (d) => { await storage.set(SK, { months: d }) }, [])

  const importData = async () => {
    if (!paste.trim()) { msg("Pega datos del Google Sheet", "err"); return }
    const lines = paste.trim().split("\n")
    const txns = []
    for (const line of lines) {
      const cols = line.split("\t")
      if (cols.length < 8) continue
      const [fecha, concepto, importeStr, tipo, subcat, cat, mes, añoStr] = cols
      if (tipo === "Tipo" || !mes) continue
      const importe = parseFloat(importeStr.replace(",", ".").replace(/[^\d.-]/g, ""))
      if (isNaN(importe)) continue
      txns.push({ fecha, concepto, importe, tipo, subcat, cat, mes: mes.trim(), año: parseInt(añoStr) })
    }
    if (!txns.length) { msg("No se encontraron transacciones válidas", "err"); return }

    const groups = {}
    txns.forEach(t => {
      const key = `${t.año}-${String(MESES.indexOf(t.mes) + 1).padStart(2, "0")}`
      if (!groups[key]) groups[key] = { id: key, mes: t.mes.substring(0, 3), año: t.año, mesN: t.mes, ingresos: 0, gastos: 0, cats: {} }
      if (t.tipo === "Ingreso") groups[key].ingresos += t.importe
      else { groups[key].gastos += Math.abs(t.importe); groups[key].cats[t.cat] = (groups[key].cats[t.cat] || 0) + Math.abs(t.importe) }
    })

    const newMonths = [...data]
    Object.values(groups).forEach(g => {
      const idx = newMonths.findIndex(m => m.id === g.id)
      if (idx >= 0) newMonths[idx] = g; else newMonths.push(g)
    })
    newMonths.sort((a, b) => a.id.localeCompare(b.id))
    setData(newMonths); sv(newMonths)
    setPaste(""); setView("dash"); msg(`${Object.keys(groups).length} mes(es) importado(s)`)
  }

  const delMonth = async (id) => {
    const nd = data.filter(m => m.id !== id); setData(nd); sv(nd)
    if (selMonth === id) setSelMonth(null); msg("Mes eliminado")
  }

  const totI = data.reduce((a, m) => a + m.ingresos, 0)
  const totG = data.reduce((a, m) => a + m.gastos, 0)
  const balance = totI - totG

  const allCats = [...new Set(data.flatMap(m => Object.keys(m.cats)))].filter(c => c !== "REVISAR").sort()
  const barData = data.map(m => { const o = { name: `${m.mes} ${m.año}` }; allCats.forEach(c => { o[c] = Math.round(m.cats[c] || 0) }); return o })
  const lineData = data.map(m => ({ name: `${m.mes} ${m.año}`, Ingresos: Math.round(m.ingresos), Gastos: Math.round(m.gastos), Balance: Math.round(m.ingresos - m.gastos) }))

  const selData = selMonth ? data.find(m => m.id === selMonth) : data[data.length - 1]
  const pieData = selData ? Object.entries(selData.cats).filter(([k]) => k !== "REVISAR").sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: Math.round(value) })) : []

  const MetricCard = ({ label, value, color }) => <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius)", padding: "1rem", flex: 1, minWidth: 140 }}>
    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{label}</p>
    <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 500, color: color || "var(--text-primary)" }}>{value}</p>
  </div>

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 12 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 500 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ margin: "2px 0", color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  }

  return <div>
    {toast && <div style={{ position: "fixed", top: 12, right: 12, zIndex: 99, padding: "8px 16px", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, background: toast.t === "err" ? "var(--danger-bg)" : "var(--success-bg)", color: toast.t === "err" ? "var(--danger)" : "var(--success)" }}>{toast.m}</div>}

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{data.length} mes(es){data.length > 0 ? ` · ${data[0].mes} ${data[0].año}` : ""}{data.length > 1 ? ` — ${data[data.length - 1].mes} ${data[data.length - 1].año}` : ""}</p>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => setView("dash")} style={{ fontWeight: view === "dash" ? 600 : 400, background: view === "dash" ? "var(--bg-tertiary)" : "transparent" }}>Dashboard</button>
        <button onClick={() => setView("import")} style={{ fontWeight: view === "import" ? 600 : 400, background: view === "import" ? "var(--bg-tertiary)" : "transparent" }}>Importar mes</button>
      </div>
    </div>

    {view === "dash" && <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Ingresos totales" value={fmt(totI)} color="var(--success)" />
        <MetricCard label="Gastos totales" value={fmt(totG)} color="var(--danger)" />
        <MetricCard label="Balance" value={fmt(balance)} color={balance >= 0 ? "var(--success)" : "var(--danger)"} />
        <MetricCard label="Tasa de ahorro" value={totI > 0 ? pct(balance / totI) : "—"} />
      </div>

      {data.length > 0 && <>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Ingresos vs gastos mensuales</h3>
        <div style={{ width: "100%", height: 280, marginBottom: 8 }}>
          <ResponsiveContainer>
            <BarChart data={lineData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "var(--text-secondary)" }} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-secondary)" }} tickFormatter={v => fmt(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, fontSize: 12, color: "var(--text-secondary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e" }}></span>Ingresos</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }}></span>Gastos</span>
        </div>
      </>}

      {data.length > 0 && allCats.length > 0 && <>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Gastos por categoría</h3>
        <div style={{ width: "100%", height: 300, marginBottom: 8 }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "var(--text-secondary)" }} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-secondary)" }} tickFormatter={v => fmt(v)} />
              <Tooltip content={<CustomTooltip />} />
              {allCats.map(c => <Bar key={c} dataKey={c} stackId="a" fill={CAT_COLS[c] || "#94a3b8"} maxBarSize={50} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, fontSize: 11, color: "var(--text-secondary)" }}>
          {allCats.map(c => <span key={c} style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLS[c] || "#94a3b8" }}></span>{c}</span>)}
        </div>
      </>}

      {pieData.length > 0 && selData && <>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 8px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Distribución de gastos</h3>
          <select value={selMonth || data[data.length - 1]?.id} onChange={e => setSelMonth(e.target.value)} style={{ fontSize: 12 }}>
            {data.map(m => <option key={m.id} value={m.id}>{m.mesN} {m.año}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ width: 220, height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={CAT_COLS[e.name] || "#94a3b8"} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            {pieData.map(p => {
              const total = pieData.reduce((a, x) => a + x.value, 0)
              return <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLS[p.name] || "#94a3b8", flexShrink: 0 }}></span>
                <span style={{ minWidth: 120, color: "var(--text-secondary)" }}>{p.name}</span>
                <span style={{ fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(p.value)}</span>
                <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>{pct(p.value / total)}</span>
              </div>
            })}
          </div>
        </div>
      </>}

      <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Detalle mensual</h3>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Mes</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Ingresos</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Gastos</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Balance</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>% ahorro</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {data.map(m => {
              const bal = m.ingresos - m.gastos
              return <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 500 }}>{m.mesN} {m.año}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--success)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmt2(m.ingresos)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--danger)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmt2(m.gastos)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 12, color: bal >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt2(bal)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>{m.ingresos > 0 ? pct(bal / m.ingresos) : "—"}</td>
                <td style={{ padding: "8px 4px" }}><button onClick={() => delMonth(m.id)} style={{ fontSize: 10, padding: "2px 6px" }}>✕</button></td>
              </tr>
            })}
            {data.length > 1 && <tr style={{ background: "var(--bg-secondary)" }}>
              <td style={{ padding: "8px 12px", fontWeight: 500 }}>Total</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, color: "var(--success)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmt2(totI)}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, color: "var(--danger)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmt2(totG)}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 12, color: balance >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt2(balance)}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 12 }}>{totI > 0 ? pct(balance / totI) : "—"}</td>
              <td></td>
            </tr>}
          </tbody>
        </table>
      </div>
    </>}

    {view === "import" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Importar datos del Google Sheet</h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Abre tu Google Sheet "FINANZAS CASA", pestaña "Transacciones". Selecciona las filas con datos (sin cabecera), copia con Ctrl+C y pega aquí.
        </p>
        <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={8}
          placeholder={"02/01/2025\tMERCADONA\t-85.30\tGasto\tAlimentación\tHogar\tEnero\t2025\t"}
          style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={importData} style={{ flex: 1 }}>Importar datos</button>
          <button onClick={() => { setPaste(""); setView("dash") }} style={{ color: "var(--text-secondary)" }}>Cancelar</button>
        </div>
      </div>
      <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius)", padding: "1rem", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 500, color: "var(--text-primary)" }}>Cómo funciona</p>
        <p style={{ margin: 0 }}>Los datos se agrupan automáticamente por mes. Si importas un mes que ya existe, se sobreescribe. Puedes importar varios meses a la vez.</p>
      </div>
    </div>}
  </div>
}
