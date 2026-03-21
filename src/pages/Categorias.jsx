import { useState, useEffect, useCallback } from 'react'
import { storage } from '../lib/storage'

const INIT = [
  {d:"RECIBO /C.P. C/ AERONAVE, 8-18",s:"Comunidad Garaje",c:"Inmobiliario",r:0},{d:"RECIBO /C.P. C/ ALGEMESI, 26",s:"Comunidad piso algemesi",c:"Inmobiliario",r:0},{d:"RECIB /C.U. APARCAMIENTOS ESFI",s:"Aparcamiento Esfinge",c:"Inmobiliario",r:0},{d:"RECIBO /PCO-ESCOLARIDAD",s:"Colegio Montessori",c:"Educación",r:0},{d:"RECIB /MONTESSORI CONDE DE ORG",s:"Colegio Montessori",c:"Educación",r:0},{d:"RECIBO /PARQUE CONDE DE ORGAZ,",s:"Colegio Montessori",c:"Educación",r:0},{d:"RECIBO /C.P. TIMON 27-33",s:"Comunidad Casa",c:"Inmobiliario",r:0},{d:"RECIB /MONTESSORI SERVICIOS-BA",s:"Colegio Montessori",c:"Educación",r:0},{d:"RECIBO /HOLMES PLACE",s:"Gimnasio",c:"Salud",r:0},{d:"TRANSF /GONZALO MEROÑO PAREDES",s:"Paga Gonzalo",c:"Casa",r:0},{d:"MERCADONA NUEVO ENSANCHE",s:"Alimentación",c:"Hogar",r:0},{d:"EL CORTE INGLES",s:"Ropa",c:"Hogar",r:0},{d:"SCALPERS GRAN VIA 27",s:"Ropa",c:"Hogar",r:0},{d:"HBO MAX",s:"TV Max",c:"Ocio",r:0},{d:"KINDLE SVCS*",s:"Libro",c:"Ocio",r:0},{d:"FNAC CALLAO",s:"Libro",c:"Ocio",r:0},{d:"AHORRAMAS",s:"Alimentación",c:"Hogar",r:0},{d:"E.S. EL PILAR",s:"Gasolina",c:"Hogar",r:0},{d:"PAGO BIZUM A YOLANY SARAHY",s:"Cuidado Madre AB",c:"Hogar",r:0},{d:"PAGO BIZUM A IVAMA CAROLINA",s:"Limpieza",c:"Hogar",r:0},{d:"RECIBO /AYUNTAMIENTO DE MADRID",s:"Impuestos",c:"Hogar",r:0},{d:"RECIB /COLEGIO OFICIAL DE ENFE",s:"Colegio Enfermería",c:"Hogar",r:0},{d:"RECIBO /INTERMON",s:"Donación",c:"Hogar",r:0},{d:"FARMACIA MARTA BERGUA",s:"Farmacia",c:"Salud",r:0},{d:"RECIB /MUTUA MADRILENA AUTOMOV",s:"Seguro Coche",c:"Hogar",r:0},{d:"PLAYSTATION NETWORK",s:"Playstation",c:"Ocio",r:0},{d:"SUPERCOR PALACIO DEL HIEL",s:"Alimentación",c:"Hogar",r:0},{d:"RENFE CERCANIAS",s:"Transporte",c:"Movilidad-Coche",r:0},
  {d:"KFC ALCALA 468",s:"Restaurante",c:"Ocio",r:0},{d:"Jacobs Douwe Egberts",s:"Alimentación",c:"Hogar",r:0},{d:"CAFETERIA VISCONTI",s:"Restaurante",c:"Ocio",r:0},{d:"LA VINA DE NEREA",s:"Restaurante",c:"Ocio",r:0},{d:"CENTRO DE IMAGEN VERA",s:"Belleza y Peluquería",c:"Salud",r:0},{d:"HIPERCOR CAMPO NACIONES",s:"Alimentación",c:"Hogar",r:0},{d:"PERFUMERIA PRIMOR",s:"Belleza y Peluquería",c:"Salud",r:0},{d:"LACAPRI",s:"Restaurante",c:"Ocio",r:0},{d:"ZARA MADRID",s:"Ropa",c:"Hogar",r:0},{d:"APP CRTM",s:"Transporte",c:"Movilidad-Coche",r:0},{d:"RECIB /ASISA",s:"Seguro Salud",c:"Salud",r:0},{d:"VIENA CAPELLANES",s:"Alimentación",c:"Hogar",r:0},{d:"EL TALLER DEL PAN",s:"Alimentación",c:"Hogar",r:0},{d:"PANOBRAR S.L.",s:"Alimentación",c:"Hogar",r:0},{d:"FEET HEALTH",s:"Esteticiene",c:"Salud",r:0},{d:"DP BARAJAS VIRTUAL",s:"Varios",c:"Hogar",r:0},{d:"LIQUID. CUOTA PTMO.",s:"Préstamo",c:"Hogar",r:0},{d:"ALIMENTACION Y BAZAR",s:"Alimentación",c:"Hogar",r:0},{d:"DELIKIA",s:"Alimentación",c:"Hogar",r:0},{d:"HPI INSTANT INK",s:"Impresora",c:"Hogar",r:0},{d:"REEMBOLS PT:",s:"Préstamo",c:"Hogar",r:0},{d:"ASOCIACION PRIMAVERA",s:"Donación",c:"Hogar",r:0},{d:"RECIB /CANAL DE ISABEL II",s:"Gas y Luz",c:"Hogar",r:0},{d:"RECIBO /ORANGE ESPAGNE",s:"Telefono / Internet",c:"Hogar",r:0},{d:"BOLT.EU",s:"Transporte",c:"Movilidad-Coche",r:0},{d:"Cabify",s:"Transporte",c:"Movilidad-Coche",r:0},{d:"EMPRESA MUNICIPAL EMT",s:"Transporte",c:"Movilidad-Coche",r:0},{d:"Telpark",s:"Parking",c:"Movilidad-Coche",r:0},{d:"INDIGO",s:"Parking",c:"Movilidad-Coche",r:0},{d:"VIPS",s:"Restaurante",c:"Ocio",r:0},{d:"RESTAURANTE JOSE MARIA",s:"Restaurante",c:"Ocio",r:0},{d:"FARMACIA TREBOL",s:"Farmacia",c:"Salud",r:0},{d:"LAMIAK",s:"Restaurante",c:"Ocio",r:0},{d:"ZARAJITO",s:"Restaurante",c:"Ocio",r:0},{d:"TABERNA",s:"Restaurante",c:"Ocio",r:0},{d:"TABERA EL TEMPRANILLO",s:"Restaurante",c:"Ocio",r:0},{d:"JENKINS MADRID",s:"Restaurante",c:"Ocio",r:0},{d:"YUCATAN",s:"Restaurante",c:"Ocio",r:0},{d:"QUEEN BURGUER",s:"Restaurante",c:"Ocio",r:0},{d:"AMAZON*",s:"Varios",c:"Hogar",r:0},{d:"POZUELO H.",s:"Alimentación",c:"Hogar",r:0},{d:"MANGO CC PALACIO",s:"Ropa",c:"Hogar",r:0},{d:"SCALPERS FASHION",s:"Ropa",c:"Hogar",r:0},{d:"IRISCOLOURS",s:"Gestiones",c:"Hogar",r:0},{d:"DNI/PASAPORTE",s:"Gestiones",c:"Hogar",r:0},{d:"CAFETERIA VIPS",s:"Restaurante",c:"Ocio",r:0},{d:"ALIMENTACION",s:"Alimentación",c:"Hogar",r:0},{d:"RECIB /COMUNIDAD PROP. PARROCO",s:"Comunidad Garaje",c:"Inmobiliario",r:0},{d:"CARLIN RETAIL",s:"Varios",c:"Hogar",r:0},{d:"TEAM PEREZ",s:"Varios",c:"Hogar",r:0},{d:"RELOJERIA ALIAGA",s:"Varios",c:"Hogar",r:0},{d:"COM REEM PT:",s:"Préstamo",c:"Hogar",r:0},{d:"VALDEBEBAS",s:"Restaurante",c:"Ocio",r:0},{d:"MADRID FILIPINAS",s:"Restaurante",c:"Ocio",r:0},{d:"SPAIN.GASTRONOMICO",s:"Restaurante",c:"Ocio",r:0}
]
const D_CATS = ["Casa","Educación","Hogar","Inmobiliario","Movilidad-Coche","Ocio","Retirada Efectivo","Salud","Ingresos"]
const D_SUBS = {"Casa":["Paga Gonzalo"],"Educación":["Colegio Montessori"],"Hogar":["Alimentación","Belleza y Peluquería","Colegio Enfermería","Comida Trabajo","Cuidado Madre AB","Donación","Gas y Luz","Gasolina","Gestiones","Impresora","Impuestos","Limpieza","Mascotas","Préstamo","Ropa","Seguro Coche","Telefono / Internet","Transporte","Varios"],"Inmobiliario":["Aparcamiento Esfinge","Comunidad Casa","Comunidad Garaje","Comunidad piso algemesi"],"Movilidad-Coche":["Parking","Transporte","Gasolina"],"Ocio":["Libro","Playstation","Restaurante","TV Max","Teatro","Viaje Ski"],"Retirada Efectivo":["Retirada Efectivo"],"Salud":["Esteticiene","Farmacia","Gimnasio","Seguro Salud","Belleza y Peluquería"],"Ingresos":["Nómina","Transferencia","Bizum Recibido","Subvención","Inversión"]}
const COLS = {"Casa":"#8b5cf6","Educación":"#3b82f6","Hogar":"#10b981","Inmobiliario":"#6366f1","Movilidad-Coche":"#f97316","Ocio":"#ec4899","Retirada Efectivo":"#78716c","Salud":"#ef4444","Ingresos":"#22c55e","REVISAR":"#eab308"}
const SK = "cc-cats-v4"

