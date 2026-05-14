'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

// ── Config ────────────────────────────────────────────────────
const STORE_CONFIG = {
  futurteck:  { name: 'Futurteck',   emoji: '📱', accent: '#0A84FF' },
  wetech:     { name: 'WeTech Perú', emoji: '💻', accent: '#30D158' },
  innovatech: { name: 'InnovaTech',  emoji: '🔧', accent: '#BF5AF2' },
  corp:       { name: 'Corp Tech',   emoji: '🏢', accent: '#0A84FF' },
};

const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  wetech:     '00000000-0000-0000-0000-000000000004',
  innovatech: '00000000-0000-0000-0000-000000000003',
  corp:       '00000000-0000-0000-0000-000000000001',
};

const ADMIN_ROLES = ['store_admin','gerente','store_manager','admin_corp','corp','superadmin'];
const CORP_ROLES  = ['admin_corp','corp','superadmin'];

const ALL_STORES = [
  { slug:'corp',       name:'Corp Tech',   orgId: '00000000-0000-0000-0000-000000000001' },
  { slug:'futurteck',  name:'Futurteck',   orgId: '00000000-0000-0000-0000-000000000002' },
  { slug:'innovatech', name:'InnovaTech',  orgId: '00000000-0000-0000-0000-000000000003' },
  { slug:'wetech',     name:'WeTech Perú', orgId: '00000000-0000-0000-0000-000000000004' },
];

// Valor especial para "todas las tiendas" (solo admins corp)
const ALL_ORGS = 'ALL';

const CORP_NAV = [
  { id: 'dashboard',     href: '/corp',           ico: '📈', lbl: 'Dashboard'     },
  { id: 'tiendas',       href: '/corp',           ico: '🏪', lbl: 'Tiendas'       },
  { id: 'global',        href: '/corp',           ico: '📦', lbl: 'Stock'         },
  { id: 'finanzas',      href: '/corp',           ico: '💰', lbl: 'Finanzas'      },
  { id: 'liquidaciones', href: '/corp',           ico: '💳', lbl: 'Liquidaciones' },
  { id: 'almacenes',     href: '/corp',           ico: '🏭', lbl: 'Almacenes'     },
  { id: 'traslados',     href: '/corp',           ico: '🔄', lbl: 'Traslados'     },
  { id: 'importacion',   href: '/corp',           ico: '📥', lbl: 'Importación'   },
  { id: 'imei',          href: '/corp',           ico: '🔍', lbl: 'IMEI'          },
  { id: 'ventas',        href: '/corp',           ico: '📊', lbl: 'Ventas'        },
  { id: 'productos',     href: '/corp',           ico: '🗂️', lbl: 'Catálogo'      },
  { id: 'equipo',        href: '/corp',           ico: '👥', lbl: 'Equipo'        },
  { href: '/asistencia',       ico: '✅', lbl: 'Marcar'                        },
  { href: '/asistencia-admin', ico: '🗓️', lbl: 'Asistencia', active: true     },
  { href: '/biometrics',       ico: '🔐', lbl: 'Mi Carnet QR'                  },
];

const STORE_NAV = [
  { href: '/pos',              ico: '🛒', lbl: 'POS'                          },
  { href: '/store',            ico: '📦', lbl: 'Stock'                        },
  { href: '/store',            ico: '👥', lbl: 'Clientes'                     },
  { href: '/store',            ico: '📊', lbl: 'Ventas'                       },
  { href: '/asistencia',       ico: '✅', lbl: 'Marcar'                        },
  { href: '/asistencia-admin', ico: '🗓️', lbl: 'Asistencia', active: true     },
  { href: '/biometrics',       ico: '🔐', lbl: 'Mi Carnet QR'                  },
];

