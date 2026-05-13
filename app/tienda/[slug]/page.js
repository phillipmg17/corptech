'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const CORP_ID = '00000000-0000-0000-0000-000000000001';

const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  innovatech: '00000000-0000-0000-0000-000000000003',
  wetech:     '00000000-0000-0000-0000-000000000004',
};

const SLUG_DEFAULTS = {
  futurteck:  { name: 'Futurteck',        slogan: 'Tecnología que transforma tu vida', primary: '#007AFF', emoji: '🔵' },
  innovatech: { name: 'Innovatech Store',  slogan: 'Innovación en cada dispositivo',   primary: '#BF5AF2', emoji: '🟣' },
  wetech:     { name: 'WeTech Peru',       slogan: 'Tu tienda tech de confianza',      primary: '#30D158', emoji: '🟢' },
};

const PRICE_FILTERS = [
  { id: 'all',   lbl: 'Todo' },
  { id: 'u500',  lbl: 'Hasta S/500',     fn: p => p.minPrice < 500 },
  { id: '500',   lbl: 'S/500 – 1,000',   fn: p => p.minPrice >= 500  && p.minPrice < 1000 },
  { id: '1000',  lbl: 'S/1,000 – 2,000', fn: p => p.minPrice >= 1000 && p.minPrice < 2000 },
  { id: 'o2000', lbl: 'Más de S/2,000',  fn: p => p.minPrice >= 2000 },
];

function hexAlpha(hex, a) {
  try {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return `rgba(128,128,128,${a})`; }
}

