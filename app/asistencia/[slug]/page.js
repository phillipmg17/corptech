'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

// ── Config por tienda ──────────────────────────────────────────
const STORE_CONFIG = {
  futurteck:  { name: 'Futurteck',       emoji: '📱', accent: '#0A84FF' },
  wetech:     { name: 'WeTech Perú',     emoji: '💻', accent: '#30D158' },
  innovatech: { name: 'InnovaTech',      emoji: '🔧', accent: '#BF5AF2' },
  corp:       { name: 'Corp Tech',       emoji: '🏢', accent: '#0A84FF' },
};

const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  wetech:     '00000000-0000-0000-0000-000000000004',
  innovatech: '00000000-0000-0000-0000-000000000003',
  corp:       '00000000-0000-0000-0000-000000000001',
};

const STAFF_ROLES = ['store_admin','vendedor','gerente','store_manager','superadmin','corp','admin_corp'];

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
  { href: '/asistencia',       ico: '✅', lbl: 'Marcar',        active: true },
  { href: '/asistencia-admin', ico: '🗓️', lbl: 'Asistencia'   },
  { href: '/biometrics',       ico: '🔐', lbl: 'Mi Carnet QR' },
];

const STORE_NAV = [
  { href: '/pos',              ico: '🛒', lbl: 'POS'          },
  { href: '/store',            ico: '📦', lbl: 'Stock'        },
  { href: '/store',            ico: '👥', lbl: 'Clientes'     },
  { href: '/store',            ico: '📊', lbl: 'Ventas'       },
  { href: '/asistencia',       ico: '✅', lbl: 'Marcar',        active: true },
  { href: '/asistencia-admin', ico: '🗓️', lbl: 'Asistencia'   },
  { href: '/biometrics',       ico: '🔐', lbl: 'Mi Carnet QR' },
];

