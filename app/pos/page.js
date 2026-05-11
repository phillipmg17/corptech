'use client';
import { useState, useEffect } from 'react';
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

export default function PosPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [me,        setMe]        = useState(null);
  const [orgId,     setOrgId]     = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [products,  setProducts]  = useState([]);
  const [cart,      setCart]      = useState([]);
  const [search,    setSearch]    = useState('');
  const [customers, setCustomers] = useState([]);
  const [custId,    setCustId]    = useState('');
  const [payMethod, setPayMethod] = useState('efectivo');
  const [discount,  setDiscount]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [step,      setStep]      = useState('products'); // products | cart | customer | payment | receipt
  const [lastSale,  setLastSale]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCust,   setNewCust]   = useState({ full_name: '', phone: '', email: '' });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/'); return; }
    const uid = session.user.id;
    const { data: prof } = await supabase.from('users').select('org_id, full_name').eq('id', uid).single();
    const oid = prof?.org_id;
    setMe({ id: uid, name: prof?.full_name });
    setOrgId(oid);

    // Check open cash session
    const { data: cs } = await supabase.from('cash_sessions')
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
      .select('id, serial_number, imei, sale_price, emoji, products(id, name)')
      .eq('owner_org_id', oid)
      .eq('status', 'available')
      .limit(100);
    // Group by product
    const map = {};
    (data || []).forEach(item => {
      const pid = item.products?.id || item.id;
      const pname = item.products?.name || 'Producto';
      if (!map[pid]) map[pid] = {
        product_id: pid,
        name:       pname,
        emoji:      item.emoji || '📦',
        price:      item.sale_price || 0,
        items:      [],
      };
      map[pid].items.push(item);
    });
    setProducts(Object.values(map));
  }

  async function loadCustomers(oid) {
    const { data } = await supabase.from('customers').select('id, full_name, phone').eq('org_id', oid).limit(100);
    setCustomers(data || []);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── CART ── */
  function addToCart(product) {
    if (product.items.length === 0) { showToast('Sin stock disponible', 'err'); return; }
    const existing = cart.find(c => c.product_id === product.product_id);
    if (existing) {
      if (existing.qty >= product.items.length) { showToast('Sin más unidades disponibles', 'err'); return; }
      setCart(cart.map(c => c.product_id === product.product_id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  }

  function removeFromCart(product_id) {
    setCart(cart.filter(c => c.product_id !== product_id));
  }

  function changeQty(product_id, delta) {
    setCart(cart.map(c => {
      if (c.product_id !== product_id) return c;
      const nq = c.qty + delta;
      if (nq <= 0) return null;
      if (nq > c.items.length) { showToast('Sin más unidades', 'err'); return c; }
      return { ...c, qty: nq };
    }).filter(Boolean));
  }

  const subtotal     = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt  = subtotal * (discount / 100);
  const total        = subtotal - discountAmt;

  /* ── PROCESS SALE ── */
  async function processSale() {
    setLoading(true);
    try {
      const customer = custId ? customers.find(c => c.id === custId) : null;
      const { data: sale, error: saleErr } = await supabase.from('sales').insert({
        org_id:         orgId,
        cashier_id:     me.id,
        customer_id:    custId || null,
        cash_session_id: sessionId,
        total_amount:   total,
        payment_method: payMethod,
        status:         'completed',
      }).select().single();

      if (saleErr) throw saleErr;

      // Insert sale items & mark stock as sold
      for (const c of cart) {
        const itemsToSell = c.items.slice(0, c.qty);
        for (const item of itemsToSell) {
          await supabase.from('sale_items').insert({
            sale_id:       sale.id,
            stock_item_id: item.id,
            quantity:      1,
            unit_price:    c.price,
          });
          await supabase.from('stock_items').update({ status: 'sold' }).eq('id', item.id);
        }
      }

      setLastSale({ ...sale, customer_name: customer?.full_name || 'Sin cliente', items: cart });
      setCart([]);
      setCustId('');
      setDiscount(0);
      setStep('receipt');
      showToast('¡Venta completada! 🎉');
    } catch (err) {
      showToast('Error al procesar la venta: ' + err.message, 'err');
    }
    setLoading(false);
  }

  /* ── ADD CUSTOMER ── */
  async function addCustomer(e) {
    e.preventDefault();
    const { data, error } = await supabase.from('customers').insert({ ...newCust, org_id: orgId }).select().single();
    if (error) { showToast('Error al agregar cliente', 'err'); return; }
    setCustomers([...customers, data]);
    setCustId(data.id);
    setShowCustModal(false);
    setNewCust({ full_name: '', phone: '', email: '' });
    showToast('Cliente agregado ✓');
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !me) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-wrap">
      {/* TOP BAR */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" className="top-btn">🏠</Link>
          <Link href="/store"     className="top-btn">🏪</Link>
          <div>
            <div className="top-bar-title">🛒 Punto de Venta</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          {cart.length > 0 && step === 'products' && (
            <button className="btn btn-sm btn-green" onClick={() => setStep('cart')}>
              🛒 {cart.reduce((s,c)=>s+c.qty,0)} — S/{total.toFixed(2)}
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* TOAST */}
      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      <div className="content-notab">

        {/* ══ PRODUCTS ══ */}
        {step === 'products' && (
          <div style={{ padding: '16px' }}>
            <div className="search-bar">
              <span>🔍</span>
              <input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
              <div className="empty-msg">Sin productos disponibles</div>
            ) : (
              <div className="product-grid">
                {filtered.map(p => {
                  const inCart = cart.find(c => c.product_id === p.product_id);
                  return (
                    <div key={p.product_id} className={`product-card${inCart ? ' in-cart' : ''}`} onClick={() => addToCart(p)}>
                      <span className="product-emoji">{p.emoji}</span>
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">S/{p.price.toFixed(2)}</div>
                      <div className={`product-stock${p.items.length < 3 ? ' low' : ''}`}>
                        {p.items.length} disponibles
                      </div>
                      {inCart && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--blue)', fontWeight: 700 }}>✓ {inCart.qty} en carrito</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ CART ══ */}
        {step === 'cart' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <button className="btn-ghost" onClick={() => setStep('products')}>← Volver</button>
              <div className="section-title" style={{ margin: 0 }}>🛒 Carrito</div>
            </div>

            {cart.length === 0 ? (
              <div className="empty-msg">El carrito está vacío</div>
            ) : (
              <div className="card">
                {cart.map(c => (
                  <div className="cart-item" key={c.product_id}>
                    <span style={{ fontSize: 24 }}>{c.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 12 }}>S/{c.price.toFixed(2)} c/u</div>
                    </div>
                    <div className="cart-qty">
                      <button className="qty-btn" onClick={() => changeQty(c.product_id, -1)}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{c.qty}</span>
                      <button className="qty-btn" onClick={() => changeQty(c.product_id, 1)}>+</button>
                    </div>
                    <div style={{ minWidth: 70, textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green)' }}>S/{(c.price * c.qty).toFixed(2)}</div>
                      <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--red)' }} onClick={() => removeFromCart(c.product_id)}>✕</button>
                    </div>
                  </div>
                ))}

                <div className="cart-total">
                  <div className="cart-total-label">Total</div>
                  <div className="cart-total-val">S/{total.toFixed(2)}</div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Descuento (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={discount}
                onChange={e => setDiscount(Number(e.target.value))} placeholder="0" />
            </div>

            {cart.length > 0 && (
              <button className="btn btn-primary" onClick={() => setStep('customer')}>
                Continuar — S/{total.toFixed(2)} →
              </button>
            )}
          </div>
        )}

        {/* ══ CUSTOMER ══ */}
        {step === 'customer' && (
          <div style={{ padding: '16px' }}>
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
                    <option key={c.id} value={c.id}>{c.full_name} {c.phone ? `· ${c.phone}` : ''}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCustModal(true)}>+ Nuevo cliente</button>
            </div>

            <button className="btn btn-primary" onClick={() => setStep('payment')}>
              Ir a pago →
            </button>
          </div>
        )}

        {/* ══ PAYMENT ══ */}
        {step === 'payment' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <button className="btn-ghost" onClick={() => setStep('customer')}>← Volver</button>
              <div className="section-title" style={{ margin: 0 }}>💳 Pago</div>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['efectivo', 'tarjeta', 'yape', 'transferencia'].map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`btn btn-sm${payMethod === m ? ' btn-primary' : ' btn-outline'}`}>
                      {m === 'efectivo' ? '💵' : m === 'tarjeta' ? '💳' : m === 'yape' ? '📱' : '🏦'} {m}
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
                <span style={{ fontWeight: 900, fontSize: 24, color: 'var(--green)' }}>S/{total.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-green btn-block" onClick={processSale} disabled={loading}>
              {loading ? '...' : `✓ Confirmar venta S/${total.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* ══ RECEIPT ══ */}
        {step === 'receipt' && lastSale && (
          <div style={{ padding: '16px' }}>
            <div className="receipt">
              <div className="receipt-ico">✅</div>
              <div className="receipt-title">¡Venta completada!</div>
              <div className="receipt-sub">{new Date(lastSale.created_at).toLocaleString('es-PE')}</div>

              {lastSale.items.map(c => (
                <div className="receipt-row" key={c.product_id}>
                  <span>{c.emoji} {c.name} × {c.qty}</span>
                  <span>S/{(c.price * c.qty).toFixed(2)}</span>
                </div>
              ))}

              <div className="receipt-row" style={{ fontWeight: 700 }}>
                <span>Método</span>
                <span>{lastSale.payment_method}</span>
              </div>
              <div className="receipt-row" style={{ fontWeight: 700 }}>
                <span>Cliente</span>
                <span>{lastSale.customer_name}</span>
              </div>

              <div className="receipt-total">S/{(lastSale.total_amount || 0).toFixed(2)}</div>
            </div>

            <button className="btn btn-primary" onClick={() => { setStep('products'); setLastSale(null); loadProducts(orgId); }}>
              Nueva venta 🛒
            </button>
          </div>
        )}

      </div>

      {/* ── NUEVO CLIENTE MODAL ── */}
      {showCustModal && (
        <div className="modal-backdrop" onClick={() => setShowCustModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <div className="modal-title">+ Nuevo cliente</div>
            <form onSubmit={addCustomer}>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" required placeholder="Nombre"
                  value={newCust.full_name} onChange={e => setNewCust({ ...newCust, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" placeholder="999 999 999"
                  value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="correo@ejemplo.com"
                  value={newCust.email} onChange={e => setNewCust({ ...newCust, email: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit">Guardar cliente</button>
              <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} type="button" onClick={() => setShowCustModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
