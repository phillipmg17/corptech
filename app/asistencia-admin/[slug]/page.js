'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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

const ADMIN_ROLES  = ['store_admin','gerente','store_manager','admin_corp','corp','superadmin'];
const CORP_ROLES   = ['admin_corp','corp','superadmin'];

const ALL_STORES = [
  { slug:'corp',       name:'Corp Tech',   orgId: '00000000-0000-0000-0000-000000000001' },
  { slug:'futurteck',  name:'Futurteck',   orgId: '00000000-0000-0000-0000-000000000002' },
  { slug:'innovatech', name:'InnovaTech',  orgId: '00000000-0000-0000-0000-000000000003' },
  { slug:'wetech',     name:'WeTech Perú', orgId: '00000000-0000-0000-0000-000000000004' },
];

export default function AsistenciaAdminPage({ params }) {
  const slug     = params?.slug || 'corp';
  const cfg      = STORE_CONFIG[slug] || STORE_CONFIG.corp;
  const orgId    = SLUG_MAP[slug];

  const mapRef    = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);

  const [loading,       setLoading]       = useState(true);
  const [isCorpAdmin,   setIsCorpAdmin]   = useState(false);
  const [registros,     setRegistros]     = useState([]);
  const [filtroFecha,   setFiltroFecha]   = useState(new Date().toISOString().split('T')[0]);
  const [filtroUser,    setFiltroUser]    = useState('');
  const [filtroTienda,  setFiltroTienda]  = useState(orgId);
  const [usuarios,      setUsuarios]      = useState([]);
  const [mapReady,      setMapReady]      = useState(false);
  const [activeView,    setActiveView]    = useState('tabla'); // 'tabla' | 'mapa'
  const [theme,         setTheme]         = useState('dark');

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

      setLoading(false);
    })();
  }, []);

  // ── Cargar registros ──────────────────────────────────────────
  const cargarRegistros = useCallback(async () => {
    const oid = filtroTienda || orgId;
    let q = supabase
      .from('asistencia_registros')
      .select(`
        *,
        profiles:profiles!asistencia_registros_user_id_fkey(full_name, avatar_url),
        user_roles!asistencia_registros_user_id_fkey(role)
      `)
      .eq('org_id', oid)
      .gte('timestamp', filtroFecha + 'T00:00:00')
      .lte('timestamp', filtroFecha + 'T23:59:59')
      .order('timestamp', { ascending: true });

    if (filtroUser) q = q.eq('user_id', filtroUser);

    const { data, error } = await q;
    if (!error) setRegistros(data || []);

    // Usuarios únicos para el filtro
    if (!filtroUser) {
      const uids = [...new Set((data || []).map(r => r.user_id))];
      const enriched = (data || []).reduce((acc, r) => {
        if (!acc.find(u => u.id === r.user_id)) {
          acc.push({ id: r.user_id, nombre: r.profiles?.full_name || r.user_id.slice(0,8) });
        }
        return acc;
      }, []);
      setUsuarios(enriched);
    }
  }, [filtroFecha, filtroUser, filtroTienda, orgId]);

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
    script.onload = () => {
      setMapReady(true);
    };
    document.head.appendChild(script);
  }, [activeView]);

  // ── Renderizar pines en el mapa ───────────────────────────────
  useEffect(() => {
    if (!mapReady || activeView !== 'mapa') return;
    const L = window.L;
    if (!L || !mapRef.current) return;

    // Limpiar mapa anterior
    if (leafletRef.current) {
      leafletRef.current.remove();
    }

    // Filtrar registros con coords válidas
    const withCoords = registros.filter(r => r.lat && r.lng);
    const center = withCoords.length > 0
      ? [withCoords[0].lat, withCoords[0].lng]
      : [-12.046374, -77.042793]; // Lima, Perú

    const map = L.map(mapRef.current).setView(center, 13);
    leafletRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Agregar pines
    const bounds = [];
    withCoords.forEach(r => {
      const isEntrada = r.tipo === 'entrada';
      const color     = isEntrada ? '#30D158' : '#FF3B30';
      const nombre    = r.profiles?.full_name || 'Usuario';
      const hora      = new Date(r.timestamp).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color}; width:32px; height:32px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4);
          font-size:14px;
        ">${isEntrada ? '▲' : '▼'}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([r.lat, r.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui; min-width:160px;">
            <div style="font-weight:700; font-size:14px;">${nombre}</div>
            <div style="color:${color}; font-weight:600; font-size:13px; text-transform:capitalize;">${r.tipo}</div>
            <div style="color:#666; font-size:12px;">🕐 ${hora}</div>
            ${r.precision_gps ? `<div style="color:#999;font-size:11px;">±${Math.round(r.precision_gps)}m precisión</div>` : ''}
          </div>
        `);

      bounds.push([r.lat, r.lng]);
      markersRef.current.push(marker);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // Fix Leaflet size after render
    setTimeout(() => map.invalidateSize(), 200);
  }, [mapReady, registros, activeView]);

  // ── Calcular sesiones (pares entrada/salida) ──────────────────
  const getSesiones = () => {
    const byUser = {};
    registros.forEach(r => {
      if (!byUser[r.user_id]) byUser[r.user_id] = { entradas:[], salidas:[], info:r };
      if (r.tipo === 'entrada') byUser[r.user_id].entradas.push(r);
      else byUser[r.user_id].salidas.push(r);
    });

    return Object.values(byUser).map(({ entradas, salidas, info }) => {
      const entrada = entradas[0];
      const salida  = salidas[salidas.length - 1];
      let horas = null;
      if (entrada && salida) {
        const diff = (new Date(salida.timestamp) - new Date(entrada.timestamp)) / 3600000;
        horas = diff.toFixed(1);
      }
      return {
        user_id: info.user_id,
        nombre:  info.profiles?.full_name || info.user_id.slice(0,8),
        entrada, salida, horas,
      };
    });
  };

  const formatHora  = (ts) => ts ? new Date(ts).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}) : '—';
  const formatCoord = (lat, lng) => lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '—';

  const totalHoy    = registros.length;
  const totalEntradas = registros.filter(r=>r.tipo==='entrada').length;
  const sesiones    = getSesiones();
  const conSalida   = sesiones.filter(s=>s.salida).length;

  // ── ESTILOS ───────────────────────────────────────────────────
  const bg     = theme==='dark' ? '#0A0A0F' : '#F2F2F7';
  const card   = theme==='dark' ? '#1C1C1E' : '#FFFFFF';
  const text   = theme==='dark' ? '#FFFFFF' : '#000000';
  const sub    = theme==='dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const border = theme==='dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const input  = theme==='dark' ? '#2C2C2E' : '#F2F2F7';

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'system-ui',fontSize:16,opacity:0.5}}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:bg, fontFamily:"'Urbanist','SF Pro Display',system-ui,sans-serif", color:text }}>
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

      {/* ── NAV ── */}
      <div style={{ background:card, borderBottom:`1px solid ${border}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => history.back()} style={{ background:'none', border:'none', color:text, cursor:'pointer', fontSize:16, padding:'4px 8px 4px 0' }}>‹</button>
          <div style={{ width:34, height:34, borderRadius:10, background:cfg.accent+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{cfg.emoji}</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>Asistencia — {cfg.name}</div>
            <div style={{ fontSize:11, color:sub }}>Panel administrativo</div>
          </div>
        </div>
        <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
          style={{ background:border, border:'none', borderRadius:10, width:34, height:34, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {theme==='dark'?'☀️':'🌙'}
        </button>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 16px' }}>

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
            { label:'Registros totales', val:totalHoy, color:'#0A84FF', ico:'📋' },
            { label:'Entradas',          val:totalEntradas, color:'#30D158', ico:'🟢' },
            { label:'Con salida',        val:conSalida, color:'#FF9F0A', ico:'✅' },
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
              <div style={{ fontSize:15, fontWeight:700 }}>📋 Reporte de sesiones — {new Date(filtroFecha).toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr style={{ borderBottomColor:border }}>
                    {['Trabajador','Entrada','Salida','Horas','📍 GPS Entrada','📍 GPS Salida'].map(h => (
                      <th key={h} style={{ color:sub, fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.4, padding:'12px 14px',
                        display: h.includes('GPS') ? undefined : undefined }} className={h.includes('GPS')?'desktop-col':''}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sesiones.length === 0 && (
                    <tr style={{ borderBottomColor:'transparent' }}>
                      <td colSpan={6} style={{ textAlign:'center', color:sub, padding:32 }}>Sin registros para esta fecha</td>
                    </tr>
                  )}
                  {sesiones.map((s,i) => (
                    <tr key={s.user_id} style={{ borderBottomColor:border }}>
                      <td>
                        <div style={{ fontWeight:600, fontSize:14 }}>{s.nombre}</div>
                      </td>
                      <td>
                        <span style={{ color:'#30D158', fontWeight:600 }}>{formatHora(s.entrada?.timestamp)}</span>
                      </td>
                      <td>
                        <span style={{ color: s.salida ? '#FF9F0A' : sub, fontWeight: s.salida ? 600 : 400 }}>
                          {formatHora(s.salida?.timestamp)}
                        </span>
                      </td>
                      <td>
                        {s.horas
                          ? <span style={{ background:cfg.accent+'20', color:cfg.accent, borderRadius:8, padding:'3px 10px', fontSize:13, fontWeight:700 }}>{s.horas}h</span>
                          : <span style={{ color:sub, fontSize:13 }}>En turno</span>
                        }
                      </td>
                      <td className="desktop-col" style={{ fontSize:12, color:sub }}>
                        {s.entrada?.lat
                          ? <a href={`https://www.google.com/maps?q=${s.entrada.lat},${s.entrada.lng}`} target="_blank" rel="noreferrer"
                              style={{ color:cfg.accent, textDecoration:'none' }}>
                              {formatCoord(s.entrada?.lat, s.entrada?.lng)} ↗
                            </a>
                          : '—'}
                      </td>
                      <td className="desktop-col" style={{ fontSize:12, color:sub }}>
                        {s.salida?.lat
                          ? <a href={`https://www.google.com/maps?q=${s.salida.lat},${s.salida.lng}`} target="_blank" rel="noreferrer"
                              style={{ color:cfg.accent, textDecoration:'none' }}>
                              {formatCoord(s.salida?.lat, s.salida?.lng)} ↗
                            </a>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Detalle crudo ── */}
            {registros.length > 0 && (
              <details style={{ padding:20, borderTop:`1px solid ${border}` }}>
                <summary style={{ fontSize:13, color:sub, cursor:'pointer', fontWeight:600 }}>Ver todos los registros del día ({registros.length})</summary>
                <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                  {registros.map(r => (
                    <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:bg, borderRadius:12 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:r.tipo==='entrada'?'#30D158':'#FF3B30', flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <span style={{ fontWeight:600, fontSize:13 }}>{r.profiles?.full_name || '—'}</span>
                        <span style={{ color:sub, fontSize:12, marginLeft:8 }}>{new Date(r.timestamp).toLocaleString('es-PE')}</span>
                        <span style={{ color:r.tipo==='entrada'?'#30D158':'#FF3B30', fontSize:12, marginLeft:8, textTransform:'capitalize' }}>{r.tipo}</span>
                      </div>
                      {r.lat && (
                        <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, color:cfg.accent, textDecoration:'none' }}>📍 Ver</a>
                      )}
                    </div>
                  ))}
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
              <div style={{ fontSize:12, color:sub, marginTop:2 }}>
                🟢 Entrada &nbsp;&nbsp; 🔴 Salida
              </div>
            </div>

            {!mapReady && (
              <div style={{ height:400, display:'flex', alignItems:'center', justifyContent:'center', color:sub }}>
                Cargando mapa...
              </div>
            )}

            <div ref={mapRef} style={{ height:480, display: mapReady ? 'block' : 'none' }} />

            {registros.filter(r=>r.lat).length === 0 && mapReady && (
              <div style={{ padding:20, textAlign:'center', color:sub, fontSize:14 }}>
                Sin coordenadas GPS para mostrar en este período
              </div>
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
  );
}
