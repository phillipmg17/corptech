'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* ══════════════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════════════ */
const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  innovatech: '00000000-0000-0000-0000-000000000003',
  wetech:     '00000000-0000-0000-0000-000000000004',
};
const SLUG_DEFAULTS = {
  futurteck:  { name:'Futurteck',       slogan:'Tecnología que transforma tu vida', primary:'#007AFF', emoji:'🔵' },
  innovatech: { name:'Innovatech Store', slogan:'Innovación en cada dispositivo',   primary:'#BF5AF2', emoji:'🟣' },
  wetech:     { name:'WeTech Peru',      slogan:'Tu tienda tech de confianza',      primary:'#30D158', emoji:'🟢' },
};

/* ── Demo fallback: cuando DB no tiene productos ── */
const DEMO_PRODUCTS = [
  { id:'d1', name:'iPhone 15 Pro',     brand:'Apple', category:'iPhone',   photo:'https://images.unsplash.com/photo-1696426503717-27b5f9d17e3a?w=600&q=80', min_price:4299, colors:['Negro Titanio','Blanco Titanio','Natural Titanio','Azul Titanio'], capacities:['128GB','256GB','512GB','1TB'], color_images:{}, is_demo:true },
  { id:'d2', name:'iPhone 14',         brand:'Apple', category:'iPhone',   photo:'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&q=80', min_price:2899, colors:['Medianoche','Estelar','Rojo','Azul','Morado'], capacities:['128GB','256GB'], color_images:{}, is_demo:true },
  { id:'d3', name:'MacBook Air M2',    brand:'Apple', category:'MacBook',  photo:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', min_price:6499, colors:['Medianoche','Luz Estelar','Gris Espacial'], capacities:['8GB RAM 256GB','8GB RAM 512GB','16GB RAM 512GB'], color_images:{}, is_demo:true },
  { id:'d4', name:'AirPods Pro 2ª Gen',brand:'Apple', category:'AirPods',  photo:'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?w=600&q=80', min_price:1299, colors:['Blanco'], capacities:['Con MagSafe'], color_images:{}, is_demo:true },
  { id:'d5', name:'iPad Pro M4 11"',   brand:'Apple', category:'iPad',     photo:'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80', min_price:5499, colors:['Negro Espacial','Plata'], capacities:['256GB Wi-Fi','512GB Wi-Fi','1TB Wi-Fi+Cell'], color_images:{}, is_demo:true },
  { id:'d6', name:'Apple Watch S9',    brand:'Apple', category:'Watch',    photo:'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&q=80', min_price:2299, colors:['Medianoche','Rosa','Rojo','Plata'], capacities:['41mm','45mm'], color_images:{}, is_demo:true },
  { id:'d7', name:'iPhone 13',         brand:'Apple', category:'iPhone',   photo:'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=80', min_price:1999, colors:['Negro','Blanco','Rojo','Azul','Verde','Rosa'], capacities:['128GB','256GB','512GB'], color_images:{}, is_demo:true },
  { id:'d8', name:'Samsung Galaxy S24',brand:'Samsung',category:'Android', photo:'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', min_price:3299, colors:['Negro','Violeta','Gris','Amarillo'], capacities:['128GB','256GB'], color_images:{}, is_demo:true },
];

const DEMO_TESTIMONIALS = [
  { name:'Carlos R.', stars:5, text:'Excelente atención y productos 100% originales. Mi iPhone llegó en perfectas condiciones y en tiempo récord. ¡Totalmente recomendado!', avatar:'CR' },
  { name:'María G.', stars:5, text:'Compré un MacBook Air y la experiencia fue increíble. El equipo los asesora muy bien antes de la compra. Ya soy cliente fijo.', avatar:'MG' },
  { name:'José M.', stars:5, text:'Muy buena relación precio-calidad. Los productos son originales con caja y garantía oficial. El pago fue súper seguro y rápido.', avatar:'JM' },
  { name:'Lucía P.', stars:5, text:'Me guiaron para elegir entre dos modelos y fui muy bien asesorada. El envío llegó al día siguiente. 100% confiable.', avatar:'LP' },
];

const DEMO_FAQ = [
  { q:'¿Cuánto demoran los envíos?', a:'En Lima realizamos envíos en 24 a 48 horas hábiles. Para provincias el tiempo estimado es de 3 a 7 días hábiles dependiendo de la ubicación. Todos los pedidos tienen número de seguimiento.' },
  { q:'¿Los productos son 100% originales?', a:'Sí, absolutamente. Todos nuestros productos son originales y cuentan con la garantía oficial del fabricante. Jamás vendemos réplicas ni equipos de procedencia dudosa.' },
  { q:'¿Ofrecen garantía?', a:'Todos los productos nuevos incluyen garantía oficial Apple (1 año) o del fabricante correspondiente. Los equipos usados tienen garantía de tienda de 3 a 6 meses según el producto.' },
  { q:'¿Puedo devolver un producto?', a:'Aceptamos devoluciones dentro de los 7 días calendario desde la recepción del producto, siempre que esté en las mismas condiciones en que fue entregado, con caja y accesorios.' },
  { q:'¿Qué métodos de pago aceptan?', a:'Aceptamos Yape, Plin, transferencia bancaria, tarjetas de crédito y débito (Visa, Mastercard, Amex) vía IziPay y Niubiz. También puedes pagar en efectivo en tienda.' },
  { q:'¿Tienen tienda física?', a:'Sí, puedes visitarnos o coordinar el recojo de tu pedido directamente en nuestra tienda. Escríbenos por WhatsApp para coordinar el horario de atención.' },
];

const DEMO_CATEGORIES = [
  { id:'all',     label:'Todo',         emoji:'✦' },
  { id:'iPhone',  label:'iPhone',       emoji:'📱' },
  { id:'MacBook', label:'MacBook',      emoji:'💻' },
  { id:'iPad',    label:'iPad',         emoji:'🖥' },
  { id:'AirPods', label:'AirPods',      emoji:'🎧' },
  { id:'Watch',   label:'Apple Watch',  emoji:'⌚' },
  { id:'Android', label:'Android',      emoji:'🤖' },
  { id:'Accesorios', label:'Accesorios', emoji:'🎒' },
];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function hexAlpha(hex, a) {
  try {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return `rgba(128,128,128,${a})`; }
}
function fmt(n) { return `S/ ${Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:0,maximumFractionDigits:0})}`; }
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5-n); }

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════ */
export default function TiendaPage({ params }) {
  const slug  = params.slug?.toLowerCase();
  const orgId = SLUG_MAP[slug];
  const def   = SLUG_DEFAULTS[slug] || SLUG_DEFAULTS.futurteck;

  /* ── Datos de tienda ── */
  const [settings,  setSettings]  = useState(null);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  /* ── UI ── */
  const [catFilter,  setCatFilter]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('default');
  const [selected,   setSelected]   = useState(null);   // producto abierto
  const [selColor,   setSelColor]   = useState('');
  const [selCap,     setSelCap]     = useState('');
  const [selCond,    setSelCond]    = useState('Nuevo');
  const [cart,       setCart]       = useState([]);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [checkout,   setCheckout]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [faqOpen,    setFaqOpen]    = useState(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [orderForm,  setOrderForm]  = useState({ name:'', phone:'', email:'', address:'', notes:'' });
  const [payMethod,  setPayMethod]  = useState('whatsapp');
  const [orderSent,  setOrderSent]  = useState(false);

  /* ── Colores dinámicos ── */
  const P   = settings?.color_primario || def.primary;
  const storeName   = settings?.store_name  || def.name;
  const storeSlogan = settings?.tagline     || def.slogan;
  const storeLogo   = settings?.logo_url    || null;
  const storeWA     = settings?.whatsapp    || '';
  const storeIG     = settings?.instagram   || '';
  const storeTK     = settings?.tiktok      || '';
  const storeFB     = settings?.facebook    || '';
  const storeYT     = settings?.youtube     || '';
  const storeDirec  = settings?.direccion   || 'Lima, Perú';
  const storePhone  = settings?.phone       || storeWA;
  const heroTitle   = settings?.hero_title  || `Bienvenido a ${storeName}`;
  const heroSub     = settings?.hero_subtitle || storeSlogan;
  const heroCTA     = settings?.hero_cta    || 'Ver productos';
  const heroImg     = settings?.hero_image_url || null;
  const aboutText   = settings?.about_text  || `Somos especialistas en tecnología con años de experiencia brindando los mejores productos y el mejor servicio. Cada equipo que vendemos pasa por un riguroso control de calidad para garantizar tu satisfacción total.`;
  const aboutImg    = settings?.about_image_url || null;
  const izipayUrl   = settings?.izipay_payment_url || null;
  const niubizUrl   = settings?.niubiz_payment_url || null;
  const bankData    = settings?.bank_account || null;
  const faqItems    = settings?.faq_items   || DEMO_FAQ;
  const testimonials= settings?.testimonials || DEMO_TESTIMONIALS;

  /* ── Cargar datos ── */
  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    setLoading(true);
    if (!orgId) { setLoading(false); return; }

    // Cargar config de tienda
    const { data: storeData } = await supabase
      .from('tiendas_config')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();
    if (storeData) setSettings(storeData);

    // Cargar productos desde stock_items disponibles para esta tienda
    const { data: stockData } = await supabase
      .from('stock_items')
      .select(`sale_price, products(id, name, brand, category, photo, description, colors, capacities, color_images)`)
      .eq('owner_org_id', orgId)
      .eq('status', 'available');

    if (stockData && stockData.length > 0) {
      // Agrupar por producto, precio mínimo
      const productMap = {};
      stockData.forEach(item => {
        const p = item.products;
        if (!p) return;
        if (!productMap[p.id]) {
          productMap[p.id] = {
            ...p,
            min_price: item.sale_price || 0,
            colors: p.colors || [],
            capacities: p.capacities || [],
            color_images: p.color_images || {},
          };
        } else if ((item.sale_price || 0) < productMap[p.id].min_price) {
          productMap[p.id].min_price = item.sale_price || 0;
        }
      });
      setProducts(Object.values(productMap));
    } else {
      setProducts(DEMO_PRODUCTS);
    }
    setLoading(false);
  }

  /* ── Filtrado y orden ── */
  const filtered = products
    .filter(p => catFilter === 'all' || p.category === catFilter)
    .filter(p => !search || (p.name+' '+p.brand+' '+(p.category||'')).toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sortBy === 'price_asc')  return (a.min_price||0)-(b.min_price||0);
      if (sortBy === 'price_desc') return (b.min_price||0)-(a.min_price||0);
      return 0;
    });

  /* ── Abrir producto ── */
  function openProduct(p) {
    setSelected(p);
    setSelColor(p.colors?.[0] || '');
    setSelCap(p.capacities?.[0] || '');
    setSelCond('Nuevo');
    document.body.style.overflow = 'hidden';
  }
  function closeProduct() { setSelected(null); document.body.style.overflow = ''; }

  /* ── Carrito ── */
  const cartQty = cart.reduce((s,i) => s+i.qty, 0);
  function addToCart(p, color, cap, cond) {
    const label = [color, cap, cond].filter(Boolean).join(' · ');
    const key = `${p.id}-${label}`;
    setCart(c => {
      const ex = c.find(i => i.key === key);
      if (ex) return c.map(i => i.key===key ? {...i,qty:i.qty+1} : i);
      return [...c, { key, name:p.name, photo:p.photo, price:p.min_price||0, label, qty:1, pid:p.id }];
    });
    closeProduct();
    setCartOpen(true);
  }
  function removeFromCart(key) { setCart(c => c.filter(i=>i.key!==key)); }
  function changeQty(key, d) {
    setCart(c => c.map(i => i.key===key ? {...i,qty:Math.max(1,i.qty+d)} : i));
  }
  const cartTotal = cart.reduce((s,i) => s+i.price*i.qty, 0);

  /* ── WhatsApp checkout ── */
  function buildWAMessage() {
    const items = cart.map(i => `• ${i.name} (${i.label}) x${i.qty} — ${fmt(i.price*i.qty)}`).join('\n');
    return encodeURIComponent(`Hola ${storeName}! Quiero hacer un pedido:\n\n${items}\n\n*TOTAL: ${fmt(cartTotal)}*\n\nMis datos:\nNombre: ${orderForm.name}\nTeléfono: ${orderForm.phone}\nEmail: ${orderForm.email}\n${orderForm.address?`Dirección: ${orderForm.address}\n`:''}${orderForm.notes?`Notas: ${orderForm.notes}`:''}`);
  }
  function handleWhatsApp() {
    const wa = (storeWA||'51999999999').replace(/\D/g,'');
    window.open(`https://wa.me/${wa}?text=${buildWAMessage()}`, '_blank');
    setOrderSent(true);
  }
  function handleIziPay() {
    if (izipayUrl) window.open(izipayUrl, '_blank');
    else alert('Pasarela IziPay no configurada. Configúrala en el panel admin → Configuración de tienda.');
  }
  function handleNiubiz() {
    if (niubizUrl) window.open(niubizUrl, '_blank');
    else alert('Pasarela Niubiz no configurada. Configúrala en el panel admin → Configuración de tienda.');
  }

  /* ── Imagen por color ── */
  function getProductImg(p, color) {
    return (color && p.color_images?.[color]) || p.photo || 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400';
  }

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div style={{ background:'#F5F5F7', minHeight:'100vh', fontFamily:"'Urbanist','SF Pro Display',-apple-system,sans-serif", color:'#1D1D1F' }}>

      {/* ── ESTILOS GLOBALES ── */}
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        :root { --p: ${P}; --bg: #F5F5F7; --card: #FFFFFF; --border: #E5E5EA; --text: #1D1D1F; --muted: #6E6E73; }
        body { background: var(--bg); }
        input, button, select, textarea { font-family: inherit; }
        .hover-lift { transition: transform .2s, box-shadow .2s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .btn-primary {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background: var(--p); color:#fff; border:none; border-radius:14px;
          padding:14px 28px; font-size:16px; font-weight:700; cursor:pointer;
          transition:all .2s; text-decoration:none;
        }
        .btn-primary:hover { filter:brightness(1.08); transform:translateY(-1px); }
        .btn-outline {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background: transparent; color: var(--p); border: 2px solid var(--p);
          border-radius:14px; padding:12px 24px; font-size:15px; font-weight:700; cursor:pointer; transition:all .2s;
        }
        .btn-outline:hover { background:var(--p); color:#fff; }
        .card { background:#fff; border-radius:20px; box-shadow:0 2px 20px rgba(0,0,0,0.07); }
        input[type=text], input[type=email], input[type=tel], input[type=search], textarea {
          background:#F5F5F7; border:1.5px solid #E5E5EA; border-radius:12px;
          padding:12px 16px; font-size:15px; color:#1D1D1F; outline:none;
          transition:border-color .2s; width:100%;
        }
        input:focus, textarea:focus { border-color:var(--p); background:#fff; }
        input::placeholder, textarea::placeholder { color:#AEAEB2; }
        .section-title { font-size:clamp(22px,3vw,32px); font-weight:800; color:#1D1D1F; letter-spacing:-0.5px; margin-bottom:8px; }
        .section-sub { font-size:16px; color:#6E6E73; }
        @media(max-width:768px){
          .desktop-only{display:none!important}
          .mobile-hide{display:none!important}
        }
        @media(min-width:769px){
          .mobile-only{display:none!important}
        }
        /* scrollbar custom */
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#C7C7CC; border-radius:4px; }
      `}</style>

      {/* ════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════ */}
      <nav style={{
        position:'sticky', top:0, zIndex:200,
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid #E5E5EA',
        boxShadow:'0 1px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:16, height:64 }}>
          {/* Logo */}
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
            {storeLogo
              ? <img src={storeLogo} alt={storeName} style={{ height:36, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
              : <span style={{ fontSize:28 }}>{def.emoji}</span>
            }
            <span style={{ fontWeight:800, fontSize:18, color:'#1D1D1F' }}>{storeName}</span>
          </a>

          {/* Search bar (desktop) */}
          <div className="desktop-only" style={{ flex:1, maxWidth:480, position:'relative' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#AEAEB2', fontSize:18 }}>🔍</span>
            <input type="search" placeholder="Buscar iPhone, MacBook, AirPods…"
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{ paddingLeft:42, background:'#F5F5F7', border:'none' }} />
          </div>

          {/* Right actions */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            {/* Search mobile */}
            <button className="mobile-only" onClick={() => setMobileSearch(!mobileSearch)}
              style={{ background:'#F5F5F7', border:'none', borderRadius:10, width:40, height:40, cursor:'pointer', fontSize:18 }}>
              🔍
            </button>
            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              style={{ position:'relative', background:'#F5F5F7', border:'none', borderRadius:10, width:40, height:40, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
              🛒
              {cartQty > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:P, color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartQty}</span>}
            </button>
            {/* WhatsApp */}
            {storeWA && (
              <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                className="desktop-only btn-primary" style={{ padding:'8px 16px', fontSize:13, borderRadius:10 }}>
                💬 WhatsApp
              </a>
            )}
            {/* Admin */}
            <a href="/acceso" style={{ fontSize:11, color:'#AEAEB2', textDecoration:'none', padding:'4px 8px', borderRadius:6, border:'1px solid #E5E5EA' }}>🔐</a>
          </div>
        </div>
        {/* Mobile search bar */}
        {mobileSearch && (
          <div style={{ padding:'8px 16px 12px', borderTop:'1px solid #F2F2F7' }}>
            <input type="search" placeholder="Buscar productos…" value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
          </div>
        )}
        {/* Categories nav */}
        <div style={{ borderTop:'1px solid #F2F2F7', overflowX:'auto', scrollbarWidth:'none' }}>
          <div style={{ display:'flex', gap:0, padding:'0 24px', maxWidth:1280, margin:'0 auto' }}>
            {DEMO_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                style={{
                  background:'none', border:'none', cursor:'pointer', padding:'10px 16px',
                  fontSize:13, fontWeight:600, whiteSpace:'nowrap', transition:'all .2s',
                  color: catFilter===cat.id ? P : '#6E6E73',
                  borderBottom: catFilter===cat.id ? `2px solid ${P}` : '2px solid transparent',
                }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════════ */}
      <section style={{
        background: heroImg
          ? `linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%), url(${heroImg}) center/cover no-repeat`
          : `linear-gradient(135deg, ${hexAlpha(P,0.9)} 0%, ${hexAlpha(P,0.7)} 50%, #1D1D1F 100%)`,
        color:'#fff', padding:'80px 24px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 30% 50%, ${hexAlpha(P,0.4)} 0%, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ maxWidth:800, margin:'0 auto', position:'relative', animation:'fadeIn 0.5s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', borderRadius:100, padding:'6px 16px', fontSize:13, fontWeight:600, marginBottom:24, border:'1px solid rgba(255,255,255,0.25)' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#30D158', display:'inline-block', animation:'pulse 1.5s infinite' }}/>
            Envíos a todo el Perú
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, lineHeight:1.1, letterSpacing:'-1px', marginBottom:16 }}>
            {heroTitle}
          </h1>
          <p style={{ fontSize:'clamp(15px,2vw,20px)', opacity:0.85, marginBottom:36, maxWidth:520, margin:'0 auto 36px' }}>
            {heroSub}
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-primary" onClick={() => document.getElementById('productos')?.scrollIntoView({behavior:'smooth'})}
              style={{ background:'#fff', color:'#1D1D1F', fontSize:16, padding:'14px 32px' }}>
              {heroCTA} →
            </button>
            {storeWA && (
              <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', border:'2px solid rgba(255,255,255,0.4)', color:'#fff', borderRadius:14, padding:'14px 28px', fontSize:16, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>
                💬 Consultar
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TRUST BAR
      ════════════════════════════════════════════ */}
      <section style={{ background:'#fff', borderBottom:'1px solid #E5E5EA' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16 }}>
          {[
            { icon:'🚚', title:'Envío rápido', sub:'24–72 horas Lima · 7 días Provincias' },
            { icon:'✅', title:'Garantía oficial', sub:'1 año con el fabricante' },
            { icon:'🔄', title:'Devoluciones', sub:'7 días sin preguntas' },
            { icon:'🔒', title:'Compra segura', sub:'Pago 100% protegido' },
            { icon:'💳', title:'Múltiples pagos', sub:'Yape, Plin, tarjeta, efectivo' },
          ].map(t => (
            <div key={t.title} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0' }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{t.icon}</span>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'#1D1D1F' }}>{t.title}</p>
                <p style={{ fontSize:12, color:'#6E6E73' }}>{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRODUCTOS — GRID
      ════════════════════════════════════════════ */}
      <section id="productos" style={{ maxWidth:1280, margin:'0 auto', padding:'48px 24px' }}>

        {/* Header sección */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <h2 className="section-title">
              {catFilter === 'all' ? 'Todos los productos' : DEMO_CATEGORIES.find(c=>c.id===catFilter)?.label || catFilter}
            </h2>
            <p className="section-sub">{filtered.length} {filtered.length===1 ? 'producto encontrado' : 'productos encontrados'}</p>
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{ padding:'10px 14px', background:'#fff', border:'1.5px solid #E5E5EA', borderRadius:12, fontSize:14, fontWeight:600, color:'#1D1D1F', cursor:'pointer', width:'auto' }}>
            <option value="default">Ordenar: Destacados</option>
            <option value="price_asc">Precio: Menor a mayor</option>
            <option value="price_desc">Precio: Mayor a menor</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} style={{ background:'#fff', borderRadius:20, overflow:'hidden', height:360, animation:'pulse 1.5s infinite' }}>
                <div style={{ height:220, background:'#F2F2F7' }} />
                <div style={{ padding:16 }}>
                  <div style={{ height:16, background:'#F2F2F7', borderRadius:6, marginBottom:8 }} />
                  <div style={{ height:12, background:'#F2F2F7', borderRadius:6, width:'60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
            <h3 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Sin resultados</h3>
            <p style={{ color:'#6E6E73' }}>Intenta con otro término o categoría</p>
            <button onClick={() => { setSearch(''); setCatFilter('all'); }} className="btn-primary" style={{ marginTop:20 }}>
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
            {filtered.map((p, i) => (
              <div key={p.id} className="card hover-lift" onClick={() => openProduct(p)}
                style={{ cursor:'pointer', overflow:'hidden', animation:`fadeIn ${0.1+i*0.04}s ease` }}>
                {/* Imagen */}
                <div style={{ position:'relative', height:220, overflow:'hidden', background:'#F5F5F7' }}>
                  <img src={p.photo || 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400'} alt={p.name}
                    style={{ width:'100%', height:'100%', objectFit:'contain', padding:16, transition:'transform .4s' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                    onError={e=>{ e.target.style.objectFit='cover'; e.target.src='https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400'; }} />
                  {/* Badge */}
                  <div style={{ position:'absolute', top:12, left:12, display:'flex', flexDirection:'column', gap:4 }}>
                    <span style={{ background:P, color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>
                      {p.category || 'Tech'}
                    </span>
                    {p.is_demo && <span style={{ background:'#FF9F0A', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6 }}>Ejemplo</span>}
                  </div>
                  {/* Colors preview */}
                  {p.colors?.length > 0 && (
                    <div style={{ position:'absolute', bottom:10, right:10, display:'flex', gap:4 }}>
                      {p.colors.slice(0,4).map(c => (
                        <div key={c} title={c} style={{ width:10, height:10, borderRadius:'50%', background:getColorHex(c), border:'1.5px solid rgba(0,0,0,0.12)' }} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding:'16px 18px 20px' }}>
                  <p style={{ fontSize:12, color:'#6E6E73', fontWeight:600, marginBottom:4 }}>{p.brand || 'Apple'}</p>
                  <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8, lineHeight:1.3 }}>{p.name}</h3>
                  {p.capacities?.length > 0 && (
                    <p style={{ fontSize:12, color:'#AEAEB2', marginBottom:10 }}>
                      {p.capacities.slice(0,3).join(' · ')}{p.capacities.length>3?` +${p.capacities.length-3} más`:''}
                    </p>
                  )}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontSize:12, color:'#AEAEB2' }}>Desde</p>
                      <p style={{ fontSize:20, fontWeight:800, color:P }}>{fmt(p.min_price)}</p>
                    </div>
                    <button className="btn-primary" onClick={e=>{ e.stopPropagation(); openProduct(p); }}
                      style={{ padding:'9px 16px', fontSize:13, borderRadius:12 }}>
                      Ver →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════
          POR QUÉ ELEGIRNOS
      ════════════════════════════════════════════ */}
      <section style={{ background:'#fff', padding:'80px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ color:P, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>¿Por qué elegirnos?</p>
            <h2 className="section-title">Tu satisfacción es nuestra prioridad</h2>
            <p className="section-sub">Más de miles de clientes satisfechos nos respaldan</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:28 }}>
            {[
              { icon:'📦', title:'Productos verificados', desc:'Cada equipo pasa por revisión exhaustiva de calidad antes de llegar a tus manos.' },
              { icon:'🛡️', title:'Garantía real', desc:'Todos los equipos nuevos con garantía oficial y usados con garantía de tienda.' },
              { icon:'⚡', title:'Respuesta rápida', desc:'Atención por WhatsApp en menos de 5 minutos en horario de atención.' },
              { icon:'💰', title:'Mejor precio', desc:'Precios competitivos y la posibilidad de pagar en cuotas sin intereses.' },
              { icon:'🔧', title:'Soporte técnico', desc:'Equipo especializado para asesorarte antes y después de tu compra.' },
              { icon:'🏪', title:'Tienda física', desc:'Visítanos en nuestro local o coordina el recojo de tu pedido.' },
            ].map(f => (
              <div key={f.title} style={{ padding:'28px 24px', background:'#F5F5F7', borderRadius:20, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10 }}>{f.title}</h3>
                <p style={{ fontSize:14, color:'#6E6E73', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SOBRE NOSOTROS
      ════════════════════════════════════════════ */}
      <section style={{ background:'#F5F5F7', padding:'80px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
          <div style={{ animation:'fadeIn 0.5s ease' }}>
            <p style={{ color:P, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Quiénes somos</p>
            <h2 className="section-title" style={{ marginBottom:20 }}>Expertos en tecnología premium</h2>
            <p style={{ fontSize:16, color:'#6E6E73', lineHeight:1.8, marginBottom:28 }}>{aboutText}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32 }}>
              {[
                { n:'5+', l:'Años de experiencia' },
                { n:'2K+', l:'Clientes satisfechos' },
                { n:'98%', l:'Valoración positiva' },
                { n:'24h', l:'Tiempo de respuesta' },
              ].map(s => (
                <div key={s.l} style={{ background:'#fff', borderRadius:16, padding:'20px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize:28, fontWeight:900, color:P }}>{s.n}</p>
                  <p style={{ fontSize:13, color:'#6E6E73' }}>{s.l}</p>
                </div>
              ))}
            </div>
            {storeWA && (
              <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="btn-primary" style={{ display:'inline-flex' }}>
                💬 Chatea con nosotros
              </a>
            )}
          </div>
          <div style={{ borderRadius:28, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', aspectRatio:'4/3', background: hexAlpha(P,0.08) }}>
            {aboutImg
              ? <img src={aboutImg} alt="Nuestra tienda" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>
                  <div style={{ fontSize:80 }}>{def.emoji}</div>
                  <p style={{ fontSize:20, fontWeight:700, color:P, textAlign:'center' }}>{storeName}</p>
                  <p style={{ fontSize:14, color:'#6E6E73', textAlign:'center' }}>Tu tienda de confianza</p>
                </div>
            }
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TESTIMONIOS
      ════════════════════════════════════════════ */}
      <section style={{ background:'#fff', padding:'80px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ color:P, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>Testimonios</p>
            <h2 className="section-title">Lo que dicen nuestros clientes</h2>
            <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:12 }}>
              {'★★★★★'.split('').map((s,i) => <span key={i} style={{ color:'#FF9F0A', fontSize:22 }}>{s}</span>)}
              <span style={{ fontSize:14, color:'#6E6E73', marginLeft:8, alignSelf:'center' }}>5.0 · +200 reseñas</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:24 }}>
            {testimonials.map((t,i) => (
              <div key={i} className="card" style={{ padding:'28px 24px', animation:`fadeIn ${0.1+i*0.08}s ease` }}>
                <div style={{ display:'flex', gap:2, marginBottom:12 }}>
                  {'★★★★★'.split('').map((s,j) => <span key={j} style={{ color: j<t.stars ? '#FF9F0A' : '#E5E5EA', fontSize:18 }}>{s}</span>)}
                </div>
                <p style={{ fontSize:15, color:'#3C3C43', lineHeight:1.7, marginBottom:20, fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:P, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0 }}>
                    {t.avatar || t.name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14 }}>{t.name}</p>
                    <p style={{ fontSize:12, color:'#6E6E73' }}>Cliente verificado ✓</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          MÉTODOS DE PAGO
      ════════════════════════════════════════════ */}
      <section style={{ background:'#F5F5F7', padding:'56px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', textAlign:'center' }}>
          <p style={{ color:P, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>Métodos de pago</p>
          <h2 className="section-title" style={{ marginBottom:8 }}>Paga como prefieras</h2>
          <p className="section-sub" style={{ marginBottom:40 }}>Múltiples opciones seguras para tu comodidad</p>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:16 }}>
            {[
              { label:'IziPay', icon:'💳', color:'#E31837', bg:'#FFF0F2' },
              { label:'Niubiz', icon:'💳', color:'#1B3A6B', bg:'#F0F4FF' },
              { label:'Visa',   icon:'💳', color:'#1A1F71', bg:'#F0F2FF' },
              { label:'Mastercard', icon:'💳', color:'#EB001B', bg:'#FFF0F0' },
              { label:'Yape',  icon:'📱', color:'#6D1FBF', bg:'#F5F0FF' },
              { label:'Plin',  icon:'📱', color:'#00A651', bg:'#F0FFF6' },
              { label:'Amex',  icon:'💳', color:'#016FD0', bg:'#F0F8FF' },
              { label:'Efectivo', icon:'💵', color:'#1C7C4E', bg:'#F0FFF8' },
            ].map(pm => (
              <div key={pm.label} style={{
                background: pm.bg, border:`1.5px solid ${pm.color}22`,
                borderRadius:14, padding:'12px 20px', display:'flex', alignItems:'center', gap:8,
                minWidth:120,
              }}>
                <span style={{ fontSize:22 }}>{pm.icon}</span>
                <span style={{ fontWeight:700, fontSize:14, color: pm.color }}>{pm.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════ */}
      <section style={{ background:'#fff', padding:'80px 24px' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ color:P, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>FAQ</p>
            <h2 className="section-title">Preguntas frecuentes</h2>
            <p className="section-sub">Todo lo que necesitas saber antes de comprar</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {faqItems.map((f,i) => (
              <div key={i} className="card" style={{ overflow:'hidden', transition:'all .2s' }}>
                <button onClick={() => setFaqOpen(faqOpen===i ? null : i)}
                  style={{ width:'100%', padding:'20px 24px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, textAlign:'left' }}>
                  <span style={{ fontSize:16, fontWeight:700, color:'#1D1D1F', flex:1 }}>{f.q}</span>
                  <span style={{ fontSize:20, color:P, flexShrink:0, transition:'transform .2s', display:'inline-block', transform: faqOpen===i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {faqOpen===i && (
                  <div style={{ padding:'0 24px 24px', animation:'slideDown 0.2s ease' }}>
                    <p style={{ fontSize:15, color:'#6E6E73', lineHeight:1.8 }}>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CONTACTO
      ════════════════════════════════════════════ */}
      <section style={{ background:'#F5F5F7', padding:'80px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>
          <div>
            <p style={{ color:P, fontSize:14, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Contáctanos</p>
            <h2 className="section-title" style={{ marginBottom:12 }}>¿Tienes alguna duda?</h2>
            <p style={{ fontSize:16, color:'#6E6E73', marginBottom:32 }}>Nuestro equipo está listo para ayudarte. Escríbenos y te respondemos en minutos.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {storeWA && <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                style={{ display:'flex', alignItems:'center', gap:14, textDecoration:'none', padding:'16px 20px', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize:28 }}>💬</span>
                <div><p style={{ fontWeight:700, color:'#1D1D1F' }}>WhatsApp</p><p style={{ color:'#6E6E73', fontSize:13 }}>{storeWA}</p></div>
              </a>}
              {storeDirec && <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize:28 }}>📍</span>
                <div><p style={{ fontWeight:700, color:'#1D1D1F' }}>Ubicación</p><p style={{ color:'#6E6E73', fontSize:13 }}>{storeDirec}</p></div>
              </div>}
              {settings?.horarios && <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize:28 }}>🕐</span>
                <div><p style={{ fontWeight:700, color:'#1D1D1F' }}>Horarios</p><p style={{ color:'#6E6E73', fontSize:13 }}>
                  {typeof settings.horarios === 'object' ? Object.entries(settings.horarios).map(([k,v])=>`${k}: ${v}`).join(' · ') : settings.horarios}
                </p></div>
              </div>}
            </div>
          </div>
          {/* Mapa placeholder */}
          <div style={{ borderRadius:24, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.10)', aspectRatio:'1', background:'#E5E5EA', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
            {settings?.google_place_id
              ? <iframe width="100%" height="100%" style={{ border:0 }} loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD-placeholder&q=${encodeURIComponent(storeDirec)}`} />
              : <>
                  <span style={{ fontSize:56 }}>🗺️</span>
                  <p style={{ fontWeight:700, color:'#6E6E73', textAlign:'center' }}>Mapa de ubicación</p>
                  <p style={{ fontSize:13, color:'#AEAEB2', textAlign:'center', padding:'0 20px' }}>{storeDirec}</p>
                  {storeWA && <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}`} className="btn-primary" target="_blank" rel="noopener" style={{ marginTop:8, fontSize:14, padding:'10px 20px' }}>
                    Cómo llegar →
                  </a>}
                </>
            }
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ background:'#1D1D1F', color:'#fff', padding:'56px 24px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:48 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                {storeLogo
                  ? <img src={storeLogo} alt={storeName} style={{ height:36, objectFit:'contain', filter:'brightness(0) invert(1)' }} onError={e=>e.target.style.display='none'} />
                  : <span style={{ fontSize:32 }}>{def.emoji}</span>
                }
                <span style={{ fontWeight:800, fontSize:20 }}>{storeName}</span>
              </div>
              <p style={{ fontSize:14, color:'#AEAEB2', lineHeight:1.7, marginBottom:24, maxWidth:280 }}>
                {storeSlogan}. Tu tienda de tecnología premium en Perú.
              </p>
              {/* Social */}
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { url:storeWA && `https://wa.me/${storeWA.replace(/\D/g,'')}`, icon:'💬', label:'WhatsApp' },
                  { url:storeIG && `https://instagram.com/${storeIG.replace('@','')}`, icon:'📸', label:'Instagram' },
                  { url:storeFB, icon:'👤', label:'Facebook' },
                  { url:storeTK, icon:'🎵', label:'TikTok' },
                  { url:storeYT, icon:'▶️', label:'YouTube' },
                ].filter(s=>s.url).map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener" title={s.label}
                    style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, textDecoration:'none', transition:'background .2s' }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
            {/* Tienda */}
            <div>
              <h4 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'#F5F5F7' }}>Tienda</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                {['iPhone','MacBook','iPad','AirPods','Apple Watch','Accesorios'].map(c => (
                  <li key={c}><button onClick={() => { setCatFilter(c); document.getElementById('productos')?.scrollIntoView({behavior:'smooth'}); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#AEAEB2', fontSize:14, textAlign:'left', transition:'color .2s' }}
                    onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#AEAEB2'}>
                    {c}
                  </button></li>
                ))}
              </ul>
            </div>
            {/* Info */}
            <div>
              <h4 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'#F5F5F7' }}>Información</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Nosotros', action:() => document.querySelector('[id="nosotros"]')?.scrollIntoView({behavior:'smooth'}) },
                  { label:'FAQ', action:() => document.querySelectorAll('section')[6]?.scrollIntoView({behavior:'smooth'}) },
                  { label:'Garantía', action:null },
                  { label:'Devoluciones', action:null },
                  { label:'Envíos', action:null },
                ].map(l => (
                  <li key={l.label}><button onClick={l.action||undefined}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#AEAEB2', fontSize:14 }}>
                    {l.label}
                  </button></li>
                ))}
              </ul>
            </div>
            {/* Contacto */}
            <div>
              <h4 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'#F5F5F7' }}>Contacto</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {storeWA && <p style={{ fontSize:14, color:'#AEAEB2' }}>📱 {storeWA}</p>}
                {storeDirec && <p style={{ fontSize:14, color:'#AEAEB2' }}>📍 {storeDirec}</p>}
                {settings?.horarios && <p style={{ fontSize:13, color:'#6E6E73' }}>🕐 Lun-Sáb 9am-7pm</p>}
              </div>
              {/* Pagos footer */}
              <div style={{ marginTop:20 }}>
                <p style={{ fontSize:12, color:'#6E6E73', marginBottom:8 }}>Métodos de pago:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {['IziPay','Niubiz','Visa','MC','Yape','Plin'].map(pm => (
                    <span key={pm} style={{ fontSize:11, fontWeight:700, padding:'3px 8px', background:'rgba(255,255,255,0.08)', borderRadius:6, color:'#AEAEB2' }}>{pm}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Bottom */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <p style={{ fontSize:13, color:'#6E6E73' }}>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
            <div style={{ display:'flex', gap:20 }}>
              <span style={{ fontSize:13, color:'#6E6E73', cursor:'pointer' }}>Política de privacidad</span>
              <span style={{ fontSize:13, color:'#6E6E73', cursor:'pointer' }}>Términos y condiciones</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════
          FLOTANTE WHATSAPP
      ════════════════════════════════════════════ */}
      {storeWA && (
        <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${storeName}! Quiero consultar sobre un producto`)}`}
          target="_blank" rel="noopener"
          style={{
            position:'fixed', bottom:24, right:24, zIndex:300,
            width:60, height:60, borderRadius:'50%',
            background:'#25D366', boxShadow:'0 6px 24px rgba(37,211,102,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, textDecoration:'none', animation:'pulse 2s infinite',
            transition:'transform .2s',
          }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
          💬
        </a>
      )}

      {/* ════════════════════════════════════════════
          MODAL PRODUCTO
      ════════════════════════════════════════════ */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={closeProduct}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} />
          <div onClick={e=>e.stopPropagation()}
            style={{
              position:'relative', background:'#fff', borderRadius:'28px 28px 0 0',
              width:'100%', maxWidth:900, maxHeight:'92vh', overflowY:'auto',
              boxShadow:'0 -20px 60px rgba(0,0,0,0.2)', animation:'slideIn 0.3s ease',
            }}>
            {/* Handle bar */}
            <div style={{ width:40, height:4, background:'#E5E5EA', borderRadius:4, margin:'12px auto 0' }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {/* Foto */}
              <div style={{ background:'#F5F5F7', borderRadius:'0 0 0 28px', display:'flex', alignItems:'center', justifyContent:'center', padding:32, minHeight:360 }}>
                <img src={getProductImg(selected, selColor)} alt={selected.name}
                  style={{ maxWidth:'100%', maxHeight:320, objectFit:'contain' }}
                  onError={e=>e.target.src='https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400'} />
              </div>
              {/* Detalles */}
              <div style={{ padding:'28px 32px 32px' }}>
                <button onClick={closeProduct}
                  style={{ position:'absolute', top:16, right:20, background:'#F5F5F7', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ×
                </button>
                <p style={{ fontSize:13, color:'#6E6E73', fontWeight:600, marginBottom:6 }}>{selected.brand || 'Apple'}</p>
                <h2 style={{ fontSize:24, fontWeight:800, marginBottom:6, lineHeight:1.2 }}>{selected.name}</h2>
                <p style={{ fontSize:28, fontWeight:900, color:P, marginBottom:20 }}>{fmt(selected.min_price)}</p>

                {/* Condición */}
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#1D1D1F', marginBottom:10 }}>Condición</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['Nuevo ✨','Como Nuevo 💚','Usado 🔄','Reacondicionado 🔧'].map(c => (
                      <button key={c} onClick={() => setSelCond(c)}
                        style={{
                          padding:'7px 14px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s',
                          background: selCond===c ? P : '#F5F5F7',
                          color: selCond===c ? '#fff' : '#6E6E73',
                          border: selCond===c ? 'none' : '1.5px solid #E5E5EA',
                        }}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                {selected.colors?.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#1D1D1F', marginBottom:10 }}>Color: <span style={{ fontWeight:400, color:'#6E6E73' }}>{selColor}</span></p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {selected.colors.map(c => (
                        <button key={c} onClick={() => setSelColor(c)} title={c}
                          style={{
                            padding:'7px 14px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s',
                            background: selColor===c ? hexAlpha(P,0.12) : '#F5F5F7',
                            color: selColor===c ? P : '#6E6E73',
                            border: selColor===c ? `2px solid ${P}` : '1.5px solid #E5E5EA',
                          }}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacidad */}
                {selected.capacities?.length > 0 && (
                  <div style={{ marginBottom:24 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#1D1D1F', marginBottom:10 }}>Almacenamiento / Modelo</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {selected.capacities.map(c => (
                        <button key={c} onClick={() => setSelCap(c)}
                          style={{
                            padding:'8px 16px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .15s',
                            background: selCap===c ? P : '#F5F5F7',
                            color: selCap===c ? '#fff' : '#6E6E73',
                            border: selCap===c ? 'none' : '1.5px solid #E5E5EA',
                          }}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descripción */}
                {selected.description && (
                  <p style={{ fontSize:14, color:'#6E6E73', lineHeight:1.7, marginBottom:20 }}>{selected.description}</p>
                )}

                {/* CTAs */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <button className="btn-primary" onClick={() => addToCart(selected, selColor, selCap, selCond)}
                    style={{ width:'100%', justifyContent:'center', fontSize:16, padding:'16px' }}>
                    🛒 Agregar al carrito
                  </button>
                  {storeWA && (
                    <a href={`https://wa.me/${storeWA.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola! Me interesa: ${selected.name} · ${selColor} · ${selCap} · ${selCond} — Precio: ${fmt(selected.min_price)}`)}`}
                      target="_blank" rel="noopener" className="btn-outline" style={{ width:'100%', justifyContent:'center' }}>
                      💬 Consultar por WhatsApp
                    </a>
                  )}
                </div>
                {/* Trust mini */}
                <div style={{ display:'flex', gap:16, marginTop:20 }}>
                  {['🚚 Envío gratis','✅ Garantía','🔄 Devol. 7 días'].map(t => (
                    <span key={t} style={{ fontSize:12, color:'#6E6E73' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          CARRITO DRAWER
      ════════════════════════════════════════════ */}
      {cartOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(2px)' }} onClick={() => setCartOpen(false)} />
          <div style={{
            position:'relative', background:'#fff', width:'100%', maxWidth:440,
            height:'100%', display:'flex', flexDirection:'column',
            boxShadow:'-20px 0 60px rgba(0,0,0,0.15)', animation:'slideIn 0.3s ease',
          }}>
            {/* Header */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #E5E5EA', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h3 style={{ fontSize:20, fontWeight:800 }}>Mi carrito ({cartQty})</h3>
              <button onClick={() => setCartOpen(false)}
                style={{ background:'#F5F5F7', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:20 }}>×</button>
            </div>
            {/* Items */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:16 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0' }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>🛒</div>
                  <p style={{ color:'#6E6E73', fontSize:16 }}>Tu carrito está vacío</p>
                  <button onClick={() => setCartOpen(false)} className="btn-primary" style={{ marginTop:20 }}>
                    Ver productos
                  </button>
                </div>
              ) : cart.map(item => (
                <div key={item.key} style={{ display:'flex', gap:14, padding:'16px', background:'#F5F5F7', borderRadius:16 }}>
                  <img src={item.photo} alt={item.name} style={{ width:70, height:70, objectFit:'contain', borderRadius:12, background:'#fff', padding:4 }} onError={e=>e.target.style.display='none'} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{item.name}</p>
                    <p style={{ fontSize:13, color:'#6E6E73', marginBottom:8 }}>{item.label}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <button onClick={() => changeQty(item.key,-1)} style={{ width:28, height:28, borderRadius:'50%', background:'#fff', border:'1.5px solid #E5E5EA', cursor:'pointer', fontSize:18, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                        <span style={{ fontWeight:700, fontSize:15 }}>{item.qty}</span>
                        <button onClick={() => changeQty(item.key,1)} style={{ width:28, height:28, borderRadius:'50%', background:P, border:'none', cursor:'pointer', fontSize:18, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontWeight:800, color:P }}>{fmt(item.price*item.qty)}</p>
                        <button onClick={() => removeFromCart(item.key)} style={{ fontSize:12, color:'#FF3B30', background:'none', border:'none', cursor:'pointer' }}>Quitar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer carrito */}
            {cart.length > 0 && (
              <div style={{ padding:'20px 24px', borderTop:'1px solid #E5E5EA', background:'#fff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                  <span style={{ fontSize:16, fontWeight:600 }}>Subtotal</span>
                  <span style={{ fontSize:22, fontWeight:900, color:P }}>{fmt(cartTotal)}</span>
                </div>
                <button className="btn-primary" onClick={() => { setCartOpen(false); setCheckout(true); setOrderSent(false); }}
                  style={{ width:'100%', justifyContent:'center', fontSize:17, padding:'16px' }}>
                  Finalizar pedido →
                </button>
                <button onClick={() => setCartOpen(false)}
                  style={{ width:'100%', marginTop:10, background:'none', border:'none', cursor:'pointer', color:'#6E6E73', fontSize:14, padding:'8px' }}>
                  Seguir comprando
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          CHECKOUT MODAL
      ════════════════════════════════════════════ */}
      {checkout && (
        <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={() => !orderSent && setCheckout(false)} />
          <div style={{
            position:'relative', background:'#fff', borderRadius:28, width:'100%', maxWidth:560,
            maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)',
            animation:'fadeIn 0.3s ease',
          }}>
            <div style={{ padding:'28px 28px 0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <h3 style={{ fontSize:22, fontWeight:800 }}>Finalizar pedido</h3>
                <button onClick={() => setCheckout(false)}
                  style={{ background:'#F5F5F7', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:20 }}>×</button>
              </div>

              {!orderSent ? <>
                {/* Resumen */}
                <div style={{ background:'#F5F5F7', borderRadius:16, padding:'16px', marginBottom:24 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#6E6E73', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>Resumen del pedido</p>
                  {cart.map(i => (
                    <div key={i.key} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:14, color:'#1D1D1F' }}>{i.name} × {i.qty}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{fmt(i.price*i.qty)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid #E5E5EA', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:700 }}>Total</span>
                    <span style={{ fontWeight:900, fontSize:18, color:P }}>{fmt(cartTotal)}</span>
                  </div>
                </div>

                {/* Datos del comprador */}
                <p style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Tus datos</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'#6E6E73', display:'block', marginBottom:6 }}>Nombre *</label>
                    <input type="text" placeholder="Juan Pérez" value={orderForm.name} onChange={e=>setOrderForm(f=>({...f,name:e.target.value}))} required />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'#6E6E73', display:'block', marginBottom:6 }}>Teléfono *</label>
                    <input type="tel" placeholder="+51 999 999 999" value={orderForm.phone} onChange={e=>setOrderForm(f=>({...f,phone:e.target.value}))} required />
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#6E6E73', display:'block', marginBottom:6 }}>Email</label>
                  <input type="email" placeholder="tu@email.com" value={orderForm.email} onChange={e=>setOrderForm(f=>({...f,email:e.target.value}))} />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#6E6E73', display:'block', marginBottom:6 }}>Dirección de entrega</label>
                  <input type="text" placeholder="Av. Arequipa 1234, Miraflores, Lima" value={orderForm.address} onChange={e=>setOrderForm(f=>({...f,address:e.target.value}))} />
                </div>
                <div style={{ marginBottom:24 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#6E6E73', display:'block', marginBottom:6 }}>Notas (opcional)</label>
                  <textarea placeholder="Instrucciones especiales, referencia de la dirección..." value={orderForm.notes} onChange={e=>setOrderForm(f=>({...f,notes:e.target.value}))}
                    style={{ resize:'vertical', minHeight:72 }} />
                </div>

                {/* Método de pago */}
                <p style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Método de pago</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                  {[
                    { id:'whatsapp', icon:'💬', label:'WhatsApp', sub:'Coordina el pago directamente', always:true },
                    { id:'izipay',   icon:'💳', label:'IziPay',   sub:'Tarjeta crédito/débito seguro', url:izipayUrl },
                    { id:'niubiz',   icon:'💳', label:'Niubiz',   sub:'Visa, Mastercard, Amex', url:niubizUrl },
                    { id:'yape',     icon:'📱', label:'Yape / Plin', sub:'Transferencia inmediata', always:true },
                    { id:'transfer', icon:'🏦', label:'Transferencia', sub: bankData ? `${bankData.bank} · ${bankData.cci}` : 'Transferencia bancaria', always:true },
                  ].map(pm => (
                    <button key={pm.id} onClick={() => setPayMethod(pm.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:14, cursor:'pointer', transition:'all .15s', textAlign:'left',
                        background: payMethod===pm.id ? hexAlpha(P,0.08) : '#F5F5F7',
                        border: payMethod===pm.id ? `2px solid ${P}` : '2px solid transparent',
                      }}>
                      <span style={{ fontSize:24 }}>{pm.icon}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:700, fontSize:15, color:'#1D1D1F' }}>{pm.label}</p>
                        <p style={{ fontSize:13, color:'#6E6E73' }}>{pm.sub}</p>
                      </div>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${payMethod===pm.id ? P : '#E5E5EA'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {payMethod===pm.id && <div style={{ width:10, height:10, borderRadius:'50%', background:P }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </> : (
                <div style={{ textAlign:'center', padding:'32px 0 40px' }}>
                  <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
                  <h3 style={{ fontSize:22, fontWeight:800, marginBottom:12 }}>¡Pedido enviado!</h3>
                  <p style={{ color:'#6E6E73', fontSize:15, marginBottom:28 }}>
                    Te contactaremos a la brevedad para confirmar tu pedido y coordinar la entrega.
                  </p>
                  <button className="btn-primary" onClick={() => { setCheckout(false); setCart([]); setOrderForm({name:'',phone:'',email:'',address:'',notes:''}); }}
                    style={{ justifyContent:'center', fontSize:16 }}>
                    Volver a la tienda
                  </button>
                </div>
              )}
            </div>

            {/* Botón confirmar */}
            {!orderSent && (
              <div style={{ padding:'0 28px 28px' }}>
                <button className="btn-primary"
                  disabled={!orderForm.name || !orderForm.phone}
                  onClick={() => {
                    if (!orderForm.name || !orderForm.phone) return;
                    if (payMethod === 'whatsapp' || payMethod === 'yape' || payMethod === 'transfer') handleWhatsApp();
                    else if (payMethod === 'izipay') { handleWhatsApp(); handleIziPay(); }
                    else if (payMethod === 'niubiz') { handleWhatsApp(); handleNiubiz(); }
                  }}
                  style={{
                    width:'100%', justifyContent:'center', fontSize:17, padding:'17px',
                    opacity: (!orderForm.name || !orderForm.phone) ? 0.5 : 1,
                  }}>
                  {payMethod === 'whatsapp' ? '💬 Confirmar por WhatsApp' :
                   payMethod === 'izipay'   ? '💳 Pagar con IziPay' :
                   payMethod === 'niubiz'   ? '💳 Pagar con Niubiz' :
                   payMethod === 'yape'     ? '📱 Confirmar y pagar con Yape' :
                   '🏦 Confirmar pedido'}
                </button>
                <p style={{ textAlign:'center', fontSize:12, color:'#AEAEB2', marginTop:12 }}>
                  🔒 Tu información está protegida y encriptada
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Helper: color aproximado por nombre ── */
function getColorHex(colorName) {
  const map = {
    negro:'#1C1C1E', blanco:'#FFFFFF', rojo:'#FF3B30', azul:'#007AFF', verde:'#30D158',
    rosa:'#FF2D55', morado:'#BF5AF2', amarillo:'#FFD60A', gris:'#8E8E93', plata:'#C7C7CC',
    dorado:'#FFD700', titanio:'#8A8A8A', medianoche:'#1C2541', 'luz estelar':'#F5F0E8',
    naranja:'#FF9F0A', violeta:'#6E3AFF', champagne:'#F7E7CE',
  };
  const k = colorName.toLowerCase().split(' ')[0];
  return map[k] || '#C7C7CC';
}
