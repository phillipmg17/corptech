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

const STORES = [
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',   ico: '🔵' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech',  ico: '🟣' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru', ico: '🟢' },
];

export default function CorpPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [me,       setMe]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('global');
  const [stocks,   setStocks]   = useState([]);
  const [sales,    setSales]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [kpis,     setKpis]     = useState({ totalStock: 0, totalSales: 0, totalRevenue: 0 });
  const [storeFilter, setStoreFilter] = useState('all');
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [products, setProducts] = useState([]);
  const [toast,    setToast]    = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/'); return; }
    const uid = session.user.id;
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
    const r = roleRow?.role;
    if (r !== 'corp' && r !== 'superadmin') { router.replace('/dashboard'); return; }
    const { data: prof } = await supabase.from('users').select('full_name').eq('id', uid).single();
    setMe({ id: uid, name: prof?.full_name, role: r });
    await loadKpis();
    await loadProducts();
    setLoading(false);
  }

  async function loadKpis() {
    const { count: stockCount } = await supabase.from('stock_items').select('id', { count: 'exact', head: true }).eq('status', 'available');
    const { data: salesData } = await supabase.from('sales').select('total_amount');
    const totalRevenue = (salesData || []).reduce((s, v) => s + (v.total_amount || 0), 0);
    setKpis({ totalStock: stockCount || 0, totalSales: (salesData || []).length, totalRevenue });
  }

  async function loadGlobalStock() {
    let q = supabase.from('stock_items').select('id, serial_number, imei, status, sale_price, emoji, owner_org_id, products(name)').order('created_at', { ascending: false }).limit(80);
    if (storeFilter !== 'all') q = q.eq('owner_org_id', storeFilter);
    const { data } = await q;
    setStocks(data || []);
  }

  async function loadAllSales() {
    let q = supabase.from('sales').select('id, total_amount, payment_method, created_at, org_id, customers(full_name)').order('created_at', { ascending: false }).limit(60);
    if (storeFilter !== 'all') q = q.eq('org_id', storeFilter);
    const { data } = await q;
    setSales(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase.from('users').select('id, full_name, email, org_id, organizations(name), user_roles(role)').limit(50);
    setUsers(data || []);
  }

  async function loadProducts() {
    const { data } = await supabase.from('products').select('id, name, emoji').limit(50);
    setProducts(data || []);
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'global') loadGlobalStock();
    if (t === 'ventas') loadAllSales();
    if (t === 'equipo') loadUsers();
  }

  useEffect(() => {
    if (tab === 'global') loadGlobalStock();
    if (tab === 'ventas') loadAllSales();
  }, [storeFilter]);

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── ADD PRODUCT ── */
  async function addProduct(e) {
    e.preventDefault();
    const { error } = await supabase.from('products').insert({
      name:        form.name,
      description: form.description || '',
      emoji:       form.emoji || '📦',
      sale_price:  parseFloat(form.sale_price) || 0,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Producto creado ✓');
    setModal(null); setForm({});
    loadProducts();
  }

  /* ── ADD STOCK (corp warehouse) ── */
  async function addStock(e) {
    e.preventDefault();
    const { error } = await supabase.from('stock_items').insert({
      owner_org_id:  form.owner_org_id || '00000000-0000-0000-0000-000000000001',
      product_id:    form.product_id,
      serial_number: form.serial_number || null,
      imei:          form.imei || null,
      sale_price:    parseFloat(form.sale_price) || 0,
      emoji:         form.emoji || '📦',
      status:        'available',
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Stock agregado ✓');
    setModal(null); setForm({});
    loadGlobalStock();
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  const getOrgName = (id) => STORES.find(s => s.id === id)?.name || 'Corp Tech';
  const getOrgIco  = (id) => STORES.find(s => s.id === id)?.ico  || '🏢';

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
            <div className="top-bar-title">🏢 Corp Tech</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="badge" style={{ background: 'var(--purple)', color: '#fff' }}>CORP</span>
          <button className="top-btn-logout" onClick={doLogout}>Salir</button>
        </div>
      </div>

      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      <div className="content">

        {/* ── GLOBAL STOCK ── */}
        {tab === 'global' && (
          <div style={{ padding: '16px' }}>
            {/* KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <div className="kpi"><div className="kpi-ico">📦</div><div className="kpi-val">{kpis.totalStock}</div><div className="kpi-lbl">Stock total</div></div>
              <div className="kpi"><div className="kpi-ico">🛒</div><div className="kpi-val">{kpis.totalSales}</div><div className="kpi-lbl">Ventas</div></div>
              <div className="kpi"><div className="kpi-ico">💰</div><div className="kpi-val" style={{ fontSize: 18 }}>S/{kpis.totalRevenue.toFixed(0)}</div><div className="kpi-lbl">Ingresos</div></div>
            </div>

            <div className="section-header">
              <div className="section-title">📦 Stock Global</div>
              <button className="section-action" onClick={() => { setModal('add-stock'); setForm({}); }}>+ Agregar</button>
            </div>

            {/* Store filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {[{ id: 'all', name: 'Todas', ico: '🌐' }, ...STORES].map(s => (
                <button key={s.id} onClick={() => setStoreFilter(s.id)}
                  className={`btn btn-sm${storeFilter===s.id?' btn-primary':' btn-outline'}`}>
                  {s.ico} {s.name}
                </button>
              ))}
            </div>

            {stocks.length === 0 ? <div className="empty-msg">Sin resultados</div> : (
              stocks.map(s => (
                <div className="card" key={s.id} style={{ padding: '12px 14px', marginBottom: 8 }}>
                  <div className="flex-between">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 26 }}>{s.emoji || '📦'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{s.products?.name || 'Producto'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.imei || s.serial_number || 'Sin serial'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{getOrgIco(s.owner_org_id)} {getOrgName(s.owner_org_id)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green)' }}>S/{(s.sale_price||0).toFixed(2)}</div>
                      <span className={`badge badge-${s.status==='available'?'green':s.status==='sold'?'orange':'red'}`}>{s.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── VENTAS ── */}
        {tab === 'ventas' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">📊 Ventas consolidadas</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {[{ id: 'all', name: 'Todas', ico: '🌐' }, ...STORES].map(s => (
                <button key={s.id} onClick={() => setStoreFilter(s.id)}
                  className={`btn btn-sm${storeFilter===s.id?' btn-primary':' btn-outline'}`}>
                  {s.ico} {s.name}
                </button>
              ))}
            </div>

            {sales.length === 0 ? <div className="empty-msg">Sin ventas</div> : (
              <div className="card">
                {sales.map(s => (
                  <div className="list-item" key={s.id}>
                    <div className="list-item-ico">{getOrgIco(s.org_id)}</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{s.customers?.full_name || 'Público general'}</div>
                      <div className="list-item-sub">
                        {getOrgName(s.org_id)} · {s.payment_method} · {new Date(s.created_at).toLocaleDateString('es-PE')}
                      </div>
                    </div>
                    <div className="list-item-val">S/{(s.total_amount||0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTOS ── */}
        {tab === 'productos' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">🗂️ Catálogo</div>
              <button className="section-action" onClick={() => { setModal('add-product'); setForm({ emoji: '📦' }); }}>+ Producto</button>
            </div>
            {products.length === 0 ? <div className="empty-msg">Sin productos</div> : (
              <div className="product-grid">
                {products.map(p => (
                  <div className="product-card" key={p.id}>
                    <span className="product-emoji">{p.emoji || '📦'}</span>
                    <div className="product-name">{p.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EQUIPO ── */}
        {tab === 'equipo' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">👥 Equipo</div>
            {users.length === 0 ? <div className="empty-msg">Sin usuarios</div> : (
              <div className="card">
                {users.map(u => (
                  <div className="list-item" key={u.id}>
                    <div className="list-item-ico">👤</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{u.full_name}</div>
                      <div className="list-item-sub">{u.organizations?.name || '—'} · {u.user_roles?.[0]?.role || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {[
          { id: 'global',    ico: '📦', lbl: 'Stock'     },
          { id: 'ventas',    ico: '📊', lbl: 'Ventas'    },
          { id: 'productos', ico: '🗂️', lbl: 'Catálogo'  },
          { id: 'equipo',    ico: '👥', lbl: 'Equipo'    },
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

            {modal === 'add-product' && (
              <>
                <div className="modal-title">🗂️ Nuevo producto</div>
                <form onSubmit={addProduct}>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input className="form-input" required placeholder="iPhone 15 Pro Max" value={form.name||''} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emoji</label>
                    <input className="form-input" placeholder="📱" value={form.emoji||''} onChange={e => setForm({...form, emoji: e.target.value})} style={{ fontSize: 24 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <input className="form-input" placeholder="Descripción..." value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio base (S/)</label>
                    <input className="form-input" type="number" placeholder="0.00" value={form.sale_price||''} onChange={e => setForm({...form, sale_price: e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Crear producto</button>
                </form>
              </>
            )}

            {modal === 'add-stock' && (
              <>
                <div className="modal-title">📦 Agregar stock</div>
                <form onSubmit={addStock}>
                  <div className="form-group">
                    <label className="form-label">Asignar a tienda</label>
                    <select className="form-select" value={form.owner_org_id||''} onChange={e => setForm({...form, owner_org_id: e.target.value})}>
                      <option value="00000000-0000-0000-0000-000000000001">🏢 Corp Tech (Almacén Central)</option>
                      {STORES.map(s => <option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
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

            <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
