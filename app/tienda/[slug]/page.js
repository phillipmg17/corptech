'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CORP_ID = '00000000-0000-0000-0000-000000000001';

const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  innovatech: '00000000-0000-0000-0000-000000000003',
  wetech:     '00000000-0000-0000-0000-000000000004',
};

const SLUG_DEFAULTS = {
  futurteck:  { name: 'Futurteck',       slogan: 'Tecnología que transforma tu vida', primary: '#007AFF', bg: '#000000', text: '#FFFFFF', emoji: '🔵' },
  innovatech: { name: 'Innovatech Store', slogan: 'Innovación en cada dispositivo',    primary: '#BF5AF2', bg: '#0D0010', text: '#FFFFFF', emoji: '🟣' },
  wetech:     { name: 'WeTech Peru',      slogan: 'Tu tienda tech de confianza',       primary: '#30D158', bg: '#000A00', text: '#FFFFFF', emoji: '🟢' },
};

const PRICE_FILTERS = [
  { id: 'all',    lbl: 'Todo' },
  { id: 'u500',   lbl: 'Hasta S/500',      fn: p => p.minPrice < 500 },
  { id: '500',    lbl: 'S/500 – 1,000',    fn: p => p.minPrice >= 500  && p.minPrice < 1000 },
  { id: '1000',   lbl: 'S/1,000 – 2,000',  fn: p => p.minPrice >= 1000 && p.minPrice < 2000 },
  { id: 'o2000',  lbl: 'Más de S/2,000',   fn: p => p.minPrice >= 2000 },
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

  const [settings,  setSettings]  = useState(null);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [cart,      setCart]      = useState([]);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [orderModal,setOrderModal]= useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', notes: '' });
  const [searchQ,   setSearchQ]   = useState('');
  const [orderSent, setOrderSent] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [priceFilter,setPriceFilter]= useState('all');
  const [showInfo,  setShowInfo]  = useState(false);

  const C = {
    primary:   settings?.color_primario   || def.primary,
    secondary: settings?.color_secundario || def.primary,
    bg:        '#0a0a0a',
    text:      '#ffffff',
    font:      'Urbanist, sans-serif',
    card:      'rgba(255,255,255,0.05)',
    cardHover: 'rgba(255,255,255,0.08)',
    border:    'rgba(255,255,255,0.10)',
    muted:     'rgba(255,255,255,0.45)',
  };
  const P = settings?.color_primario || def.primary;

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    loadAll();
  }, [slug]);

  async function loadAll() {
    await Promise.all([loadSettings(), loadProducts()]);
    setLoading(false);
  }

  async function loadSettings() {
    const { data } = await supabase.from('tiendas_config').select('*').eq('org_id', orgId).single();
    if (data) setSettings(data);
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('stock_items')
      .select('id, product_id, sale_price, emoji, products(id, name, description, emoji, brand, category, photo_url)')
      .eq('status', 'available')
      .in('owner_org_id', [orgId, CORP_ID]);

    if (!data) return;

    const map = {};
    data.forEach(item => {
      const pid    = item.product_id;
      const prod   = item.products || {};
      const pname  = prod.name  || 'Producto';
      const pemoji = prod.emoji || item.emoji || '📦';
      const pdesc  = prod.description || '';
      const pbrand = prod.brand    || '';
      const pcat   = prod.category || 'Otros';
      const pphoto = prod.photo_url || null;

      if (!map[pid]) {
        map[pid] = {
          id: pid, name: pname, emoji: pemoji, description: pdesc,
          brand: pbrand, category: pcat, photo: pphoto,
          units: [], minPrice: Infinity, maxPrice: 0,
        };
      }
      map[pid].units.push({ id: item.id, price: item.sale_price || 0 });
      if ((item.sale_price || 0) < map[pid].minPrice) map[pid].minPrice = item.sale_price || 0;
      if ((item.sale_price || 0) > map[pid].maxPrice) map[pid].maxPrice = item.sale_price || 0;
    });

    setProducts(Object.values(map).filter(p => p.units.length > 0));
  }

  /* ── FILTROS ── */
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || (p.brand || '').toLowerCase().includes(searchQ.toLowerCase());
    const matchCat    = catFilter === 'all' || p.category === catFilter;
    const priceObj    = PRICE_FILTERS.find(f => f.id === priceFilter);
    const matchPrice  = priceFilter === 'all' || (priceObj?.fn && priceObj.fn(p));
    return matchSearch && matchCat && matchPrice;
  });

  /* ── CART ── */
  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1, price: product.minPrice }];
    });
    setSelected(null);
  }
  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }
  function changeQty(id, delta) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0));
  }
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  /* ── CHECKOUT via WhatsApp ── */
  function sendOrder(e) {
    e.preventDefault();
    const phone     = settings?.whatsapp || '';
    const storeName = settings?.store_name || def.name;
    const lines     = cart.map(i => `• ${i.emoji} ${i.name} x${i.qty} — S/${(i.price * i.qty).toFixed(2)}`).join('\n');
    const msg       = `¡Hola ${storeName}! 👋\n\nSoy *${orderForm.name}*.\n\nMi pedido:\n${lines}\n\n*Total: S/${cartTotal.toFixed(2)}*\n\nTel: ${orderForm.phone}${orderForm.notes ? `\nNotas: ${orderForm.notes}` : ''}`;
    const url       = `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
    if (phone) window.open(url, '_blank');
    setOrderSent(true);
  }

  const storeName   = settings?.store_name   || def.name;
  const storeSlogan = settings?.tagline       || def.slogan;
  const storeLogo   = settings?.logo_url      || null;
  const storeBanner = settings?.banner_url    || null;
  const storeDesc   = settings?.descripcion   || '';
  const storeWA          = settings?.whatsapp       || '';
  const storeIG          = settings?.instagram      || '';
  const storeTK          = settings?.tiktok         || '';
  const storeDirec       = settings?.direccion      || '';
  const storeHrs         = settings?.horarios       || null;
  const storeGooglePlace = settings?.google_place_id || '';

  const DIAS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  const DIAS_LBL = { lunes:'Lun', martes:'Mar', miercoles:'Mié', jueves:'Jue', viernes:'Vie', sabado:'Sáb', domingo:'Dom' };

  if (!orgId) return (
    <div style={{ minHeight:'100vh', background:'#000', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Urbanist,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48 }}>🔍</div>
        <div style={{ fontSize:22, fontWeight:800, marginTop:12 }}>Tienda no encontrada</div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${P}`, borderTopColor:'transparent', animation:'spin 1s linear infinite', margin:'0 auto' }} />
        <div style={{ color:'rgba(255,255,255,0.4)', marginTop:16, fontFamily:'Urbanist,sans-serif', fontSize:14 }}>Cargando tienda…</div>
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:C.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .prod-card { transition: transform .15s, box-shadow .15s; }
        .prod-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        .chip { transition: all .15s; cursor:pointer; white-space:nowrap; }
        .chip:hover { opacity:.85; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:4px; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        background:'rgba(10,10,10,0.88)', borderBottom:`1px solid ${C.border}`,
        padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {storeLogo
            ? <img src={storeLogo} alt="logo" style={{ height:36, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            : <span style={{ fontSize:26 }}>{def.emoji}</span>
          }
          <div style={{ fontWeight:800, fontSize:16 }}>{storeName}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setShowInfo(v => !v)}
            style={{ background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:10, padding:'6px 12px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            ℹ️ Info
          </button>
          {storeWA && (
            <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ background:'#25D36620', border:'1px solid #25D36640', color:'#25D366', borderRadius:10, padding:'6px 10px', fontSize:16, textDecoration:'none' }}>
              💬
            </a>
          )}
          <button onClick={() => setCartOpen(true)} style={{
            position:'relative', background:P, border:'none', color:'#fff',
            borderRadius:12, padding:'8px 14px', fontWeight:700, fontSize:14, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6,
          }}>
            🛒
            {cartCount > 0 && (
              <span style={{ background:'#FF3B30', color:'#fff', borderRadius:'50%', width:18, height:18,
                fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── INFO PANEL (colapsable) ── */}
      {showInfo && (
        <div style={{ background:'rgba(255,255,255,0.04)', borderBottom:`1px solid ${C.border}`, padding:'20px 20px', animation:'fadeUp .2s ease' }}>
          {storeDesc && <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:16 }}>{storeDesc}</p>}

          {/* Horarios */}
          {storeHrs && (
            <>
              <div style={{ fontWeight:700, fontSize:13, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>🕐 Horarios</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:16 }}>
                {DIAS.map(d => (
                  <div key={d} style={{ background:C.card, borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:4 }}>{DIAS_LBL[d]}</div>
                    <div style={{ fontSize:10, color: storeHrs[d] === 'Cerrado' ? '#FF3B30' : P, fontWeight:700, lineHeight:1.3 }}>
                      {storeHrs[d] === 'Cerrado' ? '—' : (storeHrs[d] || '').replace(' - ','\n')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Contacto y redes */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {storeDirec && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(storeDirec)}`} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:6, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', color:C.text, textDecoration:'none', fontSize:13, fontWeight:600 }}>
                📍 {storeDirec}
              </a>
            )}
            {storeIG && (
              <a href={storeIG.startsWith('http') ? storeIG : `https://instagram.com/${storeIG.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(193,53,132,0.12)', border:'1px solid rgba(193,53,132,0.25)', borderRadius:10, padding:'8px 12px', color:'#e1306c', textDecoration:'none', fontSize:13, fontWeight:600 }}>
                📸 Instagram
              </a>
            )}
            {storeTK && (
              <a href={storeTK.startsWith('http') ? storeTK : `https://tiktok.com/@${storeTK.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', color:C.text, textDecoration:'none', fontSize:13, fontWeight:600 }}>
                🎵 TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      {storeBanner ? (
        <div style={{ position:'relative', height:220 }}>
          <img src={storeBanner} alt="banner" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, transparent 20%, ${C.bg})` }} />
          <div style={{ position:'absolute', bottom:20, left:20 }}>
            <div style={{ fontWeight:900, fontSize:26, textShadow:'0 2px 10px rgba(0,0,0,0.8)' }}>{storeName}</div>
            <div style={{ color:P, fontWeight:600, marginTop:4, textShadow:'0 1px 6px rgba(0,0,0,0.8)', fontSize:14 }}>{storeSlogan}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding:'36px 20px 24px', textAlign:'center', background:`radial-gradient(ellipse at top, ${hexAlpha(P,0.18)} 0%, transparent 70%)` }}>
          <div style={{ fontWeight:900, fontSize:32, marginBottom:6 }}>{storeName}</div>
          <div style={{ color:P, fontWeight:600, fontSize:15, marginBottom: storeDesc ? 12 : 0 }}>{storeSlogan}</div>
        </div>
      )}

      {/* ── TRUST BADGES ── */}
      <div style={{ display:'flex', gap:8, padding:'0 20px 0', overflowX:'auto', paddingBottom:4 }}>
        {[
          { ico:'✅', lbl:'Garantía oficial' },
          { ico:'🔒', lbl:'Pago seguro' },
          { ico:'📦', lbl:'Stock real' },
          { ico:'⚡', lbl:'Entrega rápida' },
        ].map(b => (
          <div key={b.lbl} style={{ display:'flex', alignItems:'center', gap:5, background:`${hexAlpha(P,0.08)}`, border:`1px solid ${hexAlpha(P,0.2)}`, borderRadius:20, padding:'6px 12px', whiteSpace:'nowrap', fontSize:12, fontWeight:600, flexShrink:0 }}>
            <span>{b.ico}</span><span style={{ color:P }}>{b.lbl}</span>
          </div>
        ))}
      </div>

      {/* ── BÚSQUEDA ── */}
      <div style={{ padding:'16px 20px 8px' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:C.muted }}>🔍</span>
          <input
            placeholder="Buscar por nombre o marca..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:14, border:`1px solid ${C.border}`,
              background:C.card, color:C.text, fontSize:15, outline:'none', fontFamily:C.font }} />
        </div>
      </div>

      {/* ── FILTROS CATEGORÍA ── */}
      {categories.length > 2 && (
        <div style={{ display:'flex', gap:8, padding:'8px 20px', overflowX:'auto', paddingBottom:4 }}>
          {categories.map(cat => (
            <button key={cat} className="chip"
              onClick={() => setCatFilter(cat)}
              style={{
                padding:'7px 14px', borderRadius:20, border:'none', fontSize:13, fontWeight:700, flexShrink:0,
                background: catFilter === cat ? P : C.card,
                color: catFilter === cat ? '#fff' : C.muted,
                outline: catFilter === cat ? 'none' : `1px solid ${C.border}`,
              }}>
              {cat === 'all' ? '📦 Todo' : cat}
            </button>
          ))}
        </div>
      )}

      {/* ── FILTROS PRECIO ── */}
      <div style={{ display:'flex', gap:8, padding:'4px 20px 12px', overflowX:'auto' }}>
        {PRICE_FILTERS.map(f => (
          <button key={f.id} className="chip"
            onClick={() => setPriceFilter(f.id)}
            style={{
              padding:'6px 12px', borderRadius:20, border:'none', fontSize:12, fontWeight:700, flexShrink:0,
              background: priceFilter === f.id ? hexAlpha(P, 0.2) : 'transparent',
              color: priceFilter === f.id ? P : C.muted,
              outline: `1px solid ${priceFilter === f.id ? hexAlpha(P,0.5) : C.border}`,
            }}>
            {f.lbl}
          </button>
        ))}
      </div>

      {/* ── GRID PRODUCTOS ── */}
      <div style={{ padding:'0 20px 120px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}>
            <div style={{ fontSize:48 }}>🔍</div>
            <div style={{ marginTop:12, fontWeight:600, fontSize:16 }}>Sin resultados</div>
            <div style={{ fontSize:13, marginTop:6 }}>Intenta con otro filtro</div>
          </div>
        ) : (
          <>
            <div style={{ color:C.muted, fontSize:13, marginBottom:14 }}>
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
              {filtered.map(p => (
                <div key={p.id} className="prod-card" onClick={() => setSelected(p)}
                  style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden', cursor:'pointer' }}>
                  {/* Foto o emoji */}
                  <div style={{ position:'relative', height:160, background:hexAlpha(P,0.08), display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    {p.photo
                      ? <img src={p.photo} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      : null
                    }
                    <div style={{ display: p.photo ? 'none' : 'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', fontSize:56 }}>
                      {p.emoji}
                    </div>
                    {/* Badge unidades */}
                    <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:10, fontWeight:700, borderRadius:8, padding:'3px 7px', backdropFilter:'blur(8px)' }}>
                      {p.units.length} ud.
                    </span>
                    {/* Badge marca */}
                    {p.brand && (
                      <span style={{ position:'absolute', bottom:8, left:8, background:hexAlpha(P,0.85), color:'#fff', fontSize:10, fontWeight:700, borderRadius:8, padding:'3px 8px' }}>
                        {p.brand}
                      </span>
                    )}
                  </div>
                  <div style={{ padding:'12px 12px 14px' }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:6, lineHeight:1.3 }}>{p.name}</div>
                    <div style={{ color:P, fontWeight:800, fontSize:16 }}>
                      {p.minPrice === p.maxPrice ? `S/${p.minPrice.toFixed(0)}` : `S/${p.minPrice.toFixed(0)} – ${p.maxPrice.toFixed(0)}`}
                    </div>
                    <button onClick={e => { e.stopPropagation(); addToCart(p); }}
                      style={{ marginTop:10, width:'100%', padding:'9px', borderRadius:10, border:'none',
                        background:P, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── GOOGLE REVIEWS ── */}
      {storeGooglePlace && (
        <div style={{ padding:'0 20px 32px', animation:'fadeUp .3s ease' }}>
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:28 }}>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:6 }}>⭐ Reseñas en Google</div>
            <div style={{ color:C.muted, fontSize:13, marginBottom:20 }}>Lo que dicen nuestros clientes</div>

            {/* Stars display */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ display:'flex', gap:3 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ fontSize:28, color:s <= 5 ? '#FFD60A' : C.border }}>★</span>
                ))}
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:22 }}>5.0</div>
                <div style={{ color:C.muted, fontSize:12 }}>En Google</div>
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
              <a
                href={`https://search.google.com/local/reviews?placeid=${storeGooglePlace}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, background:`${hexAlpha(P,0.12)}`, border:`1px solid ${hexAlpha(P,0.3)}`, borderRadius:14, padding:'12px 18px', color:P, textDecoration:'none', fontWeight:700, fontSize:14 }}>
                👁 Ver reseñas en Google
              </a>
              <a
                href={`https://search.google.com/local/writereview?placeid=${storeGooglePlace}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,214,10,0.10)', border:'1px solid rgba(255,214,10,0.30)', borderRadius:14, padding:'12px 18px', color:'#FFD60A', textDecoration:'none', fontWeight:700, fontSize:14 }}>
                ⭐ Dejar una reseña
              </a>
            </div>

            {/* Google Maps embed */}
            {storeDirec && (
              <div style={{ borderRadius:18, overflow:'hidden', border:`1px solid ${C.border}`, height:200 }}>
                <iframe
                  title="Mapa"
                  width="100%"
                  height="200"
                  style={{ border:0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(storeDirec)}&output=embed`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:'28px 20px 40px', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          {storeLogo
            ? <img src={storeLogo} alt="logo" style={{ height:40, objectFit:'contain', marginBottom:8 }} onError={e=>e.target.style.display='none'} />
            : <div style={{ fontSize:36, marginBottom:8 }}>{def.emoji}</div>
          }
          <div style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>{storeName}</div>
          <div style={{ color:P, fontSize:13, marginBottom:16 }}>{storeSlogan}</div>
        </div>
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:12, marginBottom:20 }}>
          {storeWA && (
            <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:12, padding:'10px 16px', color:'#25D366', textDecoration:'none', fontSize:14, fontWeight:700 }}>
              💬 WhatsApp
            </a>
          )}
          {storeIG && (
            <a href={storeIG.startsWith('http') ? storeIG : `https://instagram.com/${storeIG.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(193,53,132,0.12)', border:'1px solid rgba(193,53,132,0.25)', borderRadius:12, padding:'10px 16px', color:'#e1306c', textDecoration:'none', fontSize:14, fontWeight:700 }}>
              📸 Instagram
            </a>
          )}
          {storeTK && (
            <a href={storeTK.startsWith('http') ? storeTK : `https://tiktok.com/@${storeTK.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 16px', color:C.text, textDecoration:'none', fontSize:14, fontWeight:700 }}>
              🎵 TikTok
            </a>
          )}
        </div>
        {storeDirec && (
          <div style={{ textAlign:'center', color:C.muted, fontSize:13, marginBottom:8 }}>📍 {storeDirec}</div>
        )}
        <div style={{ textAlign:'center', color:C.muted, fontSize:11, marginTop:16 }}>
          © {new Date().getFullYear()} {storeName} · Powered by CorpTech
        </div>
      </div>

      {/* ══════ MODAL: PRODUCTO ══════ */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#111', width:'100%', maxHeight:'88vh', overflowY:'auto',
              borderRadius:'24px 24px 0 0', border:`1px solid ${C.border}`, borderBottom:'none', animation:'fadeUp .25s ease' }}>
            {/* Drag handle */}
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:'16px auto 0' }} />
            {/* Foto grande */}
            <div style={{ height:240, background:hexAlpha(P,0.1), display:'flex', alignItems:'center', justifyContent:'center', margin:'16px 16px 0', borderRadius:16, overflow:'hidden' }}>
              {selected.photo
                ? <img src={selected.photo} alt={selected.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                : null
              }
              <div style={{ display: selected.photo ? 'none' : 'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', fontSize:88 }}>
                {selected.emoji}
              </div>
            </div>
            <div style={{ padding:'20px 20px 32px' }}>
              {selected.brand && (
                <span style={{ background:hexAlpha(P,0.15), color:P, fontSize:11, fontWeight:800, borderRadius:8, padding:'3px 10px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {selected.brand}
                </span>
              )}
              <div style={{ fontWeight:900, fontSize:24, margin:'10px 0 8px', lineHeight:1.2 }}>{selected.name}</div>
              {selected.description && (
                <div style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:16 }}>{selected.description}</div>
              )}
              <div style={{ color:P, fontWeight:900, fontSize:32, marginBottom:4 }}>
                {selected.minPrice === selected.maxPrice
                  ? `S/${selected.minPrice.toFixed(2)}`
                  : `S/${selected.minPrice.toFixed(0)} – S/${selected.maxPrice.toFixed(0)}`}
              </div>
              <div style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
                {selected.units.length} unidad{selected.units.length !== 1 ? 'es' : ''} disponible{selected.units.length !== 1 ? 's' : ''}
                {selected.category && ` · ${selected.category}`}
              </div>
              <button onClick={() => addToCart(selected)}
                style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:P, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', marginBottom:10 }}>
                🛒 Agregar al carrito
              </button>
              {storeWA && (
                <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola, me interesa: ${selected.name} — S/${selected.minPrice.toFixed(2)}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', width:'100%', padding:'14px', borderRadius:16, border:'1px solid rgba(37,211,102,0.4)', background:'rgba(37,211,102,0.08)', color:'#25D366', fontWeight:700, fontSize:15, cursor:'pointer', marginBottom:10, textAlign:'center', textDecoration:'none' }}>
                  💬 Preguntar por WhatsApp
                </a>
              )}
              <button onClick={() => setSelected(null)}
                style={{ width:'100%', padding:'13px', borderRadius:16, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontWeight:600, fontSize:14, cursor:'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ DRAWER: CARRITO ══════ */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#111', width:'100%', maxHeight:'85vh', overflowY:'auto',
              borderRadius:'24px 24px 0 0', padding:'20px 20px 36px', border:`1px solid ${C.border}`, borderBottom:'none', animation:'fadeUp .25s ease' }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:'0 auto 20px' }} />
            <div style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>🛒 Tu carrito</div>
            {cart.length === 0 ? (
              <div style={{ textAlign:'center', color:C.muted, padding:'40px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🛒</div>
                <div>Carrito vacío</div>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:hexAlpha(P,0.1), display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                      {item.photo
                        ? <img src={item.photo} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                        : null
                      }
                      <span style={{ display: item.photo ? 'none' : 'flex', fontSize:22 }}>{item.emoji}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{item.name}</div>
                      <div style={{ color:P, fontWeight:800, fontSize:13 }}>S/{(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <button onClick={() => changeQty(item.id,-1)} style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${C.border}`, background:C.card, color:C.text, cursor:'pointer', fontWeight:800, fontSize:16 }}>−</button>
                      <span style={{ fontWeight:700, minWidth:20, textAlign:'center' }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:P, color:'#fff', cursor:'pointer', fontWeight:800, fontSize:16 }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background:'none', border:'none', color:'#FF3B30', cursor:'pointer', fontSize:18, flexShrink:0 }}>🗑</button>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0', fontWeight:800, fontSize:18, borderTop:`1px solid ${C.border}`, marginTop:4 }}>
                  <span>Total</span>
                  <span style={{ color:P }}>S/{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => { setCartOpen(false); setOrderModal(true); setOrderSent(false); }}
                  style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:P, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', marginTop:4 }}>
                  Confirmar pedido →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ MODAL: CHECKOUT ══════ */}
      {orderModal && (
        <div onClick={() => setOrderModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#111', width:'100%', maxHeight:'90vh', overflowY:'auto',
              borderRadius:'24px 24px 0 0', padding:'20px 20px 44px', border:`1px solid ${C.border}`, borderBottom:'none', animation:'fadeUp .25s ease' }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:'0 auto 20px' }} />
            {orderSent ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:64 }}>🎉</div>
                <div style={{ fontWeight:800, fontSize:24, marginTop:16, marginBottom:8 }}>¡Pedido enviado!</div>
                <div style={{ color:C.muted, fontSize:14, lineHeight:1.6 }}>Te contactaremos pronto por WhatsApp para coordinar la entrega.</div>
                <button onClick={() => { setOrderModal(false); setCart([]); setOrderSent(false); }}
                  style={{ marginTop:28, padding:'14px 32px', borderRadius:14, border:'none', background:P, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer' }}>
                  Seguir comprando
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>📦 Confirmar pedido</div>
                {/* Resumen */}
                <div style={{ background:C.card, borderRadius:14, padding:14, marginBottom:20, border:`1px solid ${C.border}` }}>
                  {cart.map(i => (
                    <div key={i.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:14 }}>
                      <span style={{ color:C.muted }}>{i.emoji} {i.name} ×{i.qty}</span>
                      <span style={{ color:P, fontWeight:700 }}>S/{(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:6, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:16 }}>
                    <span>Total</span>
                    <span style={{ color:P }}>S/{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <form onSubmit={sendOrder}>
                  {[
                    { key:'name',  lbl:'Tu nombre *', ph:'Nombre completo', req:true,  type:'text' },
                    { key:'phone', lbl:'Teléfono *',   ph:'+51 999 999 999', req:true,  type:'tel'  },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:14 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:'block', marginBottom:6 }}>{f.lbl}</label>
                      <input required={f.req} type={f.type}
                        value={orderForm[f.key]}
                        onChange={e => setOrderForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.ph}
                        style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`,
                          background:'rgba(255,255,255,0.06)', color:C.text, fontSize:15, outline:'none', fontFamily:C.font }} />
                    </div>
                  ))}
                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:'block', marginBottom:6 }}>Notas / dirección de entrega</label>
                    <textarea
                      value={orderForm.notes}
                      onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Dirección, color preferido, modelo específico..."
                      rows={3}
                      style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`,
                        background:'rgba(255,255,255,0.06)', color:C.text, fontSize:14, outline:'none', resize:'vertical', fontFamily:C.font }} />
                  </div>
                  <button type="submit"
                    style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', background:'#25D366', color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
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