export default function AsistenciaPage({ params }) {
  const slug    = params?.slug || 'corp';
  const cfg     = STORE_CONFIG[slug] || STORE_CONFIG.corp;
  const orgId   = SLUG_MAP[slug];
  const router  = useRouter();

  const [user,           setUser]           = useState(null);
  const [perfil,         setPerfil]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [gpsLoading,     setGpsLoading]     = useState(false);
  const [marcando,       setMarcando]       = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [registros,      setRegistros]      = useState([]);
  const [ultimoTipo,     setUltimoTipo]     = useState(null);
  const [horaActual,     setHoraActual]     = useState('');
  const [theme,          setTheme]          = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Reloj en tiempo real
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setHoraActual(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auth check
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = `/ingresar/${slug}`; return; }

      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', session.user.id).eq('org_id', orgId);

      const hasRole = roles?.some(r => STAFF_ROLES.includes(r.role));
      if (!hasRole) { window.location.href = `/ingresar/${slug}`; return; }

      const { data: profile } = await supabase
        .from('profiles').select('full_name, avatar_url').eq('user_id', session.user.id).single();

      setUser(session.user);
      setPerfil(profile);
      await cargarRegistros(session.user.id);
      setLoading(false);
    })();
  }, []);

  const cargarRegistros = useCallback(async (uid) => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('asistencia_registros')
      .select('*')
      .eq('user_id', uid)
      .eq('org_id', orgId)
      .gte('timestamp', hoy + 'T00:00:00')
      .order('timestamp', { ascending: true });

    setRegistros(data || []);
    if (data && data.length > 0) {
      setUltimoTipo(data[data.length - 1].tipo);
    } else {
      setUltimoTipo(null);
    }
  }, [orgId]);

  // Capturar GPS
  const capturarGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu dispositivo no soporta GPS'));
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precision_gps: pos.coords.accuracy,
        });
      },
      (err) => {
        setGpsLoading(false);
        reject(new Error('No se pudo obtener tu ubicación. Activa el GPS y permite el acceso.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

  const marcar = async (tipo) => {
    setError('');
    setSuccess('');
    setMarcando(true);
    try {
      const gps = await capturarGPS();
      const dispositivo = navigator.userAgent.substring(0, 120);

      const { error: err } = await supabase.from('asistencia_registros').insert({
        user_id:      user.id,
        org_id:       orgId,
        tipo,
        lat:          gps.lat,
        lng:          gps.lng,
        precision_gps: gps.precision_gps,
        dispositivo,
      });

      if (err) throw err;

      setSuccess(tipo === 'entrada' ? '✅ Entrada registrada correctamente' : '✅ Salida registrada correctamente');
      await cargarRegistros(user.id);
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setMarcando(false);
    }
  };

  // Calcular horas trabajadas hoy
  const calcHoras = () => {
    const entradas = registros.filter(r => r.tipo === 'entrada');
    const salidas  = registros.filter(r => r.tipo === 'salida');
    if (!entradas.length || !salidas.length) return null;
    const primera = new Date(entradas[0].timestamp);
    const ultima  = new Date(salidas[salidas.length - 1].timestamp);
    const diff    = (ultima - primera) / 3600000;
    return diff.toFixed(1);
  };

  const formatHora  = (ts) => new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const formatFecha = () => new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const bg     = theme === 'dark' ? '#0A0A0F' : '#F2F2F7';
  const card   = theme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const text   = theme === 'dark' ? '#FFFFFF' : '#000000';
  const sub    = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const border = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const accionSiguiente = ultimoTipo === 'entrada' ? 'salida' : 'entrada';
  const accionLabel     = accionSiguiente === 'entrada' ? 'Marcar Entrada' : 'Marcar Salida';
  const accionColor     = accionSiguiente === 'entrada' ? '#30D158' : '#FF3B30';
  const accionEmoji     = accionSiguiente === 'entrada' ? '🟢' : '🔴';

  const horas = calcHoras();

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#fff', fontFamily:'system-ui', fontSize:16, opacity:0.5 }}>Cargando...</div>
    </div>
  );

  return (
    <div className="page-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .marca-btn {
          width:100%; padding:22px; border:none; border-radius:20px; font-size:22px;
          font-weight:800; font-family:'Urbanist',system-ui; cursor:pointer;
          transition:all 0.15s; letter-spacing:0.3px; display:flex; align-items:center;
          justify-content:center; gap:12px;
        }
        .marca-btn:active { transform:scale(0.97); }
        .marca-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .registro-item { animation:fadeIn 0.3s ease both; }
      `}</style>

      {/* ── MOBILE NAV HEADER ── */}
      <div className="mobile-nav-header">
        <div className="mobile-nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Corp Tech" />
          <div className="mobile-nav-title">
            <span>{cfg.name}</span>
            <span>{perfil?.full_name || user?.email?.split('@')[0]}</span>
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
        {NAV.map((t, i) => (
          <Link key={i} href={t.href} className={`tab-btn${t.active ? ' active' : ''}`}>
            <span className="ico">{t.ico}</span>
            <span>{t.lbl}</span>
          </Link>
        ))}
        <div style={{ marginTop:'auto', paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
          <button onClick={toggleTheme} className="tab-btn" style={{ background:'none', border:'none', cursor:'pointer', width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:12, color:'var(--text2)', fontFamily:'inherit', fontSize:14 }}>
            <span className="ico">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>
          <button onClick={doLogout} className="tab-btn" style={{ background:'none', border:'none', cursor:'pointer', width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:12, color:'#FF3B30', fontFamily:'inherit', fontSize:14 }}>
            <span className="ico">🚪</span>
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="content content-no-topbar">
        <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 16px', paddingBottom:40 }}>

          {/* ── SALUDO Y RELOJ ── */}
          <div style={{ background:card, borderRadius:20, padding:24, marginBottom:16, border:`1px solid ${border}`, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>
              {perfil?.avatar_url
                ? <img src={perfil.avatar_url} alt="" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover' }} />
                : '👤'}
            </div>
            <div style={{ fontSize:18, fontWeight:700 }}>{perfil?.full_name || user?.email?.split('@')[0]}</div>
            <div style={{ fontSize:12, color:sub, marginTop:2 }}>{user?.email}</div>
            <div style={{ fontSize:40, fontWeight:800, color:cfg.accent, marginTop:16, letterSpacing:1 }}>{horaActual}</div>
            <div style={{ fontSize:13, color:sub, marginTop:4, textTransform:'capitalize' }}>{formatFecha()}</div>

            {horas && (
              <div style={{ marginTop:16, background:cfg.accent+'15', borderRadius:12, padding:'10px 20px', display:'inline-block' }}>
                <span style={{ fontSize:13, color:cfg.accent, fontWeight:600 }}>⏱ {horas} horas trabajadas hoy</span>
              </div>
            )}
          </div>

          {/* ── ESTADO ACTUAL ── */}
          <div style={{ background:card, borderRadius:20, padding:20, marginBottom:16, border:`1px solid ${border}` }}>
            <div style={{ fontSize:12, color:sub, fontWeight:600, marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Estado hoy</div>
            {ultimoTipo === null && (
              <div style={{ color:sub, fontSize:15 }}>Sin registros hoy. Marca tu entrada para comenzar.</div>
            )}
            {ultimoTipo === 'entrada' && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#30D158', boxShadow:'0 0 8px #30D158' }}/>
                <div style={{ fontSize:15, fontWeight:600 }}>Activo — entrada a las {formatHora(registros.filter(r=>r.tipo==='entrada').slice(-1)[0]?.timestamp)}</div>
              </div>
            )}
            {ultimoTipo === 'salida' && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#FF3B30' }}/>
                <div style={{ fontSize:15, fontWeight:600 }}>Fuera de turno — salida a las {formatHora(registros.filter(r=>r.tipo==='salida').slice(-1)[0]?.timestamp)}</div>
              </div>
            )}
          </div>

          {/* ── BOTÓN PRINCIPAL ── */}
          <div style={{ marginBottom:16 }}>
            <button
              className="marca-btn"
              style={{ background: accionColor, color:'#fff', animation: marcando ? 'none' : 'pulse 2s infinite' }}
              onClick={() => marcar(accionSiguiente)}
              disabled={marcando || gpsLoading}
            >
              {(marcando || gpsLoading) ? (
                <><span style={{ fontSize:18 }}>⏳</span> {gpsLoading ? 'Obteniendo GPS...' : 'Registrando...'}</>
              ) : (
                <><span style={{ fontSize:22 }}>{accionEmoji}</span> {accionLabel}</>
              )}
            </button>

            <div style={{ textAlign:'center', marginTop:10, fontSize:12, color:sub }}>
              📍 Se capturará tu ubicación GPS al marcar
            </div>
          </div>

          {/* ── MENSAJES ── */}
          {error && (
            <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.3)', borderRadius:14, padding:'14px 16px', marginBottom:16, color:'#FF3B30', fontSize:14 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background:'rgba(48,209,88,0.12)', border:'1px solid rgba(48,209,88,0.3)', borderRadius:14, padding:'14px 16px', marginBottom:16, color:'#30D158', fontSize:14 }}>
              {success}
            </div>
          )}

          {/* ── HISTORIAL DE HOY ── */}
          {registros.length > 0 && (
            <div style={{ background:card, borderRadius:20, padding:20, border:`1px solid ${border}` }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:14, color:sub, textTransform:'uppercase', letterSpacing:0.5 }}>Registros de hoy</div>
              {registros.map((r, i) => (
                <div key={r.id} className="registro-item" style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 0',
                  borderBottom: i < registros.length-1 ? `1px solid ${border}` : 'none'
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                    background: r.tipo === 'entrada' ? 'rgba(48,209,88,0.15)' : 'rgba(255,59,48,0.15)',
                    fontSize:16
                  }}>
                    {r.tipo === 'entrada' ? '🟢' : '🔴'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600, textTransform:'capitalize' }}>{r.tipo}</div>
                    <div style={{ fontSize:12, color:sub }}>
                      {formatHora(r.timestamp)}
                      {r.lat && ` · 📍 ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}
                      {r.precision_gps && ` (±${Math.round(r.precision_gps)}m)`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LINK AL ADMIN ── */}
          <div style={{ textAlign:'center', marginTop:24 }}>
            <a href={`/asistencia-admin/${slug}`} style={{ color:sub, fontSize:12, textDecoration:'none' }}>
              Ver panel de administración →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
