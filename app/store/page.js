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

const SLUG_MAP = {
  '00000000-0000-0000-0000-000000000002': 'futurteck',
  '00000000-0000-0000-0000-000000000003': 'innovatech',
  '00000000-0000-0000-0000-000000000004': 'wetech',
};

const DEFAULT_CONFIG = {
  store_name: '',
  tagline: '',
  descripcion: '',
  logo_url: '',
  whatsapp: '',
  instagram: '',
  tiktok: '',
  direccion: '',
  color_primario: '#0A84FF',
  color_secundario: '#5E5CE6',
  color_acento: '#30D158',
  horarios: {
    lunes: '9:00 - 18:00',
    martes: '9:00 - 18:00',
    miercoles: '9:00 - 18:00',
    jueves: '9:00 - 18:00',
    viernes: '9:00 - 18:00',
    sabado: '10:00 - 14:00',
    domingo: 'Cerrado',
  },
};

export default function StorePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [me,         setMe]         = useState(null);
  const [orgId,      setOrgId]      = useState(null);
  const [orgName,    setOrgName]    = useState('');
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('stock');
  const [stocks,     setStocks]     = useState([]);
  const [products,   setProducts]   = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [sales,      setSales]      = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [toast,      setToast]      = useState(null);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({});

  // Config state
  const [config,     setConfig]     = useState(DEFAULT_CONFIG);
  const [configId,   setConfigId]   = useState(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  // Deudas / Liquidaciones state
  const [deudas,       setDeudas]       = useState([]);
  const [deudasLoading,setDeudasLoading]= useState(false);
  const comprobanteRef = useRef(null);

  // Plataformas state
  const [deudasSubTab,   setDeudasSubTab]   = useState('corp');
  const [misPlataformas, setMisPlataformas] = useState([]);
  const [allPlataformas, setAllPlataformas] = useState([]);
  const [liqPlatStore,   setLiqPlatStore]   = useState([]);
  const [calendario,     setCalendario]     = useState([]);
  const reporteRef = useRef(null);

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
    loadConfig(prof?.org_id);
  }

  async function loadTab(t, oid) {
    const id = oid || orgId;
    if (t === 'stock')    return loadStock(id);
    if (t === 'clientes') return loadCustomers(id);
    if (t === 'ventas')   return loadSales(id);
    if (t === 'caja')     return loadSessions(id);
    if (t === 'deudas')   { loadDeudas(id); loadMisPlataformas(id); loadCalendario(id); loadAllPlataformasCat(); }
  }

  /* ── PLATAFORMAS STORE ── */
  async function loadAllPlataformasCat() {
    const { data } = await supabase.from('plataformas_venta').select('*').eq('activo', true).order('nombre');
    setAllPlataformas(data || []);
  }

  async function loadMisPlataformas(oid) {
    const id = oid || orgId;
    const { data } = await supabase
      .from('tienda_plataformas')
      .select('*, plataformas_venta(id, nombre, emoji, comision_pct, periodicidad, dia_liquidacion, metodo_pago)')
      .eq('store_org_id', id)
      .eq('activo', true);
    setMisPlataformas(data || []);
  }

  async function activarPlataforma(e) {
    e.preventDefault();
    const { error } = await supabase.from('tienda_plataformas').upsert({
      store_org_id:    orgId,
      plataforma_id:   form.tp_plat,
      cuenta_vendedor: form.tp_cuenta || '',
      activo:          true,
    }, { onConflict: 'store_org_id,plataforma_id' });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Plataforma activada ✓');
    setModal(null); setForm({});
    loadMisPlataformas();
  }

  async function loadLiqPlatStore(oid) {
    const id = oid || orgId;
    const { data } = await supabase
      .from('liquidaciones_plataforma')
      .select('*, plataformas_venta(nombre, emoji)')
      .eq('store_org_id', id)
      .order('created_at', { ascending: false })
      .limit(40);
    setLiqPlatStore(data || []);
  }

  async function crearLiqPlat(e) {
    e.preventDefault();
    const ventas = parseFloat(form.lp_ventas) || 0;
    const comis  = parseFloat(form.lp_comisiones) || 0;
    const desc   = parseFloat(form.lp_descuentos) || 0;
    const otros  = parseFloat(form.lp_otros) || 0;
    const neto   = ventas - comis - desc - otros;
    const dep    = parseFloat(form.lp_depositado) || 0;
    const diff   = dep - neto;

    const { error } = await supabase.from('liquidaciones_plataforma').insert({
      tienda_plataforma_id: form.lp_tp_id || null,
      store_org_id:         orgId,
      plataforma_id:        form.lp_plat,
      periodo_inicio:       form.lp_inicio,
      periodo_fin:          form.lp_fin,
      ventas_brutas_pen:    ventas,
      comisiones_pen:       comis,
      descuentos_pen:       desc,
      otros_cargos_pen:     otros,
      monto_neto_pen:       neto,
      monto_depositado_pen: dep,
      fecha_deposito:       form.lp_fecha_dep || null,
      diferencia_pen:       diff,
      notas_tienda:         form.lp_notas || '',
      estado:               'subido',
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }

    // Si hay archivo lo subimos
    if (form.lp_archivo) {
      const liqData = await supabase.from('liquidaciones_plataforma')
        .select('id').eq('store_org_id', orgId).order('created_at', { ascending: false }).limit(1).single();
      if (liqData.data) await subirReportePlataforma(liqData.data.id, form.lp_archivo);
    }

    showToast('Reporte enviado a Corp ✓');
    setModal(null); setForm({});
    loadLiqPlatStore();
  }

  async function subirReportePlataforma(liqId, file) {
    if (!file || file.size > 10 * 1024 * 1024) { showToast('Archivo muy grande (máx 10MB)', 'err'); return; }
    const ext  = file.name.split('.').pop();
    const path = `reportes-plataformas/${orgId}/${liqId}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('store-assets').upload(path, file, { upsert: true });
    if (upErr) { showToast('Error al subir: ' + upErr.message, 'err'); return; }
    const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(path);
    await supabase.from('liquidaciones_plataforma').update({
      archivo_url:    publicUrl,
      archivo_nombre: file.name,
      estado:         'subido',
    }).eq('id', liqId);
    showToast('Reporte subido ✓');
    loadLiqPlatStore();
  }

  async function loadCalendario(oid) {
    const id = oid || orgId;
    const { data } = await supabase
      .from('calendario_liquidaciones')
      .select('*, plataformas_venta(nombre, emoji)')
      .eq('store_org_id', id)
      .order('fecha_esperada', { ascending: true })
      .limit(30);
    setCalendario(data || []);
  }

  /* ── DEUDAS / LIQUIDACIONES ── */
  async function loadDeudas(oid) {
    const id = oid || orgId;
    setDeudasLoading(true);
    const { data } = await supabase
      .from('liquidaciones')
      .select('*')
      .eq('store_org_id', id)
      .order('created_at', { ascending: false });
    setDeudas(data || []);
    setDeudasLoading(false);
  }

  async function subirComprobante(liqId, file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Archivo muy grande (máx 5MB)', 'err'); return; }
    const ext  = file.name.split('.').pop();
    const path = `comprobantes/${orgId}/${liqId}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('store-assets').upload(path, file, { upsert: true });
    if (upErr) { showToast('Error al subir: ' + upErr.message, 'err'); return; }
    const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(path);
    const { error } = await supabase.from('liquidaciones').update({
      comprobante_url: publicUrl,
      estado: 'pagada',
      fecha_pago: new Date().toISOString().split('T')[0],
    }).eq('id', liqId);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('✅ Comprobante enviado a Corp');
    loadDeudas();
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

  /* ── LOAD CONFIG ── */
  async function loadConfig(oid) {
    const id = oid || orgId;
    const { data } = await supabase.from('tiendas_config').select('*').eq('org_id', id).single();
    if (data) {
      setConfigId(data.id);
      setConfig({
        store_name:      data.store_name      || '',
        tagline:         data.tagline         || '',
        descripcion:     data.descripcion     || '',
        logo_url:        data.logo_url        || '',
        whatsapp:        data.whatsapp        || '',
        instagram:       data.instagram       || '',
        tiktok:          data.tiktok          || '',
        direccion:       data.direccion       || '',
        color_primario:  data.color_primario  || '#0A84FF',
        color_secundario:data.color_secundario|| '#5E5CE6',
        color_acento:    data.color_acento    || '#30D158',
        horarios:        data.horarios        || DEFAULT_CONFIG.horarios,
      });
    }
  }

  /* ── SAVE CONFIG ── */
  async function saveConfig(e) {
    e.preventDefault();
    setConfigSaving(true);
    const payload = { ...config, org_id: orgId, updated_at: new Date().toISOString() };
    let error;
    if (configId) {
      ({ error } = await supabase.from('tiendas_config').update(payload).eq('id', configId));
    } else {
      const { data: ins, error: insErr } = await supabase.from('tiendas_config').insert(payload).select().single();
      error = insErr;
      if (ins) setConfigId(ins.id);
    }
    setConfigSaving(false);
    if (error) { showToast('Error al guardar: ' + error.message, 'err'); return; }
    showToast('✅ Configuración guardada');
  }

  /* ── UPLOAD LOGO ── */
  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Logo muy grande (máx 2MB)', 'err'); return; }
    setLogoUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `logos/${orgId}/logo_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('store-assets').upload(path, file, { upsert: true });
    if (upErr) { showToast('Error al subir: ' + upErr.message, 'err'); setLogoUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(path);
    setConfig(c => ({ ...c, logo_url: publicUrl }));
    setLogoUploading(false);
    showToast('Logo subido ✓');
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

  const slug = SLUG_MAP[orgId] || '';

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

        {/* ── DEUDAS / LIQUIDACIONES ── */}
        {tab === 'deudas' && (() => {
          const ESTADO = {
            borrador:      { lbl: 'Borrador',      color: '#888'    },
            enviada:       { lbl: '📋 Pendiente',   color: '#FF9F0A' },
            pagada_parcial:{ lbl: '💸 Pago parcial',color: '#5E5CE6' },
            pagada:        { lbl: '⏳ En revisión', color: '#0A84FF' },
            aprobada:      { lbl: '✅ Aprobado',    color: '#30D158' },
            rechazada:     { lbl: '❌ Rechazado',   color: '#FF453A' },
          };
          const PLAT_EST = {
            pendiente:      { lbl: 'Pendiente',     color: '#888'    },
            subido:         { lbl: '📎 Subido',      color: '#FF9F0A' },
            verificando:    { lbl: '🔍 Revisando',   color: '#5E5CE6' },
            aprobado:       { lbl: '✅ Aprobado',    color: '#30D158' },
            rechazado:      { lbl: '❌ Rechazado',   color: '#FF453A' },
            con_diferencia: { lbl: '⚠️ Diferencia',  color: '#FF6B00' },
          };
          const totalDeuda = deudas
            .filter(d => d.estado === 'enviada' || d.estado === 'pagada_parcial')
            .reduce((s, d) => s + (d.monto_neto_pen || 0), 0);
          const hoy = new Date();
          const calProximo = calendario.filter(c => {
            const d = new Date(c.fecha_esperada);
            return Math.ceil((d - hoy) / (1000*60*60*24)) <= 7 && Math.ceil((d - hoy) / (1000*60*60*24)) >= 0;
          });

          return (
            <div style={{ padding: '16px' }}>

              {/* Alertas de calendario próximo */}
              {calProximo.length > 0 && (
                <div style={{
                  background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.3)',
                  borderRadius: 14, padding: '12px 16px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#FF9F0A', marginBottom: 8 }}>⏰ Próximas en 7 días</div>
                  {calProximo.map(ev => {
                    const diff = Math.ceil((new Date(ev.fecha_esperada) - hoy) / (1000*60*60*24));
                    return (
                      <div key={ev.id} style={{ fontSize: 12, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>{ev.plataformas_venta?.emoji || '🏢'} {ev.titulo}</span>
                        <span style={{ fontWeight: 700, color: diff <= 2 ? '#FF453A' : '#FF9F0A' }}>
                          {diff === 0 ? '¡HOY!' : `en ${diff} día${diff !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--surface)', borderRadius: 12, padding: 4 }}>
                {[
                  { id: 'corp',        lbl: '🏢 Corp'       },
                  { id: 'plataformas', lbl: '🏪 Plataformas'},
                  { id: 'calendario',  lbl: '📅 Calendario' },
                ].map(st => (
                  <button key={st.id} onClick={() => { setDeudasSubTab(st.id); if (st.id === 'plataformas') loadLiqPlatStore(); }}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none',
                      background: deudasSubTab === st.id ? 'var(--blue, #0A84FF)' : 'transparent',
                      color: deudasSubTab === st.id ? '#fff' : 'var(--text-muted)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                    }}>
                    {st.lbl}
                  </button>
                ))}
              </div>

              {/* ── SUB-TAB: Corp ── */}
              {deudasSubTab === 'corp' && (
                <>
                  {totalDeuda > 0 && (
                    <div style={{ background: 'linear-gradient(135deg,rgba(255,69,58,0.15),rgba(255,159,10,0.1))', border: '1px solid rgba(255,69,58,0.3)', borderRadius: 20, padding: '20px 24px', marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#FF6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>⚠️ Deuda pendiente con Corp Tech</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>S/{totalDeuda.toFixed(0)}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Sube el comprobante de pago en cada liquidación</div>
                    </div>
                  )}
                  {totalDeuda === 0 && deudas.filter(d => d.estado === 'aprobada').length > 0 && (
                    <div style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                      <div style={{ fontWeight: 700, color: '#30D158' }}>¡Sin deudas pendientes!</div>
                    </div>
                  )}
                  <div className="section-title" style={{ marginBottom: 12 }}>📋 Mis liquidaciones con Corp</div>
                  {deudasLoading ? <div className="empty-msg">Cargando…</div>
                  : deudas.length === 0 ? <div className="empty-msg">Sin liquidaciones de Corp todavía</div>
                  : deudas.map(liq => {
                    const badge = ESTADO[liq.estado] || { lbl: liq.estado, color: '#888' };
                    const puedePagar = liq.estado === 'enviada' || liq.estado === 'pagada_parcial';
                    return (
                      <div className="card" key={liq.id} style={{ padding: '14px', marginBottom: 12 }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{liq.descripcion || `${liq.periodo_inicio} → ${liq.periodo_fin}`}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{liq.periodo_inicio} → {liq.periodo_fin}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.lbl}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '8px 12px' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Mis ventas</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>S/{(liq.total_ventas_pen||0).toFixed(0)}</div>
                          </div>
                          <div style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                            <div style={{ fontSize: 9, color: '#FF6B6B', fontWeight: 700, textTransform: 'uppercase' }}>Debo a Corp</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#FF6B6B' }}>S/{(liq.monto_neto_pen||0).toFixed(0)}</div>
                          </div>
                        </div>
                        {liq.comprobante_url && (
                          <a href={liq.comprobante_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', padding: '8px 12px', background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.25)', borderRadius: 10, fontSize: 12, color: '#4DA8FF', fontWeight: 600, marginBottom: 10, textDecoration: 'none' }}>
                            🧾 Comprobante enviado — {liq.fecha_pago || ''}
                          </a>
                        )}
                        {liq.notas_corp && liq.estado === 'rechazada' && (
                          <div style={{ background: 'rgba(255,69,58,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#FF6B6B', marginBottom: 10 }}>❌ {liq.notas_corp}</div>
                        )}
                        {puedePagar && (
                          <>
                            <input ref={comprobanteRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                              onChange={e => subirComprobante(liq.id, e.target.files?.[0])} />
                            <button onClick={() => comprobanteRef.current?.click()} style={{ width: '100%', padding: '12px', borderRadius: 14, background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                              📎 Subir comprobante de pago
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── SUB-TAB: Plataformas ── */}
              {deudasSubTab === 'plataformas' && (
                <>
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <div className="section-title">🏪 Mis plataformas activas</div>
                    <button className="section-action" onClick={() => { setModal('activar-plataforma'); setForm({}); }}>+ Agregar</button>
                  </div>
                  {misPlataformas.length === 0 ? (
                    <div className="empty-msg">No tienes plataformas activas. Toca "+ Agregar" para conectar MercadoLibre, Saga, etc.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                      {misPlataformas.map(tp => (
                        <div key={tp.id} className="card" style={{ padding: '12px' }}>
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{tp.plataformas_venta?.emoji || '🏪'}</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{tp.plataformas_venta?.nombre}</div>
                          {tp.cuenta_vendedor && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>@{tp.cuenta_vendedor}</div>}
                          <div style={{ fontSize: 10, color: '#FF9F0A', marginTop: 4 }}>Comisión: {tp.plataformas_venta?.comision_pct}%</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Día {tp.plataformas_venta?.dia_liquidacion} · {tp.plataformas_venta?.periodicidad}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <div className="section-title">📄 Reportes enviados</div>
                    <button className="section-action" onClick={() => { setModal('add-liq-plat'); setForm({}); }}>+ Nuevo reporte</button>
                  </div>
                  {liqPlatStore.length === 0 ? (
                    <div className="empty-msg">Aún no has enviado reportes de plataformas</div>
                  ) : (
                    liqPlatStore.map(lp => {
                      const badge = PLAT_EST[lp.estado] || { lbl: lp.estado, color: '#888' };
                      return (
                        <div className="card" key={lp.id} style={{ padding: '14px', marginBottom: 12 }}>
                          <div className="flex-between" style={{ marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{lp.plataformas_venta?.emoji} {lp.plataformas_venta?.nombre}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lp.periodo_inicio} → {lp.periodo_fin}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.lbl}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                            <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ventas</div>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>S/{(lp.ventas_brutas_pen||0).toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,159,10,0.1)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: '#FF9F0A', fontWeight: 700, textTransform: 'uppercase' }}>Comisión</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#FF9F0A' }}>–S/{(lp.comisiones_pen||0).toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'rgba(48,209,88,0.1)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: '#30D158', fontWeight: 700, textTransform: 'uppercase' }}>Depositado</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#30D158' }}>S/{(lp.monto_depositado_pen||0).toFixed(0)}</div>
                            </div>
                          </div>
                          {lp.diferencia_pen !== 0 && (
                            <div style={{ fontSize: 11, color: lp.diferencia_pen > 0 ? '#30D158' : '#FF6B00', marginBottom: 6 }}>
                              {lp.diferencia_pen > 0 ? '✅ Pagaron de más: ' : '⚠️ Diferencia: '}S/{Math.abs(lp.diferencia_pen).toFixed(2)}
                            </div>
                          )}
                          {lp.archivo_url && (
                            <a href={lp.archivo_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', fontSize: 12, color: '#4DA8FF', fontWeight: 600, textDecoration: 'none', marginBottom: 4 }}>
                              📎 {lp.archivo_nombre || 'Ver reporte adjunto'}
                            </a>
                          )}
                          {lp.notas_corp && <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4 }}>Corp: {lp.notas_corp}</div>}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ── SUB-TAB: Calendario ── */}
              {deudasSubTab === 'calendario' && (
                <>
                  <div className="section-title" style={{ marginBottom: 16 }}>📅 Calendario de liquidaciones</div>
                  {calendario.length === 0 ? (
                    <div className="empty-msg">Corp aún no ha programado fechas de liquidación</div>
                  ) : (
                    calendario.map(ev => {
                      const fecha = new Date(ev.fecha_esperada);
                      const diff  = Math.ceil((fecha - hoy) / (1000*60*60*24));
                      const urgente = diff <= 3 && diff >= 0;
                      const pasado  = diff < 0;
                      return (
                        <div key={ev.id} className="card" style={{
                          padding: '14px', marginBottom: 10,
                          borderLeft: `3px solid ${pasado ? '#888' : urgente ? '#FF453A' : diff <= 7 ? '#FF9F0A' : '#30D158'}`,
                        }}>
                          <div className="flex-between">
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>
                                {ev.plataformas_venta?.emoji || (ev.tipo === 'corp' ? '🏢' : '🏪')} {ev.titulo}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                                {fecha.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: 14, fontWeight: 800,
                                color: pasado ? '#888' : urgente ? '#FF453A' : diff <= 7 ? '#FF9F0A' : '#30D158',
                              }}>
                                {pasado ? 'Vencido' : diff === 0 ? '¡HOY!' : diff === 1 ? 'Mañana' : `${diff} días`}
                              </div>
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                background: ev.tipo === 'corp' ? 'rgba(10,132,255,0.15)' : 'rgba(94,92,230,0.15)',
                                color: ev.tipo === 'corp' ? '#4DA8FF' : '#A78BFA',
                                padding: '2px 6px', borderRadius: 4,
                              }}>
                                {ev.tipo === 'corp' ? 'CORP' : 'PLATAFORMA'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* ── CONFIGURACIÓN ── */}
        {tab === 'config' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">⚙️ Configuración de Tienda</div>

            {/* Preview link */}
            {slug && (
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 12, marginBottom: 20,
                  background: 'rgba(10,132,255,0.12)',
                  border: '1px solid rgba(10,132,255,0.25)',
                  color: '#4DA8FF', fontSize: 13, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>🌐</span>
                <span>Ver tienda online: /{slug}</span>
                <span style={{ marginLeft: 'auto' }}>↗</span>
              </a>
            )}

            <form onSubmit={saveConfig}>

              {/* LOGO */}
              <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🖼 Logo de la tienda</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {config.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={config.logo_url}
                      alt="Logo"
                      style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 12, background: 'var(--surface)', padding: 4 }}
                    />
                  ) : (
                    <div style={{
                      width: 72, height: 72, borderRadius: 12,
                      background: 'var(--surface)', border: '2px dashed var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, color: 'var(--text-muted)',
                    }}>🏪</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={uploadLogo}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: logoUploading ? 'not-allowed' : 'pointer', marginBottom: 8,
                      }}
                    >
                      {logoUploading ? '⏳ Subiendo...' : '📤 Subir logo'}
                    </button>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        className="form-input"
                        placeholder="O pega URL del logo"
                        value={config.logo_url}
                        onChange={e => setConfig(c => ({ ...c, logo_url: e.target.value }))}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      PNG o JPG · máx 2MB
                    </div>
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN BÁSICA */}
              <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📝 Información básica</div>
                <div className="form-group">
                  <label className="form-label">Nombre de la tienda</label>
                  <input className="form-input" placeholder="Ej: Futurteck" value={config.store_name}
                    onChange={e => setConfig(c => ({ ...c, store_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tagline / Eslogan</label>
                  <input className="form-input" placeholder="Ej: La mejor tecnología para ti" value={config.tagline}
                    onChange={e => setConfig(c => ({ ...c, tagline: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción (para el footer)</label>
                  <textarea className="form-input" rows={3} placeholder="Describe tu tienda..." value={config.descripcion}
                    onChange={e => setConfig(c => ({ ...c, descripcion: e.target.value }))}
                    style={{ resize: 'vertical', minHeight: 72 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Dirección</label>
                  <input className="form-input" placeholder="Ej: Jr. Camaná 123, Lima" value={config.direccion}
                    onChange={e => setConfig(c => ({ ...c, direccion: e.target.value }))} />
                </div>
              </div>

              {/* REDES SOCIALES */}
              <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📲 Redes sociales y contacto</div>
                <div className="form-group">
                  <label className="form-label">📱 WhatsApp (solo número, ej: 51999888777)</label>
                  <input className="form-input" placeholder="51999888777" value={config.whatsapp}
                    onChange={e => setConfig(c => ({ ...c, whatsapp: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">📸 Instagram (usuario sin @)</label>
                  <input className="form-input" placeholder="futurteck" value={config.instagram}
                    onChange={e => setConfig(c => ({ ...c, instagram: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">🎵 TikTok (usuario sin @)</label>
                  <input className="form-input" placeholder="futurteck" value={config.tiktok}
                    onChange={e => setConfig(c => ({ ...c, tiktok: e.target.value }))} />
                </div>
              </div>

              {/* COLORES */}
              <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🎨 Colores del tema</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'color_primario',   label: 'Primario'   },
                    { key: 'color_secundario', label: 'Secundario' },
                    { key: 'color_acento',     label: 'Acento'     },
                  ].map(({ key, label }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="color"
                          value={config[key]}
                          onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                          style={{
                            width: 56, height: 56, borderRadius: 12,
                            border: '2px solid var(--border)', cursor: 'pointer',
                            padding: 2, background: 'none',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{config[key]}</span>
                    </div>
                  ))}
                </div>
                {/* Preview */}
                <div style={{
                  marginTop: 16, borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${config.color_primario}, ${config.color_secundario})`,
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{config.store_name || 'Tu Tienda'}</span>
                    <div style={{
                      background: config.color_acento,
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 8,
                    }}>Ver más</div>
                  </div>
                </div>
              </div>

              {/* HORARIOS */}
              <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🕐 Horarios de atención</div>
                {Object.entries(config.horarios || {}).map(([dia, hora]) => (
                  <div key={dia} className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <label style={{
                      minWidth: 80, fontSize: 12, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'capitalize',
                    }}>{dia}</label>
                    <input
                      className="form-input"
                      value={hora}
                      placeholder="9:00 - 18:00 o Cerrado"
                      onChange={e => setConfig(c => ({
                        ...c,
                        horarios: { ...c.horarios, [dia]: e.target.value },
                      }))}
                      style={{ flex: 1, fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>

              {/* SAVE BUTTON */}
              <button
                type="submit"
                disabled={configSaving}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: configSaving
                    ? 'var(--surface)'
                    : 'linear-gradient(135deg,#30D158,#34C759)',
                  border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: configSaving ? 'not-allowed' : 'pointer',
                  boxShadow: configSaving ? 'none' : '0 4px 20px rgba(48,209,88,0.35)',
                  marginBottom: 40,
                }}
              >
                {configSaving ? '⏳ Guardando...' : '💾 Guardar configuración'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {[
          { id: 'stock',    ico: '📦', lbl: 'Stock'    },
          { id: 'clientes', ico: '👥', lbl: 'Clientes' },
          { id: 'ventas',   ico: '📊', lbl: 'Ventas'   },
          { id: 'deudas',   ico: '💳', lbl: 'Deudas'   },
          { id: 'config',   ico: '⚙️', lbl: 'Config'   },
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

            {/* ── MODAL: Activar plataforma en tienda ── */}
            {modal === 'activar-plataforma' && (
              <>
                <div className="modal-title">🏪 Activar Plataforma</div>
                <form onSubmit={activarPlataforma}>
                  <div className="form-group">
                    <label className="form-label">Plataforma</label>
                    <select className="form-select" required value={form.tp_plat || ''} onChange={e => setForm({ ...form, tp_plat: e.target.value })}>
                      <option value="">Seleccionar…</option>
                      {allPlataformas.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.nombre} ({p.comision_pct}% comisión)</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tu cuenta / usuario vendedor (opcional)</label>
                    <input className="form-input" placeholder="futurteck_oficial, @futurteck..." value={form.tp_cuenta || ''} onChange={e => setForm({ ...form, tp_cuenta: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit">✅ Activar plataforma</button>
                </form>
              </>
            )}

            {/* ── MODAL: Nuevo reporte de plataforma ── */}
            {modal === 'add-liq-plat' && (() => {
              const ventas = parseFloat(form.lp_ventas) || 0;
              const comis  = parseFloat(form.lp_comisiones) || 0;
              const desc   = parseFloat(form.lp_descuentos) || 0;
              const otros  = parseFloat(form.lp_otros) || 0;
              const neto   = ventas - comis - desc - otros;
              const dep    = parseFloat(form.lp_depositado) || 0;
              const diff   = dep - neto;
              return (
                <>
                  <div className="modal-title">📄 Nuevo Reporte de Plataforma</div>
                  <form onSubmit={crearLiqPlat}>
                    <div className="form-group">
                      <label className="form-label">Plataforma</label>
                      <select className="form-select" required value={form.lp_plat || ''} onChange={e => {
                        const tp = misPlataformas.find(m => m.plataforma_id === e.target.value);
                        setForm({ ...form, lp_plat: e.target.value, lp_tp_id: tp?.id || null });
                      }}>
                        <option value="">Seleccionar…</option>
                        {misPlataformas.map(mp => <option key={mp.id} value={mp.plataforma_id}>{mp.plataformas_venta?.emoji} {mp.plataformas_venta?.nombre}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Período inicio</label>
                        <input className="form-input" type="date" required value={form.lp_inicio || ''} onChange={e => setForm({ ...form, lp_inicio: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Período fin</label>
                        <input className="form-input" type="date" required value={form.lp_fin || ''} onChange={e => setForm({ ...form, lp_fin: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '12px 0 8px' }}>💰 Montos del reporte (S/)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Ventas brutas</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.lp_ventas || ''} onChange={e => setForm({ ...form, lp_ventas: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Comisión plataforma</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.lp_comisiones || ''} onChange={e => setForm({ ...form, lp_comisiones: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Descuentos / promos</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.lp_descuentos || ''} onChange={e => setForm({ ...form, lp_descuentos: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Otros cargos</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.lp_otros || ''} onChange={e => setForm({ ...form, lp_otros: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">💰 Monto depositado</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.lp_depositado || ''} onChange={e => setForm({ ...form, lp_depositado: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">📅 Fecha depósito</label>
                        <input className="form-input" type="date" value={form.lp_fecha_dep || ''} onChange={e => setForm({ ...form, lp_fecha_dep: e.target.value })} />
                      </div>
                    </div>
                    {/* Preview reconciliación */}
                    {ventas > 0 && (
                      <div style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Neto calculado</span>
                          <span style={{ fontWeight: 700 }}>S/{neto.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Diferencia con depósito</span>
                          <span style={{ fontWeight: 800, color: Math.abs(diff) < 1 ? '#30D158' : '#FF6B00' }}>
                            {Math.abs(diff) < 1 ? '✅ Cuadra' : `${diff > 0 ? '+' : ''}S/${diff.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">📎 Adjuntar reporte (PDF/Excel, máx 10MB)</label>
                      <input ref={reporteRef} type="file" accept=".pdf,.xlsx,.xls,.csv,image/*" style={{ display: 'none' }} onChange={e => setForm({ ...form, lp_archivo: e.target.files?.[0] })} />
                      <button type="button" className="btn btn-outline btn-block" onClick={() => reporteRef.current?.click()}>
                        {form.lp_archivo ? `✅ ${form.lp_archivo.name}` : '📎 Seleccionar archivo'}
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notas (diferencias, observaciones)</label>
                      <textarea className="form-input" rows={2} placeholder="Todo ok / Hubo devolución de..." value={form.lp_notas || ''} onChange={e => setForm({ ...form, lp_notas: e.target.value })} style={{ resize: 'vertical' }} />
                    </div>
                    <button className="btn btn-primary" type="submit">📤 Enviar reporte a Corp</button>
                  </form>
                </>
              );
            })()}

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