export default function AsistenciaAdminPage({ params }) {
  const slug  = params?.slug || 'corp';
  const cfg   = STORE_CONFIG[slug] || STORE_CONFIG.corp;
  const orgId = SLUG_MAP[slug];

  const mapRef     = useRef(null);
  const leafletRef = useRef(null);

  const [loading,        setLoading]        = useState(true);
  const [isCorpAdmin,    setIsCorpAdmin]    = useState(false);
  const [perfil,         setPerfil]         = useState(null);
  const [user,           setUser]           = useState(null);
  const [registros,      setRegistros]      = useState([]);
  const [perfiles,       setPerfiles]       = useState({}); // { user_id: { full_name, avatar_url } }
  const [filtroFecha,    setFiltroFecha]    = useState(new Date().toISOString().split('T')[0]);
  const [filtroUser,     setFiltroUser]     = useState('');
  // Corp admin por defecto ve TODAS las tiendas; store admin ve su tienda
  const [filtroTienda,   setFiltroTienda]   = useState(slug === 'corp' ? ALL_ORGS : orgId);
  const [usuarios,       setUsuarios]       = useState([]);
  const [mapReady,       setMapReady]       = useState(false);
  const [activeView,     setActiveView]     = useState('tabla');
  const [theme,          setTheme]          = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queryError,     setQueryError]     = useState('');

  // Sincronizar tema con el resto del panel al montar
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme')
        || document.documentElement.getAttribute('data-theme')
        || 'dark';
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  async function doLogout() {
    await supabase.auth.signOut();
    window.location.href = `/ingresar/${slug}`;
  }

  const NAV = slug === 'corp' ? CORP_NAV : STORE_NAV;

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = `/ingresar/${slug}`; return; }

      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', session.user.id);

      const isAdmin = roles?.some(r => ADMIN_ROLES.includes(r.role));
      if (!isAdmin) { window.location.href = `/ingresar/${slug}`; return; }

      const isCorp = roles?.some(r => CORP_ROLES.includes(r.role));
      setIsCorpAdmin(isCorp);

      // Si es admin corp, por defecto ve todas las tiendas
      if (isCorp) setFiltroTienda(ALL_ORGS);
      else setFiltroTienda(orgId);

      const { data: profile } = await supabase
        .from('profiles').select('full_name, avatar_url').eq('user_id', session.user.id).single();

      setUser(session.user);
      setPerfil(profile);
      setLoading(false);
    })();
  }, []);

  // ── Cargar registros (sin joins de FK — más robusto) ──────────
  const cargarRegistros = useCallback(async () => {
    setQueryError('');
    try {
      // 1) Construir query base sin joins complicados
      let q = supabase
        .from('asistencia_registros')
        .select('*')
        .gte('timestamp', filtroFecha + 'T00:00:00')
        .lte('timestamp', filtroFecha + 'T23:59:59')
        .order('timestamp', { ascending: true });

      // Filtro por tienda
      if (filtroTienda === ALL_ORGS) {
        // No filtrar por org — corp admin ve todo (RLS lo controla)
      } else {
        q = q.eq('org_id', filtroTienda);
      }

      if (filtroUser) q = q.eq('user_id', filtroUser);

      const { data, error } = await q;
      if (error) { setQueryError(error.message); return; }

      const rows = data || [];
      setRegistros(rows);

      // 2) Buscar perfiles para los user_ids encontrados
      const uids = [...new Set(rows.map(r => r.user_id))];
      if (uids.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', uids);

        const profileMap = {};
        (profileData || []).forEach(p => { profileMap[p.user_id] = p; });
        setPerfiles(profileMap);

        // Usuarios únicos para el filtro
        const enriched = uids.map(uid => ({
          id: uid,
          nombre: profileMap[uid]?.full_name || uid.slice(0,8),
        }));
        setUsuarios(enriched);
      } else {
        setPerfiles({});
        setUsuarios([]);
      }
    } catch (e) {
      setQueryError(e.message);
    }
  }, [filtroFecha, filtroUser, filtroTienda]);

  useEffect(() => { if (!loading) cargarRegistros(); }, [loading, cargarRegistros]);

  // ── Inicializar mapa Leaflet ──────────────────────────────────
  useEffect(() => {
    if (activeView !== 'mapa' || mapReady) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => { setMapReady(true); };
    document.head.appendChild(script);
  }, [activeView]);

  // ── Renderizar pines en el mapa ───────────────────────────────
  useEffect(() => {
    if (!mapReady || activeView !== 'mapa') return;
    const L = window.L;
    if (!L || !mapRef.current) return;

    if (leafletRef.current) { leafletRef.current.remove(); }

    const withCoords = registros.filter(r => r.lat && r.lng);
    const center = withCoords.length > 0
      ? [withCoords[0].lat, withCoords[0].lng]
      : [-12.046374, -77.042793];

    const map = L.map(mapRef.current).setView(center, 13);
    leafletRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);

    const bounds = [];
    withCoords.forEach(r => {
      const isEntrada = r.tipo === 'entrada';
      const color     = isEntrada ? '#30D158' : '#FF3B30';
      const nombre    = perfiles[r.user_id]?.full_name || r.user_id.slice(0,8);
      const hora      = new Date(r.timestamp).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
      // Nombre de tienda
      const tienda    = ALL_STORES.find(s => s.orgId === r.org_id)?.name || '';

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:14px;">${isEntrada ? '▲' : '▼'}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });

      L.marker([r.lat, r.lng], { icon }).addTo(map).bindPopup(`
        <div style="font-family:system-ui;min-width:160px;">
          <div style="font-weight:700;font-size:14px;">${nombre}</div>
          ${tienda ? `<div style="color:#888;font-size:11px;">${tienda}</div>` : ''}
          <div style="color:${color};font-weight:600;font-size:13px;text-transform:capitalize;">${r.tipo}</div>
          <div style="color:#666;font-size:12px;">🕐 ${hora}</div>
          ${r.precision_gps ? `<div style="color:#999;font-size:11px;">±${Math.round(r.precision_gps)}m precisión</div>` : ''}
        </div>
      `);

      bounds.push([r.lat, r.lng]);
    });

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    setTimeout(() => map.invalidateSize(), 200);
  }, [mapReady, registros, activeView, perfiles]);

  // ── Calcular sesiones (pares entrada/salida) ──────────────────
  const getSesiones = () => {
    const byUser = {};
    registros.forEach(r => {
      const key = `${r.user_id}_${r.org_id}`;
      if (!byUser[key]) byUser[key] = { entradas:[], salidas:[], info:r };
      if (r.tipo === 'entrada') byUser[key].entradas.push(r);
      else byUser[key].salidas.push(r);
    });

    return Object.values(byUser).map(({ entradas, salidas, info }) => {
      const entrada = entradas[0];
      const salida  = salidas[salidas.length - 1];
      let horas = null;
      if (entrada && salida) {
        horas = ((new Date(salida.timestamp) - new Date(entrada.timestamp)) / 3600000).toFixed(1);
      }
      const tiendaNombre = ALL_STORES.find(s => s.orgId === info.org_id)?.name || '';
      return {
        user_id:  info.user_id,
        org_id:   info.org_id,
        nombre:   perfiles[info.user_id]?.full_name || info.user_id.slice(0,8),
        tienda:   tiendaNombre,
        entrada, salida, horas,
      };
    });
  };

  const formatHora  = (ts) => ts ? new Date(ts).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}) : '—';
  const formatCoord = (lat, lng) => lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '—';

  const totalHoy      = registros.length;
  const totalEntradas = registros.filter(r=>r.tipo==='entrada').length;
  const sesiones      = getSesiones();
  const conSalida     = sesiones.filter(s=>s.salida).length;

  const bg     = theme==='dark' ? '#0A0A0F' : '#F2F2F7';
  const card   = theme==='dark' ? '#1C1C1E' : '#FFFFFF';
  const text   = theme==='dark' ? '#FFFFFF' : '#000000';
  const sub    = theme==='dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const border = theme==='dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const input  = theme==='dark' ? '#2C2C2E' : '#F2F2F7';

  if (loading) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input,select { outline:none; }
        .kpi-card { border-radius:16px; padding:18px 20px; border:1px solid; }
        table { border-collapse:collapse; width:100%; }
        th,td { text-align:left; padding:12px 14px; font-size:13px; }
        tr { border-bottom:1px solid; }
        @media(max-width:640px){ .desktop-col{ display:none; } }
      `}</style>

      {/* ── MOBILE NAV HEADER ── */}
      <div className="mobile-nav-header">
        <div className="mobile-nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Corp Tech" />
          <div className="mobile-nav-title">
            <span>{cfg.name}</span>
            <span>{perfil?.full_name || user?.email?.split('@')[0] || 'Admin'}</span>
          </div>
        </div>
        <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(o => !o)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-nav-drawer${mobileMenuOpen ? ' open' : ''}`}>
        {NAV.map((t, i) => (
          <Link key={i} href={t.href} className={`tab-btn${t.active ? ' active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
            <span className="ico">{t.ico}</span>{t.lbl}
          </Link>
        ))}
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <button onClick={toggleTheme} style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 0', color:'var(--text2)', cursor:'pointer', fontSize:18 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={doLogout} style={{ flex:2, background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:12, padding:'10px 0', color:'var(--red)', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="tab-bar tab-bar-branded">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top">
            <div className="sidebar-brand-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Corp Tech" />
            </div>
            <div className="sidebar-brand-info">
              <div className="sidebar-brand-name-row">
                <div className="sidebar-brand-company">{cfg.name}</div>
                <span className="sidebar-brand-badge" style={{ background: slug === 'corp' ? 'var(--purple)' : 'var(--blue)' }}>
                  {slug === 'corp' ? 'CORP' : 'ADMIN'}
                </span>
              </div>
              <div className="sidebar-brand-user">{perfil?.full_name || user?.email?.split('@')[0] || 'Admin'}</div>
            </div>
          </div>
          <div className="sidebar-brand-actions">
            <button onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            <button onClick={doLogout}>Salir</button>
          </div>
        </div>
        {NAV.map((t, i) => (
          <Link key={i} href={t.href} className={`tab-btn${t.active ? ' active' : ''}`}>
            <span className="ico">{t.ico}</span>
            <span>{t.lbl}</span>
          </Link>
        ))}
        <div className="sidebar-footer">
          Desarrollado por<br />
          <a href="https://pmg-studio.com" target="_blank" rel="noopener noreferrer">pmg-studio.com</a>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="content content-no-topbar">
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 16px', paddingBottom:40 }}>

          {/* Error de query */}
          {queryError && (
            <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.3)', borderRadius:14, padding:'14px 16px', marginBottom:16, color:'#FF3B30', fontSize:13 }}>
              ⚠️ {queryError}
            </div>
          )}

          {/* ── FILTROS ── */}
          <div style={{ background:card, borderRadius:20, padding:20, marginBottom:16, border:`1px solid ${border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:sub, textTransform:'uppercase', letterSpacing:0.5, marginBottom:14 }}>Filtros</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 160px' }}>
                <label style={{ fontSize:11, color:sub, display:'block', marginBottom:4 }}>Fecha</label>
                <input type="date" value={filtroFecha} onChange={e=>setFiltroFecha(e.target.value)}
                  style={{ width:'100%', background:input, border:'none', borderRadius:12, padding:'10px 12px', color:text, fontSize:14, fontFamily:'inherit' }}/>
              </div>

              {isCorpAdmin && (
                <div style={{ flex:'1 1 160px' }}>
                  <label style={{ fontSize:11, color:sub, display:'block', marginBottom:4 }}>Sede</label>
                  <select value={filtroTienda} onChange={e=>setFiltroTienda(e.target.value)}
                    style={{ width:'100%', background:input, border:'none', borderRadius:12, padding:'10px 12px', color:text, fontSize:14, fontFamily:'inherit', cursor:'pointer' }}>
                    <option value={ALL_ORGS}>🌐 Todas las sedes</option>
                    {ALL_STORES.map(s => (
                      <option key={s.orgId} value={s.orgId}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ flex:'1 1 160px' }}>
                <label style={{ fontSize:11, color:sub, display:'block', marginBottom:4 }}>Trabajador</label>
                <select value={filtroUser} onChange={e=>setFiltroUser(e.target.value)}
                  style={{ width:'100%', background:input, border:'none', borderRadius:12, padding:'10px 12px', color:text, fontSize:14, fontFamily:'inherit', cursor:'pointer' }}>
                  <option value="">Todos</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex:'0 0 auto', display:'flex', alignItems:'flex-end' }}>
                <button onClick={cargarRegistros}
                  style={{ background:cfg.accent, border:'none', borderRadius:12, padding:'10px 20px', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* ── KPIs ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:16 }}>
            {[
              { label:'Registros totales', val:totalHoy,        color:'#0A84FF', ico:'📋' },
              { label:'Entradas',          val:totalEntradas,   color:'#30D158', ico:'🟢' },
              { label:'Con salida',        val:conSalida,       color:'#FF9F0A', ico:'✅' },
              { label:'Personas hoy',      val:sesiones.length, color:'#BF5AF2', ico:'👥' },
            ].map((k,i) => (
              <div key={i} className="kpi-card" style={{ background:k.color+'12', borderColor:k.color+'30' }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{k.ico}</div>
                <div style={{ fontSize:28, fontWeight:800, color:k.color }}>{k.val}</div>
                <div style={{ fontSize:12, color:sub, marginTop:2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* ── TOGGLE VISTA ── */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {['tabla','mapa'].map(v => (
              <button key={v} onClick={()=>setActiveView(v)}
                style={{
                  background: activeView===v ? cfg.accent : card,
                  border:`1px solid ${activeView===v ? cfg.accent : border}`,
                  borderRadius:12, padding:'8px 20px', color: activeView===v ? '#fff' : text,
                  fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize'
                }}>
                {v==='tabla' ? '📋 Tabla' : '🗺️ Mapa'}
              </button>
            ))}
          </div>

          {/* ── TABLA ── */}
          {activeView === 'tabla' && (
            <div style={{ background:card, borderRadius:20, border:`1px solid ${border}`, overflow:'hidden' }}>
              <div style={{ padding:'18px 20px', borderBottom:`1px solid ${border}` }}>
                <div style={{ fontSize:15, fontWeight:700 }}>
                  📋 Reporte — {new Date(filtroFecha).toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table>
                  <thead>
                    <tr style={{ borderBottomColor:border }}>
                      {['Trabajador', isCorpAdmin ? 'Sede' : null, 'Entrada','Salida','Horas','📍 GPS Entrada','📍 GPS Salida']
                        .filter(Boolean)
                        .map(h => (
                          <th key={h} className={h.includes('GPS')?'desktop-col':''}
                            style={{ color:sub, fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.4, padding:'12px 14px' }}>
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sesiones.length === 0 && (
                      <tr style={{ borderBottomColor:'transparent' }}>
                        <td colSpan={7} style={{ textAlign:'center', color:sub, padding:32 }}>Sin registros para esta fecha</td>
                      </tr>
                    )}
                    {sesiones.map((s, i) => (
                      <tr key={i} style={{ borderBottomColor:border }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:14 }}>{s.nombre}</div>
                        </td>
                        {isCorpAdmin && (
                          <td>
                            <span style={{ background:cfg.accent+'20', color:cfg.accent, borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                              {s.tienda || '—'}
                            </span>
                          </td>
                        )}
                        <td><span style={{ color:'#30D158', fontWeight:600 }}>{formatHora(s.entrada?.timestamp)}</span></td>
                        <td><span style={{ color: s.salida ? '#FF9F0A' : sub, fontWeight: s.salida ? 600 : 400 }}>{formatHora(s.salida?.timestamp)}</span></td>
                        <td>
                          {s.horas
                            ? <span style={{ background:cfg.accent+'20', color:cfg.accent, borderRadius:8, padding:'3px 10px', fontSize:13, fontWeight:700 }}>{s.horas}h</span>
                            : <span style={{ color:sub, fontSize:13 }}>En turno</span>}
                        </td>
                        <td className="desktop-col" style={{ fontSize:12, color:sub }}>
                          {s.entrada?.lat
                            ? <a href={`https://www.google.com/maps?q=${s.entrada.lat},${s.entrada.lng}`} target="_blank" rel="noreferrer" style={{ color:cfg.accent, textDecoration:'none' }}>{formatCoord(s.entrada?.lat, s.entrada?.lng)} ↗</a>
                            : '—'}
                        </td>
                        <td className="desktop-col" style={{ fontSize:12, color:sub }}>
                          {s.salida?.lat
                            ? <a href={`https://www.google.com/maps?q=${s.salida.lat},${s.salida.lng}`} target="_blank" rel="noreferrer" style={{ color:cfg.accent, textDecoration:'none' }}>{formatCoord(s.salida?.lat, s.salida?.lng)} ↗</a>
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detalle crudo */}
              {registros.length > 0 && (
                <details style={{ padding:20, borderTop:`1px solid ${border}` }}>
                  <summary style={{ fontSize:13, color:sub, cursor:'pointer', fontWeight:600 }}>Ver todos los registros del día ({registros.length})</summary>
                  <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                    {registros.map(r => {
                      const nombreR = perfiles[r.user_id]?.full_name || r.user_id.slice(0,8);
                      const tiendaR = ALL_STORES.find(s => s.orgId === r.org_id)?.name || '';
                      return (
                        <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:bg, borderRadius:12 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:r.tipo==='entrada'?'#30D158':'#FF3B30', flexShrink:0 }}/>
                          <div style={{ flex:1 }}>
                            <span style={{ fontWeight:600, fontSize:13 }}>{nombreR}</span>
                            {isCorpAdmin && tiendaR && <span style={{ color:cfg.accent, fontSize:11, marginLeft:6 }}>{tiendaR}</span>}
                            <span style={{ color:sub, fontSize:12, marginLeft:8 }}>{new Date(r.timestamp).toLocaleString('es-PE')}</span>
                            <span style={{ color:r.tipo==='entrada'?'#30D158':'#FF3B30', fontSize:12, marginLeft:8, textTransform:'capitalize' }}>{r.tipo}</span>
                          </div>
                          {r.lat && (
                            <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" style={{ fontSize:11, color:cfg.accent, textDecoration:'none' }}>📍 Ver</a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* ── MAPA ── */}
          {activeView === 'mapa' && (
            <div style={{ background:card, borderRadius:20, border:`1px solid ${border}`, overflow:'hidden' }}>
              <div style={{ padding:'18px 20px', borderBottom:`1px solid ${border}` }}>
                <div style={{ fontSize:15, fontWeight:700 }}>🗺️ Mapa de marcados</div>
                <div style={{ fontSize:12, color:sub, marginTop:2 }}>▲ Entrada &nbsp;&nbsp; ▼ Salida — haz clic en un pin para ver detalles</div>
              </div>
              {!mapReady && (
                <div style={{ height:400, display:'flex', alignItems:'center', justifyContent:'center', color:sub }}>Cargando mapa...</div>
              )}
              <div ref={mapRef} style={{ height:480, display: mapReady ? 'block' : 'none' }} />
              {registros.filter(r=>r.lat).length === 0 && mapReady && (
                <div style={{ padding:20, textAlign:'center', color:sub, fontSize:14 }}>Sin coordenadas GPS para mostrar en este período</div>
              )}
            </div>
          )}

          {/* ── LINK VOLVER ── */}
          <div style={{ textAlign:'center', marginTop:28 }}>
            <a href={`/asistencia/${slug}`} style={{ color:sub, fontSize:12, textDecoration:'none' }}>
              ← Ir a marcar asistencia
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