export default function Categorias() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [subs, setSubs] = useState({})
  const [view, setView] = useState("list")
  const [q, setQ] = useState("")
  const [fc, setFc] = useState("Todas")
  const [fr, setFr] = useState(false)
  const [toast, setToast] = useState(null)
  const [eI, setEI] = useState(null)
  const [eC, setEC] = useState("")
  const [eS, setES] = useState("")
  const [eCS, setECS] = useState("")
  const [aD, setAD] = useState("")
  const [aC, setAC] = useState("")
  const [aS, setAS] = useState("")
  const [aCS, setACS] = useState("")
  const [aR, setAR] = useState(false)
  const [bulk, setBulk] = useState("")
  const [nCat, setNCat] = useState("")
  const [nCol, setNCol] = useState("#6366f1")
  const [nSub, setNSub] = useState("")
  const [expCat, setExpCat] = useState(null)

  const msg = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 2200) }

  useEffect(() => {
    const d = storage.get(SK)
    if (d) { setItems(d.i || []); setCats(d.c || D_CATS); setSubs(d.s || D_SUBS) }
    else { setItems(INIT); setCats(D_CATS); setSubs(D_SUBS) }
  }, [])

  const sv = useCallback((ni, nc, ns) => {
    storage.set(SK, { i: ni ?? items, c: nc ?? cats, s: ns ?? subs })
  }, [items, cats, subs])

  const addOne = () => {
    if (!aD.trim()) { msg("Escribe descripción", "err"); return }
    const sub = aS === "__c" ? aCS : aS
    if (!aR && (!aC || !sub)) { msg("Selecciona categoría y subcategoría", "err"); return }
    if (items.find(i => i.d.toUpperCase() === aD.trim().toUpperCase())) { msg("Ya existe", "err"); return }
    let newSubs = subs
    if (aS === "__c" && aCS.trim() && aC) {
      const ex = subs[aC] || []
      if (!ex.includes(aCS.trim())) { newSubs = { ...subs, [aC]: [...ex, aCS.trim()] }; setSubs(newSubs) }
    }
    const ni = [...items, { d: aD.trim(), s: aR ? "REVISAR" : sub, c: aR ? "REVISAR" : aC, r: aR ? 1 : 0 }]
    setItems(ni); sv(ni, null, newSubs)
    setAD(""); setAC(""); setAS(""); setACS(""); setAR(false); msg(aR ? "Marcada para revisar" : "Añadida")
  }

  const bulkAdd = () => {
    const ls = bulk.split("\n").filter(l => l.trim()); if (!ls.length) return
    const ex = new Set(items.map(i => i.d.toUpperCase()))
    const add = ls.filter(l => !ex.has(l.trim().toUpperCase())).map(l => ({ d: l.trim(), s: "REVISAR", c: "REVISAR", r: 1 }))
    if (!add.length) { msg("Todas existen", "err"); return }
    const ni = [...items, ...add]; setItems(ni); sv(ni)
    setBulk(""); setView("list"); setFr(true); setFc("Todas"); msg(`${add.length} añadidas para revisar`)
  }

  const upd = (idx) => {
    const sub = eS === "__c" ? eCS : eS; if (!sub || !eC) return
    let newSubs = subs
    if (eS === "__c" && eCS.trim() && eC) {
      const ex = subs[eC] || []
      if (!ex.includes(eCS.trim())) { newSubs = { ...subs, [eC]: [...ex, eCS.trim()] }; setSubs(newSubs) }
    }
    const ni = [...items]; ni[idx] = { ...ni[idx], s: sub, c: eC, r: 0 }
    setItems(ni); sv(ni, null, newSubs); setEI(null); msg("Actualizada")
  }

  const togR = (idx) => { const ni = [...items]; ni[idx] = { ...ni[idx], r: ni[idx].r ? 0 : 1 }; setItems(ni); sv(ni) }
  const del = (idx) => { const ni = items.filter((_, i) => i !== idx); setItems(ni); sv(ni); msg("Eliminada") }

  const addCat = () => {
    if (!nCat.trim() || cats.includes(nCat.trim())) { msg("Nombre vacío o duplicado", "err"); return }
    const nc = [...cats, nCat.trim()]; const ns = { ...subs, [nCat.trim()]: [] }; COLS[nCat.trim()] = nCol
    setCats(nc); setSubs(ns); sv(null, nc, ns); setNCat(""); msg(`"${nCat.trim()}" creada`)
  }
  const delCat = (c) => {
    if (items.some(i => i.c === c)) { msg(`Hay items en "${c}"`, "err"); return }
    const nc = cats.filter(x => x !== c); const ns = { ...subs }; delete ns[c]
    setCats(nc); setSubs(ns); sv(null, nc, ns); msg(`"${c}" eliminada`)
  }
  const addSub = (p) => {
    if (!nSub.trim() || (subs[p] || []).includes(nSub.trim())) { msg("Vacío o duplicado", "err"); return }
    const ns = { ...subs, [p]: [...(subs[p] || []), nSub.trim()] }; setSubs(ns); sv(null, null, ns); setNSub(""); msg("Subcategoría añadida")
  }
  const delSub = (p, s) => {
    if (items.some(i => i.c === p && i.s === s)) { msg(`Hay items con "${s}"`, "err"); return }
    const ns = { ...subs, [p]: (subs[p] || []).filter(x => x !== s) }; setSubs(ns); sv(null, null, ns); msg("Eliminada")
  }

  const filt = items.filter(i => {
    if (fr && !i.r) return false
    if (fc !== "Todas" && i.c !== fc) return false
    if (q && !i.d.toLowerCase().includes(q.toLowerCase()) && !i.s.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const rc = items.filter(i => i.r).length
  const cc = {}; items.forEach(i => { cc[i.c] = (cc[i.c] || 0) + 1 })

  const CatSel = ({ v, on, st }) => <select value={v} onChange={on} style={st}><option value="">Categoría...</option>{cats.map(c => <option key={c}>{c}</option>)}</select>
  const SubSel = ({ cat: p, v, on, cv, co, st }) => <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><select value={v} onChange={on} style={st}><option value="">Subcategoría...</option>{p && (subs[p] || []).map(s => <option key={s}>{s}</option>)}<option value="__c">+ Nueva</option></select>{v === "__c" && <input value={cv} onChange={co} placeholder="Nombre..." style={{ fontSize: 11, background: 'var(--warning-bg)', borderColor: '#f59e0b' }} />}</div>

  const tabs = [{ id: "list", l: "Catálogo" }, { id: "add", l: "Añadir" }, { id: "manage", l: "Categorías" }]

  return <div>
    {toast && <div style={{ position: "fixed", top: 12, right: 12, zIndex: 99, padding: "8px 16px", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, background: toast.t === "err" ? "var(--danger-bg)" : "var(--success-bg)", color: toast.t === "err" ? "var(--danger)" : "var(--success)", border: `1px solid ${toast.t === "err" ? "var(--danger)" : "var(--success)"}22` }}>{toast.m}</div>}

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{items.length} descripciones · {cats.length} categorías{rc > 0 && <span style={{ color: "var(--warning)", fontWeight: 500 }}> · {rc} por revisar</span>}</p>
      <div style={{ display: "flex", gap: 4 }}>{tabs.map(t => <button key={t.id} onClick={() => setView(t.id)} style={{ fontWeight: view === t.id ? 600 : 400, background: view === t.id ? "var(--bg-tertiary)" : "transparent" }}>{t.l}</button>)}</div>
    </div>

    {view === "list" && <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar descripción o subcategoría..." style={{ flex: 1, minWidth: 160 }} />
        <select value={fc} onChange={e => setFc(e.target.value)} style={{ minWidth: 140 }}>
          <option value="Todas">Todas ({items.length})</option>
          {cats.map(c => <option key={c} value={c}>{c} ({cc[c] || 0})</option>)}
          {cc["REVISAR"] && <option value="REVISAR">REVISAR ({cc["REVISAR"]})</option>}
        </select>
        <button onClick={() => setFr(!fr)} style={{ fontWeight: fr ? 600 : 400, background: fr ? "var(--warning-bg)" : "transparent", color: fr ? "var(--warning)" : undefined }}>Solo revisar{rc > 0 && ` (${rc})`}</button>
      </div>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "32px minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) 72px", padding: "8px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)" }}>
          <span>⚑</span><span>Descripción</span><span>Subcategoría</span><span>Categoría</span><span></span>
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {filt.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>{fr ? "Todo categorizado" : "Sin resultados"}</div>
            : filt.map(item => {
              const ri = items.indexOf(item); const isE = eI === ri; const col = COLS[item.c] || "var(--text-tertiary)"
              return <div key={ri} style={{ display: "grid", gridTemplateColumns: "32px minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) 72px", padding: "7px 12px", borderBottom: "1px solid var(--border)", fontSize: 12, alignItems: "center", background: isE || item.r ? "var(--warning-bg)" : "transparent" }}>
                <span onClick={() => togR(ri)} style={{ cursor: "pointer", fontSize: 14, opacity: item.r ? 1 : .2 }}>⚑</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }} title={item.d}>{item.d}</span>
                {isE ? <>
                  <SubSel cat={eC} v={eS} on={e => setES(e.target.value)} cv={eCS} co={e => setECS(e.target.value)} />
                  <CatSel v={eC} on={e => { setEC(e.target.value); setES("") }} />
                  <div style={{ display: "flex", gap: 3 }}>
                    <button onClick={() => upd(ri)} style={{ fontSize: 11, padding: "3px 8px", background: "var(--success-bg)", color: "var(--success)" }}>✓</button>
                    <button onClick={() => setEI(null)} style={{ fontSize: 11, padding: "3px 8px" }}>✕</button>
                  </div>
                </> : <>
                  <span style={{ color: "var(--text-secondary)" }}>{item.s}</span>
                  <span style={{ fontSize: 10, fontWeight: 500, color: col, background: `${col}18`, padding: "2px 8px", borderRadius: 12, width: "fit-content", whiteSpace: "nowrap" }}>{item.c}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => { setEI(ri); setEC(item.c); setES(item.s); setECS("") }} style={{ fontSize: 11, padding: "2px 6px" }}>✎</button>
                    <button onClick={() => del(ri)} style={{ fontSize: 11, padding: "2px 6px" }}>✕</button>
                  </div>
                </>}
              </div>
            })}
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, textAlign: "right" }}>{filt.length} de {items.length}</p>
    </>}

    {view === "add" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500 }}>Añadir descripción</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={aD} onChange={e => setAD(e.target.value)} placeholder="Descripción del banco" style={{ fontFamily: "var(--font-mono)" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, padding: "8px 12px", borderRadius: "var(--radius)", border: aR ? "1px solid #f59e0b" : "1px solid var(--border)", background: aR ? "var(--warning-bg)" : "transparent" }}>
            <input type="checkbox" checked={aR} onChange={e => setAR(e.target.checked)} />
            <span>Marcar para revisar</span>
          </label>
          {!aR && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Categoría</label><CatSel v={aC} on={e => { setAC(e.target.value); setAS("") }} st={{ width: "100%" }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Subcategoría</label><SubSel cat={aC} v={aS} on={e => setAS(e.target.value)} cv={aCS} co={e => setACS(e.target.value)} st={{ width: "100%" }} /></div>
          </div>}
          <button onClick={addOne}>{aR ? "Añadir como revisar" : "Añadir al catálogo"}</button>
        </div>
      </div>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Añadir varias de golpe</h3>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-secondary)" }}>Una por línea. Todas se marcan para revisar.</p>
        <textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={4} placeholder="RESTAURANTE LA BARCA&#10;CARREFOUR EXPRESS" style={{ fontFamily: "var(--font-mono)", fontSize: 11, width: "100%" }} />
        <button onClick={bulkAdd} style={{ width: "100%", marginTop: 8 }}>Añadir todas para revisar</button>
      </div>
    </div>}

    {view === "manage" && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500 }}>Crear categoría</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Nombre</label>
            <input value={nCat} onChange={e => setNCat(e.target.value)} placeholder="Ej: Suscripciones" onKeyDown={e => { if (e.key === "Enter") addCat() }} style={{ width: "100%" }} />
          </div>
          <input type="color" value={nCol} onChange={e => setNCol(e.target.value)} style={{ width: 38, height: 36, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2 }} />
          <button onClick={addCat}>+ Crear</button>
        </div>
      </div>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500 }}>Categorías y subcategorías</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cats.map(cat => {
            const col = COLS[cat] || "#64748b"; const isO = expCat === cat; const sb = subs[cat] || []; const cnt = cc[cat] || 0
            return <div key={cat} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <div onClick={() => setExpCat(isO ? null : cat)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", cursor: "pointer", background: isO ? "var(--bg-secondary)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: col, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{cat}</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{cnt} desc · {sb.length} subcat</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {cnt === 0 && <button onClick={e => { e.stopPropagation(); delCat(cat) }} style={{ fontSize: 10, padding: "2px 8px", color: "var(--danger)", background: "var(--danger-bg)" }}>Eliminar</button>}
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", transition: "transform .2s", transform: isO ? "rotate(90deg)" : "none", display: "inline-block" }}>▶</span>
                </div>
              </div>
              {isO && <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {sb.length === 0 && <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontStyle: "italic" }}>Sin subcategorías</span>}
                  {sb.map(s => { const sc = items.filter(i => i.c === cat && i.s === s).length; return <div key={s} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: "var(--radius)", background: "var(--bg-primary)", border: "1px solid var(--border)", fontSize: 11 }}><span>{s}</span><span style={{ color: "var(--text-tertiary)", fontSize: 9 }}>({sc})</span>{sc === 0 && <span onClick={() => delSub(cat, s)} style={{ cursor: "pointer", color: "var(--danger)", fontSize: 9, marginLeft: 2 }}>✕</span>}</div> })}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={expCat === cat ? nSub : ""} onChange={e => setNSub(e.target.value)} placeholder="Nueva subcategoría..." onKeyDown={e => { if (e.key === "Enter") addSub(cat) }} style={{ flex: 1, fontSize: 12 }} />
                  <button onClick={() => addSub(cat)} style={{ fontSize: 12 }}>+ Añadir</button>
                </div>
              </div>}
            </div>
          })}
        </div>
      </div>
    </div>}
  </div>
}
