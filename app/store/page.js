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

export default function StorePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [me,       setMe]       = useState(null);
  const [orgId,    setOrgId]    = useState(null);
  const [orgName,  setOrgName]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('stock');
  const [stocks,   setStocks]   = useState([]);
  const [products, setProducts] = useState([]);
  const [customers,setCustomers]= useState([]);
  const [sales,    setSales]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [toast,    setToast]    = useState(null);
  const [modal,    setModal]    = useState(null); // null | 'add-stock' | 'add-customer' | 'open-session'
  const [form,     setForm]     = useState({});

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;
    const { data: prof } = await supabase.from('users').select('org_id, full_name, organizations(name)').eq('id', uid).single();
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
    const r = roleRow?.role;
    if (!r || (r !== 'gerente' && r !== 'vendedor' && r !== 'superadmin' && r !== 'corp')) {
      router.replace('/dashboard'); return;
    }
    setMe({ id: uid, name: prof?.full_name, role: r });
    setOrgId(prof?.org_id);
    setOrgName(prof?.organizations?.name || 'Tienda');
    setLoading(false);
    loadTab('stock', prof?.org_id);
    loadProducts(prof?.org_id);
  }

  async function loadTab(t, oid) {
    const id = oid || orgId;
    if (t === 'stock')    return loadStock(id);
    if (t === 'clientes') return loadCustomers(id);
    if (t === 'ventas')   return loadSales(id);
    if (t === 'caja')     return loadSessions(id);
  }

  async function loadStock(oid) {
    const { data } = await supabase.from('stock_items').select('id, serial_number, imei, status, sale_price, emoji, products(name)').eq('owner_org_id', oid).order('created_at', { ascending: false }).limit(60);
    setStocks(data || []);
  }

  async function loadProducts(oid) {
    const { data } = await supabase.from('products').select('id, name, emoji, description').limit(50);
    setProducts(data || []);
  }

  async function loadCustomers(oid) {
    const { data } = await supabase.from('customers').select('*').eq('org_id', oid).order('created_at', { ascending: false });
    setCustomers(data || []);
  }

  async function loadSales(oid) {
    const { data } = await supabase.from('sales').select('id, total_amount, payment_method, created_at, customers(full_name), users!cashier_id(full_name)').eq('org_id', oid).order('created_at', { ascending: false }).limit(50);
    setSales(data || []);
  }

  async function loadSessions(oid) {
    const { data } = await supabase.from('cash_sessions').select('*').eq('org_id', oid).order('opened_at', { ascending: false }).limit(20);
    setSessions(data || []);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function switchTab(t) {
    setTab(t);
    loadTab(t, orgId);
  }

  /* ── ADD STOCK ITEM ── */
  async function addStockItem(e) {
    e.preventDefault();
    const { error } = await supabase.from('stock_items').insert({
      owner_org_id: orgId,
      product_id:   form.product_id,
      serial_number: form.serial_number || null,
      imei:         form.imei || null,
      sale_price:   parseFloat(form.sale_price) || 0,
      emoji:        form.emoji || '📦',
      status:       'available',
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Stock agregado ✓');
    setModal(null); setForm({});
    loadStock(orgId);
  }

  /* ── ADD CUSTOMER ── */
  async function addCustomer(e) {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert({ ...form, org_id: orgId });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Cliente registrado ✓');
    setModal(null); setForm({});
    loadCustomers(orgId);
  }

  /* ── OPEN SESSION ── */
  async function openSession(e) {
    e.preventDefault();
    const { error } = await supabase.from('cash_sessions').insert({
      org_id:          orgId,
      opened_by:       me.id,
      opening_balance: parseFloat(form.opening_balance) || 0,
      status:          'open',
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Caja abierta ✓');
    setModal(null); setForm({});
    loadSessions(orgId);
  }

  /* ── CLOSE SESSION ── */
  async function closeSession(sid) {
    const closing = prompt('¿Monto final en caja?');
    if (closing === null) return;
    await supabase.from('cash_sessions').update({ status: 'closed', closing_balance: parseFloat(closing) || 0, closed_at: new Date().toISOString() }).eq('id', sid);
    showToast('Caja cerrada ✓');
    loadSessions(orgId);
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-wrap">
      {/* TOP BAR */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" className="top-btn">🏠</Link>
          <Link href="/pos"       className="top-btn">🛒</Link>
          <div>
            <div className="top-bar-title">🏪 {orgName}</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="badge badge-blue">{me?.role?.toUpperCase()}</span>
          <button className="top-btn-logout" onClick={doLogout}>Salir</button>
        </div>
      </div>

      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      <div className="content">

        {/* ── STOCK ── */}
        {tab === 'stock' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">📦 Stock</div>
              <button className="section-action" onClick={() => { setModal('add-stock'); setForm({}); }}>+ Agregar</button>
            </div>
            {stocks.length === 0 ? <div className="empty-msg">Sin stock registrado</div> : (
              <div>
                {stocks.map(s => (
                  <div className="card" key={s.id} style={{ padding: '12px 14px', marginBottom: 8 }}>
                    <div className="flex-between">
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 26 }}>{s.emoji || '📦'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{s.products?.name || 'Producto'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.imei || s.serial_number || 'Sin serial'}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--green)' }}>S/{(s.sale_price||0).toFixed(2)}</div>
                        <span className={`badge badge-${s.status==='available'?'green':s.status==='sold'?'orange':'red'}`}>{s.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTES ── */}
        {tab === 'clientes' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">👥 Clientes</div>
              <button className="section-action" onClick={() => { setModal('add-customer'); setForm({}); }}>+ Agregar</button>
            </div>
            {customers.length === 0 ? <div className="empty-msg">Sin clientes registrados</div> : (
              <div className="card">
                {customers.map(c => (
                  <div className="list-item" key={c.id}>
                    <div className="list-item-ico">👤</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{c.full_name}</div>
                      <div className="list-item-sub">{c.phone || c.email || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VENTAS ── */}
        {tab === 'ventas' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">📊 Ventas</div>
            {sales.length === 0 ? <div className="empty-msg">Sin ventas</div> : (
              <div className="card">
                {sales.map(s => (
                  <div className="list-item" key={s.id}>
                    <div className="list-item-ico">🧾</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{s.customers?.full_name || 'Público general'}</div>
                      <div className="list-item-sub">
                        {s.payment_method} · {new Date(s.created_at).toLocaleDateString('es-PE')}
                        {s.users?.full_name && ` · ${s.users.full_name}`}
                      </div>
                    </div>
                    <div className="list-item-val">S/{(s.total_amount||0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CAJA ── */}
        {tab === 'caja' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">💰 Caja</div>
              <button className="section-action" onClick={() => { setModal('open-session'); setForm({ opening_balance: '0' }); }}>+ Abrir caja</button>
            </div>
            {sessions.length === 0 ? <div className="empty-msg">Sin sesiones de caja</div> : (
              sessions.map(s => (
                <div className="card" key={s.id}>
                  <div className="flex-between mb-8">
                    <div>
                      <div style={{ fontWeight: 700 }}>Caja {new Date(s.opened_at || s.created_at).toLocaleDateString('es-PE')}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(s.opened_at || s.created_at).toLocaleTimeString('es-PE')}</div>
                    </div>
                    <span className={`badge badge-${s.status==='open'?'green':'orange'}`}>{s.status}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text3)', fontSize: 13 }}>Apertura: S/{(s.opening_balance||0).toFixed(2)}</span>
                    {s.closing_balance != null && <span style={{ color: 'var(--text3)', fontSize: 13 }}>Cierre: S/{s.closing_balance.toFixed(2)}</span>}
                  </div>
                  {s.status === 'open' && (
                    <button className="btn btn-red btn-sm" style={{ marginTop: 12 }} onClick={() => closeSession(s.id)}>Cerrar caja</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {[
          { id: 'stock',    ico: '📦', lbl: 'Stock'    },
          { id: 'clientes', ico: '👥', lbl: 'Clientes' },
          { id: 'ventas',   ico: '📊', lbl: 'Ventas'   },
          { id: 'caja',     ico: '💰', lbl: 'Caja'     },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => switchTab(t.id)}>
            <span className="ico">{t.ico}</span>{t.lbl}
          </button>
        ))}
      </div>

      {/* ── MODALS ── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />

            {modal === 'add-stock' && (
              <>
                <div className="modal-title">📦 Agregar stock</div>
                <form onSubmit={addStockItem}>
                  <div className="form-group">
                    <label className="form-label">Producto</label>
                    <select className="form-select" required value={form.product_id||''} onChange={e => setForm({...form, product_id: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.emoji||'📦'} {p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">IMEI</label>
                    <input className="form-input" placeholder="352999111111111" value={form.imei||''} onChange={e => setForm({...form, imei: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial</label>
                    <input className="form-input" placeholder="SN123456" value={form.serial_number||''} onChange={e => setForm({...form, serial_number: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio de venta (S/)</label>
                    <input className="form-input" type="number" required placeholder="0.00" value={form.sale_price||''} onChange={e => setForm({...form, sale_price: e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar</button>
                </form>
              </>
            )}

            {modal === 'add-customer' && (
              <>
                <div className="modal-title">👤 Nuevo cliente</div>
                <form onSubmit={addCustomer}>
                  <div className="form-group">
                    <label className="form-label">Nombre completo</label>
                    <input className="form-input" required placeholder="Nombre" value={form.full_name||''} onChange={e => setForm({...form, full_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-input" placeholder="999 999 999" value={form.phone||''} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="correo@..." value={form.email||''} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DNI</label>
                    <input className="form-input" placeholder="12345678" value={form.document_number||''} onChange={e => setForm({...form, document_number: e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar cliente</button>
                </form>
              </>
            )}

            {modal === 'open-session' && (
              <>
                <div className="modal-title">💰 Abrir caja</div>
                <form onSubmit={openSession}>
                  <div className="form-group">
                    <label className="form-label">Monto de apertura (S/)</label>
                    <input className="form-input" type="number" required value={form.opening_balance||'0'} onChange={e => setForm({...form, opening_balance: e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Abrir caja</button>
                </form>
              </>
            )}

            <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
