'use client';
import { useState, useEffect, useCallback } from 'react';
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

const FX_URL  = 'https://api.frankfurter.app/latest?from=USD&to=PEN';
const FX_BK   = 'https://open.er-api.com/v6/latest/USD';

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [profile,   setProfile]   = useState(null);
  const [role,      setRole]      = useState('');
  const [orgName,   setOrgName]   = useState('');
  const [orgId,     setOrgId]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('inicio');
  const [kpis,      setKpis]      = useState({ ventas: 0, stock: 0, clientes: 0, ingresos: 0 });
  const [stocks,    setStocks]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales,     setSales]     = useState([]);
  const [fx,        setFx]        = useState(null);
  const [fxDate,    setFxDate]    = useState('');
  const [toast,     setToast]     = useState(null);

  /* ── AUTH CHECK ── */
  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;

    const { data: prof } = await supabase.from('users').select('*, organizations(name)').eq('id', uid).single();
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
    const r = roleRow?.role || 'vendedor';
    const oid = prof?.org_id;

    setProfile(prof);
    setRole(r);
    setOrgId(oid);
    setOrgName(prof?.organizations?.name || 'Corp Tech');

    // Si es gerente de tienda y no ha hecho onboarding → redirigir a setup
    if (r === 'store_manager' || r === 'admin_corp') {
      const { data: stSettings } = await supabase.from('org_settings').select('onboarding_done').eq('org_id', oid).single();
      if (!stSettings || !stSettings.onboarding_done) {
        router.replace('/setup'); return;
      }
    }

    setLoading(false);
    loadFx();
    loadKpis(r, oid);
  }

  async function loadFx() {
    try {
      const res  = await fetch(FX_URL, { cache: 'no-store' });
      const json = await res.json();
      const rate = json?.rates?.PEN;
      if (rate) { setFx(rate.toFixed(2)); setFxDate(json.date || ''); return; }
    } catch {}
    try {
      const res  = await fetch(FX_BK,  { cache: 'no-store' });
      const json = await res.json();
      const rate = json?.rates?.PEN;
      if (rate) { setFx(rate.toFixed(2)); }
    } catch {}
  }

  async function loadKpis(r, oid) {
    const isCorp = r === 'superadmin' || r === 'corp';
    const stockQ = supabase.from('stock_items').select('id', { count: 'exact', head: true }).eq('status', 'available');
    if (!isCorp) stockQ.eq('owner_org_id', oid);
    const { count: stockCount } = await stockQ;

    const custQ = supabase.from('customers').select('id', { count: 'exact', head: true });
    if (!isCorp) custQ.eq('org_id', oid);
    const { count: custCount } = await custQ;

    const salesQ = supabase.from('sales').select('total_amount');
    if (!isCorp) salesQ.eq('org_id', oid);
    const { data: salesData } = await salesQ;
    const total = (salesData || []).reduce((s, v) => s + (v.total_amount || 0), 0);

    setKpis({ stock: stockCount || 0, clientes: custCount || 0, ingresos: total, ventas: (salesData || []).length });
  }

  async function loadStocks() {
    const isCorp = role === 'superadmin' || role === 'corp';
    const q = supabase.from('stock_items').select('id, serial_number, imei, status, sale_price, emoji, owner_org_id, products(name)').eq('status', 'available').limit(50);
    if (!isCorp) q.eq('owner_org_id', orgId);
    const { data } = await q;
    setStocks(data || []);
  }

  async function loadCustomers() {
    const isCorp = role === 'superadmin' || role === 'corp';
    const q = supabase.from('customers').select('id, full_name, phone, email, org_id').limit(50);
    if (!isCorp) q.eq('org_id', orgId);
    const { data } = await q;
    setCustomers(data || []);
  }

  async function loadSales() {
    const isCorp = role === 'superadmin' || role === 'corp';
    const q = supabase.from('sales').select('id, total_amount, payment_method, created_at, customers(full_name)').order('created_at', { ascending: false }).limit(30);
    if (!isCorp) q.eq('org_id', orgId);
    const { data } = await q;
    setSales(data || []);
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'stock'     && stocks.length === 0)    loadStocks();
    if (t === 'clientes'  && customers.length === 0) loadCustomers();
    if (t === 'ventas'    && sales.length === 0)     loadSales();
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── QUICK LINKS by role ── */
  const LINKS = {
    superadmin: [
      { href: '/pos',         ico: '🛒', lbl: 'Punto de Venta' },
      { href: '/store',       ico: '🏪', lbl: 'Panel Tienda' },
      { href: '/corp',        ico: '🏢', lbl: 'Panel Corp' },
      { href: '/chat',        ico: '💬', lbl: 'Chat Interno' },
      { href: '/superadmin',  ico: '⚡', lbl: 'SuperAdmin' },
      { href: '/biometrics',  ico: '🔐', lbl: 'Mi Carnet QR' },
    ],
    corp: [
      { href: '/pos',        ico: '🛒', lbl: 'Punto de Venta' },
      { href: '/corp',       ico: '🏢', lbl: 'Panel Corp' },
      { href: '/chat',       ico: '💬', lbl: 'Chat Interno' },
      { href: '/biometrics', ico: '🔐', lbl: 'Mi Carnet QR' },
    ],
    gerente: [
      { href: '/pos',        ico: '🛒', lbl: 'Punto de Venta' },
      { href: '/store',      ico: '🏪', lbl: 'Panel Tienda' },
      { href: '/chat',       ico: '💬', lbl: 'Chat con Corp' },
      { href: '/biometrics', ico: '🔐', lbl: 'Mi Carnet QR' },
    ],
    vendedor: [
      { href: '/pos',        ico: '🛒', lbl: 'Punto de Venta' },
      { href: '/biometrics', ico: '🔐', lbl: 'Mi Carnet QR' },
    ],
  };
  const quickLinks = LINKS[role] || LINKS.vendedor;

  const BADGE_COLOR = { superadmin: '#BF5AF2', corp: '#0A84FF', gerente: '#30D158', vendedor: '#FF9F0A' };

  if (loading) return (
    <div className="auth-screen">
      <div className="loading-wrap"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="page-wrap">
      {/* TOP BAR */}
      <div className="top-bar">
        <div>
          <div className="top-bar-title">🏢 {orgName}</div>
          <div className="top-bar-sub">{profile?.full_name}</div>
        </div>
        <div className="top-bar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="badge" style={{ background: BADGE_COLOR[role], color: '#fff' }}>
            {role?.toUpperCase()}
          </span>
          <button className="top-btn-logout" onClick={doLogout}>Salir</button>
        </div>
      </div>

      {/* TOAST */}
      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      {/* CONTENT */}
      <div className="content">

        {/* ── INICIO ── */}
        {tab === 'inicio' && (
          <div style={{ padding: '16px' }}>
            {/* Tipo de cambio */}
            <div className="fx-card">
              <div>
                <div className="fx-label">Tipo de Cambio USD/PEN</div>
                <div className="fx-rate">{fx ? `S/ ${fx}` : '—'}</div>
                {fxDate && <div className="fx-label" style={{ marginTop: 2 }}>{fxDate}</div>}
              </div>
              <div style={{ fontSize: 32 }}>💱</div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-ico">📦</div>
                <div className="kpi-val">{kpis.stock}</div>
                <div className="kpi-lbl">Stock disponible</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">👥</div>
                <div className="kpi-val">{kpis.clientes}</div>
                <div className="kpi-lbl">Clientes</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">🛒</div>
                <div className="kpi-val">{kpis.ventas}</div>
                <div className="kpi-lbl">Ventas totales</div>
              </div>
              <div className="kpi">
                <div className="kpi-ico">💰</div>
                <div className="kpi-val">S/{kpis.ingresos.toFixed(0)}</div>
                <div className="kpi-lbl">Ingresos</div>
              </div>
            </div>

            {/* Quick links */}
            <div className="section-title">Accesos rápidos</div>
            <div className="quick-links">
              {quickLinks.map(l => (
                <Link key={l.href} href={l.href} className="quick-link">
                  <span className="ico">{l.ico}</span>
                  <span className="lbl">{l.lbl}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── STOCK ── */}
        {tab === 'stock' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">📦 Stock disponible</div>
            {stocks.length === 0 ? (
              <div className="empty-msg">Sin registros de stock</div>
            ) : (
              stocks.map(s => (
                <div className="card" key={s.id} style={{ marginBottom: 10 }}>
                  <div className="flex-between">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 28 }}>{s.emoji || '📦'}</span>
                      <div>
                        <div className="font-bold">{s.products?.name || 'Producto'}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{s.imei || s.serial_number || '—'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-green font-bold">S/{(s.sale_price || 0).toFixed(2)}</div>
                      <span className={`badge badge-${s.status === 'available' ? 'green' : 'orange'}`}>{s.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CLIENTES ── */}
        {tab === 'clientes' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">👥 Clientes</div>
            {customers.length === 0 ? (
              <div className="empty-msg">Sin clientes registrados</div>
            ) : (
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
            <div className="section-title">📊 Ventas recientes</div>
            {sales.length === 0 ? (
              <div className="empty-msg">Sin ventas registradas</div>
            ) : (
              <div className="card">
                {sales.map(s => (
                  <div className="list-item" key={s.id}>
                    <div className="list-item-ico">🧾</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{s.customers?.full_name || 'Sin nombre'}</div>
                      <div className="list-item-sub">
                        {s.payment_method || 'efectivo'} · {new Date(s.created_at).toLocaleDateString('es-PE')}
                      </div>
                    </div>
                    <div className="list-item-val">S/{(s.total_amount || 0).toFixed(2)}</div>
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
          { id: 'inicio',   ico: '🏠', lbl: 'Inicio'   },
          { id: 'stock',    ico: '📦', lbl: 'Stock'    },
          { id: 'clientes', ico: '👥', lbl: 'Clientes' },
          { id: 'ventas',   ico: '📊', lbl: 'Ventas'   },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id ? ' active' : ''}`} onClick={() => switchTab(t.id)}>
            <span className="ico">{t.ico}</span>
            {t.lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
