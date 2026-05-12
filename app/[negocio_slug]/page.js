'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CORP_ID = '00000000-0000-0000-0000-000000000001';
const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  innovatech: '00000000-0000-0000-0000-000000000003',
  wetech:     '00000000-0000-0000-0000-000000000004',
};
const SLUG_DEFAULTS = {
  futurteck:  { color_primario:'#007AFF', color_secundario:'#0A84FF', store_name:'Futurteck',       tagline:'Tecnología que transforma tu vida' },
  innovatech: { color_primario:'#BF5AF2', color_secundario:'#9B59B6', store_name:'Innovatech Store', tagline:'Innovación en cada dispositivo'   },
  wetech:     { color_primario:'#30D158', color_secundario:'#25A244', store_name:'WeTech Peru',      tagline:'Tu tienda tech de confianza'       },
};
const CAT_EMOJI = { iPhone:'📱', iPad:'📱', Mac:'🖥️', AirPods:'🎧', Wearables:'⌚', Accesorios:'🔌', Android:'📲', Laptops:'💻', default:'📦' };

function hex(h, a) {
  if (!h?.startsWith('#')) return `rgba(128,128,128,${a})`;
  const [r,g,b] = [h.slice(1,3),h.slice(3,5),h.slice(5,7)].map(x=>parseInt(x,16));
  return `rgba(${r},${g},${b},${a})`;
}

