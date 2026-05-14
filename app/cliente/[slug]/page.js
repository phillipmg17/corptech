'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  innovatech: '00000000-0000-0000-0000-000000000003',
  wetech:     '00000000-0000-0000-0000-000000000004',
};
const SLUG_DEFAULTS = {
  futurteck:  { name:'Futurteck',        primary:'#007AFF', emoji:'🔵', id:'00000000-0000-0000-0000-000000000002' },
  innovatech: { name:'Innovatech Store', primary:'#BF5AF2', emoji:'🟣', id:'00000000-0000-0000-0000-000000000003' },
  wetech:     { name:'WeTech Peru',      primary:'#30D158', emoji:'🟢', id:'00000000-0000-0000-0000-000000000004' },
};

/* ── Status flow ── */
const ORDER_FLOW = ['pendiente','confirmado','procesando','entregado'];
const STATUS_META = {
  pendiente:  { label:'Pendiente',   icon:'⏳', color:'#FF9F0A', bg:'rgba(255,159,10,0.12)',  step:0 },
  confirmado: { label:'Confirmado',  icon:'✅', color:'#0A84FF', bg:'rgba(10,132,255,0.12)',  step:1 },
  procesando: { label:'En camino',   icon:'🚚', color:'#5E5CE6', bg:'rgba(94,92,230,0.12)',   step:2 },
  entregado:  { label:'Entregado',   icon:'📦', color:'#30D158', bg:'rgba(48,209,88,0.12)',   step:3 },
  entregada:  { label:'Entregado',   icon:'📦', color:'#30D158', bg:'rgba(48,209,88,0.12)',   step:3 },
  cancelado:  { label:'Cancelado',   icon:'❌', color:'#FF3B30', bg:'rgba(255,59,48,0.12)',   step:-1 },
  cancelada:  { label:'Cancelado',   icon:'❌', color:'#FF3B30', bg:'rgba(255,59,48,0.12)',   step:-1 },
  completada: { label:'Completado',  icon:'✅', color:'#30D158', bg:'rgba(48,209,88,0.12)',   step:3 },
};
function getSt(s) { return STATUS_META[s] || { label:s||'Pendiente', icon:'⏳', color:'#AEAEB2', bg:'rgba(174,174,178,0.12)', step:0 }; }

