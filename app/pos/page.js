'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }
  return { theme, toggleTheme };
}

const DISC_THRESHOLD = 10; // % máximo sin aprobación del admin

export default function PosPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [me,           setMe]           = useState(null);
  const [orgId,        setOrgId]        = useState(null);
  const [sessionId,    setSessionId]    = useState(null);
  const [products,     setProducts]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('todos');
  const [compatSearch, setCompatSearch] = useState('');
  const [customers,    setCustomers]    = useState([]);
  const [custId,       setCustId]       = useState('');
  const [payMethod,    setPayMethod]    = useState('yape');
  const [discount,     setDiscount]     = useState(0);
  const [discNotes,    setDiscNotes]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [step,         setStep]         = useState('products'); // products | cart | customer | payment | receipt
  const [lastSale,     setLastSale]     = useState(null);
  const [toast,        setToast]        = useState(null);
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCust,      setNewCust]      = useState({ full_name: '', phone: '', email: '' });

  // IMEI picker
  const [imeiModal,    setImeiModal]    = useState(null); // product group being selected

  // Discount approval via Realtime
  const [discStatus,   setDiscStatus]   = useState('idle'); // idle | requesting | approved | denied
  const [discReqId,    setDiscReqId]    = useState(null);
  const realtimeRef = useRef(null);

  useEffect(() => { init(); }, []);

  // Cleanup realtime on unmount
  useEffect(() => () => { realtimeRef.current?.unsubscribe(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;

    const { data: prof } = await supabase
      .from('users').select('org_id, full_name').eq('id', uid).single();
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', uid).single();
    const r = roleRow?.role;

    if (r === 'corp' || r === 'admin_corp') { router.replace('/corp'); return; }
    if (r === 'superadmin')                 { router.replace('/superadmin'); return; }
    // store_admin, gerente, vendedor → todos pueden usar el POS

    const oid = prof?.org_id;
    setMe({ id: uid, name: prof?.full_name });
    setOrgId(oid);

    const { data: cs } = await supabase
      .from('cash_sessions')
      .select('id')
      .eq('org_id', oid)
      .eq('status', 'open')
      .limit(1)
      .single();

    if (!cs) {
      showToast('No hay una caja abierta. Contacta al gerente.', 'err');
      setTimeout(() => router.replace('/dashboard'), 3000);
      return;
    }
    setSessionId(cs.id);
    await loadProducts(oid);
    await loadCustomers(oid);
    setLoading(false);
  }

  async function loadProducts(oid) {
    const { data } = await supabase
      .from('stock_items')
      .select('id, product_id, serial_number, imei, sale_price, emoji, products(id, name, category, compatible_models)')
      .eq('owner_org_id', oid)
      .eq('status', 'available')
      .limit(200);

    const map = {};
    (data || []).forEach(item => {
      const pid   = item.product_id || item.products?.id || item.id;
      const pname = item.products?.name || 'Producto';
      const cat   = item.products?.category || 'accesorio';
      const compat = item.products?.compatible_models;
      if (!map[pid]) map[pid] = {
        product_id:        pid,
        name:              pname,
        emoji:             item.emoji || '📦',
        price:             item.sale_price || 0,
        category:          cat,
        compatible_models: Array.isArray(compat) ? compat : [],
        items:             [],
      };
      map[pid].items.push(item);
    });
    setProducts(Object.values(map));
  }

  async function loadCustomers(oid) {
    const { data } = await supabase
      .from('customers').select('id, full_name, phone').eq('org_id', oid).limit(200);
    setCustomers(data || []);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── AGREGAR AL CARRITO ── */
  function handleAddProduct(product) {
    if (product.items.length === 0) { showToast('Sin stock disponible', 'err'); return; }
    // Equipos con IMEI → mostrar picker
    const hasImei = product.category === 'equipo' || product.items.some(i => i.imei);
    if (hasImei) {
      setImeiModal(product);
      return;
    }
    // Accesorios: agregar directo
    addProductToCart(product, null);
  }

  function addProductToCart(product, selectedItem) {
    if (selectedItem) {
      // Con IMEI específico — siempre line item individual
      const alreadyInCart = cart.find(c => c.selectedItem?.id === selectedItem.id);
      if (alreadyInCart) { showToast('Este IMEI ya está en el carrito', 'err'); return; }
      setCart(prev => [...prev, { ...product, qty: 1, selectedItem }]);
    } else {
      // Sin IMEI (accesorios) — agrupar por product_id
      setCart(prev => {
        const existing = prev.find(c => c.product_id === product.product_id && !c.selectedItem);
        if (existing) {
          if (existing.qty >= product.items.length) { showToast('Sin más unidades', 'err'); return prev; }
          return prev.map(c => (c.product_id === product.product_id && !c.selectedItem)
            ? { ...c, qty: c.qty + 1 } : c);
        }
        return [...prev, { ...product, qty: 1, selectedItem: null }];
      });
    }
    setImeiModal(null);
  }

  function removeFromCart(idx) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  function changeQty(idx, delta) {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx || c.selectedItem) return c; // IMEI items son qty=1 fijo
      const nq = c.qty + delta;
      if (nq <= 0) return null;
      if (nq > c.items.length) { showToast('Sin más unidades', 'err'); return c; }
      return { ...c, qty: nq };
    }).filter(Boolean));
  }

  const subtotal    = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const total       = subtotal - discountAmt;
  const needsApproval = discount > DISC_THRESHOLD && discStatus !== 'approved';

  /* ── SOLICITAR APROBACIÓN DE DESCUENTO ── */
  async function requestDiscountApproval() {
    if (!discNotes.trim()) { showToast('Escribe el motivo del descuento', 'err'); return; }
    setDiscStatus('requesting');
    const { data, error } = await supabase
      .from('discount_requests')
      .insert({
        org_id:       orgId,
        cashier_id:   me.id,
        sale_amount:  subtotal,
        discount_pct: discount,
        notes:        discNotes,
        status:       'pending',
      })
      .select()
      .single();

    if (error) {
      showToast('Error al enviar solicitud: ' + error.message, 'err');
      setDiscStatus('idle');
      return;
    }
    setDiscReqId(data.id);
    showToast('📨 Solicitud enviada al administrador…');

    // Suscribir a cambios en tiempo real
    const ch = supabase.channel(`disc_req_${data.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'discount_requests', filter: `id=eq.${data.id}`,
      }, payload => {
        const st = payload.new?.status;
        if (st === 'approved') {
          setDiscStatus('approved');
          showToast('✅ Descuento aprobado por el administrador');
          ch.unsubscribe();
        } else if (st === 'denied') {
          setDiscStatus('denied');
          setDiscount(0);
          setDiscNotes('');
          showToast('❌ Descuento rechazado. Reajustado a 0%', 'err');
          ch.unsubscribe();
        }
      })
      .subscribe();
    realtimeRef.current = ch;
  }

  /* ── REGISTRAR VENTA (PENDIENTE DE PAGO) ── */
  async function processSale() {
    setSaving(true);
    try {
      const customer = custId ? customers.find(c => c.id === custId) : null;

      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          org_id:           orgId,
          cashier_id:       me.id,
          customer_id:      custId || null,
          cash_session_id:  sessionId,
          total_amount:     total,
          payment_method:   payMethod,
          discount_pct:     discount,
          discount_req_id:  discReqId || null,
          status:           'pendiente_pago', // ← stock se confirma cuando admin valida pago
        })
        .select()
        .single();

      if (saleErr) throw saleErr;

      // Insertar ítems y marcar stock como RESERVADO (no vendido aún)
      for (const c of cart) {
        const itemsToUse = c.selectedItem
          ? [c.selectedItem]
          : c.items.slice(0, c.qty);

        for (const item of itemsToUse) {
          await supabase.from('sale_items').insert({
            sale_id:       sale.id,
            stock_item_id: item.id,
            quantity:      1,
            unit_price:    c.price,
            imei:          item.imei || null,
          });
          // RESERVED: stock bloqueado pero no descontado hasta confirmar pago
          await supabase
            .from('stock_items')
            .update({ status: 'reserved' })
            .eq('id', item.id);
        }
      }

      setLastSale({
        ...sale,
        customer_name: customer?.full_name || 'Público general',
        items: cart,
        discount_pct: discount,
      });
      setCart([]);
      setCustId('');
      setDiscount(0);
      setDiscNotes('');
      setDiscStatus('idle');
      setDiscReqId(null);
      setStep('receipt');
    } catch (err) {
      showToast('Error al registrar: ' + err.message, 'err');
    }
    setSaving(false);
  }

  /* ── AGREGAR CLIENTE RÁPIDO ── */
  async function addCustomer(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('customers').insert({ ...newCust, org_id: orgId }).select().single();
    if (error) { showToast('Error al agregar cliente', 'err'); return; }
    setCustomers(prev => [...prev, data]);
    setCustId(data.id);
    setShowCustModal(false);
    setNewCust({ full_name: '', phone: '', email: '' });
    showToast('Cliente agregado ✓');
  }

  /* ── FILTRADO ── */
  const categories = ['todos', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== 'todos' && p.category !== catFilter) return false;
    if (compatSearch && p.category === 'accesorio') {
      if (!p.compatible_models?.some(m =>
        m.toLowerCase().includes(compatSearch.toLowerCase())
      )) return false;
    }
    return true;
  });

  const totalCartQty = cart.reduce((s, c) => s + c.qty, 0);

  /* ── LOADING ── */
  if (loading && !me) return (
    <div className="auth-screen">
      <div className="loading-wrap"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="page-wrap">

      {/* ── TOP BAR ── */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard"  className="top-btn">🏠</Link>
          <Link href="/store"      className="top-btn">🏪</Link>
          <Link href="/asistencia" className="top-btn">🗓️</Link>
          <div>
            <div className="top-bar-title">🛒 POS Smart</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          {totalCartQty > 0 && step === 'products' && (
            <button className="btn btn-sm btn-green" onClick={() => setStep('cart')}>
              🛒 {totalCartQty} — S/{total.toFixed(2)}
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast-wrap">
          <div className={`toast-msg ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="content-notab">

        {/* ══════ PRODUCTOS ══════ */}
        {step === 'products' && (
          <div style={{ padding: 16 }}>

            {/* Búsqueda */}
            <div className="search-bar">
              <span>🔍</span>
              <input placeholder="Buscar producto…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Pills de categoría */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0', scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  background: catFilter === cat ? 'var(--blue)' : 'var(--card)',
                  color: catFilter === cat ? '#fff' : 'var(--text2)',
                  transition: 'all .15s',
                }}>
                  {cat === 'todos' ? 'Todos' : cat === 'equipo' ? '📱 Equipos' : cat === 'accesorio' ? '🎧 Accesorios' : cat}
                </button>
              ))}
            </div>

            {/* Filtro compatibilidad (solo accesorios) */}
            {catFilter === 'accesorio' && (
              <div style={{ marginBottom: 12 }}>
                <input style={{
                  width: '100%', padding: '8px 12px', borderRadius: 12, boxSizing: 'border-box',
                  background: 'var(--card)', border: '1px solid var(--border)',
                  color: 'var(--text1)', fontSize: 13, fontFamily: 'inherit',
                }}
                  placeholder="🔗 Filtrar por modelo compatible (ej: iPhone 15)…"
                  value={compatSearch} onChange={e => setCompatSearch(e.target.value)} />
              </div>
            )}

            {/* Grid de productos */}
            {filtered.length === 0 ? (
              <div className="empty-msg">Sin productos disponibles</div>
            ) : (
              <div className="product-grid">
                {filtered.map(p => {
                  const inCart  = cart.find(c => c.product_id === p.product_id);
                  const hasImei = p.category === 'equipo' || p.items.some(i => i.imei);
                  return (
                    <div key={p.product_id}
                      className={`product-card${inCart ? ' in-cart' : ''}`}
                      onClick={() => handleAddProduct(p)}>
                      <span className="product-emoji">{p.emoji}</span>
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">S/{p.price.toFixed(2)}</div>
                      <div className={`product-stock${p.items.length < 3 ? ' low' : ''}`}>
                        {p.items.length} disp. {hasImei ? '· IMEI' : ''}
                      </div>
                      {inCart && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--blue)', fontWeight: 700 }}>
                          ✓ {inCart.qty} en carrito
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════ CARRITO ══════ */}
        {step === 'cart' && (
          <div style={{ padding: 16 }}>
            <div className="section-header">
              <button className="btn-ghost" onClick={() => setStep('products')}>← Volver</button>
              <div className="section-title" style={{ margin: 0 }}>🛒 Carrito</div>
            </div>

            {cart.length === 0 ? (
              <div className="empty-msg">El carrito está vacío</div>
            ) : (
              <div className="card">
                {cart.map((c, idx) => (
                  <div className="cart-item" key={idx}>
                    <span style={{ fontSize: 24 }}>{c.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      {c.selectedItem?.imei && (
                        <div style={{ color: 'var(--blue)', fontSize: 11, fontFamily: 'monospace' }}>
                          IMEI: {c.selectedItem.imei}
                        </div>
                      )}
                      <div style={{ color: 'var(--text3)', fontSize: 12 }}>S/{c.price.toFixed(2)} c/u</div>
                    </div>
                    {!c.selectedItem && (
                      <div className="cart-qty">
                        <button className="qty-btn" onClick={() => changeQty(idx, -1)}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{c.qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(idx, 1)}>+</button>
                      </div>
                    )}
                    <div style={{ minWidth: 70, textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green)' }}>S/{(c.price * c.qty).toFixed(2)}</div>
                      <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--red)' }}
                        onClick={() => removeFromCart(idx)}>✕</button>
                    </div>
                  </div>
                ))}
                <div className="cart-total">
                  <div className="cart-total-label">Total</div>
                  <div className="cart-total-val">S/{total.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Descuento */}
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text2)' }}>
                Descuento
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{
                  flex: 1, padding: '10px 12px', borderRadius: 12, boxSizing: 'border-box',
                  background: 'var(--bg2)', border: '1.5px solid var(--border)',
                  color: 'var(--text1)', fontSize: 15, fontFamily: 'inherit',
                }} type="number" min="0" max="100" value={discount}
                  onChange={e => { setDiscount(Number(e.target.value)); setDiscStatus('idle'); setDiscReqId(null); }}
                  placeholder="0" />
                <span style={{ color: 'var(--text2)', fontWeight: 800, fontSize: 18 }}>%</span>
                {discount > 0 && (
                  <span style={{ color: 'var(--red)', fontSize: 13, fontWeight: 700 }}>
                    −S/{discountAmt.toFixed(2)}
                  </span>
                )}
              </div>

              {discount > DISC_THRESHOLD && (
                <div style={{ marginTop: 10 }}>
                  <input style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10, boxSizing: 'border-box',
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--text1)', fontSize: 13, fontFamily: 'inherit',
                    marginBottom: 8,
                  }} placeholder="Motivo del descuento (obligatorio)…"
                    value={discNotes} onChange={e => setDiscNotes(e.target.value)} />

                  <div style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 12,
                    background: discStatus === 'approved' ? 'rgba(52,199,89,0.1)'
                      : discStatus === 'requesting'       ? 'rgba(255,149,0,0.1)'
                      : 'rgba(255,149,0,0.08)',
                    border: `1px solid ${discStatus === 'approved' ? 'var(--green)' : 'rgba(255,149,0,0.4)'}`,
                    color: discStatus === 'approved' ? 'var(--green)' : 'var(--text2)',
                  }}>
                    {discStatus === 'idle'       && `⚠️ Descuento > ${DISC_THRESHOLD}% requiere aprobación del administrador`}
                    {discStatus === 'requesting' && '⏳ Esperando aprobación del administrador…'}
                    {discStatus === 'approved'   && '✅ Descuento aprobado'}
                    {discStatus === 'denied'     && '❌ Descuento rechazado'}
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <button className="btn btn-primary" style={{ marginTop: 12 }}
                onClick={() => setStep('customer')}>
                Continuar — S/{total.toFixed(2)} →
              </button>
            )}
          </div>
        )}

        {/* ══════ CLIENTE ══════ */}
        {step === 'customer' && (
          <div style={{ padding: 16 }}>
            <div className="section-header">
              <button className="btn-ghost" onClick={() => setStep('cart')}>← Volver</button>
              <div className="section-title" style={{ margin: 0 }}>👤 Cliente</div>
            </div>
            <div className="card">
              <div className="form-group">
                <label className="form-label">Seleccionar cliente (opcional)</label>
                <select className="form-select" value={custId} onChange={e => setCustId(e.target.value)}>
                  <option value="">Sin cliente / Público general</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} {c.phone ? `· ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCustModal(true)}>
                + Nuevo cliente
              </button>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setStep('payment')}>
              Ir a pago →
            </button>
          </div>
        )}

        {/* ══════ PAGO ══════ */}
        {step === 'payment' && (
          <div style={{ padding: 16 }}>
            <div className="section-header">
              <button className="btn-ghost" onClick={() => setStep('customer')}>← Volver</button>
              <div className="section-title" style={{ margin: 0 }}>💳 Pago</div>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { key: 'efectivo',      icon: '💵' },
                    { key: 'yape',          icon: '📱' },
                    { key: 'tarjeta',       icon: '💳' },
                    { key: 'transferencia', icon: '⇄'  },
                    { key: 'deposito',      icon: '🏦' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setPayMethod(m.key)}
                      className={`btn btn-sm${payMethod === m.key ? ' btn-primary' : ' btn-outline'}`}>
                      {m.icon} {m.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider" />
              <div className="flex-between mb-8">
                <span className="text-muted">Subtotal</span>
                <span>S/{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex-between mb-8">
                  <span className="text-muted">Descuento ({discount}%)</span>
                  <span className="text-red">−S/{discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex-between">
                <span style={{ fontWeight: 800, fontSize: 18 }}>TOTAL</span>
                <span style={{ fontWeight: 900, fontSize: 24, color: 'var(--green)' }}>
                  S/{total.toFixed(2)}
                </span>
              </div>

              <div style={{
                marginTop: 16, padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.2)',
                fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
              }}>
                ℹ️ La venta se registra como <strong>pendiente de pago</strong>. El stock queda reservado y se confirma cuando el administrador valide el comprobante.
              </div>
            </div>

            {/* Botón solicitar aprobación si descuento alto */}
            {discount > DISC_THRESHOLD && discStatus === 'idle' && (
              <button onClick={requestDiscountApproval}
                style={{
                  marginTop: 12, width: '100%', padding: '13px', borderRadius: 14,
                  background: 'transparent', border: '1.5px solid orange',
                  color: 'orange', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                📨 Solicitar aprobación de descuento ({discount}%)
              </button>
            )}

            {discount > DISC_THRESHOLD && discStatus === 'requesting' && (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text2)', fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--blue)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                </div>
                ⏳ Esperando aprobación del administrador…
              </div>
            )}

            {/* Registrar venta — solo si no necesita aprobación o ya fue aprobado */}
            {!needsApproval && (
              <button className="btn btn-green btn-block" style={{ marginTop: 12 }}
                onClick={processSale} disabled={saving}>
                {saving
                  ? '⏳ Registrando…'
                  : `📋 Registrar venta — S/${total.toFixed(2)}`}
              </button>
            )}
          </div>
        )}

        {/* ══════ RECIBO (PENDIENTE) ══════ */}
        {step === 'receipt' && lastSale && (
          <div style={{ padding: 16 }}>
            <div className="receipt">
              <div className="receipt-ico">📋</div>
              <div className="receipt-title">Venta registrada</div>
              <div style={{
                margin: '8px auto 4px', padding: '5px 16px', borderRadius: 20,
                background: 'rgba(255,149,0,0.15)', color: '#FF9500',
                fontSize: 12, fontWeight: 700, display: 'inline-block',
              }}>
                ⏳ PENDIENTE DE PAGO
              </div>
              <div className="receipt-sub">
                {new Date(lastSale.created_at).toLocaleString('es-PE')}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                #{lastSale.id?.slice(0, 8).toUpperCase()}
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

              {lastSale.items.map((c, idx) => (
                <div className="receipt-row" key={idx}>
                  <span>
                    {c.emoji} {c.name}
                    {c.selectedItem?.imei ? ` (${c.selectedItem.imei})` : ` × ${c.qty}`}
                  </span>
                  <span>S/{(c.price * c.qty).toFixed(2)}</span>
                </div>
              ))}

              {lastSale.discount_pct > 0 && (
                <div className="receipt-row">
                  <span>Descuento ({lastSale.discount_pct}%)</span>
                  <span style={{ color: 'var(--red)' }}>
                    −S/{(lastSale.total_amount / (1 - lastSale.discount_pct / 100) * (lastSale.discount_pct / 100)).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="receipt-row" style={{ fontWeight: 700 }}>
                <span>Método</span><span>{lastSale.payment_method}</span>
              </div>
              <div className="receipt-row" style={{ fontWeight: 700 }}>
                <span>Cliente</span><span>{lastSale.customer_name}</span>
              </div>

              <div className="receipt-total">S/{(lastSale.total_amount || 0).toFixed(2)}</div>

              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                El administrador confirma el pago y libera el stock.<br />
                Muestra este recibo al cliente como comprobante provisional.
              </div>
            </div>

            <button className="btn btn-primary"
              onClick={() => { setStep('products'); setLastSale(null); loadProducts(orgId); }}>
              Nueva venta 🛒
            </button>
          </div>
        )}

      </div>

      {/* ══════ MODAL IMEI PICKER ══════ */}
      {imeiModal && (
        <div className="modal-backdrop" onClick={() => setImeiModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <div className="modal-title">{imeiModal.emoji} Seleccionar unidad</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
              {imeiModal.name} — Elige el IMEI a vender
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {imeiModal.items
                .filter(item => !cart.find(c => c.selectedItem?.id === item.id))
                .map(item => (
                  <button key={item.id}
                    onClick={() => addProductToCart(imeiModal, item)}
                    style={{
                      padding: '12px 16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                      background: 'var(--card)', border: '1.5px solid var(--border)',
                      color: 'var(--text1)', fontFamily: 'inherit',
                    }}>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
                      IMEI: {item.imei || item.serial_number || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      S/{Number(item.sale_price).toFixed(2)} · ID {item.id?.slice(0, 8)}
                    </div>
                  </button>
                ))}
              {imeiModal.items.filter(item => !cart.find(c => c.selectedItem?.id === item.id)).length === 0 && (
                <div className="empty-msg">Todos los IMEI ya están en el carrito</div>
              )}
            </div>
            <button className="btn btn-outline btn-block" style={{ marginTop: 16 }}
              onClick={() => setImeiModal(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ══════ MODAL NUEVO CLIENTE ══════ */}
      {showCustModal && (
        <div className="modal-backdrop" onClick={() => setShowCustModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <div className="modal-title">+ Nuevo cliente</div>
            <form onSubmit={addCustomer}>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" required placeholder="Nombre"
                  value={newCust.full_name}
                  onChange={e => setNewCust({ ...newCust, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" placeholder="999 999 999"
                  value={newCust.phone}
                  onChange={e => setNewCust({ ...newCust, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="correo@ejemplo.com"
                  value={newCust.email}
                  onChange={e => setNewCust({ ...newCust, email: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit">Guardar cliente</button>
              <button className="btn btn-outline btn-block" style={{ marginTop: 10 }}
                type="button" onClick={() => setShowCustModal(false)}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
