'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/* ── Theme ──────────────────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }
  return { theme, toggleTheme };
}

/* ── Constants ──────────────────────────────────────────────── */
const CORP_ID = '00000000-0000-0000-0000-000000000001';

const MODELS = [
  { v:'iPhone 11',          chip:'A13 Bionic', gen:'11' },
  { v:'iPhone 11 Pro',      chip:'A13 Bionic', gen:'11' },
  { v:'iPhone 11 Pro Max',  chip:'A13 Bionic', gen:'11' },
  { v:'iPhone 12 Mini',     chip:'A14 Bionic', gen:'12' },
  { v:'iPhone 12',          chip:'A14 Bionic', gen:'12' },
  { v:'iPhone 12 Pro',      chip:'A14 Bionic', gen:'12' },
  { v:'iPhone 12 Pro Max',  chip:'A14 Bionic', gen:'12' },
  { v:'iPhone 13 Mini',     chip:'A15 Bionic', gen:'13' },
  { v:'iPhone 13',          chip:'A15 Bionic', gen:'13' },
  { v:'iPhone 13 Pro',      chip:'A15 Bionic', gen:'13' },
  { v:'iPhone 13 Pro Max',  chip:'A15 Bionic', gen:'13' },
  { v:'iPhone 14',          chip:'A15 Bionic', gen:'14' },
  { v:'iPhone 14 Plus',     chip:'A15 Bionic', gen:'14' },
  { v:'iPhone 14 Pro',      chip:'A16 Bionic', gen:'14' },
  { v:'iPhone 14 Pro Max',  chip:'A16 Bionic', gen:'14' },
  { v:'iPhone 15',          chip:'A16 Bionic', gen:'15' },
  { v:'iPhone 15 Plus',     chip:'A16 Bionic', gen:'15' },
  { v:'iPhone 15 Pro',      chip:'A17 Pro',    gen:'15' },
  { v:'iPhone 15 Pro Max',  chip:'A17 Pro',    gen:'15' },
  { v:'iPhone 16',          chip:'A18',        gen:'16' },
  { v:'iPhone 16 Plus',     chip:'A18',        gen:'16' },
  { v:'iPhone 16 Pro',      chip:'A18 Pro',    gen:'16' },
  { v:'iPhone 16 Pro Max',  chip:'A18 Pro',    gen:'16' },
  { v:'iPhone 17',          chip:'A19',        gen:'17' },
  { v:'iPhone 17 Air',      chip:'A19',        gen:'17' },
  { v:'iPhone 17 Pro',      chip:'A19 Pro',    gen:'17' },
  { v:'iPhone 17 Pro Max',  chip:'A19 Pro',    gen:'17' },
];

const CAPACITIES = ['64 GB','128 GB','256 GB','512 GB','1 TB'];

const MODEL_COLORS = {
  'iPhone 11':         ['Negro','Blanco','Rojo','Amarillo','Morado','Verde'],
  'iPhone 11 Pro':     ['Gris Espacial','Plata','Oro','Verde Noche'],
  'iPhone 11 Pro Max': ['Gris Espacial','Plata','Oro','Verde Noche'],
  'iPhone 12 Mini':    ['Negro','Blanco','Rojo','Azul','Verde'],
  'iPhone 12':         ['Negro','Blanco','Rojo','Azul','Verde','Morado'],
  'iPhone 12 Pro':     ['Grafito','Plata','Oro','Azul Pacífico'],
  'iPhone 12 Pro Max': ['Grafito','Plata','Oro','Azul Pacífico'],
  'iPhone 13 Mini':    ['Negro Noche','Blanco Estrella','Rojo','Azul','Rosa','Verde'],
  'iPhone 13':         ['Negro Noche','Blanco Estrella','Rojo','Azul','Rosa','Verde'],
  'iPhone 13 Pro':     ['Grafito','Plata','Oro','Azul Sierra','Verde Alpino'],
  'iPhone 13 Pro Max': ['Grafito','Plata','Oro','Azul Sierra','Verde Alpino'],
  'iPhone 14':         ['Negro Noche','Blanco Estrella','Rojo','Azul','Morado','Amarillo'],
  'iPhone 14 Plus':    ['Negro Noche','Blanco Estrella','Rojo','Azul','Morado','Amarillo'],
  'iPhone 14 Pro':     ['Negro Espacial','Plata','Oro','Morado Oscuro'],
  'iPhone 14 Pro Max': ['Negro Espacial','Plata','Oro','Morado Oscuro'],
  'iPhone 15':         ['Negro','Rosa','Amarillo','Verde','Azul'],
  'iPhone 15 Plus':    ['Negro','Rosa','Amarillo','Verde','Azul'],
  'iPhone 15 Pro':     ['Titanio Negro','Titanio Blanco','Titanio Natural','Titanio Azul'],
  'iPhone 15 Pro Max': ['Titanio Negro','Titanio Blanco','Titanio Natural','Titanio Azul'],
  'iPhone 16':         ['Negro','Blanco','Rosa','Verde Menta','Ultramarino'],
  'iPhone 16 Plus':    ['Negro','Blanco','Rosa','Verde Menta','Ultramarino'],
  'iPhone 16 Pro':     ['Titanio Negro','Titanio Blanco','Titanio Natural','Titanio del Desierto'],
  'iPhone 16 Pro Max': ['Titanio Negro','Titanio Blanco','Titanio Natural','Titanio del Desierto'],
  'iPhone 17':         ['Negro','Blanco','Rosa','Verde','Azul'],
  'iPhone 17 Air':     ['Negro','Blanco','Rosa','Verde','Azul'],
  'iPhone 17 Pro':     ['Titanio Negro','Titanio Blanco','Titanio Natural','Titanio del Desierto'],
  'iPhone 17 Pro Max': ['Titanio Negro','Titanio Blanco','Titanio Natural','Titanio del Desierto'],
};

