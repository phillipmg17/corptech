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

const CORP_ID  = '00000000-0000-0000-0000-000000000001';
const STORES = [
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',   ico: '🔵' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech',  ico: '🟣' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru', ico: '🟢' },
];
const ALL_ORGS = [{ id: CORP_ID, name: 'Corp Tech', ico: '🏢' }, ...STORES];

export default function CorpPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [me,          setMe]          = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('global');
  const [stocks,      setStocks]      = useState([]);
  const [sales,       setSales]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [kpis,        setKpis]        = useState({ totalStock: 0, totalSales: 0, totalRevenue: 0 });
  const [storeFilter, setStoreFilter] = useState('all');
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [products,    setProducts]    = useState([]);
  const [toast,       setToast]       = useState(null);

  /* ── ALMACENES ── */
  const [warehouses,  setWarehouses]  = useState([]);

  /* ── TRASLADOS ── */
  const [transfers,   setTransfers]   = useState([]);
  const [corpStock,   setCorpStock]   = useState([]);
  const [selItems,    setSelItems]    = useState([]);
  const [txFilter,    setTxFilter]    = useState('all');

  /* ── IMPORTACIÓN ── */
  const [imports,     setImports]     = useState([]);
  const [usdRate,     setUsdRate]     = useState('');
  const [loadingRate, setLoadingRate] = useState(false);
  const [importKpis,  setImportKpis]  = useState({ totalUSD: 0, totalPEN: 0, count: 0 });

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
    await loadGlobalStock();
    setLoading(false);
  }

  async function loadKpis() {
    const { count: stockCount } = await supabase.from('stock_items').select('id', { count: 'exact', head: true }).eq('status', 'available');
    const { data: salesData }   = await supabase.from('sales').select('total_amount');
    const totalRevenue = (salesData || []).reduce((s, v) => s + (v.total_amount || 0), 0);
    setKpis({ totalStock: stockCount || 0, totalSales: (salesData || []).length, totalRevenue });
  }

  async function loadGlobalStock() {
    let q = supabase
      .from('stock_items')
      .select('id, serial_number, imei, status, sale_price, emoji, owner_org_id, product_id, products(name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (storeFilter !== 'all') q = q.eq('owner_org_id', storeFilter);
    const { data } = await q;
    setStocks(data || []);
  }

  async function loadAllSales() {
    let q = supabase
      .from('sales')
      .select('id, total_amount, payment_method, created_at, org_id, customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(60);
    if (storeFilter !== 'all') q = q.eq('org_id', storeFilter);
    const { data } = await q;
    setSales(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, org_id, organizations(name), user_roles(role)')
      .limit(50);
    setUsers(data || []);
  }

  async function loadProducts() {
    const { data } = await supabase.from('products').select('id, name, emoji').limit(50);
    setProducts(data || []);
  }

  /* ── ALMACENES ── */
  async function loadWarehouses() {
    const { data } = await supabase
      .from('warehouses')
      .select('id, name, type, aisle, shelf, org_id, is_active')
      .order('created_at', { ascending: false });
    setWarehouses(data || []);
  }

  async function addWarehouse(e) {
    e.preventDefault();
    const { error } = await supabase.from('warehouses').insert({
      org_id:    form.wh_org_id || CORP_ID,
      name:      form.wh_name,
      type:      form.wh_type || 'central',
      aisle:     form.wh_aisle || null,
      shelf:     form.wh_shelf || null,
      is_active: true,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Almacén creado ✓');
    setModal(null); setForm({});
    loadWarehouses();
  }

  /* ── TRASLADOS ── */
  async function loadTransfers() {
    let q = supabase
      .from('stock_transfers')
      .select('id, from_org_id, to_org_id, status, total_amount, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (txFilter !== 'all') q = q.eq('status', txFilter);
    const { data } = await q;
    setTransfers(data || []);
  }

  async function loadCorpStock() {
    const { data } = await supabase
      .from('stock_items')
      .select('id, serial_number, imei, sale_price, emoji, product_id, products(name)')
      .eq('owner_org_id', CORP_ID)
      .eq('status', 'available')
      .limit(100);
    setCorpStock(data || []);
  }

  function toggleSelItem(id) {
    setSelItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function createTransfer(e) {
    e.preventDefault();
    if (!form.tx_to_org) { showToast('Selecciona tienda destino', 'err'); return; }
    if (selItems.length === 0) { showToast('Selecciona al menos 1 equipo', 'err'); return; }

    const totalAmt = selItems.reduce((sum, id) => {
      const it = corpStock.find(s => s.id === id);
      return sum + (it?.sale_price || 0);
    }, 0);

    const { data: tx, error: txErr } = await supabase
      .from('stock_transfers')
      .insert({
        from_org_id:  CORP_ID,
        to_org_id:    form.tx_to_org,
        status:       'pending',
        total_amount: totalAmt,
        notes:        form.tx_notes || '',
      })
      .select('id')
      .single();

    if (txErr) { showToast('Error traslado: ' + txErr.message, 'err'); return; }

    const itemRows = selItems.map(sid => ({
      transfer_id:   tx.id,
      stock_item_id: sid,
      corp_price:    corpStock.find(s => s.id === sid)?.sale_price || 0,
      quantity:      1,
    }));
    const { error: itemErr } = await supabase.from('stock_transfer_items').insert(itemRows);
    if (itemErr) { showToast('Error items: ' + itemErr.message, 'err'); return; }

    // Cambiar owner de los items al estado in_transit
    await supabase.from('stock_items')
      .update({ status: 'in_transit' })
      .in('id', selItems);

    showToast(`Traslado creado — ${selItems.length} equipo(s) ✓`);
    setModal(null); setForm({}); setSelItems([]);
    loadTransfers();
    loadGlobalStock();
    loadKpis();
  }

  async function receiveTransfer(txId) {
    // Obtener items del traslado
    const { data: txItems } = await supabase
      .from('stock_transfer_items')
      .select('stock_item_id, transfer_id, stock_transfers(to_org_id)')
      .eq('transfer_id', txId);

    if (!txItems || txItems.length === 0) { showToast('Sin items', 'err'); return; }

    const toOrg = txItems[0]?.stock_transfers?.to_org_id;
    const ids   = txItems.map(i => i.stock_item_id);

    await supabase.from('stock_items')
      .update({ status: 'available', owner_org_id: toOrg })
      .in('id', ids);

    await supabase.from('stock_transfers')
      .update({ status: 'received', received_at: new Date().toISOString() })
      .eq('id', txId);

    showToast('Traslado recibido ✓ — Stock actualizado');
    loadTransfers();
    loadGlobalStock();
    loadKpis();
  }

  async function approveTransfer(txId) {
    await supabase.from('stock_transfers')
      .update({ status: 'in_transit', approved_at: new Date().toISOString() })
      .eq('id', txId);
    showToast('Traslado aprobado ✓');
    loadTransfers();
  }

  /* ── IMPORTACIÓN USA ── */
  async function loadImports() {
    const { data } = await supabase
      .from('accounting_tx')
      .select('id, amount, currency, description, created_at, org_id')
      .eq('org_id', CORP_ID)
      .eq('type', 'expense')
      .ilike('description', 'IMPORTACIÓN%')
      .order('created_at', { ascending: false })
      .limit(60);
    const list = data || [];
    setImports(list);
    // KPIs
    const totalUSD = list.filter(x => x.currency === 'USD').reduce((s, x) => s + (x.amount || 0), 0);
    const totalPEN = list.filter(x => x.currency === 'PEN').reduce((s, x) => s + (x.amount || 0), 0);
    setImportKpis({ totalUSD, totalPEN, count: list.length });
  }

  async function fetchUsdRate() {
    setLoadingRate(true);
    try {
      const res  = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const json = await res.json();
      const pen  = json?.rates?.PEN;
      if (pen) { setUsdRate(pen.toFixed(3)); showToast(`Tipo de cambio: S/${pen.toFixed(3)} ✓`); }
      else showToast('No se pudo obtener el tipo de cambio', 'err');
    } catch { showToast('Error al consultar API', 'err'); }
    setLoadingRate(false);
  }

  async function addImport(e) {
    e.preventDefault();
    const usd    = parseFloat(form.imp_usd)  || 0;
    const rate   = parseFloat(usdRate)        || parseFloat(form.imp_rate) || 1;
    const penAmt = parseFloat(form.imp_pen)  || (usd * rate);

    // Insert USD row
    if (usd > 0) {
      await supabase.from('accounting_tx').insert({
        org_id:      CORP_ID,
        type:        'expense',
        amount:      usd,
        currency:    'USD',
        description: `IMPORTACIÓN USA: ${form.imp_desc || 'Sin descripción'}`,
        created_by:  me?.id,
      });
    }
    // Insert PEN row
    if (penAmt > 0) {
      await supabase.from('accounting_tx').insert({
        org_id:      CORP_ID,
        type:        'expense',
        amount:      penAmt,
        currency:    'PEN',
        description: `IMPORTACIÓN USA: ${form.imp_desc || 'Sin descripción'} (TC: ${rate})`,
        created_by:  me?.id,
      });
    }

    showToast('Importación registrada ✓');
    setModal(null); setForm({});
    loadImports();
  }

  /* ── ADD PRODUCT ── */
  async function addProduct(e) {
    e.preventDefault();
    const { error } = await supabase.from('products').insert({
      name:        form.name,
      description: form.description || '',
      emoji:       form.emoji || '📦',
      sale_price:  parseFloat(form.sale_price) || 0,
      corp_id:     CORP_ID,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Producto creado ✓');
    setModal(null); setForm({});
    loadProducts();
  }

  /* ── ADD STOCK ── */
  async function addStock(e) {
    e.preventDefault();
    const { error } = await supabase.from('stock_items').insert({
      owner_org_id:  form.owner_org_id || CORP_ID,
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
    loadKpis();
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'global')       loadGlobalStock();
    if (t === 'ventas')       loadAllSales();
    if (t === 'equipo')       loadUsers();
    if (t === 'almacenes')    loadWarehouses();
    if (t === 'traslados')  { loadTransfers(); loadCorpStock(); }
    if (t === 'importacion')  loadImports();
  }

  useEffect(() => {
    if (tab === 'global') loadGlobalStock();
    if (tab === 'ventas') loadAllSales();
  }, [storeFilter]);

  useEffect(() => {
    if (tab === 'traslados') loadTransfers();
  }, [txFilter]);

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const getOrgName = (id) => ALL_ORGS.find(s => s.id === id)?.name || id;
  const getOrgIco  = (id) => ALL_ORGS.find(s => s.id === id)?.ico  || '🏢';

  const TX_BADGES = {
    pending:    { lbl: 'Pendiente',  color: 'var(--yellow)' },
    approved:   { lbl: 'Aprobado',   color: 'var(--blue)'   },
    in_transit: { lbl: 'En camino',  color: 'var(--purple)'  },
    received:   { lbl: 'Recibido',   color: 'var(--green)'   },
    cancelled:  { lbl: 'Cancelado',  color: 'var(--red)'     },
  };

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

      {toast && (
        <div className="toast-wrap">
          <div className={`toast-msg ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="content">

        {/* ══════════════════════════════════════
            TAB: STOCK GLOBAL
        ══════════════════════════════════════ */}
        {tab === 'global' && (
          <div style={{ padding: '16px' }}>
            {/* KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
              <div className="kpi">
                <div className="kpi-ico">📦</div>
                <div className="kpi-val">{kpis.totalStock}</div>
                <div className="kpi-lbl">Stock disponible</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">🛒</div>
                <div className="kpi-val">{kpis.totalSales}</div>
                <div className="kpi-lbl">Ventas totales</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">💰</div>
                <div className="kpi-val" style={{ fontSize: 16 }}>S/{kpis.totalRevenue.toFixed(0)}</div>
                <div className="kpi-lbl">Ingresos</div>
              </div>
            </div>

            <div className="section-header">
              <div className="section-title">📦 Stock Global</div>
              <button className="section-action" onClick={() => { setModal('add-stock'); setForm({}); }}>+ Agregar</button>
            </div>

            {/* Filtro por tienda */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {[{ id: 'all', name: 'Todas', ico: '🌐' }, { id: CORP_ID, name: 'Corp (Almacén)', ico: '🏢' }, ...STORES].map(s => (
                <button key={s.id} onClick={() => setStoreFilter(s.id)}
                  className={`btn btn-sm${storeFilter === s.id ? ' btn-primary' : ' btn-outline'}`}>
                  {s.ico} {s.name}
                </button>
              ))}
            </div>

            {stocks.length === 0 ? (
              <div className="empty-msg">Sin resultados</div>
            ) : (
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
                      <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: 15 }}>S/{(s.sale_price || 0).toFixed(2)}</div>
                      <span className={`badge badge-${s.status === 'available' ? 'green' : s.status === 'sold' ? 'orange' : s.status === 'in_transit' ? 'blue' : 'red'}`}>
                        {s.status === 'available' ? 'Disponible' : s.status === 'sold' ? 'Vendido' : s.status === 'in_transit' ? 'En tránsito' : s.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: VENTAS
        ══════════════════════════════════════ */}
        {tab === 'ventas' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">📊 Ventas consolidadas</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {[{ id: 'all', name: 'Todas', ico: '🌐' }, ...STORES].map(s => (
                <button key={s.id} onClick={() => setStoreFilter(s.id)}
                  className={`btn btn-sm${storeFilter === s.id ? ' btn-primary' : ' btn-outline'}`}>
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
                    <div className="list-item-val" style={{ color: 'var(--green)', fontWeight: 800 }}>S/{(s.total_amount || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: CATÁLOGO
        ══════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════
            TAB: EQUIPO
        ══════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════
            TAB: ALMACENES
        ══════════════════════════════════════ */}
        {tab === 'almacenes' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">🏭 Almacenes</div>
              <button className="section-action" onClick={() => { setModal('add-warehouse'); setForm({ wh_org_id: CORP_ID, wh_type: 'central' }); }}>+ Agregar</button>
            </div>

            {warehouses.length === 0 ? (
              <div className="empty-msg">Sin almacenes registrados</div>
            ) : (
              warehouses.map(w => (
                <div className="card" key={w.id} style={{ padding: '14px', marginBottom: 10 }}>
                  <div className="flex-between">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {w.type === 'central' ? '🏭' : w.type === 'store' ? '🏪' : '👤'} {w.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                        {getOrgIco(w.org_id)} {getOrgName(w.org_id)}
                        {w.aisle && <span> · Pasillo: <b>{w.aisle}</b></span>}
                        {w.shelf  && <span> · Estante: <b>{w.shelf}</b></span>}
                      </div>
                    </div>
                    <span className={`badge badge-${w.is_active ? 'green' : 'red'}`}>
                      {w.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Resumen de stock por tienda */}
            <div style={{ marginTop: 24 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>📊 Stock por organización</div>
              {[{ id: CORP_ID, name: 'Corp Tech (Almacén)', ico: '🏢' }, ...STORES].map(org => {
                const count = stocks.filter(s => s.owner_org_id === org.id && s.status === 'available').length;
                const transit = stocks.filter(s => s.owner_org_id === org.id && s.status === 'in_transit').length;
                return (
                  <div className="card" key={org.id} style={{ padding: '12px 14px', marginBottom: 8 }}>
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{org.ico}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{org.name}</div>
                          {transit > 0 && <div style={{ fontSize: 11, color: 'var(--yellow)' }}>🚚 {transit} en tránsito</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{count}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>disponibles</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: TRASLADOS
        ══════════════════════════════════════ */}
        {tab === 'traslados' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">🔄 Traslados de Stock</div>
              <button className="section-action" onClick={() => { setModal('new-transfer'); setForm({ tx_to_org: STORES[0].id }); setSelItems([]); }}>+ Nuevo</button>
            </div>

            {/* Filtro por estado */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { v: 'all',        l: '🌐 Todos'       },
                { v: 'pending',    l: '⏳ Pendiente'   },
                { v: 'in_transit', l: '🚚 En camino'   },
                { v: 'received',   l: '✅ Recibido'    },
              ].map(f => (
                <button key={f.v} onClick={() => setTxFilter(f.v)}
                  className={`btn btn-sm${txFilter === f.v ? ' btn-primary' : ' btn-outline'}`}>
                  {f.l}
                </button>
              ))}
            </div>

            {transfers.length === 0 ? (
              <div className="empty-msg">Sin traslados</div>
            ) : (
              transfers.map(tx => {
                const badge  = TX_BADGES[tx.status] || { lbl: tx.status, color: 'var(--text3)' };
                const isPending   = tx.status === 'pending';
                const isInTransit = tx.status === 'in_transit';
                return (
                  <div className="card" key={tx.id} style={{ padding: '14px', marginBottom: 10 }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {getOrgIco(tx.from_org_id)} {getOrgName(tx.from_org_id)} → {getOrgIco(tx.to_org_id)} {getOrgName(tx.to_org_id)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                          {new Date(tx.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {tx.notes && <span> · {tx.notes}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--green)' }}>S/{(tx.total_amount || 0).toFixed(2)}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>● {badge.lbl}</span>
                      </div>
                    </div>
                    {/* Acciones */}
                    {isPending && (
                      <button className="btn btn-primary btn-sm" onClick={() => approveTransfer(tx.id)}>
                        ✅ Aprobar
                      </button>
                    )}
                    {isInTransit && (
                      <button className="btn btn-primary btn-sm" style={{ background: 'var(--green)' }} onClick={() => receiveTransfer(tx.id)}>
                        📦 Marcar como recibido
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: IMPORTACIÓN USA
        ══════════════════════════════════════ */}
        {tab === 'importacion' && (
          <div style={{ padding: '16px' }}>
            {/* KPIs importación */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
              <div className="kpi">
                <div className="kpi-ico">🇺🇸</div>
                <div className="kpi-val" style={{ fontSize: 16 }}>${importKpis.totalUSD.toFixed(0)}</div>
                <div className="kpi-lbl">Total USD</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">🪙</div>
                <div className="kpi-val" style={{ fontSize: 16 }}>S/{importKpis.totalPEN.toFixed(0)}</div>
                <div className="kpi-lbl">Total PEN</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">📥</div>
                <div className="kpi-val">{importKpis.count}</div>
                <div className="kpi-lbl">Registros</div>
              </div>
            </div>

            {/* Tipo de cambio */}
            <div className="card" style={{ padding: '14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>💱 Tipo de Cambio USD → PEN</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  type="number"
                  step="0.001"
                  placeholder="Ej: 3.750"
                  value={usdRate}
                  onChange={e => setUsdRate(e.target.value)}
                />
                <button className="btn btn-outline btn-sm" onClick={fetchUsdRate} disabled={loadingRate}>
                  {loadingRate ? '…' : '🔄 API'}
                </button>
              </div>
              {usdRate && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 6 }}>✓ S/{usdRate} por $1 USD</div>}
            </div>

            <div className="section-header">
              <div className="section-title">📥 Costos de Importación</div>
              <button className="section-action" onClick={() => { setModal('add-import'); setForm({}); }}>+ Registrar</button>
            </div>

            {imports.length === 0 ? (
              <div className="empty-msg">Sin registros de importación</div>
            ) : (
              <div className="card">
                {imports.map(imp => (
                  <div className="list-item" key={imp.id}>
                    <div className="list-item-ico">{imp.currency === 'USD' ? '🇺🇸' : '🪙'}</div>
                    <div className="list-item-body">
                      <div className="list-item-name" style={{ fontSize: 13 }}>
                        {imp.description?.replace('IMPORTACIÓN USA: ', '') || '—'}
                      </div>
                      <div className="list-item-sub">
                        {new Date(imp.created_at).toLocaleDateString('es-PE')} · {imp.currency}
                      </div>
                    </div>
                    <div className="list-item-val" style={{ color: 'var(--red)', fontWeight: 800 }}>
                      {imp.currency === 'USD' ? '$' : 'S/'}{(imp.amount || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>{/* end .content */}

      {/* TAB BAR — scrollable on mobile */}
      <div className="tab-bar" style={{ overflowX: 'auto' }}>
        {[
          { id: 'global',      ico: '📦', lbl: 'Stock'      },
          { id: 'almacenes',   ico: '🏭', lbl: 'Almacenes'  },
          { id: 'traslados',   ico: '🔄', lbl: 'Traslados'  },
          { id: 'importacion', ico: '📥', lbl: 'Importación' },
          { id: 'ventas',      ico: '📊', lbl: 'Ventas'     },
          { id: 'productos',   ico: '🗂️', lbl: 'Catálogo'   },
          { id: 'equipo',      ico: '👥', lbl: 'Equipo'     },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => switchTab(t.id)}>
            <span className="ico">{t.ico}</span>{t.lbl}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          MODALS
      ══════════════════════════════════════ */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />

            {/* ── MODAL: Nuevo Producto ── */}
            {modal === 'add-product' && (
              <>
                <div className="modal-title">🗂️ Nuevo producto</div>
                <form onSubmit={addProduct}>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input className="form-input" required placeholder="iPhone 15 Pro Max" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emoji</label>
                    <input className="form-input" placeholder="📱" value={form.emoji || ''} onChange={e => setForm({ ...form, emoji: e.target.value })} style={{ fontSize: 24 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <input className="form-input" placeholder="Descripción..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio base (S/)</label>
                    <input className="form-input" type="number" placeholder="0.00" value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit">Crear producto</button>
                </form>
              </>
            )}

            {/* ── MODAL: Agregar Stock ── */}
            {modal === 'add-stock' && (
              <>
                <div className="modal-title">📦 Agregar stock</div>
                <form onSubmit={addStock}>
                  <div className="form-group">
                    <label className="form-label">Asignar a</label>
                    <select className="form-select" value={form.owner_org_id || ''} onChange={e => setForm({ ...form, owner_org_id: e.target.value })}>
                      <option value={CORP_ID}>🏢 Corp Tech (Almacén Central)</option>
                      {STORES.map(s => <option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Producto</label>
                    <select className="form-select" required value={form.product_id || ''} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.emoji || '📦'} {p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">IMEI</label>
                    <input className="form-input" placeholder="352999111111111" value={form.imei || ''} onChange={e => setForm({ ...form, imei: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial</label>
                    <input className="form-input" placeholder="SN123456" value={form.serial_number || ''} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio de venta (S/)</label>
                    <input className="form-input" type="number" required placeholder="0.00" value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar</button>
                </form>
              </>
            )}

            {/* ── MODAL: Nuevo Almacén ── */}
            {modal === 'add-warehouse' && (
              <>
                <div className="modal-title">🏭 Nuevo almacén</div>
                <form onSubmit={addWarehouse}>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input className="form-input" required placeholder="Almacén Central Lima" value={form.wh_name || ''} onChange={e => setForm({ ...form, wh_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organización</label>
                    <select className="form-select" value={form.wh_org_id || CORP_ID} onChange={e => setForm({ ...form, wh_org_id: e.target.value })}>
                      {ALL_ORGS.map(o => <option key={o.id} value={o.id}>{o.ico} {o.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.wh_type || 'central'} onChange={e => setForm({ ...form, wh_type: e.target.value })}>
                      <option value="central">🏭 Central (Corp)</option>
                      <option value="store">🏪 Tienda</option>
                      <option value="personal">👤 Personal</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Pasillo</label>
                      <input className="form-input" placeholder="A1" value={form.wh_aisle || ''} onChange={e => setForm({ ...form, wh_aisle: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estante</label>
                      <input className="form-input" placeholder="E3" value={form.wh_shelf || ''} onChange={e => setForm({ ...form, wh_shelf: e.target.value })} />
                    </div>
                  </div>
                  <button className="btn btn-primary" type="submit">Crear almacén</button>
                </form>
              </>
            )}

            {/* ── MODAL: Nuevo Traslado ── */}
            {modal === 'new-transfer' && (
              <>
                <div className="modal-title">🔄 Nuevo Traslado</div>
                <form onSubmit={createTransfer}>
                  <div className="form-group">
                    <label className="form-label">Tienda destino</label>
                    <select className="form-select" value={form.tx_to_org || ''} onChange={e => setForm({ ...form, tx_to_org: e.target.value })}>
                      {STORES.map(s => <option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <input className="form-input" placeholder="Traslado semanal..." value={form.tx_notes || ''} onChange={e => setForm({ ...form, tx_notes: e.target.value })} />
                  </div>
                  <div className="form-label" style={{ marginBottom: 8 }}>
                    Seleccionar equipos del almacén Corp ({selItems.length} seleccionados)
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                    {corpStock.length === 0 ? (
                      <div style={{ padding: 14, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Sin stock en almacén Corp</div>
                    ) : (
                      corpStock.map(s => {
                        const selected = selItems.includes(s.id);
                        return (
                          <div key={s.id}
                            onClick={() => toggleSelItem(s.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px', cursor: 'pointer',
                              background: selected ? 'var(--blue-dim, rgba(0,122,255,0.15))' : 'transparent',
                              borderBottom: '1px solid var(--border)',
                            }}>
                            <span style={{ fontSize: 20 }}>{s.emoji || '📦'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.products?.name || 'Producto'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.imei || s.serial_number || 'Sin serial'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 13 }}>S/{(s.sale_price || 0).toFixed(0)}</div>
                              {selected && <span style={{ fontSize: 16 }}>✅</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {selItems.length > 0 && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--card2, rgba(255,255,255,0.05))', borderRadius: 10, fontSize: 14 }}>
                      <span>Total traslado: </span>
                      <b style={{ color: 'var(--green)' }}>
                        S/{selItems.reduce((sum, id) => sum + (corpStock.find(s => s.id === id)?.sale_price || 0), 0).toFixed(2)}
                      </b>
                    </div>
                  )}
                  <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>
                    Crear traslado ({selItems.length} equipo{selItems.length !== 1 ? 's' : ''})
                  </button>
                </form>
              </>
            )}

            {/* ── MODAL: Registrar Importación ── */}
            {modal === 'add-import' && (
              <>
                <div className="modal-title">📥 Registrar Importación USA</div>
                <form onSubmit={addImport}>
                  <div className="form-group">
                    <label className="form-label">Descripción / Productos</label>
                    <input className="form-input" required placeholder="10x Samsung Galaxy S24 — Miami" value={form.imp_desc || ''} onChange={e => setForm({ ...form, imp_desc: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo en USD ($)</label>
                    <input className="form-input" type="number" step="0.01" required placeholder="0.00" value={form.imp_usd || ''} onChange={e => setForm({ ...form, imp_usd: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Tipo de cambio</label>
                      <input className="form-input" type="number" step="0.001" placeholder="3.750" value={usdRate || form.imp_rate || ''} onChange={e => setForm({ ...form, imp_rate: e.target.value })} />
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 20 }} onClick={fetchUsdRate}>
                      🔄
                    </button>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'var(--card2, rgba(255,255,255,0.05))', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
                    <span>Equivalente PEN: </span>
                    <b style={{ color: 'var(--green)' }}>
                      S/{((parseFloat(form.imp_usd) || 0) * (parseFloat(usdRate) || parseFloat(form.imp_rate) || 0)).toFixed(2)}
                    </b>
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar importación</button>
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
