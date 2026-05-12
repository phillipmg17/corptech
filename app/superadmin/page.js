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

const ORGS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Corp Tech',       ico: '🏢', color: '#0A84FF' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',       ico: '🔵', color: '#30D158' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech Store', ico: '🟣', color: '#BF5AF2' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru',     ico: '🟢', color: '#FF9F0A' },
];

const STATUS_COLORS = {
  active:     { bg: 'var(--green-dim)',  color: 'var(--green)'  },
  built:      { bg: 'var(--blue-dim)',   color: 'var(--blue)'   },
  planned:    { bg: 'var(--orange-dim)', color: 'var(--orange)' },
  deprecated: { bg: 'var(--red-dim)',    color: 'var(--red)'    },
  new:        { bg: 'var(--blue-dim)',   color: 'var(--blue)'   },
  in_review:  { bg: 'var(--orange-dim)', color: 'var(--orange)' },
  resolved:   { bg: 'var(--green-dim)',  color: 'var(--green)'  },
  closed:     { bg: 'var(--card3)',      color: 'var(--text3)'  },
  passed:     { bg: 'var(--green-dim)',  color: 'var(--green)'  },
  failed:     { bg: 'var(--red-dim)',    color: 'var(--red)'    },
  pending:    { bg: 'var(--orange-dim)', color: 'var(--orange)' },
};