const CONDITIONS = [
  { value:'nuevo',     label:'✨ Nuevo — sellado de fábrica',    color:'#30D158' },
  { value:'open_box',  label:'📦 Open Box — sin usar, sin caja', color:'#34C759' },
  { value:'excelente', label:'⭐ Excelente (A+) — sin marcas',   color:'#0A84FF' },
  { value:'bueno',     label:'👍 Bueno (A) — uso leve',          color:'#4DA8FF' },
  { value:'regular',   label:'🔧 Regular (B) — marcas visibles', color:'#FF9F0A' },
  { value:'reparado',  label:'🛠 Reparado — pieza cambiada',     color:'#BF5AF2' },
];

const REGIONS = [
  { value:'LL/A', label:'🇺🇸 LL/A — USA',         desc:'Desbloqueado AT&T / unlocked' },
  { value:'LZ/A', label:'🌎 LZ/A — LatAm',         desc:'Desbloqueado para Latam' },
  { value:'LL/A-V', label:'🌐 LLA/V — Verizon',    desc:'Verizon USA' },
  { value:'ZP/A', label:'🇭🇰 ZP/A — HK/APAC',      desc:'Hong Kong / Asia-Pacífico' },
  { value:'AB/A', label:'🇦🇺 AB/A — Australia',     desc:'Australia' },
  { value:'otro', label:'🏷 Otro / Sin región',     desc:'No especificada' },
];

const ALL_CHIPS = [...new Set(MODELS.map(m => m.chip))];