export default function TiendaPage({ params }) {
  const slug  = params.negocio_slug?.toLowerCase();
  const orgId = SLUG_MAP[slug];
  const def   = SLUG_DEFAULTS[slug] || SLUG_DEFAULTS.futurteck;

  const [config,      setConfig]      = useState(null);
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [catActive,   setCatActive]   = useState('Todos');
  const [searchQ,     setSearchQ]     = useState('');
  const [cart,        setCart]        = useState([]);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [checkoutOpen,setCheckoutOpen]= useState(false);
  const [orderForm,   setOrderForm]   = useState({ name:'', phone:'', notes:'' });
  const [orderSent,   setOrderSent]   = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const C = {
    primary:  config?.color_primario   || def.color_primario,
    second:   config?.color_secundario || def.color_secundario,
    accent:   config?.color_acento     || '#30D158',
  };

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    Promise.all([loadConfig(), loadProducts()]).then(() => setLoading(false));
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  async function loadConfig() {
    const { data } = await supabase.from('tiendas_config').select('*').eq('org_id', orgId).single();
    if (data) setConfig(data);
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('stock_items')
      .select('id,product_id,sale_price,emoji,owner_org_id,products(id,name,description,category,emoji,image_url)')
      .eq('status','available')
      .in('owner_org_id',[orgId, CORP_ID]);
    if (!data) return;

    const map = {};
    data.forEach(item => {
      const pid    = item.product_id;
      const prod   = item.products || {};
      const cat    = prod.category || 'Accesorios';
      const emoji  = prod.emoji || item.emoji || CAT_EMOJI[cat] || '📦';
      const imgUrl = prod.image_url || null;
      if (!map[pid]) map[pid] = { id:pid, name:prod.name||'Producto', description:prod.description||'', category:cat, emoji, imgUrl, units:[], minPrice:Infinity, maxPrice:0 };
      map[pid].units.push({ id:item.id, price:item.sale_price||0 });
      if ((item.sale_price||0) < map[pid].minPrice) map[pid].minPrice = item.sale_price||0;
      if ((item.sale_price||0) > map[pid].maxPrice) map[pid].maxPrice = item.sale_price||0;
    });
    setProducts(Object.values(map).filter(p => p.units.length > 0));
  }

  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchCat  = catActive === 'Todos' || p.category === catActive;
    const matchSrch = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchSrch;
  });

  const cartCount = cart.reduce((s,i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id===p.id ? {...i,qty:i.qty+1} : i);
      return [...prev, {...p, qty:1, price:p.minPrice}];
    });
    setSelected(null);
  }
  function removeCart(id)  { setCart(p => p.filter(i => i.id !== id)); }
  function changeQty(id,d) { setCart(p => p.map(i => i.id===id ? {...i,qty:Math.max(1,i.qty+d)} : i)); }

  function sendOrder(e) {
    e.preventDefault();
    const waMensaje = config?.whatsapp_mensaje || 'Hola, quiero información sobre';
    const lines = cart.map(i=>`• ${i.emoji} ${i.name} ×${i.qty} — S/${(i.price*i.qty).toFixed(2)}`).join('\n');
    const msg = `${waMensaje}\n\n*Pedido de ${orderForm.name}:*\n${lines}\n\n*Total: S/${cartTotal.toFixed(2)}*\nTel: ${orderForm.phone}${orderForm.notes?`\nNotas: ${orderForm.notes}`:''}`;
    if (config?.whatsapp_numero) window.open(`https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(msg)}`,'_blank');
    setOrderSent(true);
  }

  const storeName   = config?.store_name  || def.store_name;
  const tagline     = config?.tagline     || def.tagline;
  const testimonios = config?.testimonios || [];
  const horarios    = config?.horarios    || { 'Lun–Vie':'9am–7pm', 'Sábado':'10am–6pm', 'Domingo':'Cerrado' };
  const rating      = config?.google_rating   || 4.9;
  const reviewCount = config?.google_reviews  || 0;
  const banners     = config?.banner_urls || [];

  const S = {
    page:    { minHeight:'100dvh', background:'#050508', color:'#e8e8f0', fontFamily:"'Urbanist','Inter',sans-serif", overflowX:'hidden' },
    nav:     { position:'sticky', top:0, zIndex:200, height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background: scrolled?'rgba(5,5,8,0.92)':'transparent', backdropFilter: scrolled?'blur(16px)':'none', borderBottom: scrolled?'1px solid rgba(255,255,255,0.07)':'none', transition:'all 0.3s' },
    navLogo: { display:'flex', alignItems:'center', gap:10, textDecoration:'none' },
    navRight:{ display:'flex', alignItems:'center', gap:12 },
    cartBtn: { position:'relative', background:C.primary, border:'none', color:'#fff', borderRadius:12, padding:'8px 16px', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' },
    badge:   { position:'absolute', top:-6, right:-6, background:'#FF3B30', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
  };

  if (!orgId) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:60,marginBottom:16}}>🔍</div><div style={{fontSize:22,fontWeight:800}}>Tienda no encontrada</div></div>
    </div>
  );

  if (loading) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{width:44,height:44,border:`3px solid ${hex(C.primary,0.2)}`,borderTopColor:C.primary,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .prod-card:hover{transform:translateY(-4px)!important;box-shadow:0 12px 40px rgba(0,0,0,0.4)!important;}
        .cat-pill:hover{background:${hex(C.primary,0.2)}!important;color:${C.primary}!important;}
        .add-btn:hover{opacity:0.85!important;}
        @media(max-width:640px){.cat-bar{overflow-x:auto;flex-wrap:nowrap!important;}.grid-4{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          {config?.logo_url
            ? <img src={config.logo_url} alt="logo" style={{height:34,objectFit:'contain'}} onError={e=>e.target.style.display='none'} />
            : <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.primary},${C.second})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff'}}>
                {storeName.charAt(0)}
              </div>
          }
          <span style={{fontWeight:800,fontSize:16,color:'#fff'}}>{storeName}</span>
        </div>

        {/* Search — desktop */}
        <div style={{flex:1,maxWidth:340,margin:'0 20px',position:'relative',display:'flex'}}>
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'rgba(255,255,255,0.35)'}}>🔍</span>
          <input
            placeholder="Buscar productos..."
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            style={{width:'100%',padding:'9px 12px 9px 34px',borderRadius:12,border:'1px solid rgba(255,255,255,0.10)',background:'rgba(255,255,255,0.06)',color:'#fff',fontSize:14,outline:'none',fontFamily:'inherit'}}
          />
        </div>

        <div style={S.navRight}>
          {config?.whatsapp_numero && (
            <a href={`https://wa.me/${config.whatsapp_numero}`} target="_blank" rel="noopener noreferrer"
              style={{fontSize:22,textDecoration:'none'}}>💬</a>
          )}
          <button style={S.cartBtn} onClick={()=>setCartOpen(true)}>
            🛒 {cartCount > 0 && <span>{cartCount}</span>}
            {cartCount > 0 && <span style={S.badge}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{position:'relative',overflow:'hidden',marginBottom:0}}>
        {banners.length > 0 ? (
          <div style={{position:'relative',height:320}}>
            <img src={banners[0]} alt="banner" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'} />
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(5,5,8,0.3) 0%,rgba(5,5,8,0.85) 100%)'}} />
          </div>
        ) : (
          <div style={{height:300,background:`radial-gradient(ellipse 80% 60% at 50% 0%, ${hex(C.primary,0.22)} 0%, transparent 70%)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px',textAlign:'center'}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:'0.12em',color:C.primary,textTransform:'uppercase',marginBottom:12}}>
              {config?.google_reviews > 0 ? `⭐ ${rating} · ${reviewCount} reseñas en Google` : '✨ Garantía oficial'}
            </div>
            <h1 style={{fontSize:'clamp(28px,5vw,56px)',fontWeight:900,color:'#fff',marginBottom:10,letterSpacing:'-1px',lineHeight:1.1}}>{storeName}</h1>
            <p style={{fontSize:'clamp(14px,2vw,18px)',color:'rgba(255,255,255,0.55)',maxWidth:480,lineHeight:1.6,marginBottom:28}}>{tagline}</p>
            <a href="#catalogo" style={{padding:'13px 28px',borderRadius:14,background:`linear-gradient(135deg,${C.primary},${C.second})`,color:'#fff',fontWeight:700,fontSize:15,textDecoration:'none',boxShadow:`0 6px 24px ${hex(C.primary,0.4)}`}}>
              Ver catálogo →
            </a>
          </div>
        )}
      </div>

      {/* ── CATEGORÍAS ── */}
      <div id="catalogo" style={{padding:'24px 20px 0',position:'sticky',top:60,zIndex:100,background:'rgba(5,5,8,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="cat-bar" style={{display:'flex',gap:8,flexWrap:'wrap',paddingBottom:16,overflowX:'auto'}}>
          {categories.map(cat => (
            <button key={cat} className="cat-pill" onClick={()=>setCatActive(cat)} style={{
              padding:'7px 16px',borderRadius:20,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.15s',whiteSpace:'nowrap',fontFamily:'inherit',
              background: catActive===cat ? C.primary : 'rgba(255,255,255,0.07)',
              color:      catActive===cat ? '#fff'     : 'rgba(255,255,255,0.55)',
              boxShadow:  catActive===cat ? `0 4px 16px ${hex(C.primary,0.35)}` : 'none',
            }}>
              {CAT_EMOJI[cat]||''} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      <div style={{padding:'24px 20px 48px'}}>
        {searchQ && <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:16}}>{filtered.length} resultado{filtered.length!==1?'s':''} para "{searchQ}"</div>}
        {!searchQ && <div style={{fontSize:13,color:'rgba(255,255,255,0.35)',marginBottom:16}}>{filtered.length} producto{filtered.length!==1?'s':''}</div>}

        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0',color:'rgba(255,255,255,0.3)'}}>
            <div style={{fontSize:52,marginBottom:12}}>📦</div>
            <div style={{fontSize:16,fontWeight:600}}>Sin productos en esta categoría</div>
          </div>
        ) : (
          <div className="grid-4" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,animation:'slideUp 0.3s ease'}}>
            {filtered.map(p => (
              <div key={p.id} className="prod-card" onClick={()=>setSelected(p)} style={{
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:20,overflow:'hidden',cursor:'pointer',transition:'all 0.2s',
              }}>
                {/* Imagen / Emoji */}
                <div style={{
                  background: p.imgUrl ? '#111' : `linear-gradient(145deg,${hex(C.primary,0.15)},${hex(C.second,0.08)})`,
                  height:170,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',
                }}>
                  {p.imgUrl
                    ? <img src={p.imgUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:12}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}} />
                    : null
                  }
                  <div style={{fontSize:72,display:p.imgUrl?'none':'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}}>{p.emoji}</div>
                  {/* Stock badge */}
                  <div style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',borderRadius:8,padding:'3px 8px',fontSize:10,fontWeight:700,color:p.units.length<=2?'#FF9F0A':'rgba(255,255,255,0.7)'}}>
                    {p.units.length} disp.
                  </div>
                </div>
                <div style={{padding:'14px 14px 16px'}}>
                  <div style={{fontSize:11,color:C.primary,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{p.category}</div>
                  <div style={{fontWeight:700,fontSize:14,color:'#fff',marginBottom:8,lineHeight:1.3}}>{p.name}</div>
                  <div style={{color:C.primary,fontWeight:900,fontSize:18,marginBottom:12}}>
                    {p.minPrice===p.maxPrice ? `S/${p.minPrice.toFixed(2)}` : `S/${p.minPrice.toFixed(0)} – ${p.maxPrice.toFixed(0)}`}
                  </div>
                  <button className="add-btn" onClick={e=>{e.stopPropagation();addToCart(p);}} style={{
                    width:'100%',padding:'9px',borderRadius:12,border:'none',
                    background:`linear-gradient(135deg,${C.primary},${C.second})`,
                    color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',
                    boxShadow:`0 4px 16px ${hex(C.primary,0.3)}`,fontFamily:'inherit',
                  }}>+ Agregar al carrito</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SOCIAL PROOF ── */}
      {(testimonios.length > 0 || rating >= 4.0) && (
        <div style={{padding:'48px 20px',borderTop:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.01)'}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.primary,marginBottom:8}}>Lo que dicen nuestros clientes</div>
            <div style={{fontSize:36,fontWeight:900,color:'#fff',marginBottom:6}}>
              {'⭐'.repeat(5)} {rating}
            </div>
            {reviewCount > 0 && <div style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>{reviewCount} reseñas verificadas en Google</div>}
          </div>

          {/* Testimonios */}
          {testimonios.length > 0 ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16,maxWidth:960,margin:'0 auto'}}>
              {testimonios.slice(0,4).map((t,i) => (
                <div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},${C.second})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16}}>
                      {(t.name||'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>{t.name||'Cliente'}</div>
                      <div style={{fontSize:11,color:'#FFD700'}}>{'★'.repeat(t.rating||5)}</div>
                    </div>
                  </div>
                  <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>"{t.text}"</p>
                </div>
              ))}
            </div>
          ) : (
            /* Testimonios por defecto si no hay configurados */
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16,maxWidth:960,margin:'0 auto'}}>
              {[
                {name:'Carlos M.',     rating:5, text:'Excelente servicio, equipo nuevo y con garantía. Totalmente recomendado.'},
                {name:'Lucía R.',      rating:5, text:'Muy buena atención y entrega el mismo día. Seguiré comprando aquí.'},
                {name:'Diego P.',      rating:5, text:'Los mejores precios del mercado y equipos originales. 10/10.'},
              ].map((t,i) => (
                <div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},${C.second})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16}}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>{t.name}</div>
                      <div style={{fontSize:11,color:'#FFD700'}}>{'★'.repeat(t.rating)}</div>
                    </div>
                  </div>
                  <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>"{t.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'40px 20px 32px',background:'rgba(0,0,0,0.3)'}}>
        <div style={{maxWidth:960,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:32}}>
          <div>
            <div style={{fontWeight:900,fontSize:18,color:'#fff',marginBottom:8}}>{storeName}</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7,marginBottom:16}}>{tagline}</div>
            <div style={{display:'flex',gap:12}}>
              {config?.instagram_url && <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" style={{fontSize:22,textDecoration:'none'}}>📸</a>}
              {config?.tiktok_url    && <a href={config.tiktok_url}    target="_blank" rel="noopener noreferrer" style={{fontSize:22,textDecoration:'none'}}>🎵</a>}
              {config?.whatsapp_numero && <a href={`https://wa.me/${config.whatsapp_numero}`} target="_blank" rel="noopener noreferrer" style={{fontSize:22,textDecoration:'none'}}>💬</a>}
            </div>
          </div>
          {config?.direccion && (
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Ubicación</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.7}}>📍 {config.direccion}</div>
              {config?.email_ventas && <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:6}}>✉️ {config.email_ventas}</div>}
            </div>
          )}
          {horarios && typeof horarios === 'object' && (
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Horarios</div>
              {Object.entries(horarios).map(([dia,hora]) => (
                <div key={dia} style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:4,gap:12}}>
                  <span>{dia}</span><span style={{color:'rgba(255,255,255,0.7)',fontWeight:600}}>{hora}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{maxWidth:960,margin:'24px auto 0',paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>© {new Date().getFullYear()} {storeName} · Corp Tech Holding</div>
          {config?.whatsapp_numero && (
            <a href={`https://wa.me/${config.whatsapp_numero}`} target="_blank" rel="noopener noreferrer"
              style={{fontSize:12,color:C.primary,textDecoration:'none',fontWeight:600}}>
              💬 Contáctanos por WhatsApp
            </a>
          )}
        </div>
      </footer>

      {/* ══ MODAL: DETALLE PRODUCTO ══ */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center',animation:'fadeIn 0.2s'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#111114',width:'100%',maxWidth:540,maxHeight:'88vh',overflowY:'auto',borderRadius:'24px 24px 0 0',padding:24,border:'1px solid rgba(255,255,255,0.10)',borderBottom:'none',animation:'slideUp 0.25s ease'}}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,0.15)',borderRadius:99,margin:'0 auto 20px'}} />
            <div style={{background:`linear-gradient(145deg,${hex(C.primary,0.12)},${hex(C.second,0.06)})`,borderRadius:20,height:220,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,overflow:'hidden'}}>
              {selected.imgUrl
                ? <img src={selected.imgUrl} alt={selected.name} style={{maxHeight:'100%',maxWidth:'100%',objectFit:'contain',padding:16}} onError={e=>{e.target.style.display='none';}} />
                : <span style={{fontSize:100}}>{selected.emoji}</span>
              }
            </div>
            <div style={{fontSize:11,color:C.primary,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{selected.category}</div>
            <div style={{fontWeight:900,fontSize:22,color:'#fff',marginBottom:8,lineHeight:1.2}}>{selected.name}</div>
            {selected.description && <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.7,marginBottom:16}}>{selected.description}</p>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div style={{color:C.primary,fontWeight:900,fontSize:28}}>
                {selected.minPrice===selected.maxPrice ? `S/${selected.minPrice.toFixed(2)}` : `S/${selected.minPrice.toFixed(0)} – ${selected.maxPrice.toFixed(0)}`}
              </div>
              <div style={{background:selected.units.length<=2?'rgba(255,159,10,0.15)':'rgba(48,209,88,0.12)',color:selected.units.length<=2?'#FF9F0A':'#30D158',borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:700}}>
                {selected.units.length} disponible{selected.units.length!==1?'s':''}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {config?.whatsapp_numero && (
                <a href={`https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(`${config?.whatsapp_mensaje||'Hola, quiero información sobre'} *${selected.name}* (S/${selected.minPrice.toFixed(2)})`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{width:'100%',padding:'16px',borderRadius:16,background:'#25D366',color:'#fff',fontWeight:800,fontSize:16,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  💬 Comprar por WhatsApp
                </a>
              )}
              <button onClick={()=>addToCart(selected)} style={{width:'100%',padding:'14px',borderRadius:16,border:'none',background:`linear-gradient(135deg,${C.primary},${C.second})`,color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',boxShadow:`0 4px 20px ${hex(C.primary,0.35)}`,fontFamily:'inherit'}}>
                🛒 Agregar al carrito
              </button>
              <button onClick={()=>setSelected(null)} style={{width:'100%',padding:'12px',borderRadius:14,border:'1px solid rgba(255,255,255,0.10)',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DRAWER: CARRITO ══ */}
      {cartOpen && (
        <div onClick={()=>setCartOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center',animation:'fadeIn 0.2s'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#111114',width:'100%',maxWidth:540,maxHeight:'85vh',overflowY:'auto',borderRadius:'24px 24px 0 0',padding:'20px 20px 32px',border:'1px solid rgba(255,255,255,0.10)',borderBottom:'none',animation:'slideUp 0.25s ease'}}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,0.15)',borderRadius:99,margin:'0 auto 20px'}} />
            <div style={{fontWeight:800,fontSize:20,color:'#fff',marginBottom:20}}>🛒 Tu carrito</div>
            {cart.length===0 ? (
              <div style={{textAlign:'center',color:'rgba(255,255,255,0.3)',padding:'40px 0'}}>
                <div style={{fontSize:40,marginBottom:10}}>🛒</div>Carrito vacío
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    <span style={{fontSize:32,flexShrink:0}}>{item.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:'#fff',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</div>
                      <div style={{color:C.primary,fontWeight:800,fontSize:15}}>S/{(item.price*item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <button onClick={()=>changeQty(item.id,-1)} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'#fff',cursor:'pointer',fontWeight:800,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                      <span style={{fontWeight:700,color:'#fff',minWidth:20,textAlign:'center'}}>{item.qty}</span>
                      <button onClick={()=>changeQty(item.id,1)} style={{width:28,height:28,borderRadius:'50%',border:'none',background:C.primary,color:'#fff',cursor:'pointer',fontWeight:800,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    </div>
                    <button onClick={()=>removeCart(item.id)} style={{background:'none',border:'none',color:'#FF453A',cursor:'pointer',fontSize:18,padding:'4px'}}>🗑</button>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'20px 0 4px',fontWeight:900,fontSize:20,color:'#fff'}}>
                  <span>Total</span><span style={{color:C.primary}}>S/{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={()=>{setCartOpen(false);setCheckoutOpen(true);setOrderSent(false);}} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:`linear-gradient(135deg,${C.primary},${C.second})`,color:'#fff',fontWeight:800,fontSize:16,cursor:'pointer',marginTop:16,boxShadow:`0 6px 24px ${hex(C.primary,0.35)}`,fontFamily:'inherit'}}>
                  Hacer pedido →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL: CHECKOUT ══ */}
      {checkoutOpen && (
        <div onClick={()=>setCheckoutOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center',animation:'fadeIn 0.2s'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#111114',width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',borderRadius:'24px 24px 0 0',padding:'20px 20px 40px',border:'1px solid rgba(255,255,255,0.10)',borderBottom:'none',animation:'slideUp 0.25s ease'}}>
            <div style={{width:40,height:4,background:'rgba(255,255,255,0.15)',borderRadius:99,margin:'0 auto 20px'}} />
            {orderSent ? (
              <div style={{textAlign:'center',padding:'40px 0'}}>
                <div style={{fontSize:64,marginBottom:16}}>🎉</div>
                <div style={{fontWeight:900,fontSize:24,color:'#fff',marginBottom:8}}>¡Pedido enviado!</div>
                <div style={{color:'rgba(255,255,255,0.5)',marginBottom:24}}>Te contactaremos pronto por WhatsApp.</div>
                <button onClick={()=>{setCheckoutOpen(false);setCart([]);setOrderSent(false);}} style={{padding:'14px 32px',borderRadius:14,border:'none',background:C.primary,color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
                  Continuar comprando
                </button>
              </div>
            ) : (
              <>
                <div style={{fontWeight:800,fontSize:20,color:'#fff',marginBottom:20}}>📦 Confirmar pedido</div>
                <div style={{background:'rgba(255,255,255,0.04)',borderRadius:14,padding:14,marginBottom:20,border:'1px solid rgba(255,255,255,0.07)'}}>
                  {cart.map(i => (
                    <div key={i.id} style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:14,color:'rgba(255,255,255,0.7)'}}>
                      <span>{i.emoji} {i.name} ×{i.qty}</span>
                      <span style={{color:C.primary,fontWeight:700}}>S/{(i.price*i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:10,marginTop:8,display:'flex',justifyContent:'space-between',fontWeight:900,color:'#fff',fontSize:16}}>
                    <span>Total</span><span style={{color:C.primary}}>S/{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <form onSubmit={sendOrder} style={{display:'flex',flexDirection:'column',gap:14}}>
                  {[
                    {label:'Tu nombre',  key:'name',  type:'text',     ph:'Nombre completo',       req:true},
                    {label:'Teléfono',   key:'phone', type:'tel',      ph:'+51 999 999 999',        req:true},
                    {label:'Dirección o notas', key:'notes', type:'text', ph:'Dirección de entrega, etc.', req:false},
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.label}</label>
                      <input required={f.req} type={f.type} placeholder={f.ph}
                        value={orderForm[f.key]} onChange={e=>setOrderForm(prev=>({...prev,[f.key]:e.target.value}))}
                        style={{width:'100%',padding:'12px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.10)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:15,outline:'none',fontFamily:'inherit'}}/>
                    </div>
                  ))}
                  <button type="submit" style={{padding:'16px',borderRadius:16,border:'none',background:'#25D366',color:'#fff',fontWeight:800,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4,fontFamily:'inherit'}}>
                    💬 Enviar pedido por WhatsApp
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
