import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { storage } from '../lib/storage'

const SK = "cc-dashboard-v2"
const SK_TXN = "cc-txn-detail-v1"
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
  const [txnDetail, setTxnDetail] = useState([]) // todas las transacciones con detalle
  const [view, setView] = useState("dash")
  const [paste, setPaste] = useState("")
  const [toast, setToast] = useState(null)
  const [detailMonth, setDetailMonth] = useState("all")
  const [detailSearch, setDetailSearch] = useState("")

  const msg = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    const load = async () => {
      const d = await storage.get(SK)
      if (d) setData(d.months || [])
      else { setData([JAN25]); await storage.set(SK, { months: [JAN25] }) }

      const txn = await storage.get(SK_TXN)
      if (txn) setTxnDetail(txn.txns || [])
    }
    load()
    const unsub = storage.subscribe(SK, (d) => { if (d && d.months) setData(d.months) })
    const unsub2 = storage.subscribe(SK_TXN, (d) => { if (d && d.txns) setTxnDetail(d.txns) })
    return () => { if (unsub) unsub(); if (unsub2) unsub2() }
  }, [])

  const sv = useCallback(async (d) => { await storage.set(SK, { months: d }) }, [])
  const svTxn = useCallback(async (t) => { await storage.set(SK_TXN, { txns: t }) }, [])

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

    // Guardar detalle de transacciones
    const newTxns = [...txnDetail]
    txns.forEach(t => {
      const key = `${t.año}-${String(MESES.indexOf(t.mes) + 1).padStart(2,"0")}`
      // quitar transacciones antiguas del mismo mes y reemplazar
      const filtered = newTxns.filter(x => x.mesId !== key)
      if (filtered.length !== newTxns.length) {
        newTxns.length = 0
        filtered.forEach(x => newTxns.push(x))
      }
    })
    txns.forEach(t => {
      const key = `${t.año}-${String(MESES.indexOf(t.mes) + 1).padStart(2,"0")}`
      newTxns.push({ ...t, mesId: key })
    })
    newTxns.sort((a,b) => a.fecha?.localeCompare(b.fecha) || 0)
    setTxnDetail(newTxns)
    await svTxn(newTxns)

    // Agrupar por mes
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
    const nt = txnDetail.filter(t => t.mesId !== id); setTxnDetail(nt); svTxn(nt)
    msg("Mes eliminado")
  }

  const totI = data.reduce((a, m) => a + m.ingresos, 0)
  const totG = data.reduce((a, m) => a + m.gastos, 0)
  const balance = totI - totG

  // Datos para gráfico líneas suavizadas
  const lineData = data.map(m => ({
    name: `${m.mes} ${m.año}`,
    Ingresos: Math.round(m.ingresos),
    Gastos: Math.round(m.gastos),
    Balance: Math.round(m.ingresos - m.gastos)
  }))

  // Datos para gráfico de barras por categoría (media mensual)
  const allCats = [...new Set(data.flatMap(m => Object.keys(m.cats)))].filter(c => c !== "REVISAR").sort()
  const nMeses = data.length || 1
  const catMediaData = allCats.map(cat => ({
    name: cat,
    Media: Math.round(data.reduce((a, m) => a + (m.cats[cat] || 0), 0) / nMeses)
  })).sort((a, b) => b.Media - a.Media)

  // Filtro tabla detalle
  const filteredTxns = txnDetail.filter(t => {
    if (detailMonth !== "all" && t.mesId !== detailMonth) return false
    if (detailSearch && !t.concepto?.toLowerCase().includes(detailSearch.toLowerCase()) &&
        !t.cat?.toLowerCase().includes(detailSearch.toLowerCase()) &&
        !t.subcat?.toLowerCase().includes(detailSearch.toLowerCase())) return false
    if (t.tipo === "Ingreso") return false // mostrar solo gastos en detalle
    return true
  }).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))

  const MetricCard = ({ label, value, color }) =>
    <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius)", padding: "1rem", flex: 1, minWidth: 140 }}>
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

  const CatTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 12 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "2px 0", color: payload[0]?.fill }}>{fmt(payload[0]?.value)} / mes</p>
    </div>
  }

  return <div>
    {toast && <div style={{ position: "fixed", top: 12, right: 12, zIndex: 99, padding: "8px 16px", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, background: toast.t === "err" ? "var(--danger-bg)" : "var(--success-bg)", color: toast.t === "err" ? "var(--danger)" : "var(--success)" }}>{toast.m}</div>}

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        {data.length} mes(es){data.length > 0 ? ` · ${data[0].mes} ${data[0].año}` : ""}{data.length > 1 ? ` — ${data[data.length-1].mes} ${data[data.length-1].año}` : ""}
      </p>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => setView("dash")} style={{ fontWeight: view === "dash" ? 600 : 400, background: view === "dash" ? "var(--bg-tertiary)" : "transparent" }}>Dashboard</button>
        <button onClick={() => setView("import")} style={{ fontWeight: view === "import" ? 600 : 400, background: view === "import" ? "var(--bg-tertiary)" : "transparent" }}>Importar mes</button>
      </div>
    </div>

    {view === "dash" && <>
      {/* Metric cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Ingresos totales" value={fmt(totI)} color="var(--success)" />
        <MetricCard label="Gastos totales" value={fmt(totG)} color="var(--danger)" />
        <MetricCard label="Balance" value={fmt(balance)} color={balance >= 0 ? "var(--success)" : "var(--danger)"} />
        <MetricCard label="Tasa de ahorro" value={totI > 0 ? pct(balance / totI) : "—"} />
      </div>

      {/* Gráfico 1: Líneas suavizadas ingresos vs gastos */}
      {data.length > 0 && <>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 12px" }}>Ingresos vs Gastos mensuales</h3>
        <div style={{ width: "100%", height: 280, marginBottom: 24 }}>
          <ResponsiveContainer>
            <AreaChart data={lineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "var(--text-secondary)" }} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-secondary)" }} tickFormatter={v => fmt(v)} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradI)" dot={{ r: 4, fill: "#22c55e" }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradG)" dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* Gráfico 2: Barras por categoría con media mensual */}
      {catMediaData.length > 0 && <>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Gasto medio mensual por categoría</h3>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
          Media sobre {nMeses} {nMeses === 1 ? "mes" : "meses"}
        </p>
        <div style={{ width: "100%", height: 300, marginBottom: 24 }}>
          <ResponsiveContainer>
            <BarChart data={catMediaData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={11}
                tick={{ fill: "var(--text-secondary)" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis fontSize={11} tick={{ fill: "var(--text-secondary)" }} tickFormatter={v => fmt(v)} width={72} />
              <Tooltip content={<CatTooltip />} />
              <Bar dataKey="Media" radius={[6, 6, 0, 0]} maxBarSize={60}
                label={{ position: "top", fontSize: 10, fill: "var(--text-secondary)", formatter: v => fmt(v) }}
              >
                {catMediaData.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLS[entry.name] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* Tabla resumen mensual */}
      <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Resumen mensual</h3>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
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

      {/* Tabla detalle de todos los gastos */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Detalle de gastos</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={detailSearch}
            onChange={e => setDetailSearch(e.target.value)}
            placeholder="Buscar concepto, categoría..."
            style={{ fontSize: 12, minWidth: 200 }}
          />
          <select value={detailMonth} onChange={e => setDetailMonth(e.target.value)} style={{ fontSize: 12 }}>
            <option value="all">Todos los meses</option>
            {data.map(m => <option key={m.id} value={m.id}>{m.mesN} {m.año}</option>)}
          </select>
        </div>
      </div>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 16 }}>
        {txnDetail.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            No hay transacciones. Importa un mes para ver el detalle.
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Concepto</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Subcategoría</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Categoría</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 500, fontSize: 11, color: "var(--text-tertiary)" }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t, i) => {
                  const col = CAT_COLS[t.cat] || "#94a3b8"
                  return <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>{t.fecha}</td>
                    <td style={{ padding: "7px 12px", maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.concepto}>{t.concepto}</td>
                    <td style={{ padding: "7px 12px", color: "var(--text-secondary)", fontSize: 11 }}>{t.subcat}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: col, background: `${col}18`, padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap" }}>{t.cat}</span>
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger)", whiteSpace: "nowrap" }}>{fmt2(Math.abs(t.importe))}</td>
                  </tr>
                })}
              </tbody>
            </table>
            <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
              <span>{filteredTxns.length} transacciones</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--danger)" }}>
                {fmt2(filteredTxns.reduce((a, t) => a + Math.abs(t.importe), 0))}
              </span>
            </div>
          </>
        )}
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
