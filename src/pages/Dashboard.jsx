import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { storage } from '../lib/storage'

const SK = "cc-dashboard-v2"
const SK_TXN = "cc-txn-detail-v1"
const SK_CATS = "cc-cats-v4"
const SK_EXCL = "cc-excluded-cats-v1"
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const CAT_COLS = {"Hogar":"#10b981","Educación":"#3b82f6","Ocio":"#ec4899","Inmobiliario":"#6366f1","Salud":"#ef4444","Movilidad-Coche":"#f97316","Casa":"#8b5cf6","Retirada Efectivo":"#78716c","REVISAR":"#eab308"}

const fmt = n => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:0}).format(n)
const fmt2 = n => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:2}).format(n)
const pct = n => (n*100).toFixed(1)+"%"

// Parser robusto: maneja "-1.234,56 €", "1.200,00 €", "-69,58 €", etc.
const parseImporte = (raw) => {
  const clean = raw.replace(/[€\s]/g, "").replace(/\./g, "").replace(",", ".")
  return parseFloat(clean)
}

export default function Dashboard() {
  const [data, setData] = useState([])
  const [txnDetail, setTxnDetail] = useState([])
  const [view, setView] = useState("dash")
  const [paste, setPaste] = useState("")
  const [toast, setToast] = useState(null)
  const [detailMonth, setDetailMonth] = useState("all")
  const [detailSearch, setDetailSearch] = useState("")
  const [excludedCats, setExcludedCats] = useState([])
  const [availableCats, setAvailableCats] = useState([])
  // Edición inline de concepto en tabla de transacciones
  const [editConceptoIdx, setEditConceptoIdx] = useState(null)
  const [editConceptoVal, setEditConceptoVal] = useState("")

  const msg = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const load = async () => {
      const d = await storage.get(SK)
      if (d) setData(d.months || [])
      const txn = await storage.get(SK_TXN)
      if (txn) setTxnDetail(txn.txns || [])
      const excl = await storage.get(SK_EXCL)
      if (excl) setExcludedCats(excl.cats || [])
      const cats = await storage.get(SK_CATS)
      if (cats && cats.c) setAvailableCats(cats.c)
    }
    load()
    const unsub = storage.subscribe(SK, (d) => { if (d && d.months) setData(d.months) })
    const unsub2 = storage.subscribe(SK_TXN, (d) => { if (d && d.txns) setTxnDetail(d.txns) })
    const unsub3 = storage.subscribe(SK_EXCL, (d) => { if (d) setExcludedCats(d.cats || []) })
    const unsub4 = storage.subscribe(SK_CATS, (d) => { if (d && d.c) setAvailableCats(d.c) })
    return () => { if (unsub) unsub(); if (unsub2) unsub2(); if (unsub3) unsub3(); if (unsub4) unsub4() }
  }, [])

  const sv = useCallback(async (d) => { await storage.set(SK, { months: d }) }, [])
  const svTxn = useCallback(async (t) => { await storage.set(SK_TXN, { txns: t }) }, [])
  const svExcl = useCallback(async (cats) => { await storage.set(SK_EXCL, { cats }) }, [])

  const toggleExcludedCat = async (cat) => {
    const next = excludedCats.includes(cat)
      ? excludedCats.filter(c => c !== cat)
      : [...excludedCats, cat]
    setExcludedCats(next)
    await svExcl(next)
  }

  const saveConcepto = async (globalIdx, newConcepto) => {
    if (!newConcepto.trim()) return
    const updated = txnDetail.map((t, i) => i === globalIdx ? { ...t, concepto: newConcepto.trim() } : t)
    setTxnDetail(updated)
    await svTxn(updated)
    setEditConceptoIdx(null)
    setEditConceptoVal("")
    msg("Concepto actualizado")
  }
  const applyConceptCatalog = async (txns) => {
    const catalogRaw = await storage.get(SK_CATS)
    if (!catalogRaw || !catalogRaw.i) return txns
    const catalog = catalogRaw.i
    const catalogMap = {}
    catalog.forEach(entry => {
      if (entry.c && entry.c !== "REVISAR" && entry.s && entry.s !== "REVISAR") {
        catalogMap[entry.d.trim().toUpperCase()] = { cat: entry.c, subcat: entry.s }
      }
    })
    return txns.map(t => {
      if (t.tipo === "Ingreso") return t
      const match = catalogMap[t.concepto?.trim().toUpperCase()]
      if (match) return { ...t, cat: match.cat, subcat: match.subcat }
      return t
    })
  }

  const importData = async () => {
    if (!paste.trim()) { msg("Pega datos del Google Sheet", "err"); return }
    const lines = paste.trim().split("\n")
    const txns = []
    let skipped = 0

    for (const line of lines) {
      if (!line.trim()) continue
      const cols = line.split("\t")
      if (cols.length < 6) { skipped++; continue }

      const fecha      = cols[0]?.trim() || ""
      const concepto   = cols[1]?.trim() || ""
      const importeStr = cols[2]?.trim() || ""
      const tipo       = cols[3]?.trim() || ""
      const subcat     = cols[4]?.trim() || ""
      const cat        = cols[5]?.trim() || ""
      const mes        = cols[6]?.trim() || ""
      const añoStr     = cols[7]?.trim() || ""

      if (tipo === "Tipo" || !fecha || !concepto || !importeStr) { skipped++; continue }

      const importe = parseImporte(importeStr)
      if (isNaN(importe)) { skipped++; continue }

      const mesReal = mes || "Enero"
      const añoReal = parseInt(añoStr) || new Date().getFullYear()
      txns.push({ fecha, concepto, importe, tipo, subcat, cat, mes: mesReal, año: añoReal })
    }

    if (!txns.length) { msg("No se encontraron transacciones válidas", "err"); return }

    // Aplicar catálogo de conceptos para auto-categorizar
    const txnsCategorized = await applyConceptCatalog(txns)

    const mesesAfectados = new Set(txnsCategorized.map(t =>
      `${t.año}-${String(MESES.indexOf(t.mes) + 1).padStart(2, "0")}`
    ))

    const newTxns = txnDetail.filter(x => !mesesAfectados.has(x.mesId))
    txnsCategorized.forEach(t => {
      const key = `${t.año}-${String(MESES.indexOf(t.mes) + 1).padStart(2, "0")}`
      newTxns.push({ ...t, mesId: key })
    })
    newTxns.sort((a, b) =>
      (a.mesId || "").localeCompare(b.mesId || "") ||
      (a.fecha || "").localeCompare(b.fecha || "")
    )
    setTxnDetail(newTxns)
    await svTxn(newTxns)

    const groups = {}
    txnsCategorized.forEach(t => {
      const key = `${t.año}-${String(MESES.indexOf(t.mes) + 1).padStart(2, "0")}`
      if (!groups[key]) groups[key] = { id: key, mes: t.mes.substring(0, 3), año: t.año, mesN: t.mes, ingresos: 0, gastos: 0, cats: {} }
      if (t.tipo === "Ingreso") groups[key].ingresos += t.importe
      else {
        groups[key].gastos += Math.abs(t.importe)
        groups[key].cats[t.cat] = (groups[key].cats[t.cat] || 0) + Math.abs(t.importe)
      }
    })

    const newMonths = data.filter(m => !mesesAfectados.has(m.id))
    Object.values(groups).forEach(g => newMonths.push(g))
    newMonths.sort((a, b) => a.id.localeCompare(b.id))
    setData(newMonths)
    sv(newMonths)
    setPaste("")
    setView("dash")
    const autoCat = txnsCategorized.filter(t => t.tipo !== "Ingreso" && t.cat && t.cat !== "REVISAR" && t.cat !== "").length
    const total = txnsCategorized.filter(t => t.tipo !== "Ingreso").length
    msg(`${txnsCategorized.length} transacciones en ${Object.keys(groups).length} mes(es) · ${autoCat}/${total} gastos auto-categorizados${skipped > 0 ? ` · ${skipped} ignoradas` : ""}`)
  }

  const delMonth = async (id) => {
    const nd = data.filter(m => m.id !== id); setData(nd); sv(nd)
    const nt = txnDetail.filter(t => t.mesId !== id); setTxnDetail(nt); svTxn(nt)
    msg("Mes eliminado")
  }

  // Transacciones y meses filtrados excluyendo categorías marcadas como excluidas
  const txnDetailFiltered = txnDetail.filter(t => !excludedCats.includes(t.cat))

  const dataFiltered = data.map(m => {
    const catsFiltered = Object.fromEntries(
      Object.entries(m.cats).filter(([cat]) => !excludedCats.includes(cat))
    )
    const gastosFiltered = Object.values(catsFiltered).reduce((a, v) => a + v, 0)
    return { ...m, cats: catsFiltered, gastos: gastosFiltered }
  })

  const totI = dataFiltered.reduce((a, m) => a + m.ingresos, 0)
  const totG = dataFiltered.reduce((a, m) => a + m.gastos, 0)
  const balance = totI - totG

  const lineData = dataFiltered.map(m => ({
    name: `${m.mes} ${m.año}`,
    Ingresos: Math.round(m.ingresos),
    Gastos: Math.round(m.gastos),
  }))

  const allCats = [...new Set(dataFiltered.flatMap(m => Object.keys(m.cats)))].filter(c => c !== "REVISAR").sort()
  const nMeses = data.length || 1
  const catMediaData = allCats.map(cat => ({
    name: cat,
    Media: Math.round(dataFiltered.reduce((a, m) => a + (m.cats[cat] || 0), 0) / nMeses)
  })).sort((a, b) => b.Media - a.Media)

  const filteredTxns = txnDetailFiltered.filter(t => {
    if (detailMonth !== "all" && t.mesId !== detailMonth) return false
    if (detailSearch) {
      const q = detailSearch.toLowerCase()
      if (!t.concepto?.toLowerCase().includes(q) &&
          !t.cat?.toLowerCase().includes(q) &&
          !t.subcat?.toLowerCase().includes(q)) return false
    }
    return true
  })

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
        {excludedCats.length > 0 && <span style={{ color: "var(--warning)", fontWeight: 500 }}> · {excludedCats.length} categoría{excludedCats.length > 1 ? "s" : ""} excluida{excludedCats.length > 1 ? "s" : ""}</span>}
      </p>
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
              <YAxis fontSize={11} tick={{ fill: "var(--text-secondary)" }} tickFormatter={v => fmt(v)} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradI)" dot={{ r: 4, fill: "#22c55e" }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradG)" dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </>}

      {catMediaData.length > 0 && <>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Gasto medio mensual por categoría</h3>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>Media sobre {nMeses} {nMeses === 1 ? "mes" : "meses"}</p>
        <div style={{ width: "100%", height: 300, marginBottom: 24 }}>
          <ResponsiveContainer>
            <BarChart data={catMediaData} margin={{ top: 16, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "var(--text-secondary)" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-secondary)" }} tickFormatter={v => fmt(v)} width={80} />
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
            {dataFiltered.map(m => {
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
            {dataFiltered.length > 1 && <tr style={{ background: "var(--bg-secondary)" }}>
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Detalle de transacciones</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={detailSearch} onChange={e => setDetailSearch(e.target.value)} placeholder="Buscar concepto, categoría..." style={{ fontSize: 12, minWidth: 200 }} />
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
        ) : <>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
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
                  const esIngreso = t.tipo === "Ingreso"
                  // El índice global en txnDetail (necesario para editar correctamente)
                  const globalIdx = txnDetail.indexOf(t)
                  const isEditing = editConceptoIdx === globalIdx
                  return <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>{t.fecha}</td>
                    <td style={{ padding: "7px 12px", maxWidth: 260 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input
                            autoFocus
                            value={editConceptoVal}
                            onChange={e => setEditConceptoVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") saveConcepto(globalIdx, editConceptoVal)
                              if (e.key === "Escape") { setEditConceptoIdx(null); setEditConceptoVal("") }
                            }}
                            style={{ fontSize: 11, flex: 1, fontFamily: "var(--font-mono)", padding: "2px 6px" }}
                          />
                          <button onClick={() => saveConcepto(globalIdx, editConceptoVal)} style={{ fontSize: 10, padding: "2px 6px", background: "var(--success-bg)", color: "var(--success)" }}>✓</button>
                          <button onClick={() => { setEditConceptoIdx(null); setEditConceptoVal("") }} style={{ fontSize: 10, padding: "2px 6px" }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", overflow: "hidden" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }} title={t.concepto}>{t.concepto}</span>
                          <button
                            onClick={() => { setEditConceptoIdx(globalIdx); setEditConceptoVal(t.concepto) }}
                            style={{ fontSize: 9, padding: "1px 5px", opacity: 0.4, flexShrink: 0 }}
                            title="Editar concepto"
                          >✎</button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "7px 12px", color: "var(--text-secondary)", fontSize: 11 }}>{t.subcat}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: col, background: `${col}18`, padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap" }}>{t.cat}</span>
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: esIngreso ? "var(--success)" : "var(--danger)", whiteSpace: "nowrap" }}>
                      {esIngreso ? "+" : ""}{fmt2(Math.abs(t.importe))}
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
            <span>{filteredTxns.length} transacciones</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
              Gastos: <span style={{ color: "var(--danger)" }}>{fmt2(filteredTxns.filter(t => t.tipo !== "Ingreso").reduce((a, t) => a + Math.abs(t.importe), 0))}</span>
              {" · "}
              Ingresos: <span style={{ color: "var(--success)" }}>{fmt2(filteredTxns.filter(t => t.tipo === "Ingreso").reduce((a, t) => a + t.importe, 0))}</span>
            </span>
          </div>
        </>}
      </div>
    </>}

    {view === "import" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Importar datos del Google Sheet</h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Abre tu Google Sheet "FINANZAS CASA", pestaña "Transacciones". Selecciona las filas con datos (sin cabecera), copia con Ctrl+C y pega aquí.
        </p>
        <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={8}
          placeholder={"02/01/2025\tMERCADONA\t-85,30 €\tGasto\tAlimentación\tHogar\tEnero\t2025"}
          style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={importData} style={{ flex: 1 }}>Importar datos</button>
          <button onClick={() => { setPaste(""); setView("dash") }} style={{ color: "var(--text-secondary)" }}>Cancelar</button>
        </div>
      </div>
      <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius)", padding: "1rem", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 500, color: "var(--text-primary)" }}>Cómo funciona</p>
        <p style={{ margin: 0 }}>Los datos se agrupan automáticamente por mes. Si reimportas un mes ya existente, se sobreescribe. Al importar, cada gasto se categoriza automáticamente si su concepto está en el catálogo.</p>
      </div>

      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Categorías excluidas del dashboard</h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Las categorías marcadas no aparecen en gráficos ni totales. Los registros se conservan.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[...new Set([...availableCats, ...Object.keys(CAT_COLS).filter(c => c !== "REVISAR")])].sort().map(cat => {
            const col = CAT_COLS[cat] || "#64748b"
            const isExcluded = excludedCats.includes(cat)
            return (
              <button key={cat} onClick={() => toggleExcludedCat(cat)} style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 20,
                border: `1px solid ${isExcluded ? "#94a3b8" : col}`,
                background: isExcluded ? "var(--bg-secondary)" : `${col}18`,
                color: isExcluded ? "var(--text-tertiary)" : col,
                textDecoration: isExcluded ? "line-through" : "none",
                opacity: isExcluded ? 0.6 : 1, cursor: "pointer"
              }}>
                {isExcluded ? "✕ " : ""}{cat}
              </button>
            )
          })}
        </div>
        {excludedCats.length > 0 && (
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--warning)" }}>
            Excluidas del dashboard: {excludedCats.join(", ")}
          </p>
        )}
      </div>
    </div>}
  </div>
}
