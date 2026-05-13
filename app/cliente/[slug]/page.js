'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SLUG_DEFAULTS = {
  futurteck:  { name: 'Futurteck',        primary: '#007AFF', emoji: '🔵', id: '00000000-0000-0000-0000-000000000002' },
  innovatech: { name: 'Innovatech Store',  primary: '#BF5AF2', emoji: '🟣', id: '00000000-0000-0000-0000-000000000003' },
  wetech:     { name: 'WeTech Peru',       primary: '#30D158', emoji: '🟢', id: '00000000-0000-0000-0000-000000000004' },
};

function hexAlpha(hex, a) {
  try {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return `rgba(128,128,128,${a})`; }
}

function fmt(n) { return `S/ ${Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',')}`; }

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}

const STATUS_STYLES = {
  completada:  { label:'✅ Completada',  bg:'rgba(48,209,88,0.12)',  color:'#30D158' },
  pendiente:   { label:'⏳ Pendiente',   bg:'rgba(255,159,10,0.12)', color:'#FF9F0A' },
  cancelada:   { label:'❌ Cancelada',   bg:'rgba(255,59,48,0.12)',  color:'#FF3B30' },
  procesando:  { label:'🔄 En proceso',  bg:'rgba(10,132,255,0.12)', color:'#0A84FF' },
  entregada:   { label:'📦 Entregada',   bg:'rgba(48,209,88,0.12)',  color:'#30D158' },
};
function getStatus(s) { return STATUS_STYLES[s] || { label: s || 'Pendiente', bg:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)' }; }

export default function ClientePortalPage({ params }) {
  const slug   = params.slug?.toLowerCase();
  const def    = SLUG_DEFAULTS[slug] || { name:'Tienda', primary:'#0A84FF', emoji:'🏪', id:null };
  const router = useRouter();

  const [loading,   setLoading]   = useState(true);
  const [user,      setUser]      = useState(null);
  const [store,     setStore]     = useState(null);
  const [customer,  setCustomer]  = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [expanded,  setExpanded]  = useState(null); // id del pedido expandido
  const [tab,       setTab]       = useState('pedidos'); // 'pedidos' | 'perfil'
  const [editMode,  setEditMode]  = useState(false);
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const P = store?.theme_color || def.primary;

  useEffect(() => {
    const init = async () => {
      /* 1. Verificar sesión */
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace(`/acceso/${slug}`); return; }

      /* 2. Verificar que no sea staff (staff va a /store o /pos) */
      const { data: roleData } = await supabase
        .from('user_roles').select('role').eq('user_id', session.user.id).limit(1).maybeSingle();
      const r = roleData?.role;
      if (r && r !== 'cliente') {
        if (r === 'superadmin')   { router.replace('/superadmin'); return; }
        if (r === 'corp' || r === 'admin_corp') { router.replace('/corp'); return; }
        router.replace('/store'); return;
      }

      setUser(session.user);

      /* 3. Cargar tienda */
      const { data: storeData } = await supabase
        .from('stores').select('id,store_name,logo_url,theme_color,whatsapp,direccion')
        .eq('slug', slug).maybeSingle();
      setStore(storeData);
      const storeId = storeData?.id || def.id;

      /* 4. Buscar cliente por email o auth_user_id */
      let cust = null;
      if (storeId) {
        const { data: c1 } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', storeId)
          .eq('email', session.user.email)
          .maybeSingle();
        cust = c1;

        /* Si no existe, crear registro automáticamente */
        if (!cust) {
          const meta = session.user.user_metadata || {};
          const { data: newCust } = await supabase
            .from('customers')
            .insert({
              store_id: storeId,
              name:  meta.full_name || session.user.email.split('@')[0],
              email: session.user.email,
              auth_user_id: session.user.id,
            })
            .select().single();
          cust = newCust;
        } else if (!cust.auth_user_id) {
          /* Vincular auth_user_id si aún no está */
          await supabase.from('customers').update({ auth_user_id: session.user.id }).eq('id', cust.id);
          cust.auth_user_id = session.user.id;
        }
      }
      setCustomer(cust);
      setEditName(cust?.name || '');
      setEditPhone(cust?.phone || '');

      /* 5. Cargar pedidos */
      if (cust?.id) {
        const { data: salesData } = await supabase
          .from('sales')
          .select(`
            id, total, status, payment_method, notes, created_at,
            sale_items(qty, price, discount,
              products(name, photo, brand, category)
            )
          `)
          .eq('store_id', storeId)
          .eq('customer_id', cust.id)
          .order('created_at', { ascending: false });
        setOrders(salesData || []);
      }

      setLoading(false);
    };
    init();
  }, [slug]);

  async function saveProfile() {
    if (!customer) return;
    setSavingProfile(true);
    await supabase.from('customers').update({ name: editName, phone: editPhone }).eq('id', customer.id);
    setCustomer(prev => ({ ...prev, name: editName, phone: editPhone }));
    setSavingProfile(false);
    setEditMode(false);
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace(`/acceso/${slug}`);
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.08)', borderTopColor: def.primary, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const storeName = store?.store_name || def.name;
  const logoUrl   = store?.logo_url   || null;
  const custName  = customer?.name    || user?.email?.split('@')[0] || 'Cliente';

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${hexAlpha(P, 0.10)} 0%, #080808 40%)`,
      fontFamily: "'Urbanist','SF Pro Display',system-ui,sans-serif",
      color: '#fff',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1c1c1e inset !important; -webkit-text-fill-color:#fff !important; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .cli-input {
          width:100%; padding:11px 14px; background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1); border-radius:12px;
          color:#fff; font-size:15px; font-family:inherit; outline:none;
          box-sizing:border-box; transition:border-color .2s;
        }
        .cli-input:focus { border-color: var(--p); }
        :root { --p: ${P}; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 20px',
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {logoUrl
            ? <img src={logoUrl} alt={storeName} style={{ height:30, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            : <span style={{ fontSize:24 }}>{def.emoji}</span>
          }
          <span style={{ fontWeight:800, fontSize:15 }}>{storeName}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)', display:'none' }} className="desktop-only">
            Hola, {custName.split(' ')[0]}
          </span>
          <a href="/" style={{
            fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none', fontWeight:600,
            padding:'5px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)',
          }}>
            ← Tienda
          </a>
        </div>
      </nav>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 16px' }}>

        {/* ── BIENVENIDA ── */}
        <div style={{
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:20, padding:'20px 22px', marginBottom:20,
          animation:'fadeUp 0.3s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                Mi cuenta
              </p>
              <h2 style={{ fontSize:22, fontWeight:800, margin:0 }}>{custName}</h2>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:'4px 0 0' }}>{user?.email}</p>
            </div>
            <button onClick={doLogout}
              style={{
                background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.2)',
                color:'#FF3B30', borderRadius:10, padding:'7px 12px',
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>Salir</button>
          </div>
          {/* Stats */}
          <div style={{ display:'flex', gap:12, marginTop:16 }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
              <p style={{ fontSize:22, fontWeight:800, margin:0, color: P }}>{orders.length}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>Pedidos</p>
            </div>
            <div style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
              <p style={{ fontSize:22, fontWeight:800, margin:0, color: P }}>
                {fmt(orders.reduce((s,o) => s + (o.total || 0), 0))}
              </p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>Total gastado</p>
            </div>
            <div style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
              <p style={{ fontSize:22, fontWeight:800, margin:0, color: P }}>
                {orders.filter(o=>o.status==='completada'||o.status==='entregada').length}
              </p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>Completados</p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:14, padding:4, marginBottom:20, gap:4 }}>
          {[
            { id:'pedidos', lbl:'📦 Mis pedidos' },
            { id:'perfil',  lbl:'👤 Mi perfil'   },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex:1, padding:'10px 0', borderRadius:11, border:'none', cursor:'pointer',
                fontSize:14, fontWeight:700, fontFamily:'inherit', transition:'all .2s',
                background: tab === t.id ? P : 'transparent',
                color:      tab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>{t.lbl}</button>
          ))}
        </div>

        {/* ── TAB PEDIDOS ── */}
        {tab === 'pedidos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.25s ease' }}>
            {orders.length === 0 ? (
              <div style={{
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:20, padding:'48px 24px', textAlign:'center',
              }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🛍️</div>
                <h3 style={{ fontSize:18, fontWeight:700, margin:'0 0 8px' }}>Aún no tienes pedidos</h3>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, margin:'0 0 20px' }}>
                  Visita nuestra tienda y encuentra los mejores productos.
                </p>
                <a href="/" style={{
                  display:'inline-block', padding:'12px 24px',
                  background: P, color:'#fff', borderRadius:14,
                  textDecoration:'none', fontSize:15, fontWeight:700,
                }}>Ver productos</a>
              </div>
            ) : (
              orders.map(order => {
                const st  = getStatus(order.status);
                const exp = expanded === order.id;
                return (
                  <div key={order.id}
                    style={{
                      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:18, overflow:'hidden', animation:'fadeUp 0.3s ease',
                    }}>
                    {/* Header del pedido */}
                    <button onClick={() => setExpanded(exp ? null : order.id)}
                      style={{
                        width:'100%', padding:'16px 18px', background:'none', border:'none',
                        cursor:'pointer', textAlign:'left', color:'#fff',
                      }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:'0 0 4px', letterSpacing:'0.3px' }}>
                            Pedido #{order.id.slice(-6).toUpperCase()} · {fmtDate(order.created_at)}
                          </p>
                          <p style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>
                            {order.sale_items?.map(i => i.products?.name || 'Producto').slice(0,2).join(', ')}
                            {order.sale_items?.length > 2 ? ` +${order.sale_items.length - 2} más` : ''}
                          </p>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{
                              fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:6,
                              background: st.bg, color: st.color,
                            }}>{st.label}</span>
                            {order.payment_method && (
                              <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
                                · {order.payment_method}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <p style={{ fontSize:18, fontWeight:800, margin:'0 0 4px', color: P }}>{fmt(order.total)}</p>
                          <span style={{ fontSize:18, color:'rgba(255,255,255,0.25)', transition:'transform .2s',
                            display:'inline-block', transform: exp ? 'rotate(180deg)' : 'none' }}>
                            ▾
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Detalle expandible */}
                    {exp && (
                      <div style={{
                        borderTop:'1px solid rgba(255,255,255,0.07)',
                        padding:'14px 18px 18px',
                        animation:'fadeUp 0.2s ease',
                      }}>
                        <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                          Artículos
                        </p>
                        {order.sale_items?.map((item, i) => (
                          <div key={i} style={{
                            display:'flex', alignItems:'center', gap:12,
                            padding:'10px 0',
                            borderBottom: i < order.sale_items.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}>
                            {item.products?.photo ? (
                              <img src={item.products.photo} alt="" style={{ width:44, height:44, objectFit:'cover', borderRadius:10 }} />
                            ) : (
                              <div style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📱</div>
                            )}
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:14, fontWeight:600, margin:'0 0 2px' }}>
                                {item.products?.name || 'Producto'}
                              </p>
                              <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0 }}>
                                {item.products?.brand && `${item.products.brand} · `}Cant: {item.qty}
                              </p>
                            </div>
                            <p style={{ fontSize:14, fontWeight:700, margin:0 }}>
                              {fmt((item.price || 0) * (item.qty || 1))}
                            </p>
                          </div>
                        ))}
                        {order.notes && (
                          <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:'0 0 2px' }}>Notas</p>
                            <p style={{ fontSize:13, margin:0 }}>{order.notes}</p>
                          </div>
                        )}
                        {/* Soporte WhatsApp */}
                        {store?.whatsapp && (
                          <a href={`https://wa.me/${store.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola! Tengo una consulta sobre mi pedido #${order.id.slice(-6).toUpperCase()}`)}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                              marginTop:14, padding:'10px', borderRadius:12, textDecoration:'none',
                              background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.2)',
                              color:'#25D366', fontSize:13, fontWeight:700,
                            }}>
                            💬 Consultar por WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB PERFIL ── */}
        {tab === 'perfil' && (
          <div style={{
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20, padding:'22px', animation:'fadeUp 0.25s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:700, margin:0 }}>Mis datos</h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)}
                  style={{ background: hexAlpha(P,0.15), border:`1px solid ${hexAlpha(P,0.3)}`,
                    color: P, borderRadius:10, padding:'7px 14px',
                    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Editar
                </button>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setEditMode(false); setEditName(customer?.name||''); setEditPhone(customer?.phone||''); }}
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                      color:'rgba(255,255,255,0.5)', borderRadius:10, padding:'7px 12px',
                      fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    Cancelar
                  </button>
                  <button onClick={saveProfile} disabled={savingProfile}
                    style={{ background: P, border:'none',
                      color:'#fff', borderRadius:10, padding:'7px 14px',
                      fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    {savingProfile ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { lbl:'Nombre', val: editMode ? editName : (customer?.name || '—'), key:'name' },
                { lbl:'Email',  val: user?.email || '—', key:'email', readOnly:true },
                { lbl:'Teléfono', val: editMode ? editPhone : (customer?.phone || '—'), key:'phone' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                    {f.lbl}
                  </label>
                  {editMode && !f.readOnly ? (
                    <input
                      className="cli-input"
                      style={{ marginTop:6 }}
                      value={f.key==='name' ? editName : editPhone}
                      onChange={e => f.key==='name' ? setEditName(e.target.value) : setEditPhone(e.target.value)}
                      placeholder={f.key==='phone' ? '+51 999 999 999' : f.lbl}
                    />
                  ) : (
                    <p style={{ fontSize:15, margin:'5px 0 0', color: f.readOnly ? 'rgba(255,255,255,0.5)' : '#fff' }}>
                      {f.val}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', margin:0 }}>
                Para cambiar tu contraseña, usa la opción "Olvidé mi contraseña" en la pantalla de acceso.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:32, marginBottom:16 }}>
          <p style={{ color:'rgba(255,255,255,0.12)', fontSize:12, margin:0 }}>{storeName} · Portal de clientes</p>
        </div>
      </div>
    </div>
  );
}
