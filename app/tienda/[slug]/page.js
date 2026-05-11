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
  wetech:     { name: 'WeTech Peru',      slogan: 'Tu tienda tech de confianza',        primary: '#30D158', bg: '#000A00', text: '#FFFFFF', emoji: '🟢' },
};

export default function TiendaPage({ params }) {
  const slug = params.slug?.toLowerCase();
  const orgId = SLUG_MAP[slug];
  const def   = SLUG_DEFAULTS[slug] || SLUG_DEFAULTS.futurteck;

  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cart,     setCart]     = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(null); // product detail modal
  const [orderModal, setOrderModal] = useState(false);
  const [orderForm,  setOrderForm]  = useState({ name: '', phone: '', notes: '' });
  const [searchQ,    setSearchQ]    = useState('');
  const [orderSent,  setOrderSent]  = useState(false);

  // Colores dinámicos del settings o defaults
  const C = {
    primary:   settings?.color_primary   || def.primary,
    secondary: settings?.color_secondary || def.primary,
    bg:        settings?.color_bg        || def.bg,
    text:      settings?.color_text      || def.text,
    font:      settings?.font_family     || 'Urbanist',
    card:      hexAlpha(settings?.color_text || def.text, 0.06),
    border:    hexAlpha(settings?.color_text || def.text, 0.12),
    muted:     hexAlpha(settings?.color_text || def.text, 0.45),
  };

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    loadAll();
  }, [slug]);

  async function loadAll() {
    await Promise.all([loadSettings(), loadProducts()]);
    setLoading(false);
  }

  async function loadSettings() {
    const { data } = await supabase.from('org_settings').select('*').eq('org_id', orgId).single();
    if (data) setSettings(data);
  }

  async function loadProducts() {
    // Traer stock disponible agrupado por producto
    const { data } = await supabase
      .from('stock_items')
      .select('id, product_id, sale_price, emoji, products(id, name, description, emoji)')
      .eq('status', 'available')
      .in('owner_org_id', [orgId, CORP_ID]);

    if (!data) return;

    // Agrupar por producto
    const map = {};
    data.forEach(item => {
      const pid   = item.product_id;
      const pname = item.products?.name || 'Producto';
      const pemoji = item.products?.emoji || item.emoji || '📦';
      const pdesc = item.products?.description || '';
      if (!map[pid]) {
        map[pid] = { id: pid, name: pname, emoji: pemoji, description: pdesc, units: [], minPrice: Infinity, maxPrice: 0 };
      }
      map[pid].units.push({ id: item.id, price: item.sale_price || 0 });
      if ((item.sale_price || 0) < map[pid].minPrice) map[pid].minPrice = item.sale_price || 0;
      if ((item.sale_price || 0) > map[pid].maxPrice) map[pid].maxPrice = item.sale_price || 0;
    });

    setProducts(Object.values(map).filter(p => p.units.length > 0));
  }

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
    const phone = settings?.whatsapp_phone || '';
    const storeName = settings?.store_name || def.name;
    const lines = cart.map(i => `• ${i.emoji} ${i.name} x${i.qty} — S/${(i.price * i.qty).toFixed(2)}`).join('\n');
    const msg = `¡Hola ${storeName}! 👋\n\nSoy *${orderForm.name}*.\n\nMi pedido:\n${lines}\n\n*Total: S/${cartTotal.toFixed(2)}*\n\nTel: ${orderForm.phone}${orderForm.notes ? `\nNotas: ${orderForm.notes}` : ''}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    if (phone) window.open(url, '_blank');
    setOrderSent(true);
  }

  /* ── SEARCH ── */
  const filtered = searchQ
    ? products.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()))
    : products;

  if (!orgId) return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Urbanist, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>Tienda no encontrada</div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: def.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${def.primary}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const storeName = settings?.store_name || def.name;
  const storeSlogan = settings?.store_slogan || def.slogan;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: `${C.font}, sans-serif` }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)',
        background: hexAlpha(C.bg, 0.85), borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="logo" style={{ height: 36, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
            : <span style={{ fontSize: 28 }}>{def.emoji}</span>
          }
          <div style={{ fontWeight: 800, fontSize: 16 }}>{storeName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* WhatsApp */}
          {settings?.whatsapp_phone && (
            <a href={`https://wa.me/${settings.whatsapp_phone}`} target="_blank" rel="noopener noreferrer"
              style={{ color: '#25D366', fontSize: 22, textDecoration: 'none' }}>💬</a>
          )}
          {/* Cart button */}
          <button onClick={() => setCartOpen(true)}
            style={{ position: 'relative', background: C.primary, border: 'none', color: '#fff',
              borderRadius: 12, padding: '8px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6 }}>
            🛒
            {cartCount > 0 && (
              <span style={{ background: '#FF3B30', color: '#fff', borderRadius: '50%', width: 18, height: 18,
                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {settings?.banner_url ? (
          <div style={{ position: 'relative', height: 260 }}>
            <img src={settings.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${C.bg})` }} />
            <div style={{ position: 'absolute', bottom: 24, left: 24 }}>
              <div style={{ fontWeight: 900, fontSize: 28, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{storeName}</div>
              <div style={{ color: C.primary, fontWeight: 600, marginTop: 4, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{storeSlogan}</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '48px 24px 32px', textAlign: 'center',
            background: `radial-gradient(ellipse at top, ${hexAlpha(C.primary, 0.2)} 0%, transparent 70%)` }}>
            <div style={{ fontWeight: 900, fontSize: 36, marginBottom: 8 }}>{storeName}</div>
            <div style={{ color: C.primary, fontWeight: 600, fontSize: 16, marginBottom: 20 }}>{storeSlogan}</div>
            {settings?.store_description && (
              <div style={{ color: C.muted, fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                {settings.store_description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.muted }}>🔍</span>
          <input
            placeholder="Buscar productos..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 14, border: `1px solid ${C.border}`,
              background: C.card, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box',
              fontFamily: C.font }} />
        </div>
      </div>

      {/* ── PRODUCTS GRID ── */}
      <div style={{ padding: '20px 20px 120px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
            <div style={{ fontSize: 48 }}>📦</div>
            <div style={{ marginTop: 12, fontWeight: 600 }}>Sin productos disponibles</div>
          </div>
        ) : (
          <>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              {filtered.map(p => (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
                    overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s',
                    ':hover': { transform: 'scale(1.02)' } }}>
                  {/* Emoji / image */}
                  <div style={{ background: hexAlpha(C.primary, 0.1), padding: '28px 0', textAlign: 'center', fontSize: 56 }}>
                    {p.emoji}
                  </div>
                  <div style={{ padding: '12px 12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ color: C.primary, fontWeight: 800, fontSize: 16 }}>
                      {p.minPrice === p.maxPrice ? `S/${p.minPrice.toFixed(2)}` : `S/${p.minPrice.toFixed(0)} – ${p.maxPrice.toFixed(0)}`}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{p.units.length} disponible{p.units.length !== 1 ? 's' : ''}</div>
                    <button onClick={e => { e.stopPropagation(); addToCart(p); }}
                      style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 10, border: 'none',
                        background: C.primary, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{storeName}</div>
        {settings?.address && <div style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>📍 {settings.address}</div>}
        {settings?.phone    && <div style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>📞 {settings.phone}</div>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
          {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: C.primary, textDecoration: 'none', fontSize: 22 }}>📸</a>}
          {settings?.facebook_url  && <a href={settings.facebook_url}  target="_blank" rel="noopener noreferrer" style={{ color: C.primary, textDecoration: 'none', fontSize: 22 }}>👥</a>}
          {settings?.whatsapp_phone && <a href={`https://wa.me/${settings.whatsapp_phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontSize: 22 }}>💬</a>}
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 20 }}>© {new Date().getFullYear()} {storeName}</div>
      </div>

      {/* ══════ MODAL: PRODUCTO DETALLE ══════ */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.bg, width: '100%', maxHeight: '80vh', overflowY: 'auto', borderRadius: '24px 24px 0 0',
              padding: 24, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 99, margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center', fontSize: 80, marginBottom: 16 }}>{selected.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{selected.name}</div>
            {selected.description && <div style={{ color: C.muted, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{selected.description}</div>}
            <div style={{ color: C.primary, fontWeight: 900, fontSize: 28, marginBottom: 6 }}>
              {selected.minPrice === selected.maxPrice ? `S/${selected.minPrice.toFixed(2)}` : `S/${selected.minPrice.toFixed(0)} – ${selected.maxPrice.toFixed(0)}`}
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>{selected.units.length} unidad{selected.units.length !== 1 ? 'es' : ''} disponible{selected.units.length !== 1 ? 's' : ''}</div>
            <button onClick={() => addToCart(selected)}
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                background: C.primary, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
              🛒 Agregar al carrito
            </button>
            <button onClick={() => setSelected(null)}
              style={{ width: '100%', padding: '14px', borderRadius: 16, border: `1px solid ${C.border}`,
                background: 'transparent', color: C.text, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 10 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ══════ DRAWER: CARRITO ══════ */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.bg, width: '100%', maxHeight: '85vh', overflowY: 'auto', borderRadius: '24px 24px 0 0',
              padding: '20px 20px 32px', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 99, margin: '0 auto 20px' }} />
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>🛒 Tu carrito</div>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.muted, padding: '40px 0' }}>Carrito vacío</div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 32 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                      <div style={{ color: C.primary, fontWeight: 800 }}>S/{(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => changeQty(item.id, -1)}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.card, color: C.text, cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: C.primary, color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)}
                      style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18 }}>🗑</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontWeight: 800, fontSize: 18 }}>
                  <span>Total</span>
                  <span style={{ color: C.primary }}>S/{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => { setCartOpen(false); setOrderModal(true); setOrderSent(false); }}
                  style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                    background: C.primary, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                  Hacer pedido →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ MODAL: PEDIDO / CHECKOUT ══════ */}
      {orderModal && (
        <div onClick={() => setOrderModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.bg, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 99, margin: '0 auto 20px' }} />
            {orderSent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 64 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 24, marginTop: 16 }}>¡Pedido enviado!</div>
                <div style={{ color: C.muted, marginTop: 8 }}>Te contactaremos pronto por WhatsApp.</div>
                <button onClick={() => { setOrderModal(false); setCart([]); setOrderSent(false); }}
                  style={{ marginTop: 24, padding: '14px 32px', borderRadius: 14, border: 'none',
                    background: C.primary, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                  Continuar comprando
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>📦 Confirmar pedido</div>
                {/* Resumen */}
                <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 20 }}>
                  {cart.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span>{i.emoji} {i.name} ×{i.qty}</span>
                      <span style={{ color: C.primary, fontWeight: 700 }}>S/{(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: C.primary }}>S/{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <form onSubmit={sendOrder}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>Tu nombre *</label>
                    <input required value={orderForm.name} onChange={e => setOrderForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre completo"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.border}`,
                        background: C.card, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: C.font }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>Teléfono *</label>
                    <input required value={orderForm.phone} onChange={e => setOrderForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+51 999 999 999"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.border}`,
                        background: C.card, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: C.font }} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>Notas adicionales</label>
                    <textarea value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Dirección de entrega, color preferido, etc..."
                      rows={3}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.border}`,
                        background: C.card, color: C.text, fontSize: 15, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: C.font }} />
                  </div>
                  <button type="submit"
                    style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                      background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    💬 Enviar pedido por WhatsApp
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
      `}</style>
    </div>
  );
}

/* Hex con alpha */
function hexAlpha(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(128,128,128,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