export default function TiendaPage({ params }) {
  const slug  = params.slug?.toLowerCase();
  const orgId = SLUG_MAP[slug];
  const def   = SLUG_DEFAULTS[slug] || SLUG_DEFAULTS.futurteck;

  const [settings,    setSettings]    = useState(null);
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [cart,        setCart]        = useState([]);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [orderModal,  setOrderModal]  = useState(false);
  const [orderForm,   setOrderForm]   = useState({ name: '', phone: '', notes: '' });
  const [orderSent,   setOrderSent]   = useState(false);
  const [searchQ,     setSearchQ]     = useState('');
  const [catFilter,   setCatFilter]   = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [heroSlide,   setHeroSlide]   = useState(0);
  const [selColor,    setSelColor]    = useState('');
  const [selCap,      setSelCap]      = useState('');
  const heroTimer = useRef(null);

  /* ── COLORES ── */
  const P = settings?.color_primario || def.primary;
  const C = {
    bg: '#0a0a0a', text: '#ffffff', font: 'Urbanist, sans-serif',
    card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)',
    muted: 'rgba(255,255,255,0.45)',
  };

  /* ── DATOS DE TIENDA ── */
  const storeName          = settings?.store_name          || def.name;
  const storeSlogan        = settings?.tagline             || def.slogan;
  const storeDesc          = settings?.descripcion         || '';
  const storeLogo          = settings?.logo_url            || null;
  const storeWA            = settings?.whatsapp            || '';
  const storeIG            = settings?.instagram           || '';
  const storeTK            = settings?.tiktok              || '';
  const storeFB            = settings?.facebook            || '';
  const storeDirec         = settings?.direccion           || '';
  const storeHrs           = settings?.horarios            || null;
  const storeGooglePlace   = settings?.google_place_id     || '';
  const storeGallery       = settings?.gallery_urls        || [];
  const storeReviews       = settings?.reviews_data        || [];
  const storeRating        = settings?.google_rating       ?? 5.0;
  const storeReviewsCount  = settings?.google_reviews_count || 0;

  const DIAS     = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  const DIAS_LBL = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' };

  /* ── HERO SLIDESHOW ── */
  useEffect(() => {
    if (storeGallery.length > 1) {
      heroTimer.current = setInterval(() => setHeroSlide(s => (s + 1) % storeGallery.length), 4500);
    }
    return () => clearInterval(heroTimer.current);
  }, [storeGallery.length]);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    Promise.all([loadSettings(), loadProducts()]).then(() => setLoading(false));
  }, [slug]);

  async function loadSettings() {
    const { data } = await supabase.from('tiendas_config').select('*').eq('org_id', orgId).single();
    if (data) setSettings(data);
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('stock_items')
      .select('id, product_id, sale_price, emoji, color_info, storage_info, products(id, name, description, emoji, brand, category, photo_url, image_url, default_colors, default_capacities)')
      .eq('status', 'available')
      .in('owner_org_id', [orgId, CORP_ID]);
    if (!data) return;
    const map = {};
    data.forEach(item => {
      const pid = item.product_id;
      const pr  = item.products || {};
      if (!map[pid]) map[pid] = {
        id: pid, name: pr.name || 'Producto', emoji: pr.emoji || item.emoji || '📦',
        description: pr.description || '', brand: pr.brand || '',
        category: pr.category || 'Otros',
        photo: pr.image_url || pr.photo_url || null,
        colors:     pr.default_colors     || [],
        capacities: pr.default_capacities || [],
        units: [], minPrice: Infinity, maxPrice: 0,
      };
      map[pid].units.push({ id: item.id, price: item.sale_price || 0, color: item.color_info || '', storage: item.storage_info || '' });
      if ((item.sale_price || 0) < map[pid].minPrice) map[pid].minPrice = item.sale_price || 0;
      if ((item.sale_price || 0) > map[pid].maxPrice) map[pid].maxPrice = item.sale_price || 0;
    });
    setProducts(Object.values(map).filter(p => p.units.length > 0));
  }

  /* ── FILTROS ── */
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = products.filter(p => {
    const mS = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || (p.brand||'').toLowerCase().includes(searchQ.toLowerCase());
    const mC = catFilter === 'all' || p.category === catFilter;
    const pf = PRICE_FILTERS.find(f => f.id === priceFilter);
    const mP = priceFilter === 'all' || (pf?.fn && pf.fn(p));
    return mS && mC && mP;
  });

  /* ── CARRITO ── */
  function openProduct(p) {
    setSelected(p);
    setSelColor(p.colors?.[0] || '');
    setSelCap(p.capacities?.[0] || '');
  }

  function addToCart(p) {
    const label = [selColor, selCap].filter(Boolean).join(' · ');
    setCart(prev => {
      const key = p.id + label;
      const ex  = prev.find(i => i._key === key);
      if (ex) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1, price: p.minPrice, _key: key, label }];
    });
    setSelected(null);
    setSelColor(''); setSelCap('');
  }
  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }
  function changeQty(id, d) { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)); }
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  /* ── CHECKOUT ── */
  function sendOrder(e) {
    e.preventDefault();
    const lines = cart.map(i => {
      const spec = i.label ? ` (${i.label})` : '';
      return `• ${i.emoji} ${i.name}${spec} x${i.qty} — S/${(i.price*i.qty).toFixed(2)}`;
    }).join('\n');
    const msg   = `¡Hola ${storeName}! 👋\n\nSoy *${orderForm.name}*.\n\nPedido:\n${lines}\n\n*Total: S/${cartTotal.toFixed(2)}*\n\nTel: ${orderForm.phone}${orderForm.notes?`\nNotas: ${orderForm.notes}`:''}`;
    if (storeWA) window.open(`https://wa.me/${storeWA.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
    setOrderSent(true);
  }

  /* ── NOT FOUND ── */
  if (!orgId) return (
    <div style={{ minHeight:'100vh', background:'#000', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Urbanist,sans-serif' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:48 }}>🔍</div><div style={{ fontSize:22, fontWeight:800, marginTop:12 }}>Tienda no encontrada</div></div>
    </div>
  );

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${def.primary}`, borderTopColor:'transparent', animation:'spin 1s linear infinite', margin:'0 auto' }} />
        <div style={{ color:'rgba(255,255,255,0.4)', marginTop:16, fontFamily:'Urbanist,sans-serif', fontSize:14 }}>Cargando…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     RENDER PRINCIPAL
  ════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:C.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .pcard{transition:transform .15s,box-shadow .15s}
        .pcard:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.5)}
        .chip{transition:all .15s;cursor:pointer;white-space:nowrap}
        .chip:hover{opacity:.85}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        background:'rgba(10,10,10,0.92)', borderBottom:`1px solid ${C.border}`,
        padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {storeLogo
            ? <img src={storeLogo} alt="logo" style={{ height:34, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            : <span style={{ fontSize:24 }}>{def.emoji}</span>
          }
          <span style={{ fontWeight:800, fontSize:16 }}>{storeName}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {storeWA && (
            <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)', color:'#25D366', borderRadius:10, padding:'6px 12px', fontSize:13, fontWeight:700, textDecoration:'none' }}>
              💬 WhatsApp
            </a>
          )}
          <button onClick={() => setCartOpen(true)} style={{
            position:'relative', background:P, border:'none', color:'#fff',
            borderRadius:12, padding:'8px 14px', fontWeight:700, fontSize:14, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6,
          }}>
            🛒
            {cartCount > 0 && (
              <span style={{ background:'#FF3B30', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ position:'relative', height:'88vh', minHeight:500, overflow:'hidden' }}>
        {/* Slides */}
        {storeGallery.length > 0
          ? storeGallery.map((url, i) => (
              <div key={i} style={{
                position:'absolute', inset:0,
                backgroundImage:`url(${url})`, backgroundSize:'cover', backgroundPosition:'center',
                opacity: i === heroSlide ? 1 : 0, transition:'opacity 1.2s ease',
              }} />
            ))
          : <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, #0a0a0a 0%, ${hexAlpha(P,0.45)} 50%, #0a0a0a 100%)` }} />
        }
        {/* Overlay */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)' }} />
        {/* Contenido */}
        <div style={{ position:'relative', zIndex:2, height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 28px', maxWidth:680 }}>
          {storeLogo && (
            <img src={storeLogo} alt="logo" style={{ height:44, objectFit:'contain', marginBottom:20, alignSelf:'flex-start' }} onError={e=>e.target.style.display='none'} />
          )}
          <h1 style={{ fontSize:'clamp(34px,7vw,68px)', fontWeight:900, lineHeight:1.05, marginBottom:14, textShadow:'0 2px 24px rgba(0,0,0,0.6)' }}>
            {storeName}
          </h1>
          <p style={{ fontSize:'clamp(15px,2.5vw,20px)', color:'rgba(255,255,255,0.88)', fontWeight:500, marginBottom:32, lineHeight:1.55, maxWidth:480 }}>
            {storeSlogan}
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <a href="#productos"
              style={{ background:P, color:'#fff', borderRadius:14, padding:'14px 28px', fontWeight:800, fontSize:15, textDecoration:'none' }}>
              Ver productos →
            </a>
            {storeWA && (
              <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', borderRadius:14, padding:'14px 28px', fontWeight:700, fontSize:15, textDecoration:'none' }}>
                💬 Contáctanos
              </a>
            )}
          </div>
        </div>
        {/* Dots */}
        {storeGallery.length > 1 && (
          <div style={{ position:'absolute', bottom:24, left:0, right:0, display:'flex', justifyContent:'center', gap:8, zIndex:3 }}>
            {storeGallery.map((_, i) => (
              <button key={i} onClick={() => setHeroSlide(i)}
                style={{ width: i===heroSlide ? 28 : 8, height:8, borderRadius:99, border:'none', background: i===heroSlide ? P : 'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all .3s', padding:0 }} />
            ))}
          </div>
        )}
      </section>

      {/* ══ TRUST BADGES ══ */}
      <div style={{ background:hexAlpha(P,0.07), borderBottom:`1px solid ${C.border}`, padding:'14px 20px' }}>
        <div style={{ display:'flex', gap:20, overflowX:'auto', justifyContent:'center', flexWrap:'wrap' }}>
          {[['✅','Garantía oficial'],['🔒','Pago 100% seguro'],['📦','Stock real'],['⚡','Entrega rápida'],['🛡️','Productos originales']].map(([ico,lbl]) => (
            <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>
              <span>{ico}</span><span>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PRODUCTOS ══ */}
      <section id="productos" style={{ padding:'36px 20px 0' }}>
        <h2 style={{ fontWeight:900, fontSize:26, marginBottom:22 }}>
          Nuestros Productos <span style={{ color:P }}>✦</span>
        </h2>

        {/* Buscador */}
        <div style={{ position:'relative', marginBottom:14 }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:C.muted }}>🔍</span>
          <input placeholder="Buscar por nombre o marca…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            style={{ width:'100%', padding:'12px 14px 12px 42px', borderRadius:14, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.05)', color:C.text, fontSize:15, outline:'none', fontFamily:C.font }} />
        </div>

        {/* Chips categoría */}
        {categories.length > 2 && (
          <div style={{ display:'flex', gap:8, marginBottom:10, overflowX:'auto', paddingBottom:4 }}>
            {categories.map(cat => (
              <button key={cat} className="chip" onClick={()=>setCatFilter(cat)}
                style={{ padding:'7px 16px', borderRadius:20, border:'none', fontSize:13, fontWeight:700, flexShrink:0,
                  background: catFilter===cat ? P : 'rgba(255,255,255,0.07)', color: catFilter===cat ? '#fff' : C.muted,
                  outline: catFilter===cat ? 'none' : `1px solid ${C.border}` }}>
                {cat==='all' ? '📦 Todo' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Chips precio */}
        <div style={{ display:'flex', gap:8, marginBottom:22, overflowX:'auto' }}>
          {PRICE_FILTERS.map(f => (
            <button key={f.id} className="chip" onClick={()=>setPriceFilter(f.id)}
              style={{ padding:'6px 12px', borderRadius:20, border:'none', fontSize:12, fontWeight:700, flexShrink:0,
                background: priceFilter===f.id ? hexAlpha(P,0.2) : 'transparent',
                color: priceFilter===f.id ? P : C.muted,
                outline:`1px solid ${priceFilter===f.id ? hexAlpha(P,0.5) : C.border}` }}>
              {f.lbl}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0
          ? <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}><div style={{ fontSize:48 }}>🔍</div><div style={{ marginTop:12, fontWeight:600, fontSize:16 }}>Sin resultados</div></div>
          : <>
              <div style={{ color:C.muted, fontSize:13, marginBottom:14 }}>{filtered.length} producto{filtered.length!==1?'s':''}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
                {filtered.map(p => (
                  <div key={p.id} className="pcard" onClick={()=>openProduct(p)}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden', cursor:'pointer' }}>
                    <div style={{ position:'relative', height:160, background:hexAlpha(P,0.08), display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {p.photo && <img src={p.photo} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />}
                      <div style={{ display:p.photo?'none':'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', fontSize:56 }}>{p.emoji}</div>
                      <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:10, fontWeight:700, borderRadius:8, padding:'3px 7px' }}>{p.units.length} ud.</span>
                      {p.brand && <span style={{ position:'absolute', bottom:8, left:8, background:hexAlpha(P,0.85), color:'#fff', fontSize:10, fontWeight:700, borderRadius:8, padding:'3px 8px' }}>{p.brand}</span>}
                    </div>
                    <div style={{ padding:'12px' }}>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:6, lineHeight:1.3 }}>{p.name}</div>
                      <div style={{ color:P, fontWeight:800, fontSize:16, marginBottom:10 }}>
                        {p.minPrice===p.maxPrice ? `S/${p.minPrice.toFixed(0)}` : `S/${p.minPrice.toFixed(0)} – ${p.maxPrice.toFixed(0)}`}
                      </div>
                      <button onClick={e=>{e.stopPropagation();addToCart(p)}}
                        style={{ width:'100%', padding:'9px', borderRadius:10, border:'none', background:P, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                        + Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
        }
      </section>

      {/* ══ GOOGLE REVIEWS ══ */}
      {(storeReviews.length > 0 || storeGooglePlace) && (
        <section style={{ padding:'56px 20px', marginTop:40, background:'rgba(255,255,255,0.02)', borderTop:`1px solid ${C.border}` }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:C.muted, textTransform:'uppercase', marginBottom:8 }}>RESEÑAS VERIFICADAS DE GOOGLE</div>
            <h2 style={{ fontWeight:900, fontSize:28, marginBottom:20 }}>Lo que dicen nuestros clientes</h2>
            {storeGooglePlace && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:14, background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:'14px 28px' }}>
                <div style={{ fontWeight:900, fontSize:36, lineHeight:1 }}>{Number(storeRating).toFixed(1)}</div>
                <div>
                  <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:22, color:'#FFD60A' }}>★</span>)}
                  </div>
                  <div style={{ fontSize:12, color:C.muted }}>{storeReviewsCount > 0 ? `${storeReviewsCount} reseñas en Google` : 'en Google'}</div>
                </div>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:18, fontWeight:900, color:'#4285F4' }}>G</span>
                </div>
              </div>
            )}
          </div>

          {/* Cards de reseñas */}
          {storeReviews.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:32 }}>
              {storeReviews.slice(0,6).map((r,i) => (
                <div key={i} style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:16, padding:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background: r.color || P, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#fff', flexShrink:0 }}>
                      {(r.name||'A').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{r.name}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{r.date || ''}</div>
                    </div>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:13, fontWeight:900, color:'#4285F4' }}>G</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:2, marginBottom:10 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:14, color: s<=(r.rating||5) ? '#FFD60A' : 'rgba(255,255,255,0.15)' }}>★</span>)}
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.78)', lineHeight:1.65 }}>{r.text}</div>
                </div>
              ))}
            </div>
          )}

          {storeGooglePlace && (
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a href={`https://search.google.com/local/reviews?placeid=${storeGooglePlace}`} target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, background:hexAlpha(P,0.12), border:`1px solid ${hexAlpha(P,0.3)}`, borderRadius:14, padding:'12px 24px', color:P, textDecoration:'none', fontWeight:700, fontSize:14 }}>
                👁 Ver todas las reseñas
              </a>
              <a href={`https://search.google.com/local/writereview?placeid=${storeGooglePlace}`} target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,214,10,0.1)', border:'1px solid rgba(255,214,10,0.3)', borderRadius:14, padding:'12px 24px', color:'#FFD60A', textDecoration:'none', fontWeight:700, fontSize:14 }}>
                ⭐ Dejar una reseña
              </a>
            </div>
          )}
        </section>
      )}

      {/* ══ UBICACIÓN ══ */}
      {storeDirec && (
        <section style={{ padding:'52px 20px', borderTop:`1px solid ${C.border}` }}>
          <h2 style={{ fontWeight:900, fontSize:24, marginBottom:6 }}>📍 Encuéntranos aquí</h2>
          <p style={{ color:C.muted, fontSize:14, marginBottom:24 }}>{storeDirec}</p>
          <div style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${C.border}`, marginBottom:24, height:260 }}>
            <iframe title="Mapa de la tienda" width="100%" height="260" style={{ border:0 }} loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(storeDirec)}&output=embed`} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
            {storeHrs && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>🕐 Horarios</div>
                {DIAS.map(d => (
                  <div key={d} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ color:C.muted }}>{DIAS_LBL[d]}</span>
                    <span style={{ color: storeHrs[d]==='Cerrado' ? '#FF3B30' : P, fontWeight:600 }}>{storeHrs[d] || 'Cerrado'}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>📞 Contacto directo</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {storeWA && <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:8, color:'#25D366', textDecoration:'none', fontSize:14, fontWeight:600 }}>💬 WhatsApp</a>}
                {storeIG && <a href={storeIG.startsWith('http')?storeIG:`https://instagram.com/${storeIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:8, color:'#e1306c', textDecoration:'none', fontSize:14, fontWeight:600 }}>📸 Instagram</a>}
                {storeTK && <a href={storeTK.startsWith('http')?storeTK:`https://tiktok.com/@${storeTK.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:8, color:'#fff', textDecoration:'none', fontSize:14, fontWeight:600 }}>🎵 TikTok</a>}
                {storeFB && <a href={storeFB.startsWith('http')?storeFB:`https://facebook.com/${storeFB}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:8, color:'#1877F2', textDecoration:'none', fontSize:14, fontWeight:600 }}>👥 Facebook</a>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ INSTAGRAM ══ */}
      {storeIG && (
        <section style={{ padding:'44px 20px', borderTop:`1px solid ${C.border}`, textAlign:'center' }}>
          <h2 style={{ fontWeight:900, fontSize:22, marginBottom:6 }}>📸 Síguenos en Instagram</h2>
          <p style={{ color:C.muted, fontSize:14, marginBottom:22 }}>@{storeIG.replace('@','').replace('https://instagram.com/','')}</p>
          <a href={storeIG.startsWith('http')?storeIG:`https://instagram.com/${storeIG.replace('@','')}`} target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color:'#fff', borderRadius:14, padding:'13px 28px', fontWeight:800, fontSize:14, textDecoration:'none' }}>
            Seguir en Instagram →
          </a>
        </section>
      )}

      {/* ══ TIKTOK ══ */}
      {storeTK && (
        <section style={{ padding:'44px 20px', borderTop:`1px solid ${C.border}`, textAlign:'center' }}>
          <h2 style={{ fontWeight:900, fontSize:22, marginBottom:6 }}>🎵 Síguenos en TikTok</h2>
          <p style={{ color:C.muted, fontSize:14, marginBottom:22 }}>@{storeTK.replace('@','').replace('https://tiktok.com/@','')}</p>
          <a href={storeTK.startsWith('http')?storeTK:`https://tiktok.com/@${storeTK.replace('@','')}`} target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#000', border:'2px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:14, padding:'13px 28px', fontWeight:800, fontSize:14, textDecoration:'none' }}>
            Abrir en TikTok →
          </a>
        </section>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'44px 20px 32px', background:'rgba(0,0,0,0.5)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:28, marginBottom:32 }}>
          <div>
            {storeLogo ? <img src={storeLogo} alt="logo" style={{ height:36, objectFit:'contain', marginBottom:12 }} onError={e=>e.target.style.display='none'} /> : <div style={{ fontSize:30, marginBottom:12 }}>{def.emoji}</div>}
            <div style={{ fontWeight:800, fontSize:16, marginBottom:6 }}>{storeName}</div>
            <div style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>{storeDesc || storeSlogan}</div>
          </div>
          {storeDirec && (
            <div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'rgba(255,255,255,0.7)' }}>TIENDA</div>
              <div style={{ color:C.muted, fontSize:13, marginBottom:8, lineHeight:1.5 }}>📍 {storeDirec}</div>
              {storeHrs && <div style={{ color:C.muted, fontSize:12, lineHeight:1.8 }}>Lun–Vie: {storeHrs.lunes||'–'}<br/>Sáb: {storeHrs.sabado||'–'}<br/>Dom: {storeHrs.domingo||'Cerrado'}</div>}
            </div>
          )}
          <div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'rgba(255,255,255,0.7)' }}>SÍGUENOS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {storeWA && <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ color:'#25D366', textDecoration:'none', fontSize:13, fontWeight:600 }}>💬 WhatsApp</a>}
              {storeIG && <a href={storeIG.startsWith('http')?storeIG:`https://instagram.com/${storeIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ color:'#e1306c', textDecoration:'none', fontSize:13, fontWeight:600 }}>📸 Instagram</a>}
              {storeTK && <a href={storeTK.startsWith('http')?storeTK:`https://tiktok.com/@${storeTK.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ color:'#fff', textDecoration:'none', fontSize:13, fontWeight:600 }}>🎵 TikTok</a>}
              {storeFB && <a href={storeFB.startsWith('http')?storeFB:`https://facebook.com/${storeFB}`} target="_blank" rel="noopener noreferrer" style={{ color:'#1877F2', textDecoration:'none', fontSize:13, fontWeight:600 }}>👥 Facebook</a>}
            </div>
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:20, textAlign:'center', color:C.muted, fontSize:12 }}>
          © {new Date().getFullYear()} {storeName} · Powered by CorpTech
        </div>
      </footer>

      {/* ══ MODAL PRODUCTO ══ */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#111', width:'100%', maxHeight:'88vh', overflowY:'auto', borderRadius:'24px 24px 0 0', border:`1px solid ${C.border}`, borderBottom:'none', animation:'fadeUp .25s ease' }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:'16px auto 0' }} />
            <div style={{ height:240, background:hexAlpha(P,0.1), display:'flex', alignItems:'center', justifyContent:'center', margin:'16px 16px 0', borderRadius:16, overflow:'hidden' }}>
              {selected.photo && <img src={selected.photo} alt={selected.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />}
              <div style={{ display:selected.photo?'none':'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', fontSize:88 }}>{selected.emoji}</div>
            </div>
            <div style={{ padding:'20px 20px 32px' }}>
              {selected.brand && <span style={{ background:hexAlpha(P,0.15), color:P, fontSize:11, fontWeight:800, borderRadius:8, padding:'3px 10px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{selected.brand}</span>}
              <div style={{ fontWeight:900, fontSize:24, margin:'10px 0 8px', lineHeight:1.2 }}>{selected.name}</div>
              {selected.description && <div style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:16 }}>{selected.description}</div>}
              <div style={{ color:P, fontWeight:900, fontSize:32, marginBottom:4 }}>
                {selected.minPrice===selected.maxPrice ? `S/${selected.minPrice.toFixed(2)}` : `S/${selected.minPrice.toFixed(0)} – S/${selected.maxPrice.toFixed(0)}`}
              </div>
              <div style={{ color:C.muted, fontSize:13, marginBottom:16 }}>{selected.units.length} unidad{selected.units.length!==1?'es':''} disponible{selected.units.length!==1?'s':''}{selected.category&&` · ${selected.category}`}</div>

              {/* ── Capacidades ── */}
              {selected.capacities?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Capacidad</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {selected.capacities.map(c => (
                      <button key={c} type="button" onClick={()=>setSelCap(selCap===c?'':c)}
                        style={{ padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer',
                          border:`2px solid ${selCap===c?'#FF9F0A':'rgba(255,255,255,0.18)'}`,
                          background: selCap===c?'rgba(255,159,10,0.15)':'rgba(255,255,255,0.05)',
                          color: selCap===c?'#FF9F0A':'rgba(255,255,255,0.7)',
                          transition:'all .15s',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Colores ── */}
              {selected.colors?.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Color{selColor ? `: ${selColor}` : ''}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {selected.colors.map(c => (
                      <button key={c} type="button" onClick={()=>setSelColor(selColor===c?'':c)}
                        style={{ padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer',
                          border:`2px solid ${selColor===c?P:'rgba(255,255,255,0.18)'}`,
                          background: selColor===c?hexAlpha(P,0.2):'rgba(255,255,255,0.05)',
                          color: selColor===c?P:'rgba(255,255,255,0.7)',
                          transition:'all .15s',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={()=>addToCart(selected)} style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:P, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', marginBottom:10 }}>🛒 Agregar al carrito</button>
              {storeWA && (
                <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola, me interesa: ${selected.name} — S/${selected.minPrice.toFixed(2)}`)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', width:'100%', padding:'14px', borderRadius:16, border:'1px solid rgba(37,211,102,0.4)', background:'rgba(37,211,102,0.08)', color:'#25D366', fontWeight:700, fontSize:15, textAlign:'center', textDecoration:'none', marginBottom:10 }}>
                  💬 Preguntar por WhatsApp
                </a>
              )}
              <button onClick={()=>setSelected(null)} style={{ width:'100%', padding:'13px', borderRadius:16, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontWeight:600, fontSize:14, cursor:'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DRAWER CARRITO ══ */}
      {cartOpen && (
        <div onClick={()=>setCartOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#111', width:'100%', maxHeight:'85vh', overflowY:'auto', borderRadius:'24px 24px 0 0', padding:'20px 20px 36px', border:`1px solid ${C.border}`, borderBottom:'none', animation:'fadeUp .25s ease' }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:'0 auto 20px' }} />
            <div style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>🛒 Tu carrito</div>
            {cart.length === 0
              ? <div style={{ textAlign:'center', color:C.muted, padding:'40px 0' }}><div style={{ fontSize:48, marginBottom:12 }}>🛒</div><div>Carrito vacío</div></div>
              : <>
                  {cart.map(item => (
                    <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ width:44, height:44, borderRadius:10, background:hexAlpha(P,0.1), display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {item.photo && <img src={item.photo} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />}
                        <span style={{ display:item.photo?'none':'flex', fontSize:22 }}>{item.emoji}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{item.name}</div>
                        {item.label && <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>{item.label}</div>}
                        <div style={{ color:P, fontWeight:800, fontSize:13 }}>S/{(item.price*item.qty).toFixed(2)}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button onClick={()=>changeQty(item.id,-1)} style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.06)', color:C.text, cursor:'pointer', fontWeight:800, fontSize:16 }}>−</button>
                        <span style={{ fontWeight:700, minWidth:20, textAlign:'center' }}>{item.qty}</span>
                        <button onClick={()=>changeQty(item.id,1)} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:P, color:'#fff', cursor:'pointer', fontWeight:800, fontSize:16 }}>+</button>
                      </div>
                      <button onClick={()=>removeFromCart(item.id)} style={{ background:'none', border:'none', color:'#FF3B30', cursor:'pointer', fontSize:18, flexShrink:0 }}>🗑</button>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0', fontWeight:800, fontSize:18, borderTop:`1px solid ${C.border}`, marginTop:4 }}>
                    <span>Total</span><span style={{ color:P }}>S/{cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={()=>{setCartOpen(false);setOrderModal(true);setOrderSent(false)}}
                    style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:P, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer' }}>
                    Confirmar pedido →
                  </button>
                </>
            }
          </div>
        </div>
      )}

      {/* ══ MODAL CHECKOUT ══ */}
      {orderModal && (
        <div onClick={()=>setOrderModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#111', width:'100%', maxHeight:'90vh', overflowY:'auto', borderRadius:'24px 24px 0 0', padding:'24px 20px 40px', border:`1px solid ${C.border}`, borderBottom:'none', animation:'fadeUp .25s ease' }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:'0 auto 20px' }} />
            {orderSent
              ? <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
                  <div style={{ fontWeight:900, fontSize:22, marginBottom:8 }}>¡Pedido enviado!</div>
                  <div style={{ color:C.muted, fontSize:14, marginBottom:24, lineHeight:1.6 }}>Se abrió WhatsApp con tu pedido. El equipo de {storeName} te contactará pronto.</div>
                  <button onClick={()=>{setOrderModal(false);setCart([])}} style={{ padding:'14px 32px', borderRadius:14, border:'none', background:P, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>Cerrar</button>
                </div>
              : <form onSubmit={sendOrder}>
                  <div style={{ fontWeight:800, fontSize:20, marginBottom:6 }}>Confirmar pedido</div>
                  <div style={{ color:C.muted, fontSize:13, marginBottom:20 }}>{cart.length} producto{cart.length!==1?'s':''} · S/{cartTotal.toFixed(2)} total</div>
                  {[
                    { key:'name',  label:'Tu nombre',   ph:'Rodrigo García',       req:true },
                    { key:'phone', label:'Tu teléfono', ph:'+51 999 000 000',       req:true },
                    { key:'notes', label:'Notas',       ph:'Dirección, modelo…',    req:false },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:14 }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:C.muted }}>{f.label}</div>
                      {f.key==='notes'
                        ? <textarea value={orderForm[f.key]} onChange={e=>setOrderForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} rows={2}
                            style={{ width:'100%', padding:'12px', borderRadius:12, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.05)', color:C.text, fontSize:14, fontFamily:C.font, resize:'none', outline:'none' }} />
                        : <input value={orderForm[f.key]} onChange={e=>setOrderForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} required={f.req}
                            style={{ width:'100%', padding:'12px', borderRadius:12, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.05)', color:C.text, fontSize:14, fontFamily:C.font, outline:'none' }} />
                      }
                    </div>
                  ))}
                  <button type="submit" style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:'#25D366', color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', marginTop:8 }}>💬 Enviar por WhatsApp</button>
                </form>
            }
          </div>
        </div>
      )}
    </div>
  );
}