export default function SuperadminPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [loading,   setLoading]   = useState(true);
  const [me,        setMe]        = useState(null);
  const [tab,       setTab]       = useState('dashboard');
  const [toast,     setToast]     = useState(null);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState({});

  // Data
  const [kpis,      setKpis]      = useState({ orgs: 4, users: 0, stock: 0, sales: 0, revenue: 0, customers: 0 });
  const [orgStats,  setOrgStats]  = useState([]);
  const [credits,   setCredits]   = useState([]);
  const [creditTx,  setCreditTx]  = useState([]);
  const [features,  setFeatures]  = useState([]);
  const [bugs,      setBugs]      = useState([]);
  const [qaTests,   setQaTests]   = useState([]);
  const [users,     setUsers]     = useState([]);
  const [featureFilter, setFeatureFilter] = useState('all');
  const [apiSettings,   setApiSettings]   = useState([]);
  const [rechargeReqs,  setRechargeReqs]  = useState([]);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
    if (roleRow?.role !== 'superadmin') { router.replace('/dashboard'); return; }
    const { data: prof } = await supabase.from('users').select('full_name').eq('id', session.user.id).single();
    setMe({ id: session.user.id, name: prof?.full_name });
    await loadDashboard();
    setLoading(false);
  }

  async function loadDashboard() {
    const [
      { count: userCount },
      { count: stockCount },
      { data: salesData },
      { count: custCount },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('stock_items').select('id', { count: 'exact', head: true }).eq('status', 'available'),
      supabase.from('sales').select('total_amount, org_id'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
    ]);

    const revenue = (salesData || []).reduce((s, v) => s + (v.total_amount || 0), 0);

    // Stats por org
    const stats = ORGS.map(org => {
      const orgSales = (salesData || []).filter(s => s.org_id === org.id);
      return {
        ...org,
        sales: orgSales.length,
        revenue: orgSales.reduce((s, v) => s + (v.total_amount || 0), 0),
      };
    });

    setKpis({ orgs: 4, users: userCount || 0, stock: stockCount || 0, sales: (salesData || []).length, revenue, customers: custCount || 0 });
    setOrgStats(stats);
  }

  async function loadCredits() {
    const { data } = await supabase.from('org_credits').select('*, organizations(name)').order('updated_at', { ascending: false });
    setCredits(data || []);
    const { data: tx } = await supabase.from('credit_transactions').select('*, organizations(name)').order('created_at', { ascending: false }).limit(40);
    setCreditTx(tx || []);
  }

  async function loadFeatures() {
    const { data } = await supabase.from('feature_registry').select('*').order('code');
    setFeatures(data || []);
  }

  async function loadBugs() {
    const { data } = await supabase.from('bug_reports').select('*, users!reported_by(full_name), organizations(name)').order('created_at', { ascending: false });
    setBugs(data || []);
  }

  async function loadQA() {
    const { data } = await supabase.from('qa_test_cases').select('*').order('feature_code');
    setQaTests(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase.from('users').select('id, full_name, email, org_id, created_at, organizations(name), user_roles(role)').order('created_at', { ascending: false }).limit(60);
    setUsers(data || []);
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'creditos'  && credits.length === 0)  loadCredits();
    if (t === 'funciones' && features.length === 0) loadFeatures();
    if (t === 'bugs'      && bugs.length === 0)     loadBugs();
    if (t === 'qa'        && qaTests.length === 0)  loadQA();
    if (t === 'usuarios'  && users.length === 0)    loadUsers();
    if (t === 'apis')                               { loadApiSettings(); loadRechargeReqs(); }
  }

  /* ── API Settings ── */
  async function loadApiSettings() {
    const { data } = await supabase
      .from('api_settings')
      .select('*, organizations(name)')
      .order('created_at', { ascending: false });
    setApiSettings(data || []);
  }

  // Parsea "ID: Nombre :precio_usd" por línea → [{id, label, price}]
  function parseServicesText(txt) {
    return (txt || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const parts = l.split(':');
      const id    = (parts[0] || '').trim();
      // Último segmento: si es número, es el precio
      const lastPart = (parts[parts.length - 1] || '').trim();
      const isPrice  = parts.length >= 3 && !isNaN(parseFloat(lastPart));
      const label    = isPrice
        ? parts.slice(1, parts.length - 1).join(':').trim()
        : parts.slice(1).join(':').trim();
      const price    = isPrice ? lastPart : undefined;
      return { id, label: label || `Servicio ${id}`, ...(price ? { price } : {}) };
    });
  }

  async function saveApiSetting(e) {
    e.preventDefault();
    const services    = parseServicesText(form.api_services_txt);
    const providerKey = form.api_provider_key || 'sickw';
    // Endpoint por defecto según proveedor
    const defaultEndpoint = providerKey === 'imeicheck'
      ? 'https://alpha.imeicheck.com/api/php-api/create'
      : 'https://sickw.com/api.php';
    const payload = {
      org_id:           form.api_org_id,
      service:          'imei',
      provider:         providerKey,
      provider_name:    form.api_provider_name || (providerKey === 'imeicheck' ? 'IMEICheck.com' : 'Sickw'),
      api_key:          form.api_key,
      api_endpoint:     form.api_endpoint || defaultEndpoint,
      tokens_limit:     parseInt(form.api_tokens_limit) || 100,
      tokens_used:      parseInt(form.api_tokens_used)  || 0,
      allowed_services: services,
      is_active:        form.api_active !== false,
      notas:            form.api_notas || '',
      updated_at:       new Date().toISOString(),
    };
    const { error } = await supabase.from('api_settings')
      .upsert(payload, { onConflict: 'org_id,service,provider' });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('API configurada ✓');
    setModal(null); setForm({});
    loadApiSettings();
  }

  async function toggleApiActive(id, currentVal) {
    await supabase.from('api_settings').update({ is_active: !currentVal, updated_at: new Date().toISOString() }).eq('id', id);
    showToast(currentVal ? 'Acceso desactivado' : 'Acceso activado ✓');
    loadApiSettings();
  }

  /* ── Recargas de Tokens ── */
  async function loadRechargeReqs() {
    const { data } = await supabase
      .from('token_recharge_requests')
      .select('*, organizations(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    setRechargeReqs(data || []);
  }

  async function approveRecharge(req) {
    const tokensToGrant = req.tokens_requested;
    // Buscar la api_setting de la org (primer proveedor activo)
    const { data: apis } = await supabase
      .from('api_settings')
      .select('id, tokens_limit, org_id')
      .eq('org_id', req.org_id)
      .eq('service', 'imei')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1);

    if (apis && apis.length > 0) {
      const api = apis[0];
      await supabase.from('api_settings')
        .update({ tokens_limit: (api.tokens_limit || 0) + tokensToGrant, updated_at: new Date().toISOString() })
        .eq('id', api.id);
    }
    await supabase.from('token_recharge_requests').update({
      status:        'approved',
      tokens_granted: tokensToGrant,
      approved_by:   me?.id,
      approved_at:   new Date().toISOString(),
    }).eq('id', req.id);
    showToast(`✅ Recarga aprobada — +${tokensToGrant} tokens a ${req.organizations?.name}`);
    loadRechargeReqs();
    loadApiSettings();
  }

  async function rejectRecharge(id, reason) {
    await supabase.from('token_recharge_requests').update({
      status:           'rejected',
      rejection_reason: reason || 'Rechazado por SuperAdmin',
      approved_by:      me?.id,
      approved_at:      new Date().toISOString(),
    }).eq('id', id);
    showToast('Solicitud rechazada');
    loadRechargeReqs();
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── Asignar créditos ── */
  async function assignCredits(e) {
    e.preventDefault();
    const { error } = await supabase.from('org_credits')
      .upsert({ org_id: form.org_id, balance: parseInt(form.balance) || 0 }, { onConflict: 'org_id' });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    await supabase.from('credit_transactions').insert({
      org_id: form.org_id, amount: parseInt(form.amount) || 0,
      type: 'manual_assign', description: form.note || 'Asignación manual SA',
    });
    showToast('Créditos asignados ✓');
    setModal(null); setForm({});
    loadCredits();
  }

  /* ── Cambiar estado bug ── */
  async function updateBugStatus(id, status) {
    await supabase.from('bug_reports').update({ status }).eq('id', id);
    setBugs(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    showToast('Estado actualizado ✓');
  }

  /* ── Cambiar estado QA ── */
  async function updateQAStatus(id, status) {
    await supabase.from('qa_test_cases').update({ status }).eq('id', id);
    setQaTests(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    showToast('Test actualizado ✓');
  }

  /* ── Sincronizar QA desde feature_registry ── */
  const [syncing, setSyncing] = useState(false);
  async function syncQAFromFeatures() {
    setSyncing(true);
    // Cargar features y qa_test_cases actuales
    const { data: allFeatures } = await supabase.from('feature_registry').select('code, name, panel, description');
    const { data: existingQA }  = await supabase.from('qa_test_cases').select('feature_code');
    const existingCodes = new Set((existingQA || []).map(q => q.feature_code));
    const newFeatures   = (allFeatures || []).filter(f => !existingCodes.has(f.code));

    if (newFeatures.length === 0) {
      showToast('Todo al día — sin funciones nuevas que sincronizar ✓');
      setSyncing(false);
      return;
    }

    const rows = newFeatures.map(f => ({
      feature_code:    f.code,
      name:            `Verificar: ${f.name}`,
      steps:           `1. Abrir panel ${f.panel || f.code.split('-')[0]}\n2. Ejecutar función "${f.name}"\n3. Verificar resultado esperado`,
      expected_result: `La función "${f.name}" debe ejecutarse sin errores y mostrar el resultado correcto.`,
      status:          'pending',
    }));

    const { error } = await supabase.from('qa_test_cases').insert(rows);
    if (error) { showToast('Error: ' + error.message, 'err'); setSyncing(false); return; }

    showToast(`✅ ${newFeatures.length} caso${newFeatures.length !== 1 ? 's' : ''} de QA generado${newFeatures.length !== 1 ? 's' : ''}`);
    await loadQA();
    setSyncing(false);
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const panelCodes = [...new Set(features.map(f => f.panel || f.code?.split('-')[0]))].filter(Boolean);
  const filteredFeatures = featureFilter === 'all' ? features : features.filter(f => (f.panel || f.code?.split('-')[0]) === featureFilter);

  if (loading) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-wrap">

      {/* TOP BAR */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div className="top-bar-title">SuperAdmin</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/dashboard" className="top-btn" title="Dashboard">🏠</Link>
          <button className="top-btn-logout" onClick={doLogout}>Salir</button>
        </div>
      </div>

      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      {/* CONTENT */}
      <div className="content">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div style={{ padding: '16px' }}>

            {/* KPI grid */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="kpi"><div className="kpi-ico">👥</div><div className="kpi-val">{kpis.users}</div><div className="kpi-lbl">Usuarios</div></div>
              <div className="kpi"><div className="kpi-ico">📦</div><div className="kpi-val">{kpis.stock}</div><div className="kpi-lbl">Stock</div></div>
              <div className="kpi"><div className="kpi-ico">🛒</div><div className="kpi-val">{kpis.sales}</div><div className="kpi-lbl">Ventas</div></div>
              <div className="kpi"><div className="kpi-ico">💰</div><div className="kpi-val" style={{ fontSize: 20 }}>S/{kpis.revenue.toFixed(0)}</div><div className="kpi-lbl">Ingresos</div></div>
              <div className="kpi"><div className="kpi-ico">👤</div><div className="kpi-val">{kpis.customers}</div><div className="kpi-lbl">Clientes</div></div>
              <div className="kpi"><div className="kpi-ico">🏢</div><div className="kpi-val">{kpis.orgs}</div><div className="kpi-lbl">Empresas</div></div>
            </div>

            {/* Resumen por empresa */}
            <div className="section-title">📊 Rendimiento por empresa</div>
            {orgStats.map(org => (
              <div className="card" key={org.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: org.color + '22', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 24, flexShrink: 0,
                  }}>{org.ico}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{org.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {org.sales} ventas
                    </div>
                    {/* barra de progreso */}
                    <div style={{ marginTop: 8, height: 6, background: 'var(--card2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: org.color,
                        width: kpis.revenue > 0 ? `${Math.min(100, (org.revenue / kpis.revenue) * 100)}%` : '0%',
                        transition: 'width .6s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--green)' }}>S/{org.revenue.toFixed(0)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {kpis.revenue > 0 ? ((org.revenue / kpis.revenue) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Accesos rápidos */}
            <div className="section-title" style={{ marginTop: 20 }}>🔗 Paneles</div>
            <div className="quick-links">
              {[
                { href: '/corp',  ico: '🏢', lbl: 'Corp Admin' },
                { href: '/store', ico: '🏪', lbl: 'Tienda'     },
                { href: '/pos',   ico: '🛒', lbl: 'POS'        },
                { href: '/dashboard', ico: '📊', lbl: 'Dashboard' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="quick-link">
                  <span className="ico">{l.ico}</span>
                  <span className="lbl">{l.lbl}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── USUARIOS ── */}
        {tab === 'usuarios' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">👥 Todos los usuarios ({users.length})</div>
            {users.length === 0 ? <div className="empty-msg">Sin usuarios</div> : (
              <div className="card">
                {users.map(u => (
                  <div className="list-item" key={u.id}>
                    <div className="list-item-ico">👤</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{u.full_name}</div>
                      <div className="list-item-sub">{u.email} · {u.organizations?.name || '—'}</div>
                    </div>
                    <span className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                      {u.user_roles?.[0]?.role || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CRÉDITOS ── */}
        {tab === 'creditos' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">💎 Créditos por empresa</div>
              <button className="section-action" onClick={() => { setModal('credits'); setForm({}); }}>+ Asignar</button>
            </div>

            {credits.length === 0 ? (
              <div className="empty-msg">Sin registros de créditos — pulsa "+ Asignar" para inicializar</div>
            ) : (
              credits.map(c => {
                const org = ORGS.find(o => o.id === c.org_id);
                const pct = Math.min(100, ((c.balance || 0) / 500) * 100);
                return (
                  <div className="card" key={c.org_id} style={{ marginBottom: 10 }}>
                    <div className="flex-between mb-8">
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 26 }}>{org?.ico || '🏢'}</span>
                        <div>
                          <div style={{ fontWeight: 800 }}>{c.organizations?.name || org?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            Actualizado: {new Date(c.updated_at).toLocaleDateString('es-PE')}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: 22, color: c.balance < 50 ? 'var(--red)' : 'var(--yellow)' }}>
                          {c.balance || 0}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>créditos</div>
                      </div>
                    </div>
                    <div style={{ height: 8, background: 'var(--card2)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 6,
                        background: c.balance < 50 ? 'var(--red)' : 'linear-gradient(90deg, #0A84FF, #BF5AF2)',
                        width: `${pct}%`, transition: 'width .5s ease',
                      }} />
                    </div>
                    {c.balance < 50 && (
                      <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8, fontWeight: 700 }}>
                        ⚠️ Saldo bajo — recarga pronto
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {creditTx.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 20 }}>📋 Historial de transacciones</div>
                <div className="card">
                  {creditTx.map(tx => (
                    <div className="list-item" key={tx.id}>
                      <div className="list-item-ico">{tx.amount > 0 ? '➕' : '➖'}</div>
                      <div className="list-item-body">
                        <div className="list-item-name">{tx.organizations?.name || '—'}</div>
                        <div className="list-item-sub">{tx.description || tx.type} · {new Date(tx.created_at).toLocaleDateString('es-PE')}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: tx.amount > 0 ? 'var(--green)' : 'var(--red)', fontSize: 15 }}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── FUNCIONES ── */}
        {tab === 'funciones' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">🧩 Funciones ({features.length})</div>
            </div>

            {/* Filtro por panel */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', ...panelCodes].map(p => (
                <button key={p} onClick={() => setFeatureFilter(p)}
                  className={`btn btn-sm${featureFilter === p ? ' btn-primary' : ' btn-outline'}`}>
                  {p === 'all' ? '🌐 Todas' : p}
                </button>
              ))}
            </div>

            {filteredFeatures.length === 0 ? (
              <div className="empty-msg">Sin funciones registradas</div>
            ) : (
              <div className="card">
                {filteredFeatures.map(f => {
                  const sc = STATUS_COLORS[f.status] || STATUS_COLORS.planned;
                  return (
                    <div className="list-item" key={f.id || f.code}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: 'var(--card2)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 900, fontSize: 10, color: 'var(--blue)',
                      }}>{f.code}</div>
                      <div className="list-item-body">
                        <div className="list-item-name">{f.name}</div>
                        <div className="list-item-sub">{f.panel || '—'} · {f.description?.slice(0, 60) || '—'}</div>
                      </div>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, textTransform: 'uppercase', fontSize: 9, whiteSpace: 'nowrap' }}>
                        {f.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BUGS ── */}
        {tab === 'bugs' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">🐛 Reportes de error ({bugs.length})</div>
            {bugs.length === 0 ? (
              <div className="empty-msg">Sin bugs reportados 🎉</div>
            ) : (
              bugs.map(b => {
                const sc = STATUS_COLORS[b.status] || STATUS_COLORS.new;
                return (
                  <div className="card" key={b.id} style={{ marginBottom: 10 }}>
                    <div className="flex-between mb-8">
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                          {b.users?.full_name || 'Anónimo'} · {b.organizations?.name || '—'} · {new Date(b.created_at).toLocaleDateString('es-PE')}
                        </div>
                        {b.description && (
                          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6, lineHeight: 1.4 }}>{b.description}</div>
                        )}
                      </div>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, textTransform: 'uppercase', fontSize: 10, flexShrink: 0 }}>
                        {b.status}
                      </span>
                    </div>
                    {/* Acciones rápidas */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {['new','in_review','resolved','closed'].map(s => (
                        <button key={s} onClick={() => updateBugStatus(b.id, s)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: 11, padding: '5px 10px', opacity: b.status === s ? 1 : 0.5 }}>
                          {s === 'new' ? '🆕' : s === 'in_review' ? '🔍' : s === 'resolved' ? '✅' : '🔒'} {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── QA ── */}
        {tab === 'qa' && (
          <div style={{ padding: '16px' }}>
            {/* Header con botón sync */}
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div>
                <div className="section-title" style={{ marginBottom: 2 }}>🧪 Control de Calidad</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {qaTests.filter(t => t.status === 'passed').length} ✅ · {qaTests.filter(t => t.status === 'failed').length} ❌ · {qaTests.filter(t => t.status === 'pending').length} ⏳
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={syncQAFromFeatures}
                disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar QA'}
              </button>
            </div>

            {/* Info box */}
            <div style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text3)' }}>
              💡 El botón <b style={{ color: 'var(--blue)' }}>Sincronizar QA</b> genera automáticamente un caso de prueba por cada función nueva en el registro. Nunca se borra lo existente.
            </div>

            {qaTests.length === 0 ? (
              <div className="empty-msg">Sin casos de prueba — presiona Sincronizar QA para generarlos</div>
            ) : (
              qaTests.map(t => {
                const sc = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
                return (
                  <div className="card" key={t.id} style={{ marginBottom: 10 }}>
                    <div className="flex-between mb-8">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ background: 'var(--card2)', color: 'var(--blue)', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6 }}>{t.feature_code}</span>
                          <span style={{ fontWeight: 800, fontSize: 14 }}>{t.name}</span>
                        </div>
                        {t.steps && (
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4, whiteSpace: 'pre-line' }}>📋 {t.steps}</div>
                        )}
                        {t.expected_result && (
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>✔️ {t.expected_result}</div>
                        )}
                      </div>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, textTransform: 'uppercase', fontSize: 10, flexShrink: 0, marginLeft: 10 }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {['pending','passed','failed'].map(s => (
                        <button key={s} onClick={() => updateQAStatus(t.id, s)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: 11, padding: '5px 10px', opacity: t.status === s ? 1 : 0.5 }}>
                          {s === 'pending' ? '⏳' : s === 'passed' ? '✅' : '❌'} {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB: APIs ── */}
        {tab === 'apis' && (
          <div style={{ padding: '16px' }}>
            <div className="section-header">
              <div className="section-title">🔑 APIs IMEI — Integraciones</div>
              <button className="section-action" onClick={() => { setModal('add-api'); setForm({ api_tokens_limit: '100', api_tokens_used: '0', api_active: true, api_provider_key: 'sickw', api_endpoint: 'https://sickw.com/api.php' }); }}>
                + Configurar
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Asigna API key, tokens y servicios permitidos a cada organización. La key solo la ves tú.
            </div>

            {apiSettings.length === 0 ? (
              <div className="empty-msg">Sin APIs configuradas. Toca "+ Configurar" para agregar.</div>
            ) : (
              apiSettings.map(api => {
                const restantes = (api.tokens_limit || 0) - (api.tokens_used || 0);
                const services  = api.allowed_services || [];
                return (
                  <div key={api.id} className="card" style={{ padding: '14px', marginBottom: 12 }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                            background: (api.provider || 'sickw') === 'imeicheck' ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.15)',
                            color:      (api.provider || 'sickw') === 'imeicheck' ? '#30D158' : '#4DA8FF',
                          }}>
                            {(api.provider || 'sickw') === 'imeicheck' ? 'IMEICheck' : 'Sickw'}
                          </span>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {api.provider_name || 'IMEI API'} — {api.organizations?.name}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                          Key: {api.api_key ? `${api.api_key.substring(0, 8)}...` : '⚠️ Sin key'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          {api.api_endpoint}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleApiActive(api.id, api.is_active)}
                        style={{
                          padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: api.is_active ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)',
                          color: api.is_active ? '#30D158' : '#FF453A',
                          fontSize: 12, fontWeight: 700,
                        }}>
                        {api.is_active ? '✅ Activo' : '🔴 Inactivo'}
                      </button>
                    </div>

                    {/* Tokens */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Usados</div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>{api.tokens_used || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(10,132,255,0.1)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#4DA8FF', fontWeight: 700, textTransform: 'uppercase' }}>Límite</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#4DA8FF' }}>{api.tokens_limit || 0}</div>
                      </div>
                      <div style={{ background: restantes > 10 ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>🪙 Tokens</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: restantes > 10 ? '#30D158' : '#FF453A' }}>{restantes}</div>
                      </div>
                    </div>

                    {/* Servicios habilitados */}
                    {services.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>
                          Servicios habilitados ({services.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {services.map(s => (
                            <span key={s.id} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(94,92,230,0.15)', color: '#A78BFA', fontSize: 11, fontWeight: 600 }}>
                              [{s.id}] {s.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {api.notas && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>📝 {api.notas}</div>}

                    <button
                      onClick={() => {
                        const svcs = (api.allowed_services || []).map(s => `${s.id}: ${s.label}${s.price ? ':' + s.price : ''}`).join('\n');
                        setForm({
                          api_org_id:        api.org_id,
                          api_provider_key:  api.provider || 'sickw',
                          api_provider_name: api.provider_name,
                          api_key:           api.api_key,
                          api_endpoint:      api.api_endpoint,
                          api_tokens_limit:  String(api.tokens_limit || 100),
                          api_tokens_used:   String(api.tokens_used || 0),
                          api_active:        api.is_active,
                          api_notas:         api.notas,
                          api_services_txt:  svcs,
                        });
                        setModal('add-api');
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      ✏️ Editar configuración
                    </button>
                  </div>
                );
              })
            )}

            {/* ── SOLICITUDES DE RECARGA DE TOKENS ── */}
            <div style={{ marginTop: 28, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="section-title" style={{ margin: 0 }}>💳 Solicitudes de Recarga</div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}>
                  {rechargeReqs.filter(r => r.status === 'pending').length} pendientes
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                Conversion: <b>S/1.00 = 1 token</b>. Al aprobar se suman los tokens al primer proveedor activo de la org.
              </div>
              {rechargeReqs.length === 0 ? (
                <div className="empty-msg">Sin solicitudes</div>
              ) : (
                rechargeReqs.map(req => {
                  const isPending  = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const statusCfg  = { pending: { color:'#FF9F0A', bg:'rgba(255,159,10,0.15)', txt:'⏳ Pendiente' }, approved: { color:'#30D158', bg:'rgba(48,209,88,0.15)', txt:'✅ Aprobado' }, rejected: { color:'#FF453A', bg:'rgba(255,69,58,0.15)', txt:'❌ Rechazado' } };
                  const sc = statusCfg[req.status] || statusCfg.pending;
                  return (
                    <div key={req.id} className="card" style={{ padding: '14px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {req.organizations?.name || req.org_id.substring(0,8)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {req.payment_method === 'yape' ? '💜 Yape' : '🏦 Transferencia'} · {new Date(req.created_at).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </div>
                          {req.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📝 {req.notes}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: 20, color: '#FF9F0A' }}>S/{parseFloat(req.amount_soles).toFixed(2)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.tokens_requested} tokens</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: sc.bg, color: sc.color }}>{sc.txt}</span>
                        </div>
                      </div>

                      {/* Screenshot */}
                      {req.screenshot_url && (
                        <div style={{ marginBottom: 10 }}>
                          <a href={req.screenshot_url} target="_blank" rel="noreferrer">
                            <img
                              src={req.screenshot_url}
                              alt="Comprobante"
                              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                            />
                          </a>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: 'center' }}>
                            📷 Tocar para ver comprobante completo
                          </div>
                        </div>
                      )}

                      {/* Botones acción */}
                      {isPending && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <button
                            onClick={() => approveRecharge(req)}
                            style={{ padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(48,209,88,0.2)', color: '#30D158', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                            ✅ Aprobar +{req.tokens_requested} tokens
                          </button>
                          <button
                            onClick={() => { const r = prompt('Motivo de rechazo (opcional):'); rejectRecharge(req.id, r); }}
                            style={{ padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(255,69,58,0.15)', color: '#FF453A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            ❌ Rechazar
                          </button>
                        </div>
                      )}
                      {isApproved && (
                        <div style={{ fontSize: 12, color: '#30D158', fontWeight: 700, textAlign: 'center', padding: '6px' }}>
                          ✅ Tokens otorgados: +{req.tokens_granted}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {[
          { id: 'dashboard', ico: '⚡', lbl: 'Dashboard' },
          { id: 'usuarios',  ico: '👥', lbl: 'Usuarios'  },
          { id: 'creditos',  ico: '💎', lbl: 'Créditos'  },
          { id: 'apis',      ico: '🔑', lbl: 'APIs'      },
          { id: 'funciones', ico: '🧩', lbl: 'Funciones' },
          { id: 'bugs',      ico: '🐛', lbl: 'Bugs'      },
          { id: 'qa',        ico: '🧪', lbl: 'QA'        },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => switchTab(t.id)}>
            <span className="ico">{t.ico}</span>{t.lbl}
          </button>
        ))}
      </div>

      {/* ── MODAL API SETTINGS ── */}
      {modal === 'add-api' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <div className="modal-title">🔑 Configurar API IMEI</div>
            <form onSubmit={saveApiSetting}>

              {/* Org */}
              <div className="form-group">
                <label className="form-label">Organización</label>
                <select className="form-select" required value={form.api_org_id || ''} onChange={e => setForm({ ...form, api_org_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {ORGS.map(o => <option key={o.id} value={o.id}>{o.ico} {o.name}</option>)}
                </select>
              </div>

              {/* Proveedor (selector técnico) */}
              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'sickw',     label: 'Sickw',          endpoint: 'https://sickw.com/api.php',                           color: '#0A84FF', hint: 'Respuesta texto Key: Value' },
                    { key: 'imeicheck', label: 'IMEICheck.com',   endpoint: 'https://alpha.imeicheck.com/api/php-api/create',      color: '#30D158', hint: 'Respuesta JSON estructurada' },
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setForm({ ...form, api_provider_key: p.key, api_endpoint: p.endpoint, api_provider_name: p.label })}
                      style={{
                        padding: '10px 8px', borderRadius: 10, border: `2px solid ${(form.api_provider_key || 'sickw') === p.key ? p.color : 'var(--border)'}`,
                        background: (form.api_provider_key || 'sickw') === p.key ? `${p.color}22` : 'var(--surface)',
                        cursor: 'pointer', textAlign: 'center',
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: (form.api_provider_key || 'sickw') === p.key ? p.color : 'var(--text)' }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{p.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input className="form-input" required placeholder="Pega aquí la key del proveedor"
                  value={form.api_key || ''} onChange={e => setForm({ ...form, api_key: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: 12 }} />
              </div>

              {/* Endpoint (auto-llenado pero editable) */}
              <div className="form-group">
                <label className="form-label">URL del endpoint API</label>
                <input className="form-input"
                  value={form.api_endpoint || ((form.api_provider_key || 'sickw') === 'imeicheck' ? 'https://alpha.imeicheck.com/api/php-api/create' : 'https://sickw.com/api.php')}
                  onChange={e => setForm({ ...form, api_endpoint: e.target.value })} />
              </div>

              {/* Tokens */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label">🪙 Límite de tokens</label>
                  <input className="form-input" type="number" min="0"
                    value={form.api_tokens_limit || '100'} onChange={e => setForm({ ...form, api_tokens_limit: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label">Tokens usados (reset=0)</label>
                  <input className="form-input" type="number" min="0"
                    value={form.api_tokens_used || '0'} onChange={e => setForm({ ...form, api_tokens_used: e.target.value })} />
                </div>
              </div>

              {/* Servicios permitidos */}
              <div className="form-group">
                <label className="form-label">Servicios habilitados</label>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Una línea por servicio. Formato: <code style={{ background:'var(--surface)', padding:'1px 4px', borderRadius:4 }}>ID: Nombre : precio_usd</code><br/>
                  {(form.api_provider_key || 'sickw') === 'imeicheck'
                    ? <span>Ej IMEICheck: <code style={{ background:'var(--surface)', padding:'1px 4px', borderRadius:4 }}>1: Find My iPhone:0.01</code></span>
                    : <span>Ej Sickw: <code style={{ background:'var(--surface)', padding:'1px 4px', borderRadius:4 }}>12: Apple Info:0.07</code></span>}
                </div>
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder={(form.api_provider_key || 'sickw') === 'imeicheck'
                    ? '1: Find My iPhone:0.01\n2: Warranty + Activation:0.02\n3: Apple FULL INFO:0.07\n4: iCloud Clean/Lost:0.02\n5: Blacklist Status:0.02\n13: Model+Color+Storage+FMI:0.02'
                    : '12: Apple Info (modelo, activación, FMI):0.07\n8: Blacklist / Reportado robado:0.04\n15: Samsung Info:0.04'}
                  value={form.api_services_txt || ''}
                  onChange={e => setForm({ ...form, api_services_txt: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
                />
              </div>

              {/* Notas */}
              <div className="form-group">
                <label className="form-label">Notas internas</label>
                <input className="form-input" placeholder="Plan básico, renovar en julio, etc."
                  value={form.api_notas || ''} onChange={e => setForm({ ...form, api_notas: e.target.value })} />
              </div>

              {/* Activar */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="api_active_chk" checked={form.api_active !== false}
                  onChange={e => setForm({ ...form, api_active: e.target.checked })}
                  style={{ width: 18, height: 18 }} />
                <label htmlFor="api_active_chk" style={{ fontSize: 13, fontWeight: 600 }}>Activar acceso inmediatamente</label>
              </div>

              <button className="btn btn-primary" type="submit">💾 Guardar configuración</button>
            </form>
            <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── MODAL CRÉDITOS ── */}
      {modal === 'credits' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <div className="modal-title">💎 Asignar créditos</div>
            <form onSubmit={assignCredits}>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <select className="form-select" required value={form.org_id || ''} onChange={e => setForm({ ...form, org_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {ORGS.map(o => <option key={o.id} value={o.id}>{o.ico} {o.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nuevo saldo total (créditos)</label>
                <input className="form-input" type="number" required placeholder="500"
                  value={form.balance || ''} onChange={e => setForm({ ...form, balance: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad asignada en esta operación</label>
                <input className="form-input" type="number" required placeholder="100"
                  value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Nota (opcional)</label>
                <input className="form-input" placeholder="Recarga mensual..."
                  value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit">Guardar créditos</button>
            </form>
            <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