/* ── Form inicial vacío ─────────────────────────────────────── */
const EMPTY = {
  imei:'', serial:'', sku:'',
  model:'', capacity:'', color:'', chip:'', condition:'',
  region:'', battery_health:'',
  costo_origen:'', gastos_import:'', gastos_lima:'',
  negocio_id: CORP_ID,
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function NuevoProducto() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const photoRef    = useRef(null);
  const boxRef      = useRef(null);

  const [me,        setMe]        = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [success,   setSuccess]   = useState(false);

  const [form,      setForm]      = useState(EMPTY);
  const [imeiErr,   setImeiErr]   = useState('');
  const [photos,    setPhotos]    = useState([]);      // {file, preview}
  const [boxPhotos, setBoxPhotos] = useState([]);      // {file, preview}

  /* ── CATÁLOGO desde Supabase ── */
  const [catalog,         setCatalog]         = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [catFilter,       setCatFilter]       = useState('todos');

  /* Costo Landed calculado en tiempo real */
  const landed = (
    (parseFloat(form.costo_origen)  || 0) +
    (parseFloat(form.gastos_import) || 0) +
    (parseFloat(form.gastos_lima)   || 0)
  );

  /* Si hay producto del catálogo y no hay costos manuales, auto-sugerir base + 15% */
  const catalogBasePEN   = selectedProduct?.sale_price || 0;   // ya es landed en PEN
  const catalogBaseUSD   = catalogBasePEN / 3.75;              // convertir a USD
  const catalogSuggestedBase = (catalogBaseUSD / 1.15).toFixed(2); // precio antes del 15%

  /* Auto-fill chip al cambiar modelo */
  useEffect(() => {
    if (form.model) {
      const found = MODELS.find(m => m.v === form.model);
      setForm(f => ({ ...f, chip: found?.chip || f.chip, color: '' }));
    }
  }, [form.model]);

  /* Auth */
  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
    const r = roleRow?.role;
    if (!['corp','superadmin','admin_corp','store_admin'].includes(r)) {
      router.replace('/dashboard'); return;
    }
    const { data: prof } = await supabase.from('users').select('full_name').eq('id', uid).single();
    setMe({ id: uid, name: prof?.full_name, role: r });
    await loadCatalog();
    setLoading(false);
  }

  async function loadCatalog() {
    const { data } = await supabase
      .from('products')
      .select('id, name, emoji, category, chip, default_colors, default_capacities, sale_price')
      .order('category').order('name').limit(200);
    setCatalog(data || []);
  }

  function pickProduct(prod) {
    if (selectedProduct?.id === prod.id) {
      // deselect
      setSelectedProduct(null);
      setForm(f => ({ ...f, model: '', chip: '', color: '', capacity: '' }));
      return;
    }
    setSelectedProduct(prod);
    setForm(f => ({
      ...f,
      model:    prod.name,
      chip:     prod.chip || f.chip || '',
      color:    '',
      capacity: '',
    }));
  }

  function toast_(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── IMEI validation ── */
  function onImeiChange(raw) {
    const clean = raw.replace(/\D/g, '').substring(0, 16);
    if (clean.length > 0 && (clean.length < 14 || clean.length > 16)) {
      setImeiErr('Debe tener 14–16 dígitos');
    } else { setImeiErr(''); }
    setForm(f => ({ ...f, imei: clean }));
  }

  /* ── Photo selection ── */
  function addPhotos(files, isBox) {
    const items = Array.from(files).map(file => ({
      file, preview: URL.createObjectURL(file),
    }));
    if (isBox) setBoxPhotos(p => [...p, ...items]);
    else       setPhotos(p => [...p, ...items]);
  }

  function removePhoto(idx, isBox) {
    if (isBox) setBoxPhotos(p => p.filter((_,i) => i !== idx));
    else       setPhotos(p => p.filter((_,i) => i !== idx));
  }

  /* ── Upload a Supabase Storage ── */
  async function uploadFile(file, folder) {
    const ext  = file.name.split('.').pop() || 'jpg';
    const path = `${CORP_ID}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-photos')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast_('Error foto: ' + error.message, 'err'); return null; }
    const { data } = supabase.storage.from('product-photos').getPublicUrl(path);
    return data?.publicUrl || null;
  }

  /* ── SUBMIT ── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.model && !selectedProduct) { toast_('Selecciona el modelo o elige del catálogo', 'err'); return; }
    if (!form.condition) { toast_('Selecciona el estado', 'err');    return; }
    if (imeiErr)         { toast_('Corrige el IMEI primero', 'err'); return; }
    const modelName = selectedProduct?.name || form.model;

    setSaving(true);

    /* Subir fotos */
    const photoUrls = [];
    for (const p of photos)    { const u = await uploadFile(p.file, 'device'); if (u) photoUrls.push(u); }
    const boxUrls = [];
    for (const p of boxPhotos) { const u = await uploadFile(p.file, 'box');    if (u) boxUrls.push(u); }

    /* Construcción del payload → tabla stock_items */
    const notes = [
      modelName, form.chip,
      form.capacity       && `Capacidad: ${form.capacity}`,
      form.color          && `Color: ${form.color}`,
      form.region         && `Región: ${form.region}`,
      ['excelente','bueno','regular','reparado'].includes(form.condition) && form.battery_health
        ? `Salud Batería: ${form.battery_health}%` : '',
      CONDITIONS.find(c => c.value === form.condition)?.label,
      `Base: S/${(landed / 1.15).toFixed(2)} + 15% margen operativo`,
      `Costo Origen: S/${parseFloat(form.costo_origen  || 0).toFixed(2)}`,
      `Gastos Import: S/${parseFloat(form.gastos_import || 0).toFixed(2)}`,
      `Gastos Lima: S/${parseFloat(form.gastos_lima    || 0).toFixed(2)}`,
      `Costo Landed Total: S/${landed.toFixed(2)}`,
      photoUrls.length ? `Fotos dispositivo: ${photoUrls.join(' | ')}` : '',
      boxUrls.length   ? `Fotos caja: ${boxUrls.join(' | ')}`          : '',
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('stock_items').insert({
      owner_org_id:  form.negocio_id || CORP_ID,
      serial_number: form.serial || form.imei || null,
      imei:          form.imei   || null,
      status:        'available',
      sale_price:    landed || 0,
      emoji:         selectedProduct?.emoji || '📱',
      model_number:  form.sku    || null,
      color_info:    form.color  || null,
      storage_info:  form.capacity || null,
      product_id:    selectedProduct?.id || null,
      notes,
      created_by:    me?.id,
    });

    setSaving(false);

    if (error) { toast_('Error al guardar: ' + error.message, 'err'); return; }

    /* Reset */
    photos.forEach(p    => URL.revokeObjectURL(p.preview));
    boxPhotos.forEach(p => URL.revokeObjectURL(p.preview));
    setForm(EMPTY);
    setPhotos([]); setBoxPhotos([]);
    setImeiErr('');
    // mantiene selectedProduct para registrar múltiples del mismo modelo
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3200);
  }

  if (loading) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  /* Colores y capacidades: primero del catálogo, luego del hardcode */
  const modelColors     = selectedProduct?.default_colors?.length
    ? selectedProduct.default_colors
    : (MODEL_COLORS[form.model] || []);

  const modelCapacities = selectedProduct?.default_capacities?.length
    ? selectedProduct.default_capacities
    : CAPACITIES;

  /* Categorías únicas para filtro */
  const catCategories = ['todos', ...new Set(catalog.map(p => p.category).filter(Boolean))];
  const filteredCatalog = catFilter === 'todos'
    ? catalog
    : catalog.filter(p => p.category === catFilter);

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="page-wrap">

      {/* ── TOP BAR ── */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/corp" className="top-btn">‹ Corp</Link>
          <div>
            <div className="top-bar-title">📲 Registrar Producto</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="badge" style={{ background:'var(--purple)', color:'#fff' }}>CORP</span>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast-wrap">
          <div className={`toast-msg ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      {/* ── SUCCESS OVERLAY (iOS-style) ── */}
      {success && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.72)', backdropFilter:'blur(20px)',
          animation:'fadeIn .25s ease',
        }}>
          <div style={{
            background:'var(--surface)', borderRadius:28,
            padding:'44px 36px', textAlign:'center', maxWidth:300, width:'90%',
            boxShadow:'0 32px 80px rgba(0,0,0,0.55)',
            animation:'popIn .3s cubic-bezier(.34,1.56,.64,1)',
          }}>
            <div style={{ fontSize:72, lineHeight:1, marginBottom:18 }}>✅</div>
            <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>¡Registrado!</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
              {selectedProduct?.name || form.model || 'Equipo'} agregado al stock con éxito.
            </div>
          </div>
        </div>
      )}

      {/* ── FORM ── */}
      <div className="content" style={{ paddingBottom:48 }}>
        <form onSubmit={handleSubmit}
          style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

          {/* ═══════════════════════════════════
              SELECTOR DE CATÁLOGO
          ═══════════════════════════════════ */}
          {catalog.length > 0 && (
            <div style={{
              background:'var(--card)', border:'1px solid var(--border)',
              borderRadius:20, overflow:'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding:'13px 18px',
                background:'linear-gradient(135deg,rgba(94,92,230,0.18),rgba(94,92,230,0.06))',
                borderBottom:'1px solid rgba(94,92,230,0.22)',
                display:'flex', alignItems:'center', gap:10,
              }}>
                <div style={{ width:4, height:20, borderRadius:4, background:'#5E5CE6', flexShrink:0 }} />
                <div style={{ flex:1, fontSize:14, fontWeight:800 }}>
                  📋 Seleccionar del Catálogo
                </div>
                {selectedProduct && (
                  <span style={{
                    fontSize:11, padding:'3px 10px', borderRadius:20,
                    background:'rgba(94,92,230,0.18)', color:'#5E5CE6',
                    fontWeight:700, border:'1px solid rgba(94,92,230,0.35)',
                  }}>
                    ✓ {selectedProduct.name}
                  </span>
                )}
              </div>

              {/* Filtros de categoría */}
              <div style={{ padding:'10px 14px 0', display:'flex', gap:6, flexWrap:'wrap' }}>
                {catCategories.map(cat => (
                  <button
                    key={cat} type="button"
                    onClick={() => setCatFilter(cat)}
                    style={{
                      padding:'5px 12px', borderRadius:20, fontWeight:700,
                      fontSize:11, cursor:'pointer', transition:'all .15s',
                      border:`1.5px solid ${catFilter === cat ? '#5E5CE6' : 'var(--border)'}`,
                      background: catFilter === cat ? 'rgba(94,92,230,0.18)' : 'transparent',
                      color: catFilter === cat ? '#5E5CE6' : 'var(--text3)',
                      textTransform:'capitalize',
                    }}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de productos */}
              <div style={{ padding:'12px 14px 14px', display:'flex', gap:10, flexWrap:'wrap' }}>
                {filteredCatalog.map(prod => {
                  const active = selectedProduct?.id === prod.id;
                  return (
                    <button
                      key={prod.id} type="button"
                      onClick={() => pickProduct(prod)}
                      style={{
                        display:'flex', flexDirection:'column', alignItems:'center',
                        gap:4, padding:'10px 12px', borderRadius:14, cursor:'pointer',
                        transition:'all .15s', minWidth:90,
                        border:`1.5px solid ${active ? '#5E5CE6' : 'var(--border)'}`,
                        background: active ? 'rgba(94,92,230,0.14)' : 'transparent',
                        color: active ? '#5E5CE6' : 'var(--text)',
                      }}>
                      <span style={{ fontSize:26 }}>{prod.emoji || '📦'}</span>
                      <span style={{ fontSize:11, fontWeight:800, textAlign:'center', lineHeight:1.3 }}>
                        {prod.name}
                      </span>
                      {prod.chip && (
                        <span style={{ fontSize:9, color:'var(--text3)', fontWeight:600 }}>
                          {prod.chip}
                        </span>
                      )}
                      {(prod.default_capacities?.length > 0) && (
                        <span style={{ fontSize:9, color:'var(--text3)' }}>
                          {prod.default_capacities.length} opciones GB
                        </span>
                      )}
                      {active && (
                        <span style={{ fontSize:14 }}>✅</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredCatalog.length === 0 && (
                <div style={{ padding:'20px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                  No hay productos en esta categoría.{' '}
                  <Link href="/corp" style={{ color:'#5E5CE6' }}>Agregar en Corp Panel →</Link>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════
              SECCIÓN 1 — IDENTIFICACIÓN
          ═══════════════════════════════════ */}
          <CardSection title="🔢 Identificación" accent="#0A84FF">

            {/* IMEI */}
            <div className="form-group">
              <label className="form-label">IMEI</label>
              <input
                className="form-input"
                placeholder="352999111111111"
                inputMode="numeric"
                value={form.imei}
                maxLength={16}
                onChange={e => onImeiChange(e.target.value)}
                style={{
                  fontFamily:'monospace', fontSize:18, letterSpacing:2.5, fontWeight:700,
                  borderColor: imeiErr
                    ? '#FF453A'
                    : form.imei.length >= 14 && !imeiErr ? '#30D158' : 'var(--border)',
                }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:11 }}>
                {imeiErr
                  ? <span style={{ color:'#FF453A', fontWeight:700 }}>⚠️ {imeiErr}</span>
                  : form.imei.length >= 14 && form.imei.length <= 16
                    ? <span style={{ color:'#30D158', fontWeight:700 }}>✅ IMEI válido</span>
                    : <span style={{ color:'var(--text-muted)' }}>14 a 16 dígitos numéricos</span>
                }
                <span style={{ color:'var(--text-muted)', fontFamily:'monospace' }}>{form.imei.length}/15</span>
              </div>
            </div>

            {/* Serial */}
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                className="form-input"
                placeholder="DNXXX… (en la caja o en Ajustes)"
                style={{ fontFamily:'monospace', fontWeight:700, letterSpacing:1 }}
                value={form.serial}
                onChange={e => setForm(f => ({ ...f, serial: e.target.value.toUpperCase() }))}
              />
            </div>

            {/* SKU */}
            <div className="form-group">
              <label className="form-label">SKU / Número de Modelo</label>
              <input
                className="form-input"
                placeholder="A2651 · MXXX2LL/A"
                style={{ fontFamily:'monospace' }}
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))}
              />
            </div>

            {/* Región */}
            <div className="form-group">
              <label className="form-label">🌍 Región del equipo</label>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {REGIONS.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm(f => ({ ...f, region: f.region === r.value ? '' : r.value }))}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 14px', borderRadius:12,
                      border:`1.5px solid ${form.region === r.value ? '#0A84FF' : 'var(--border)'}`,
                      background: form.region === r.value ? 'rgba(10,132,255,0.10)' : 'transparent',
                      color: form.region === r.value ? 'var(--blue)' : 'var(--text)',
                      cursor:'pointer', textAlign:'left', transition:'all .15s',
                    }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>{r.label}</span>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardSection>

          {/* ═══════════════════════════════════
              SECCIÓN 2 — ESPECIFICACIONES
          ═══════════════════════════════════ */}
          <CardSection title="📋 Especificaciones" accent="#5E5CE6">

            {/* Modelo */}
            <div className="form-group">
              <label className="form-label">Modelo *</label>

              {/* Si hay producto del catálogo, mostrar chip de selección */}
              {selectedProduct && (
                <div style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 14px', borderRadius:12, marginBottom:8,
                  background:'rgba(94,92,230,0.10)',
                  border:'1.5px solid rgba(94,92,230,0.35)',
                }}>
                  <span style={{ fontSize:22 }}>{selectedProduct.emoji || '📦'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14 }}>{selectedProduct.name}</div>
                    {selectedProduct.chip && (
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{selectedProduct.chip}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedProduct(null); setForm(f => ({...f, model:'', chip:'', color:'', capacity:''})); }}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text3)' }}>
                    ✕
                  </button>
                </div>
              )}

              {/* Dropdown solo si no hay catálogo seleccionado */}
              {!selectedProduct && (
                <select
                  required
                  className="form-select"
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}>
                  <option value="">— Selecciona modelo o elige del catálogo arriba —</option>
                  {['11','12','13','14','15','16','17'].map(gen => (
                    <optgroup key={gen} label={`iPhone ${gen}`}>
                      {MODELS.filter(m => m.gen === gen).map(m => (
                        <option key={m.v} value={m.v}>{m.v}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Capacidad — pill buttons (desde catálogo o hardcode) */}
            <div className="form-group">
              <label className="form-label">
                Capacidad
                {selectedProduct?.default_capacities?.length > 0 &&
                  <span style={{ marginLeft:8, fontSize:10, color:'#5E5CE6', fontWeight:700 }}>
                    📋 del catálogo
                  </span>
                }
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {modelCapacities.map(cap => (
                  <PillBtn
                    key={cap}
                    label={cap}
                    active={form.capacity === cap}
                    color="#FF9F0A"
                    onClick={() => setForm(f => ({ ...f, capacity: f.capacity === cap ? '' : cap }))}
                  />
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="form-group">
              <label className="form-label">
                Color
                {selectedProduct?.default_colors?.length > 0 &&
                  <span style={{ marginLeft:8, fontSize:10, color:'#5E5CE6', fontWeight:700 }}>
                    📋 del catálogo
                  </span>
                }
              </label>
              {modelColors.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {modelColors.map(col => (
                    <PillBtn
                      key={col} label={col}
                      active={form.color === col} color="#BF5AF2"
                      onClick={() => setForm(f => ({ ...f, color: f.color === col ? '' : col }))}
                    />
                  ))}
                </div>
              ) : (
                <input
                  className="form-input"
                  placeholder="Deep Blue, Natural Titanium…"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                />
              )}
            </div>

            {/* Chip */}
            <div className="form-group">
              <label className="form-label">Chip (se autocompleta con el modelo)</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {ALL_CHIPS.map(chip => (
                  <PillBtn
                    key={chip} label={chip}
                    active={form.chip === chip} color="#FF9F0A"
                    onClick={() => setForm(f => ({ ...f, chip: f.chip === chip ? '' : chip }))}
                  />
                ))}
              </div>
            </div>

            {/* Estado */}
            <div className="form-group">
              <label className="form-label">Estado del equipo *</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {CONDITIONS.map(c => (
                  <button
                    key={c.value} type="button"
                    onClick={() => setForm(f => ({ ...f, condition: f.condition === c.value ? '' : c.value }))}
                    style={{
                      padding:'13px 16px', borderRadius:13, fontWeight:700, fontSize:14,
                      border:`1.5px solid ${form.condition === c.value ? c.color : 'var(--border)'}`,
                      background: form.condition === c.value ? `${c.color}18` : 'transparent',
                      color: form.condition === c.value ? c.color : 'var(--text)',
                      cursor:'pointer', textAlign:'left', transition:'all .15s',
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Battery Health — solo para equipos usados */}
            {['excelente','bueno','regular','reparado'].includes(form.condition) && (
              <div className="form-group">
                <label className="form-label">🔋 Salud de Batería (%)</label>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <input
                    type="range" min="50" max="100" step="1"
                    value={form.battery_health || 100}
                    onChange={e => setForm(f => ({ ...f, battery_health: e.target.value }))}
                    style={{ flex:1, accentColor: parseInt(form.battery_health||100) >= 85 ? '#30D158' : parseInt(form.battery_health||100) >= 70 ? '#FF9F0A' : '#FF453A' }}
                  />
                  <div style={{
                    minWidth:56, textAlign:'center',
                    fontSize:22, fontWeight:900, fontVariantNumeric:'tabular-nums',
                    color: parseInt(form.battery_health||100) >= 85 ? '#30D158'
                         : parseInt(form.battery_health||100) >= 70 ? '#FF9F0A' : '#FF453A',
                  }}>
                    {form.battery_health || 100}%
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4, display:'flex', justifyContent:'space-between' }}>
                  <span>🔴 Baja (&lt;70%)</span><span>🟡 Regular (70–84%)</span><span>🟢 Buena (85%+)</span>
                </div>
              </div>
            )}
          </CardSection>

          {/* ═══════════════════════════════════
              SECCIÓN 3 — CONTABILIDAD LANDED
          ═══════════════════════════════════ */}
          <CardSection title="💰 Contabilidad Landed" accent="#30D158">

            {/* Sugerencia automática desde catálogo */}
            {selectedProduct && catalogBasePEN > 0 && (
              <div style={{
                padding:'10px 14px', borderRadius:12, marginBottom:12,
                background:'rgba(48,209,88,0.08)', border:'1px solid rgba(48,209,88,0.30)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#30D158' }}>
                    📋 Precio base del catálogo
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    Base ≈ ${catalogSuggestedBase} USD + 15% = S/{catalogBasePEN.toLocaleString()} PEN
                  </div>
                </div>
                <button type="button"
                  onClick={() => {
                    const base = (catalogBasePEN * 0.70).toFixed(2);
                    const import_ = (catalogBasePEN * 0.20).toFixed(2);
                    const lima   = (catalogBasePEN * 0.10).toFixed(2);
                    setForm(f => ({ ...f, costo_origen: base, gastos_import: import_, gastos_lima: lima }));
                  }}
                  style={{
                    padding:'6px 12px', borderRadius:8, fontWeight:700, fontSize:11,
                    border:'1.5px solid #30D158', background:'rgba(48,209,88,0.15)',
                    color:'#30D158', cursor:'pointer',
                  }}>
                  Aplicar
                </button>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Costo Origen (S/)</label>
                <input
                  className="form-input" type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={form.costo_origen}
                  onChange={e => setForm(f => ({ ...f, costo_origen: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Gastos Importación (S/)</label>
                <input
                  className="form-input" type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={form.gastos_import}
                  onChange={e => setForm(f => ({ ...f, gastos_import: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ margin:0, gridColumn:'1 / -1' }}>
                <label className="form-label">Gastos Lima (S/)</label>
                <input
                  className="form-input" type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={form.gastos_lima}
                  onChange={e => setForm(f => ({ ...f, gastos_lima: e.target.value }))}
                />
              </div>
            </div>

            {/* Costo Total Landed — calculado */}
            <div style={{
              marginTop:14,
              background:'linear-gradient(135deg,rgba(48,209,88,0.13),rgba(52,199,89,0.05))',
              border:'1.5px solid rgba(48,209,88,0.38)',
              borderRadius:16, padding:'16px 20px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'#30D158', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  🏷 Costo Total Landed
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                  Origen + Importación + Lima
                </div>
              </div>
              <div style={{ fontSize:30, fontWeight:900, color:'#30D158', fontVariantNumeric:'tabular-nums' }}>
                S/ {landed.toFixed(2)}
              </div>
            </div>
          </CardSection>

          {/* ═══════════════════════════════════
              SECCIÓN 4 — MULTIMEDIA
          ═══════════════════════════════════ */}
          <CardSection title="📸 Fotos del Equipo" accent="#FF9F0A">

            {/* Fotos del equipo */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8 }}>
                📱 Fotos del dispositivo
              </div>
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                style={uploadBtnStyle('#FF9F0A')}>
                <span style={{ fontSize:34 }}>📷</span>
                <span style={{ fontWeight:700 }}>Abrir cámara / galería</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>JPG · PNG · múltiples fotos</span>
              </button>
              <input
                ref={photoRef} type="file"
                accept="image/*" capture="environment" multiple
                style={{ display:'none' }}
                onChange={e => addPhotos(e.target.files, false)}
              />
              {photos.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
                  {photos.map((p, i) => (
                    <PhotoThumb key={i} src={p.preview} onRemove={() => removePhoto(i, false)} />
                  ))}
                </div>
              )}
            </div>

            {/* Fotos de la caja */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8 }}>
                📦 Fotos de la caja (opcional)
              </div>
              <button
                type="button"
                onClick={() => boxRef.current?.click()}
                style={uploadBtnStyle('rgba(255,255,255,0.15)')}>
                <span style={{ fontSize:34 }}>📦</span>
                <span style={{ fontWeight:700 }}>Foto de la caja</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>Frente, trasera, accesorios</span>
              </button>
              <input
                ref={boxRef} type="file"
                accept="image/*" capture="environment" multiple
                style={{ display:'none' }}
                onChange={e => addPhotos(e.target.files, true)}
              />
              {boxPhotos.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
                  {boxPhotos.map((p, i) => (
                    <PhotoThumb key={i} src={p.preview} onRemove={() => removePhoto(i, true)} />
                  ))}
                </div>
              )}
            </div>
          </CardSection>

          {/* ── Resumen antes de guardar ── */}
          {(form.model || form.imei) && (
            <div style={{
              background:'rgba(10,132,255,0.07)',
              border:'1px solid rgba(10,132,255,0.22)',
              borderRadius:16, padding:'14px 16px',
            }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#4DA8FF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
                📋 Resumen del registro
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(selectedProduct?.name || form.model) && <Tag label={selectedProduct?.name || form.model} color="#0A84FF" />}
                {form.capacity        && <Tag label={form.capacity}   color="#FF9F0A" />}
                {form.color           && <Tag label={form.color}      color="#BF5AF2" />}
                {form.chip            && <Tag label={form.chip}       color="#FF9F0A" />}
                {form.region          && <Tag label={form.region}     color="#0A84FF" />}
                {form.battery_health && ['excelente','bueno','regular','reparado'].includes(form.condition)
                  && <Tag label={`🔋 ${form.battery_health}%`} color={parseInt(form.battery_health)>=85?'#30D158':parseInt(form.battery_health)>=70?'#FF9F0A':'#FF453A'} />
                }
                {form.condition && <Tag label={CONDITIONS.find(c=>c.value===form.condition)?.label.split(' — ')[0] || form.condition} color="#30D158" />}
                {form.imei      && <Tag label={form.imei}     color="#4DA8FF" mono />}
                {landed > 0     && <Tag label={`S/ ${landed.toFixed(2)} landed`} color="#30D158" />}
                {photos.length > 0 && <Tag label={`${photos.length} foto${photos.length>1?'s':''} 📷`} color="#FF9F0A" />}
              </div>
            </div>
          )}

          {/* ── Campo oculto negocio_id ── */}
          <input type="hidden" value={CORP_ID} readOnly />

          {/* ── BOTÓN SUBMIT ── */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width:'100%', padding:'17px', borderRadius:16, border:'none',
              background: saving
                ? 'var(--surface)'
                : 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
              color:'#fff', fontSize:17, fontWeight:800,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 6px 28px rgba(10,132,255,0.38)',
              transition:'all .2s',
            }}>
            {saving ? '⏳ Guardando…' : '✅ Registrar Equipo'}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes popIn  {
          from { opacity:0; transform:scale(0.82) }
          to   { opacity:1; transform:scale(1) }
        }
      `}</style>
    </div>
  );
}

/* ── Subcomponentes ─────────────────────────────────────────── */

function CardSection({ title, accent, children }) {
  return (
    <div style={{
      background:'var(--card, rgba(255,255,255,0.04))',
      border:'1px solid var(--border)',
      borderRadius:20, overflow:'hidden',
    }}>
      {/* Header de sección */}
      <div style={{
        padding:'13px 18px',
        background:`linear-gradient(135deg,${accent}1A,${accent}08)`,
        borderBottom:`1px solid ${accent}28`,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{ width:4, height:20, borderRadius:4, background:accent, flexShrink:0 }} />
        <div style={{ fontSize:14, fontWeight:800 }}>{title}</div>
      </div>
      {/* Body */}
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:0 }}>
        {children}
      </div>
    </div>
  );
}

function PillBtn({ label, active, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:'8px 14px', borderRadius:10, fontWeight:700, fontSize:13,
        border:`1.5px solid ${active ? color : 'var(--border)'}`,
        background: active ? `${color}1E` : 'transparent',
        color: active ? color : 'var(--text)',
        cursor:'pointer', transition:'all .15s',
      }}>
      {label}
    </button>
  );
}

function Tag({ label, color, mono = false }) {
  return (
    <span style={{
      fontSize:11, padding:'3px 10px', borderRadius:20,
      background:`${color}1A`, color, fontWeight:700,
      border:`1px solid ${color}30`,
      fontFamily: mono ? 'monospace' : 'inherit',
    }}>
      {label}
    </span>
  );
}

function PhotoThumb({ src, onRemove }) {
  return (
    <div style={{ position:'relative', borderRadius:10, overflow:'hidden', aspectRatio:'1', background:'var(--surface)' }}>
      <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      <button
        type="button"
        onClick={onRemove}
        style={{
          position:'absolute', top:5, right:5,
          width:22, height:22, borderRadius:'50%',
          background:'rgba(255,69,58,0.92)', border:'none',
          color:'#fff', fontSize:12, fontWeight:900,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
        }}>✕</button>
    </div>
  );
}

function uploadBtnStyle(borderColor) {
  return {
    width:'100%', padding:'20px 16px', borderRadius:14,
    border:`2px dashed ${borderColor}80`,
    background:`${borderColor}06`,
    color:'var(--text)', fontSize:14,
    cursor:'pointer',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', gap:6,
  };
}