function hexAlpha(hex, a) {
  try {
    const h=hex.replace('#',''), r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return `rgba(128,128,128,${a})`; }
}
function fmt(n) { return `S/ ${Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:0,maximumFractionDigits:0})}`; }
function fmtDate(d) { if(!d)return''; return new Date(d).toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtTime(d) { if(!d)return''; return new Date(d).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}); }
function initials(name) { return (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

/* ══════════════════════════════
   SUBCOMPONENTE: Barra de progreso
══════════════════════════════ */
function OrderProgress({ status, P }) {
  const st = getSt(status);
  if (st.step === -1) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(255,59,48,0.08)', borderRadius:10, border:'1px solid rgba(255,59,48,0.15)' }}>
      <span style={{ fontSize:18 }}>❌</span>
      <span style={{ fontSize:13, fontWeight:700, color:'#FF3B30' }}>Pedido cancelado</span>
    </div>
  );
  const steps = ['Recibido','Confirmado','En camino','Entregado'];
  const stepIcons = ['📋','✅','🚚','📦'];
  return (
    <div style={{ padding:'10px 0 4px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
        {/* Línea de fondo */}
        <div style={{ position:'absolute', top:14, left:'6%', right:'6%', height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, zIndex:0 }} />
        {/* Línea de progreso */}
        <div style={{
          position:'absolute', top:14, left:'6%', height:3,
          width: `${st.step === 0 ? 0 : st.step === 1 ? 33 : st.step === 2 ? 66 : 88}%`,
          background: `linear-gradient(90deg, ${P}, ${hexAlpha(P,0.5)})`,
          borderRadius:2, zIndex:1, transition:'width .5s ease',
        }} />
        {steps.map((s, i) => {
          const done = i <= st.step;
          const active = i === st.step;
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, zIndex:2, flex:1 }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background: done ? P : 'rgba(255,255,255,0.08)',
                border: active ? `3px solid ${P}` : done ? 'none' : '2px solid rgba(255,255,255,0.12)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, transition:'all .3s',
                boxShadow: active ? `0 0 12px ${hexAlpha(P,0.5)}` : 'none',
              }}>
                {done ? <span style={{ fontSize:11 }}>{stepIcons[i]}</span> : <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>○</span>}
              </div>
              <span style={{ fontSize:9, fontWeight:700, color: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', textAlign:'center', lineHeight:1.2 }}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════ */
export default function ClientePortalPage({ params }) {
  const slug  = params.slug?.toLowerCase();
  const def   = SLUG_DEFAULTS[slug] || { name:'Tienda', primary:'#0A84FF', emoji:'🏪', id:null };
  const router = useRouter();

  const [loading,      setLoading]      = useState(true);
  const [user,         setUser]         = useState(null);
  const [store,        setStore]        = useState(null);
  const [customer,     setCustomer]     = useState(null);
  const [orders,       setOrders]       = useState([]);
  const [expanded,     setExpanded]     = useState(null);
  const [tab,          setTab]          = useState('pedidos');
  const [editMode,     setEditMode]     = useState(false);
  const [editName,     setEditName]     = useState('');
  const [editPhone,    setEditPhone]    = useState('');
  const [editAddress,  setEditAddress]  = useState('');
  const [savingProfile,setSavingProfile] = useState(false);
  const [savedOk,      setSavedOk]      = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const P = store?.color_primario || def.primary;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace(`/acceso/${slug}`); return; }

      /* Verificar rol */
      const { data: roleData } = await supabase
        .from('user_roles').select('role').eq('user_id', session.user.id).limit(1).maybeSingle();
      const r = roleData?.role;
      if (r && r !== 'cliente') {
        if (r === 'superadmin')               { router.replace('/superadmin'); return; }
        if (r === 'corp' || r === 'admin_corp'){ router.replace('/corp'); return; }
        router.replace('/store'); return;
      }
      setUser(session.user);

      const orgId = SLUG_MAP[slug] || def.id;

      /* Cargar tienda */
      const { data: storeData } = await supabase
        .from('tiendas_config')
        .select('org_id,store_name,logo_url,color_primario,whatsapp,direccion,phone')
        .eq('org_id', orgId).maybeSingle();
      setStore(storeData);

      /* Cargar / crear cliente */
      let cust = null;
      if (orgId) {
        const { data: c1 } = await supabase
          .from('customers').select('*')
          .eq('org_id', orgId).eq('email', session.user.email).maybeSingle();
        cust = c1;
        if (!cust) {
          const meta = session.user.user_metadata || {};
          const { data: nc } = await supabase.from('customers').insert({
            org_id: orgId, full_name: meta.full_name || session.user.email.split('@')[0],
            email: session.user.email, auth_user_id: session.user.id,
          }).select().single();
          cust = nc;
        } else if (!cust.auth_user_id) {
          await supabase.from('customers').update({ auth_user_id: session.user.id }).eq('id', cust.id);
          cust.auth_user_id = session.user.id;
        }
      }
      setCustomer(cust);
      setEditName(cust?.full_name || '');
      setEditPhone(cust?.phone || '');
      setEditAddress(cust?.address || '');

      /* Cargar pedidos — dos intentos para máxima compatibilidad con RLS */
      const email = session.user.email;
      let ordersData = [];

      // Intento 1: por customer_id (si tiene registro en customers)
      if (cust?.id) {
        const { data: o1 } = await supabase
          .from('online_orders')
          .select('id, total_amount, status, payment_method, items, notes, created_at, delivery_address, contact_email')
          .eq('org_id', orgId)
          .eq('customer_id', cust.id)
          .order('created_at', { ascending: false });
        ordersData = o1 || [];
      }

      // Intento 2: por email (pedidos hechos antes de tener cuenta)
      if (ordersData.length === 0 && email) {
        const { data: o2 } = await supabase
          .from('online_orders')
          .select('id, total_amount, status, payment_method, items, notes, created_at, delivery_address, contact_email')
          .eq('org_id', orgId)
          .eq('contact_email', email)
          .order('created_at', { ascending: false });
        ordersData = o2 || [];
      }

      setOrders(ordersData);
      setLoading(false);
    };
    init();
  }, [slug]);

  async function saveProfile() {
    if (!customer) return;
    setSavingProfile(true);
    await supabase.from('customers').update({
      full_name: editName, phone: editPhone, address: editAddress
    }).eq('id', customer.id);
    setCustomer(prev => ({ ...prev, full_name: editName, phone: editPhone, address: editAddress }));
    setSavingProfile(false);
    setEditMode(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace(`/acceso/${slug}`);
  }

  /* ── Filtros de pedidos ── */
  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => {
        if (filterStatus === 'activos') return !['entregado','entregada','completada','cancelado','cancelada'].includes(o.status);
        if (filterStatus === 'entregados') return ['entregado','entregada','completada'].includes(o.status);
        return o.status === filterStatus;
      });

  /* ── Stats ── */
  const totalGastado = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const activos = orders.filter(o => !['entregado','entregada','completada','cancelado','cancelada'].includes(o.status)).length;
  const entregados = orders.filter(o => ['entregado','entregada','completada'].includes(o.status)).length;

  /* ══════ LOADING ══════ */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.08)', borderTopColor: def.primary, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, fontFamily:"'Urbanist',sans-serif" }}>Cargando tu portal…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const storeName = store?.store_name || def.name;
  const logoUrl   = store?.logo_url || null;
  const storeWA   = store?.whatsapp || '';
  const custName  = customer?.full_name || user?.email?.split('@')[0] || 'Cliente';

  /* ══════ RENDER ══════ */
  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(170deg, ${hexAlpha(P,0.12)} 0%, #0a0a0a 35%, #080808 100%)`,
      fontFamily:"'Urbanist','SF Pro Display',system-ui,sans-serif",
      color:'#fff',
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pop     { 0%{transform:scale(0.92);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes glow    { 0%,100%{opacity:1} 50%{opacity:0.6} }
        * { box-sizing:border-box; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #1c1c1e inset!important; -webkit-text-fill-color:#fff!important; }
        input::placeholder, textarea::placeholder { color:rgba(255,255,255,0.2); }
        .cli-input {
          width:100%; padding:12px 16px;
          background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1);
          border-radius:14px; color:#fff; font-size:15px; font-family:inherit; outline:none;
          box-sizing:border-box; transition:border-color .2s,background .2s;
        }
        .cli-input:focus { border-color:var(--cp); background:rgba(255,255,255,0.08); }
        :root { --cp: ${P}; }
        .tab-btn { flex:1; padding:10px 0; border-radius:11px; border:none; cursor:pointer; font-size:13px; font-weight:700; font-family:inherit; transition:all .2s; white-space:nowrap; }
        .order-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; overflow:hidden; transition:border-color .2s; }
        .order-card:hover { border-color:rgba(255,255,255,0.14); }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:700; }
        .filter-pill { padding:7px 14px; border-radius:20px; border:1.5px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.45); font-size:12px; font-weight:700; font-family:inherit; cursor:pointer; transition:all .2s; white-space:nowrap; }
        .filter-pill.active { border-color:var(--cp); background:rgba(var(--cp-rgb,10,132,255),0.15); color:#fff; }
        .stat-card { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:14px 12px; text-align:center; transition:transform .2s; }
        .stat-card:hover { transform:translateY(-2px); }
        @media(max-width:400px) { .hide-xs { display:none!important } }
      `}</style>

      {/* ══════ NAVBAR ══════ */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(8,8,8,0.85)', backdropFilter:'blur(24px)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'12px 20px', display:'flex', alignItems:'center', gap:12 }}>
          {/* Logo */}
          <a href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
            {logoUrl
              ? <img src={logoUrl} alt={storeName} style={{ height:28, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
              : <span style={{ fontSize:22 }}>{def.emoji}</span>
            }
            <span style={{ fontWeight:800, fontSize:14, color:'rgba(255,255,255,0.85)' }}>{storeName}</span>
          </a>

          <div style={{ flex:1 }} />

          {/* Avatar + saludo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background:`linear-gradient(135deg, ${P}, ${hexAlpha(P,0.5)})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:800, color:'#fff', flexShrink:0,
            }}>
              {initials(custName)}
            </div>
            <a href="/" style={{
              fontSize:12, color:'rgba(255,255,255,0.35)', textDecoration:'none', fontWeight:600,
              padding:'5px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)',
              transition:'all .2s',
            }}>
              ← Tienda
            </a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px 48px' }}>

        {/* ══════ HERO — BIENVENIDA ══════ */}
        <div style={{
          background:`linear-gradient(135deg, ${hexAlpha(P,0.18)}, ${hexAlpha(P,0.06)})`,
          border:`1px solid ${hexAlpha(P,0.2)}`,
          borderRadius:24, padding:'20px 22px', marginBottom:20,
          animation:'pop 0.4s ease',
          position:'relative', overflow:'hidden',
        }}>
          {/* Glow decorativo */}
          <div style={{
            position:'absolute', top:-40, right:-40, width:160, height:160,
            borderRadius:'50%', background: hexAlpha(P,0.10), filter:'blur(40px)', pointerEvents:'none',
          }} />

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, position:'relative' }}>
            <div>
              <p style={{ color: hexAlpha(P,0.9), fontSize:12, fontWeight:700, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'1px' }}>
                Mi portal
              </p>
              <h1 style={{ fontSize:'clamp(20px,5vw,26px)', fontWeight:900, margin:'0 0 3px', letterSpacing:'-0.5px' }}>
                Hola, {custName.split(' ')[0]} 👋
              </h1>
              <p style={{ color:'rgba(255,255,255,0.38)', fontSize:13, margin:0 }}>{user?.email}</p>
            </div>
            <button onClick={doLogout} style={{
              background:'rgba(255,59,48,0.10)', border:'1px solid rgba(255,59,48,0.18)',
              color:'#FF3B30', borderRadius:12, padding:'8px 14px',
              fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0,
            }}>
              Salir
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:18 }}>
            {[
              { val: orders.length,  lbl:'Total pedidos',  icon:'🛍️' },
              { val: activos,        lbl:'En proceso',     icon:'🚚' },
              { val: fmt(totalGastado), lbl:'Total gastado', icon:'💰', small: true },
            ].map((s,i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize:20, marginBottom:5 }}>{s.icon}</div>
                <p style={{ fontSize: s.small ? 13 : 20, fontWeight:900, margin:'0 0 2px', color: P, lineHeight:1 }}>
                  {s.val}
                </p>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', margin:0, letterSpacing:'0.2px' }}>{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════ ACCIONES RÁPIDAS ══════ */}
        <div style={{ display:'flex', gap:10, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {[
            { icon:'🏪', lbl:'Ver tienda',  href:'/', primary:false },
            storeWA && { icon:'💬', lbl:'WhatsApp',  href:`https://wa.me/${storeWA.replace(/\D/g,'')}`, primary:false, ext:true },
            { icon:'📦', lbl:'Mis pedidos', action:() => setTab('pedidos'), primary: tab==='pedidos' },
            { icon:'👤', lbl:'Mi perfil',   action:() => setTab('perfil'),  primary: tab==='perfil' },
          ].filter(Boolean).map((a,i) => a.href ? (
            <a key={i} href={a.href} target={a.ext?'_blank':undefined} rel={a.ext?'noopener noreferrer':undefined}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
                background: a.primary ? P : 'rgba(255,255,255,0.06)',
                border: `1px solid ${a.primary ? P : 'rgba(255,255,255,0.1)'}`,
                borderRadius:14, textDecoration:'none',
                color: a.primary ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize:13, fontWeight:700, whiteSpace:'nowrap', transition:'all .2s', flexShrink:0,
              }}>
              <span>{a.icon}</span> {a.lbl}
            </a>
          ) : (
            <button key={i} onClick={a.action}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
                background: a.primary ? P : 'rgba(255,255,255,0.06)',
                border: `1px solid ${a.primary ? P : 'rgba(255,255,255,0.1)'}`,
                borderRadius:14, cursor:'pointer', fontFamily:'inherit',
                color: a.primary ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize:13, fontWeight:700, whiteSpace:'nowrap', transition:'all .2s', flexShrink:0,
              }}>
              <span>{a.icon}</span> {a.lbl}
            </button>
          ))}
        </div>

        {/* ══════ TABS ══════ */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:5, marginBottom:20, gap:4 }}>
          {[
            { id:'pedidos', lbl:'📦 Pedidos', badge: activos > 0 ? activos : null },
            { id:'perfil',  lbl:'👤 Mi perfil' },
          ].map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
              style={{
                background: tab===t.id ? P : 'transparent',
                color:      tab===t.id ? '#fff' : 'rgba(255,255,255,0.38)',
                position:'relative',
              }}>
              {t.lbl}
              {t.badge && (
                <span style={{
                  position:'absolute', top:3, right:12,
                  background:'#FF3B30', color:'#fff', borderRadius:'50%',
                  width:16, height:16, fontSize:9, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════ TAB PEDIDOS ══════ */}
        {tab === 'pedidos' && (
          <div style={{ animation:'fadeUp 0.25s ease' }}>

            {/* Filtros */}
            {orders.length > 0 && (
              <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
                {[
                  { id:'all',       lbl:`Todos (${orders.length})` },
                  { id:'activos',   lbl:`En proceso (${activos})` },
                  { id:'entregados',lbl:`Entregados (${entregados})` },
                ].map(f => (
                  <button key={f.id} className={`filter-pill${filterStatus===f.id?' active':''}`}
                    onClick={() => setFilterStatus(f.id)}>
                    {f.lbl}
                  </button>
                ))}
              </div>
            )}

            {/* Lista vacía */}
            {filteredOrders.length === 0 && (
              <div style={{
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:24, padding:'56px 24px', textAlign:'center',
              }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🛍️</div>
                <h3 style={{ fontSize:18, fontWeight:800, margin:'0 0 8px' }}>
                  {filterStatus === 'all' ? 'Aún no tienes pedidos' : 'No hay pedidos aquí'}
                </h3>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, margin:'0 0 24px' }}>
                  {filterStatus === 'all'
                    ? 'Visita nuestra tienda y encuentra los mejores productos.'
                    : 'Cambia el filtro para ver otros pedidos.'}
                </p>
                <a href="/" style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  padding:'12px 28px', background:P, color:'#fff',
                  borderRadius:16, textDecoration:'none', fontSize:15, fontWeight:700,
                }}>🏪 Ver productos</a>
              </div>
            )}

            {/* Cards de pedido */}
            {filteredOrders.map(order => {
              const st  = getSt(order.status);
              const exp = expanded === order.id;
              const items = order.items || [];
              const previewName = items.slice(0,2).map(i=>i.name||'Producto').join(', ') + (items.length > 2 ? ` +${items.length-2}` : '');

              return (
                <div key={order.id} className="order-card" style={{ marginBottom:12 }}>

                  {/* ── Header clickable ── */}
                  <button onClick={() => setExpanded(exp ? null : order.id)}
                    style={{ width:'100%', padding:'16px 18px 12px', background:'none', border:'none', cursor:'pointer', textAlign:'left', color:'#fff', fontFamily:'inherit' }}>

                    {/* Row top */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        {/* ID y fecha */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)', letterSpacing:'0.3px' }}>
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.18)' }}>·</span>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>
                            {fmtDate(order.created_at)} {fmtTime(order.created_at)}
                          </span>
                        </div>
                        {/* Nombre productos */}
                        <p style={{ fontSize:15, fontWeight:700, margin:'0 0 8px', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>
                          {previewName || 'Pedido'}
                        </p>
                        {/* Status chip */}
                        <span className="chip" style={{ background: st.bg, color: st.color }}>
                          {st.icon} {st.label}
                        </span>
                      </div>

                      {/* Monto + chevron */}
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p style={{ fontSize:20, fontWeight:900, margin:'0 0 6px', color: P, letterSpacing:'-0.5px' }}>
                          {fmt(order.total_amount)}
                        </p>
                        <span style={{ fontSize:16, color:'rgba(255,255,255,0.2)', display:'inline-block', transition:'transform .25s', transform: exp ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          ▾
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso siempre visible */}
                    {st.step >= 0 && <OrderProgress status={order.status} P={P} />}
                  </button>

                  {/* ── Detalle expandible ── */}
                  {exp && (
                    <div style={{
                      borderTop:'1px solid rgba(255,255,255,0.06)',
                      padding:'16px 18px 20px',
                      animation:'fadeUp 0.2s ease',
                    }}>

                      {/* Artículos */}
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>
                        Artículos ({items.length})
                      </p>
                      <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:14 }}>
                        {items.map((item,i) => (
                          <div key={i} style={{
                            display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                            borderBottom: i < items.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}>
                            <div style={{
                              width:42, height:42, borderRadius:12,
                              background:`linear-gradient(135deg, ${hexAlpha(P,0.15)}, ${hexAlpha(P,0.06)})`,
                              border:`1px solid ${hexAlpha(P,0.2)}`,
                              display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0,
                            }}>📱</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:14, fontWeight:700, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                {item.name || 'Producto'}
                              </p>
                              <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>
                                {item.variant ? `${item.variant} · ` : ''}Cant: {item.qty || 1}
                              </p>
                            </div>
                            <p style={{ fontSize:14, fontWeight:700, color:'#fff', margin:0, flexShrink:0 }}>
                              {fmt((item.price || 0) * (item.qty || 1))}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Detalles extra */}
                      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                        {order.payment_method && (
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', minWidth:90 }}>Pago con</span>
                            <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', textTransform:'capitalize' }}>
                              {order.payment_method}
                            </span>
                          </div>
                        )}
                        {order.delivery_address && (
                          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                            <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', minWidth:90 }}>Dirección</span>
                            <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{order.delivery_address}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                            <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', minWidth:90 }}>Notas</span>
                            <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{order.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Subtotal / Total */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'rgba(255,255,255,0.04)', borderRadius:14, marginBottom:14 }}>
                        <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Total del pedido</span>
                        <span style={{ fontSize:18, fontWeight:900, color: P }}>{fmt(order.total_amount)}</span>
                      </div>

                      {/* CTA WhatsApp soporte */}
                      {storeWA && (
                        <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${storeName}! Tengo una consulta sobre mi pedido #${order.id.slice(-8).toUpperCase()}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                            padding:'11px', borderRadius:14, textDecoration:'none',
                            background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.18)',
                            color:'#25D366', fontSize:13, fontWeight:700,
                          }}>
                          💬 Consultar por WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ TAB PERFIL ══════ */}
        {tab === 'perfil' && (
          <div style={{ animation:'fadeUp 0.25s ease', display:'flex', flexDirection:'column', gap:14 }}>

            {/* Toast de guardado */}
            {savedOk && (
              <div style={{
                position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
                background:'#30D158', color:'#fff', borderRadius:14, padding:'12px 24px',
                fontSize:14, fontWeight:700, zIndex:999, animation:'pop 0.3s ease',
                boxShadow:'0 8px 30px rgba(48,209,88,0.4)',
              }}>
                ✅ Perfil guardado
              </div>
            )}

            {/* Card avatar */}
            <div style={{
              background:`linear-gradient(135deg, ${hexAlpha(P,0.12)}, rgba(255,255,255,0.03))`,
              border:`1px solid ${hexAlpha(P,0.18)}`,
              borderRadius:22, padding:'22px', display:'flex', alignItems:'center', gap:16,
            }}>
              <div style={{
                width:64, height:64, borderRadius:'50%', flexShrink:0,
                background:`linear-gradient(135deg, ${P}, ${hexAlpha(P,0.5)})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, fontWeight:900, color:'#fff',
                boxShadow:`0 8px 24px ${hexAlpha(P,0.35)}`,
              }}>
                {initials(custName)}
              </div>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, margin:'0 0 3px' }}>{custName}</h2>
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:0 }}>{user?.email}</p>
                <p style={{ color: hexAlpha(P,0.85), fontSize:11, fontWeight:700, margin:'5px 0 0', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  Cliente verificado ✓
                </p>
              </div>
            </div>

            {/* Formulario */}
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:22, padding:'22px',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:800, margin:0 }}>Mis datos</h3>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} style={{
                    background: hexAlpha(P,0.15), border:`1px solid ${hexAlpha(P,0.3)}`,
                    color: P, borderRadius:10, padding:'7px 16px',
                    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  }}>✏️ Editar</button>
                ) : (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => { setEditMode(false); setEditName(customer?.full_name||''); setEditPhone(customer?.phone||''); setEditAddress(customer?.address||''); }}
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', borderRadius:10, padding:'7px 12px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      Cancelar
                    </button>
                    <button onClick={saveProfile} disabled={savingProfile} style={{
                      background: P, border:'none', color:'#fff',
                      borderRadius:10, padding:'7px 16px',
                      fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                      opacity: savingProfile ? 0.7 : 1,
                    }}>
                      {savingProfile ? 'Guardando…' : '✓ Guardar'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Email (readonly) */}
                <div>
                  <label style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', display:'block', marginBottom:7 }}>
                    Email
                  </label>
                  <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                    <p style={{ fontSize:15, margin:0, color:'rgba(255,255,255,0.4)' }}>{user?.email}</p>
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', display:'block', marginBottom:7 }}>
                    Nombre completo
                  </label>
                  {editMode
                    ? <input className="cli-input" value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Tu nombre completo" />
                    : <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                        <p style={{ fontSize:15, margin:0, color: editName ? '#fff' : 'rgba(255,255,255,0.25)' }}>{editName || '—'}</p>
                      </div>
                  }
                </div>

                {/* Teléfono */}
                <div>
                  <label style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', display:'block', marginBottom:7 }}>
                    Teléfono
                  </label>
                  {editMode
                    ? <input className="cli-input" value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="+51 999 999 999" type="tel" />
                    : <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                        <p style={{ fontSize:15, margin:0, color: editPhone ? '#fff' : 'rgba(255,255,255,0.25)' }}>{editPhone || '—'}</p>
                      </div>
                  }
                </div>

                {/* Dirección */}
                <div>
                  <label style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', display:'block', marginBottom:7 }}>
                    Dirección de envío
                  </label>
                  {editMode
                    ? <input className="cli-input" value={editAddress} onChange={e=>setEditAddress(e.target.value)} placeholder="Tu dirección de entrega" />
                    : <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1.5px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                        <p style={{ fontSize:15, margin:0, color: editAddress ? '#fff' : 'rgba(255,255,255,0.25)' }}>{editAddress || '—'}</p>
                      </div>
                  }
                </div>
              </div>

              <div style={{ marginTop:24, paddingTop:18, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', margin:0, lineHeight:1.6 }}>
                  Para cambiar tu contraseña ve a{' '}
                  <a href="/acceso" style={{ color: hexAlpha(P,0.8), textDecoration:'none', fontWeight:700 }}>
                    Acceso
                  </a>{' '}
                  → "¿Olvidaste tu contraseña?"
                </p>
              </div>
            </div>

            {/* Zona peligrosa */}
            <div style={{ background:'rgba(255,59,48,0.05)', border:'1px solid rgba(255,59,48,0.12)', borderRadius:18, padding:'18px 22px' }}>
              <h4 style={{ fontSize:13, fontWeight:700, color:'rgba(255,59,48,0.7)', margin:'0 0 8px' }}>Sesión</h4>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:'0 0 14px' }}>
                Cierra sesión en este dispositivo de forma segura.
              </p>
              <button onClick={doLogout} style={{
                background:'transparent', border:'1px solid rgba(255,59,48,0.3)',
                color:'#FF3B30', borderRadius:12, padding:'10px 20px',
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                transition:'all .2s',
              }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.1)', fontSize:11, marginTop:36, letterSpacing:'0.3px' }}>
          {storeName} · Portal de clientes
        </p>
      </div>
    </div>
  );
}
