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
  const [me,             setMe]             = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stocks,      setStocks]      = useState([]);
  const [sales,       setSales]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [kpis,        setKpis]        = useState({ totalStock: 0, totalSales: 0, totalRevenue: 0 });
  const [storeFilter, setStoreFilter] = useState('all');
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [products,    setProducts]    = useState([]);
  const [toast,       setToast]       = useState(null);
  const [prodSearch,  setProdSearch]  = useState('');
  const [stockCatFilter, setStockCatFilter] = useState('all');

  /* ── ALMACENES ── */
  const [warehouses,  setWarehouses]  = useState([]);

  /* ── TRASLADOS ── */
  const [transfers,   setTransfers]   = useState([]);
  const [corpStock,   setCorpStock]   = useState([]);
  const [selItems,    setSelItems]    = useState([]);
  const [txFilter,    setTxFilter]    = useState('all');

  /* ── IMPORTACIÓN ── */
  const [batches,     setBatches]     = useState([]);
  const [usdRate,     setUsdRate]     = useState('');
  const [loadingRate, setLoadingRate] = useState(false);
  const [tcMode,      setTcMode]      = useState('auto'); // 'auto' | 'manual'

  /* ── FINANZAS ── */
  const [finFx,       setFinFx]       = useState(null);
  const [finData,     setFinData]     = useState({ stockVal: 0, stockValUSD: 0, inTransitVal: 0, stockCount: 0, transitCount: 0, byStore: [] });
  const [cashAccounts,setCashAccounts]= useState([]);
  const [cashTotals,  setCashTotals]  = useState({ banks_pen: 0, platforms_pen: 0, cash_pen: 0, total_pen: 0, total_usd: 0 });
  const [finLoading,  setFinLoading]  = useState(false);

  /* ── DASHBOARD ── */
  const [dashData,    setDashData]    = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  /* ── FINANZAS COMPLETO — sub-tabs ── */
  const [finSubTab,           setFinSubTab]           = useState('caja');

  // Sueldos
  const [employees,           setEmployees]           = useState([]);
  const [empLoading,          setEmpLoading]          = useState(false);
  const [empOrgFilter,        setEmpOrgFilter]        = useState('all');
  const [empStatusFilter,     setEmpStatusFilter]     = useState('activo');
  const [salaryPayments,      setSalaryPayments]      = useState([]);
  const [empDetailId,         setEmpDetailId]         = useState(null);

  // Deudores
  const [debtors,             setDebtors]             = useState([]);
  const [debtorLoading,       setDebtorLoading]       = useState(false);
  const [debtorOrgFilter,     setDebtorOrgFilter]     = useState('all');
  const [debtorStatusFilter,  setDebtorStatusFilter]  = useState('activo');

  // Deudas empresa
  const [compDebts,           setCompDebts]           = useState([]);
  const [compDebtLoading,     setCompDebtLoading]     = useState(false);
  const [compDebtOrgFilter,   setCompDebtOrgFilter]   = useState('all');
  const [compDebtStatusFilter,setCompDebtStatusFilter]= useState('activo');

  /* ── LIQUIDACIONES ── */
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [liqLoading,    setLiqLoading]    = useState(false);
  const [periodData,    setPeriodData]    = useState(null);
  const [liqFilter,     setLiqFilter]     = useState('all');

  /* ── PLATAFORMAS ── */
  const [liqSubTab,     setLiqSubTab]     = useState('corp');
  const [plataformas,   setPlataformas]   = useState([]);
  const [liqPlat,       setLiqPlat]       = useState([]);
  const [liqPlatFilter, setLiqPlatFilter] = useState('all');
  const [calendarioAll, setCalendarioAll] = useState([]);

  /* ── IMEI CHECKER ── */
  const [imeiInput,    setImeiInput]    = useState('');
  const [imeiService,  setImeiService]  = useState('');
  const [imeiResult,   setImeiResult]   = useState(null);
  const [imeiLoading,  setImeiLoading]  = useState(false);
  const [imeiHistory,  setImeiHistory]  = useState([]);
  const [imeiConfig,   setImeiConfig]   = useState(null);
  const [rechargeFile, setRechargeFile] = useState(null); // screenshot para recarga

  /* ── BATCH IMEI CHECKER ── */
  const [batchOpen,     setBatchOpen]     = useState(false);
  const [batchImeis,    setBatchImeis]    = useState([]);
  const [batchResults,  setBatchResults]  = useState([]);
  const [batchLoading,  setBatchLoading]  = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchText,     setBatchText]     = useState('');

  /* ── TIENDAS & GESTIÓN DE USUARIOS ── */
  const [storeUsers,            setStoreUsers]            = useState([]);
  const [storeUsersLoading,     setStoreUsersLoading]     = useState(false);
  const [selectedStoreForUsers, setSelectedStoreForUsers] = useState(STORES[0].id);
  const [creatingUser,          setCreatingUser]          = useState(false);
  const [newUserForm,           setNewUserForm]           = useState({
    full_name: '', email: '', password: '', role: 'vendedor', org_id: STORES[0].id,
  });

  /* ── GESTIÓN DE TRABAJADORES (tab equipo) ── */
  const [workerList,    setWorkerList]    = useState([]);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [workerModal,   setWorkerModal]   = useState(false);
  const [workerForm,    setWorkerForm]    = useState({ full_name:'', email:'', role:'vendedor', org_id: STORES[0].id });
  const [workerSaving,  setWorkerSaving]  = useState(false);
  const [workerMsg,     setWorkerMsg]     = useState(null); // { type:'ok'|'err', text }
  const [workerFilter,  setWorkerFilter]  = useState('all');
  const [editWorker,    setEditWorker]    = useState(null); // { id, role, org_id }

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/ingresar/corp'); return; }
      const uid = session.user.id;

      // Buscar todos los roles del usuario y elegir el de mayor jerarquía
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid);

      const roles = (roleRows || []).map(row => row.role);

      // Roles permitidos en corp panel
      const CORP_ROLES = ['corp', 'superadmin', 'admin_corp'];
      const r = roles.find(ro => ro === 'superadmin') ||
                roles.find(ro => ro === 'corp' || ro === 'admin_corp') ||
                roles[0];

      if (!r || !CORP_ROLES.includes(r)) {
        router.replace('/ingresar/corp');
        return;
      }

      const { data: prof } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', uid)
        .maybeSingle();

      setMe({ id: uid, name: prof?.full_name || 'Admin', role: r });

      // Cargar datos en paralelo para que sea más rápido
      await Promise.allSettled([
        loadKpis(),
        loadProducts(),
        loadGlobalStock(),
      ]);

      setLoading(false);
    } catch (err) {
      console.error('Corp init error:', err);
      setLoading(false); // mostrar algo aunque falle
    }
  }

  async function loadKpis() {
    const { count: stockCount } = await supabase.from('stock_items').select('id', { count: 'exact', head: true }).eq('status', 'available');
    const { data: salesData }   = await supabase.from('sales').select('total_amount');
    const totalRevenue = (salesData || []).reduce((s, v) => s + (v.total_amount || 0), 0);
    setKpis({ totalStock: stockCount || 0, totalSales: (salesData || []).length, totalRevenue });
  }

  async function loadDashboard() {
    setDashLoading(true);
    try {
      // Tipo de cambio USD→PEN
      let fx = 3.75;
      try {
        const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=PEN', { cache: 'no-store' });
        const j = await r.json();
        if (j?.rates?.PEN) fx = j.rates.PEN;
      } catch {}

      // Stock disponible + en tránsito
      const { data: stockItems } = await supabase
        .from('stock_items')
        .select('id, status, sale_price, owner_org_id')
        .in('status', ['available', 'in_transit']);

      const available  = (stockItems || []).filter(s => s.status === 'available');
      const inTransit  = (stockItems || []).filter(s => s.status === 'in_transit');
      const stockTotal = available.reduce((s, x) => s + (x.sale_price || 0), 0);
      const transitVal = inTransit.reduce((s, x) => s + (x.sale_price || 0), 0);

      const stockByOrg = [
        { id: CORP_ID, name: 'Almacén Corp', ico: '🏢', color: '#0A84FF' },
        ...STORES.map(s => ({ ...s, color: s.id === STORES[0].id ? '#30D158' : s.id === STORES[1].id ? '#BF5AF2' : '#FF9F0A' })),
      ].map(org => {
        const items = available.filter(x => x.owner_org_id === org.id);
        return { ...org, count: items.length, value: items.reduce((s, x) => s + (x.sale_price || 0), 0) };
      });

      // Cuentas de caja
      const { data: cashRows } = await supabase.from('cash_accounts').select('*').eq('org_id', CORP_ID);
      const toS = a => a.moneda === 'USD' ? (a.saldo || 0) * fx : (a.saldo || 0);
      const cashAccs = cashRows || [];
      const cashBanks = cashAccs.filter(a => a.tipo === 'banco').reduce((s, a) => s + toS(a), 0);
      const cashPlats = cashAccs.filter(a => a.tipo === 'plataforma').reduce((s, a) => s + toS(a), 0);
      const cashEfect = cashAccs.filter(a => a.tipo === 'efectivo').reduce((s, a) => s + toS(a), 0);
      const cashTotal = cashBanks + cashPlats + cashEfect;

      // Detalles por cuenta
      const cashDetail = cashAccs.map(a => ({
        id: a.id, nombre: a.nombre, tipo: a.tipo, moneda: a.moneda,
        saldo: a.saldo || 0, saldoPEN: toS(a),
      })).sort((a, b) => b.saldoPEN - a.saldoPEN);

      // Liquidaciones pendientes por tienda
      const { data: liqRows } = await supabase
        .from('liquidaciones')
        .select('store_org_id, monto_neto_pen, estado, periodo_inicio, periodo_fin')
        .in('estado', ['enviada', 'pendiente'])
        .order('created_at', { ascending: false });

      const liqByStore = STORES.map(s => {
        const items = (liqRows || []).filter(l => l.store_org_id === s.id);
        return { ...s, items, total: items.reduce((sum, l) => sum + (l.monto_neto_pen || 0), 0) };
      }).filter(s => s.items.length > 0);
      const totalDeuda = liqByStore.reduce((s, st) => s + st.total, 0);

      // Ventas del mes
      const now   = new Date();
      const y     = now.getFullYear();
      const m     = String(now.getMonth() + 1).padStart(2, '0');
      const start = `${y}-${m}-01T00:00:00`;
      const { data: salesMonth } = await supabase
        .from('sales')
        .select('id, total_amount, payment_method, org_id, created_at')
        .gte('created_at', start)
        .order('created_at', { ascending: false })
        .limit(100);

      const ventasMes  = (salesMonth || []).reduce((s, v) => s + (v.total_amount || 0), 0);
      const ventasCount = (salesMonth || []).length;

      const ventasByStore = STORES.map(s => ({
        ...s,
        total: (salesMonth || []).filter(v => v.org_id === s.id).reduce((sum, v) => sum + (v.total_amount || 0), 0),
        count: (salesMonth || []).filter(v => v.org_id === s.id).length,
      }));

      // Importaciones activas
      const { data: imBatches } = await supabase
        .from('import_batches')
        .select('id, descripcion, estado, num_unidades, costo_landed_pen, fecha_llegada_est')
        .in('estado', ['en_transito', 'en_aduana', 'en_lima'])
        .order('created_at', { ascending: false })
        .limit(10);

      const importVal = (imBatches || []).reduce((s, b) => s + (b.costo_landed_pen || 0), 0);

      // Total capital (stock disponible + caja + importaciones en tránsito)
      const capitalTotal = stockTotal + cashTotal + importVal;

      setDashData({
        fx, stockTotal, transitVal, stockByOrg, stockCount: available.length,
        cashBanks, cashPlats, cashEfect, cashTotal, cashDetail,
        liqByStore, totalDeuda,
        ventasMes, ventasCount, ventasByStore, recentSales: (salesMonth || []).slice(0, 8),
        importVal, imBatches: imBatches || [],
        capitalTotal,
      });
    } catch (err) { console.error('loadDashboard error:', err); }
    setDashLoading(false);
  }

  async function loadGlobalStock() {
    let q = supabase
      .from('stock_items')
      .select('id, serial_number, imei, status, sale_price, emoji, owner_org_id, product_id, products(name), imei_check_id, model_number, color_info, storage_info')
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
    const { data } = await supabase
      .from('products')
      .select('id, name, emoji, description, sale_price, category, chip, default_colors, default_capacities, image_url')
      .order('category', { ascending: true })
      .order('name',     { ascending: true })
      .limit(200);
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

  async function editWarehouse(e) {
    e.preventDefault();
    if (!form.wh_id) { showToast('Error: ID de almacén no encontrado', 'err'); return; }
    const { data, error } = await supabase
      .from('warehouses')
      .update({
        name:      form.wh_name,
        org_id:    form.wh_org_id,
        type:      form.wh_type,
        aisle:     form.wh_aisle || null,
        shelf:     form.wh_shelf || null,
        is_active: form.wh_active,
      })
      .eq('id', form.wh_id)
      .select();
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    if (!data || data.length === 0) {
      showToast('Sin permiso para editar. Revisa el SQL Editor de Supabase.', 'err');
      return;
    }
    showToast('Almacén actualizado ✓');
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

  /* ── IMPORTACIÓN USA — Costo Landed ── */
  async function loadBatches() {
    const { data } = await supabase
      .from('import_batches')
      .select('*')
      .eq('org_id', CORP_ID)
      .order('created_at', { ascending: false })
      .limit(50);
    setBatches(data || []);
  }

  async function fetchUsdRate() {
    setLoadingRate(true);
    try {
      const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=PEN', { cache: 'no-store' });
      const json = await res.json();
      const pen  = json?.rates?.PEN;
      if (pen) { setUsdRate(pen.toFixed(3)); showToast(`Tipo de cambio: S/${pen.toFixed(3)} ✓`); }
      else {
        const res2  = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const json2 = await res2.json();
        const pen2  = json2?.rates?.PEN;
        if (pen2) { setUsdRate(pen2.toFixed(3)); showToast(`TC: S/${pen2.toFixed(3)} ✓`); }
      }
    } catch { showToast('Error al consultar API de cambio', 'err'); }
    setLoadingRate(false);
  }

  // Calcula todos los valores del Costo Landed a partir del formulario
  function calcLanded(f, tc) {
    const compra   = parseFloat(f.imp_compra)   || 0;
    const flete    = parseFloat(f.imp_flete)    || 0;
    const seguro   = parseFloat(f.imp_seguro)   || 0;
    const aranPct  = parseFloat(f.imp_arancel)  || 0;
    const igvPct   = parseFloat(f.imp_igv)      ?? 18;
    const gastosLima= parseFloat(f.imp_gastos)  || 0;
    const rate     = parseFloat(tc) || parseFloat(f.imp_rate) || 3.75;
    const unds     = Math.max(1, parseInt(f.imp_unidades) || 1);
    const margenPct= parseFloat(f.imp_margen)   || 30;

    const subtotalUSD   = compra + flete + seguro;
    const arancelUSD    = subtotalUSD * aranPct / 100;
    const baseIgv       = subtotalUSD + arancelUSD;
    const igvUSD        = baseIgv * igvPct / 100;
    const landedUSD     = subtotalUSD + arancelUSD + igvUSD;
    const landedPEN     = landedUSD * rate + gastosLima;
    const costoPorUnd   = landedPEN / unds;
    const precioSug     = costoPorUnd / (1 - margenPct / 100);
    const margenSoles   = precioSug - costoPorUnd;

    return { subtotalUSD, arancelUSD, igvUSD, landedUSD, landedPEN, costoPorUnd, precioSug, margenSoles, rate };
  }

  async function addBatch(e) {
    e.preventDefault();
    const tc  = parseFloat(usdRate) || parseFloat(form.imp_rate) || 3.75;
    const C   = calcLanded(form, tc);
    const { error } = await supabase.from('import_batches').insert({
      org_id:              CORP_ID,
      descripcion:         form.imp_desc || '',
      proveedor:           form.imp_proveedor || '',
      fecha_compra:        form.imp_fecha_compra || null,
      fecha_llegada_est:   form.imp_fecha_llegada || null,
      estado:              'en_transito',
      num_unidades:        parseInt(form.imp_unidades) || 1,
      costo_usd:           parseFloat(form.imp_compra)   || 0,
      flete_usd:           parseFloat(form.imp_flete)    || 0,
      seguro_usd:          parseFloat(form.imp_seguro)   || 0,
      arancel_pct:         parseFloat(form.imp_arancel)  || 0,
      igv_pct:             parseFloat(form.imp_igv)      ?? 18,
      gastos_lima_pen:     parseFloat(form.imp_gastos)   || 0,
      tipo_cambio_usado:   C.rate,
      subtotal_usd:        C.subtotalUSD,
      arancel_usd:         C.arancelUSD,
      igv_usd:             C.igvUSD,
      costo_landed_usd:    C.landedUSD,
      costo_landed_pen:    C.landedPEN,
      margen_pct:          parseFloat(form.imp_margen)   || 30,
      precio_sugerido_pen: C.precioSug,
      notas:               form.imp_notas || '',
      created_by:          me?.id,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Lote de importación registrado ✓');
    setModal(null); setForm({});
    loadBatches();
  }

  async function updateBatchStatus(id, estado) {
    const updates = { estado };
    if (estado === 'en_lima') updates.fecha_llegada_real = new Date().toISOString().split('T')[0];
    await supabase.from('import_batches').update(updates).eq('id', id);
    showToast('Estado actualizado ✓');
    loadBatches();
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

  /* ── LIQUIDACIONES ── */
  async function loadLiquidaciones() {
    setLiqLoading(true);
    let q = supabase.from('liquidaciones').select('*').order('created_at', { ascending: false }).limit(60);
    if (liqFilter !== 'all') q = q.eq('store_org_id', liqFilter);
    const { data } = await q;
    setLiquidaciones(data || []);
    setLiqLoading(false);
  }

  async function fetchPeriodData(storeId, start, end) {
    if (!storeId || !start || !end) return;
    setPeriodData(null);
    // Ventas de la tienda en el período
    const { data: salesData } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('org_id', storeId)
      .gte('created_at', start + 'T00:00:00')
      .lte('created_at', end + 'T23:59:59');
    const totalVentas = (salesData || []).reduce((s, v) => s + (v.total_amount || 0), 0);
    const numVentas   = (salesData || []).length;

    // Traslados recibidos por la tienda en el período (productos extraídos de Corp)
    const { data: txData } = await supabase
      .from('stock_transfers')
      .select('total_amount')
      .eq('to_org_id', storeId)
      .eq('status', 'received')
      .gte('created_at', start + 'T00:00:00')
      .lte('created_at', end + 'T23:59:59');
    const valorProductos = (txData || []).reduce((s, t) => s + (t.total_amount || 0), 0);
    const numProductos   = (txData || []).length;

    setPeriodData({ totalVentas, numVentas, valorProductos, numProductos });
    setForm(f => ({
      ...f,
      liq_ventas:    totalVentas.toFixed(2),
      liq_productos: valorProductos.toFixed(2),
      liq_monto:     valorProductos.toFixed(2),  // por defecto deben el valor de productos recibidos
    }));
  }

  async function createLiquidacion(e) {
    e.preventDefault();
    const montoNeto = (parseFloat(form.liq_productos) || 0)
                    - (parseFloat(form.liq_comision)  || 0)
                    + (parseFloat(form.liq_ajuste)    || 0);
    const { error } = await supabase.from('liquidaciones').insert({
      store_org_id:           form.liq_store,
      corp_org_id:            CORP_ID,
      periodo_inicio:         form.liq_inicio,
      periodo_fin:            form.liq_fin,
      descripcion:            form.liq_desc || '',
      total_ventas_pen:       parseFloat(form.liq_ventas)    || 0,
      valor_productos_pen:    parseFloat(form.liq_productos) || 0,
      comision_plataforma_pen:parseFloat(form.liq_comision)  || 0,
      ajustes_pen:            parseFloat(form.liq_ajuste)    || 0,
      notas_ajuste:           form.liq_notas || '',
      monto_neto_pen:         montoNeto,
      estado:                 'enviada',
      created_by:             me?.id,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Liquidación enviada a la tienda ✓');
    setModal(null); setForm({}); setPeriodData(null);
    loadLiquidaciones();
  }

  async function approveLiquidacion(id) {
    await supabase.from('liquidaciones').update({
      estado: 'aprobada',
      aprobado_por: me?.id,
      aprobado_at: new Date().toISOString(),
    }).eq('id', id);
    showToast('Liquidación aprobada ✓');
    loadLiquidaciones();
  }

  async function rejectLiquidacion(id, motivo) {
    await supabase.from('liquidaciones').update({
      estado: 'rechazada',
      notas_corp: motivo || 'Rechazado por Corp',
    }).eq('id', id);
    showToast('Liquidación rechazada');
    loadLiquidaciones();
  }

  /* ── PLATAFORMAS DE VENTA ── */
  async function loadPlataformas() {
    const { data } = await supabase.from('plataformas_venta').select('*').order('nombre');
    setPlataformas(data || []);
  }

  async function savePlataforma(e) {
    e.preventDefault();
    const payload = {
      nombre:          form.plat_nombre,
      emoji:           form.plat_emoji || '🏪',
      comision_pct:    parseFloat(form.plat_comision) || 0,
      periodicidad:    form.plat_periodicidad || 'mensual',
      dia_liquidacion: parseInt(form.plat_dia) || 1,
      metodo_pago:     form.plat_metodo || 'transferencia',
      instrucciones:   form.plat_instrucciones || '',
      activo:          true,
    };
    const isEdit = !!form.plat_id;
    const { error } = isEdit
      ? await supabase.from('plataformas_venta').update(payload).eq('id', form.plat_id)
      : await supabase.from('plataformas_venta').insert(payload);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast(isEdit ? 'Plataforma actualizada ✓' : 'Plataforma creada ✓');
    setModal(null); setForm({});
    loadPlataformas();
  }

  async function deletePlataforma(id) {
    if (!confirm('¿Eliminar esta plataforma?')) return;
    await supabase.from('plataformas_venta').delete().eq('id', id);
    showToast('Plataforma eliminada');
    loadPlataformas();
  }

  async function loadLiqPlat() {
    let q = supabase
      .from('liquidaciones_plataforma')
      .select('*, plataformas_venta(nombre, emoji, logo_url), organizations!store_org_id(name)')
      .order('created_at', { ascending: false })
      .limit(80);
    if (liqPlatFilter !== 'all') q = q.eq('store_org_id', liqPlatFilter);
    const { data } = await q;
    setLiqPlat(data || []);
  }

  async function approveLiqPlat(id) {
    await supabase.from('liquidaciones_plataforma').update({
      estado: 'aprobado',
      revisado_por: me?.id,
      revisado_at:  new Date().toISOString(),
    }).eq('id', id);
    showToast('Reporte aprobado ✓');
    loadLiqPlat();
  }

  async function rejectLiqPlat(id, motivo) {
    await supabase.from('liquidaciones_plataforma').update({
      estado:       'rechazado',
      notas_corp:   motivo || 'Revisar diferencias',
      revisado_por: me?.id,
      revisado_at:  new Date().toISOString(),
    }).eq('id', id);
    showToast('Reporte rechazado');
    loadLiqPlat();
  }

  async function loadCalendarioAll() {
    const { data } = await supabase
      .from('calendario_liquidaciones')
      .select('*, plataformas_venta(nombre, emoji), organizations!store_org_id(name)')
      .order('fecha_esperada', { ascending: true })
      .limit(120);
    setCalendarioAll(data || []);
  }

  async function generarCalendarioTienda(storeId, platId, fechaEsperada, titulo, tipo) {
    await supabase.from('calendario_liquidaciones').insert({
      store_org_id:  storeId,
      plataforma_id: platId || null,
      titulo,
      fecha_esperada: fechaEsperada,
      tipo:           tipo || 'plataforma',
      estado:         'pendiente',
    });
    showToast('Evento de calendario creado ✓');
    loadCalendarioAll();
  }

  /* ── FINANZAS: load valorización + caja ── */
  async function loadFinanzas() {
    setFinLoading(true);
    // 1. Tipo de cambio
    let fx = finFx;
    try {
      const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=PEN', { cache: 'no-store' });
      const json = await res.json();
      if (json?.rates?.PEN) { fx = json.rates.PEN; setFinFx(json.rates.PEN); }
    } catch {}
    if (!fx) fx = 3.75;

    // 2. Stock items — valorización
    const { data: stockData } = await supabase
      .from('stock_items')
      .select('id, status, sale_price, owner_org_id')
      .in('status', ['available', 'in_transit']);

    const available  = (stockData || []).filter(s => s.status === 'available');
    const inTransit  = (stockData || []).filter(s => s.status === 'in_transit');
    const totalVal   = available.reduce((s, x) => s + (x.sale_price || 0), 0);
    const transitVal = inTransit.reduce((s, x) => s + (x.sale_price || 0), 0);

    const byStore = [...[{ id: CORP_ID, name: 'Corp Tech (Almacén)', ico: '🏢' }], ...STORES].map(org => {
      const items = available.filter(s => s.owner_org_id === org.id);
      return { ...org, count: items.length, valor: items.reduce((s, x) => s + (x.sale_price || 0), 0) };
    });

    setFinData({
      stockVal: totalVal, stockValUSD: totalVal / fx,
      inTransitVal: transitVal, inTransitValUSD: transitVal / fx,
      stockCount: available.length, transitCount: inTransit.length,
      byStore,
    });

    // 3. Cuentas de caja
    await loadCashAccounts(fx);
    setFinLoading(false);
  }

  async function loadCashAccounts(fx) {
    const rate = fx || finFx || 3.75;
    const { data } = await supabase.from('cash_accounts').select('*').eq('org_id', CORP_ID).order('tipo');
    const accounts = data || [];
    setCashAccounts(accounts);
    const toSoles = (a) => a.moneda === 'USD' ? (a.saldo || 0) * rate : (a.saldo || 0);
    const banks    = accounts.filter(a => a.tipo === 'banco').reduce((s, a) => s + toSoles(a), 0);
    const plats    = accounts.filter(a => a.tipo === 'plataforma').reduce((s, a) => s + toSoles(a), 0);
    const cash     = accounts.filter(a => a.tipo === 'efectivo').reduce((s, a) => s + toSoles(a), 0);
    const other    = accounts.filter(a => a.tipo === 'otro').reduce((s, a) => s + toSoles(a), 0);
    const total    = banks + plats + cash + other;
    setCashTotals({ banks_pen: banks, platforms_pen: plats, cash_pen: cash, total_pen: total, total_usd: total / rate });
  }

  async function addCashAccount(e) {
    e.preventDefault();
    const { error } = await supabase.from('cash_accounts').insert({
      org_id: CORP_ID, nombre: form.ca_nombre,
      tipo: form.ca_tipo || 'banco', moneda: form.ca_moneda || 'PEN',
      saldo: parseFloat(form.ca_saldo) || 0, updated_by: me?.id,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Cuenta agregada ✓');
    setModal(null); setForm({});
    loadFinanzas();
  }

  async function updateCashAccount(e) {
    e.preventDefault();
    const { error } = await supabase.from('cash_accounts').update({
      nombre: form.ca_nombre, tipo: form.ca_tipo, moneda: form.ca_moneda,
      saldo: parseFloat(form.ca_saldo) || 0,
      updated_at: new Date().toISOString(), updated_by: me?.id,
    }).eq('id', form.ca_id);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Cuenta actualizada ✓');
    setModal(null); setForm({});
    loadFinanzas();
  }

  async function deleteCashAccount(id) {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    await supabase.from('cash_accounts').delete().eq('id', id);
    showToast('Cuenta eliminada');
    setModal(null); setForm({});
    loadFinanzas();
  }

  /* ── SUELDOS ── */
  async function loadEmployees() {
    setEmpLoading(true);
    let q = supabase.from('employees').select('*').order('full_name');
    if (empOrgFilter !== 'all') q = q.eq('org_id', empOrgFilter);
    if (empStatusFilter !== 'all') q = q.eq('is_active', empStatusFilter === 'activo');
    const { data } = await q;
    setEmployees(data || []);
    setEmpLoading(false);
  }

  async function loadSalaryPayments(empId) {
    const { data } = await supabase.from('salary_payments').select('*')
      .eq('employee_id', empId).order('created_at', { ascending: false }).limit(24);
    setSalaryPayments(data || []);
  }

  async function saveEmployee(e) {
    e.preventDefault();
    const payload = {
      org_id:          form.emp_org   || CORP_ID,
      full_name:       form.emp_name,
      email:           form.emp_email      || null,
      phone:           form.emp_phone      || null,
      role_title:      form.emp_role       || 'Empleado',
      salary:          parseFloat(form.emp_salary) || 0,
      salary_currency: form.emp_currency   || 'PEN',
      salary_period:   form.emp_period     || 'mensual',
      start_date:      form.emp_start      || null,
      notes:           form.emp_notes      || null,
      is_active:       true,
      created_by:      me?.id,
    };
    const isEdit = !!form.emp_id;
    const { error } = isEdit
      ? await supabase.from('employees').update(payload).eq('id', form.emp_id)
      : await supabase.from('employees').insert(payload);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast(isEdit ? 'Empleado actualizado ✓' : 'Empleado agregado ✓');
    setModal(null); setForm({});
    loadEmployees();
  }

  async function deleteEmployee(id) {
    if (!confirm('¿Eliminar empleado?')) return;
    await supabase.from('employees').delete().eq('id', id);
    showToast('Empleado eliminado');
    loadEmployees();
  }

  async function saveSalaryPayment(e) {
    e.preventDefault();
    const { error } = await supabase.from('salary_payments').insert({
      employee_id:    form.sp_emp_id,
      org_id:         form.sp_org || CORP_ID,
      amount:         parseFloat(form.sp_amount) || 0,
      currency:       form.sp_currency || 'PEN',
      period_label:   form.sp_period_label || '',
      payment_date:   form.sp_date || new Date().toISOString().split('T')[0],
      payment_method: form.sp_method || 'efectivo',
      status:         'pagado',
      notes:          form.sp_notes || null,
      created_by:     me?.id,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Pago registrado ✓');
    setModal(null); setForm({});
    loadEmployees();
    if (empDetailId) loadSalaryPayments(empDetailId);
  }

  /* ── DEUDORES ── */
  async function loadDebtors() {
    setDebtorLoading(true);
    let q = supabase.from('debtors').select('*').order('created_at', { ascending: false });
    if (debtorOrgFilter !== 'all') q = q.eq('org_id', debtorOrgFilter);
    if (debtorStatusFilter !== 'all') q = q.eq('status', debtorStatusFilter);
    const { data } = await q;
    setDebtors(data || []);
    setDebtorLoading(false);
  }

  async function saveDebtor(e) {
    e.preventDefault();
    const payload = {
      org_id:           form.dr_org  || CORP_ID,
      name:             form.dr_name,
      phone:            form.dr_phone         || null,
      email:            form.dr_email         || null,
      description:      form.dr_desc          || null,
      principal_amount: parseFloat(form.dr_principal) || 0,
      currency:         form.dr_currency      || 'PEN',
      interest_rate:    parseFloat(form.dr_rate) || 0,
      interest_type:    form.dr_int_type       || 'none',
      start_date:       form.dr_start          || new Date().toISOString().split('T')[0],
      due_date:         form.dr_due            || null,
      status:           'activo',
      notes:            form.dr_notes          || null,
      created_by:       me?.id,
    };
    const isEdit = !!form.dr_id;
    const { error } = isEdit
      ? await supabase.from('debtors').update(payload).eq('id', form.dr_id)
      : await supabase.from('debtors').insert(payload);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast(isEdit ? 'Deudor actualizado ✓' : 'Deudor agregado ✓');
    setModal(null); setForm({});
    loadDebtors();
  }

  async function registerDebtorPayment(e) {
    e.preventDefault();
    const dr = debtors.find(d => d.id === form.drp_id);
    if (!dr) return;
    const newPaid = (dr.amount_paid || 0) + (parseFloat(form.drp_amount) || 0);
    const total   = dr.principal_amount + calcAccruedInterest(dr);
    const newStatus = newPaid >= total ? 'pagado' : 'activo';
    const { error } = await supabase.from('debtors')
      .update({ amount_paid: newPaid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', form.drp_id);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Cobro registrado ✓');
    setModal(null); setForm({});
    loadDebtors();
  }

  /* ── DEUDAS EMPRESA ── */
  async function loadCompDebts() {
    setCompDebtLoading(true);
    let q = supabase.from('company_debts').select('*').order('created_at', { ascending: false });
    if (compDebtOrgFilter !== 'all') q = q.eq('org_id', compDebtOrgFilter);
    if (compDebtStatusFilter !== 'all') q = q.eq('status', compDebtStatusFilter);
    const { data } = await q;
    setCompDebts(data || []);
    setCompDebtLoading(false);
  }

  async function saveCompDebt(e) {
    e.preventDefault();
    const payload = {
      org_id:           form.cd_org  || CORP_ID,
      creditor_name:    form.cd_creditor,
      description:      form.cd_desc          || null,
      principal_amount: parseFloat(form.cd_principal) || 0,
      currency:         form.cd_currency      || 'PEN',
      interest_rate:    parseFloat(form.cd_rate) || 0,
      interest_type:    form.cd_int_type       || 'none',
      start_date:       form.cd_start          || new Date().toISOString().split('T')[0],
      due_date:         form.cd_due            || null,
      status:           'activo',
      notes:            form.cd_notes          || null,
      created_by:       me?.id,
    };
    const isEdit = !!form.cd_id;
    const { error } = isEdit
      ? await supabase.from('company_debts').update(payload).eq('id', form.cd_id)
      : await supabase.from('company_debts').insert(payload);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast(isEdit ? 'Deuda actualizada ✓' : 'Deuda registrada ✓');
    setModal(null); setForm({});
    loadCompDebts();
  }

  async function registerDebtPayment(e) {
    e.preventDefault();
    const cd = compDebts.find(d => d.id === form.cdp_id);
    if (!cd) return;
    const newPaid = (cd.amount_paid || 0) + (parseFloat(form.cdp_amount) || 0);
    const total   = cd.principal_amount + calcAccruedInterest(cd);
    const newStatus = newPaid >= total ? 'pagado' : 'activo';
    const { error } = await supabase.from('company_debts')
      .update({ amount_paid: newPaid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', form.cdp_id);
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Pago registrado ✓');
    setModal(null); setForm({});
    loadCompDebts();
  }

  /* ── HELPER: interés acumulado ── */
  function calcAccruedInterest(item) {
    if (!item.interest_rate || item.interest_type === 'none') return 0;
    const start  = new Date(item.start_date || item.created_at);
    const now    = new Date();
    const months = Math.max(0, (now - start) / (1000 * 60 * 60 * 24 * 30.4375));
    const rate   = parseFloat(item.interest_rate) / 100;
    if (item.interest_type === 'monthly') return item.principal_amount * rate * months;
    if (item.interest_type === 'annual')  return item.principal_amount * rate * (months / 12);
    return 0;
  }

  /* ── ADD / EDIT / DELETE PRODUCT ── */
  async function addProduct(e) {
    e.preventDefault();

    // Convertir texto de colores/capacidades a arrays
    const parseList = (str) =>
      (str || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);

    const payload = {
      name:                form.name,
      description:         form.description         || '',
      emoji:               form.emoji               || '📦',
      sale_price:          parseFloat(form.sale_price) || 0,
      category:            form.category            || 'otro',
      chip:                form.chip                || null,
      default_colors:      parseList(form.colors_text),
      default_capacities:  parseList(form.capacities_text),
      image_url:           form.image_url           || null,
      color_images:        form.color_images        || {},
    };

    if (form._edit_id) {
      const { error } = await supabase.from('products').update(payload).eq('id', form._edit_id);
      if (error) { showToast('Error: ' + error.message, 'err'); return; }
      showToast('Producto actualizado ✓');
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, corp_id: CORP_ID });
      if (error) { showToast('Error: ' + error.message, 'err'); return; }
      showToast('Producto creado ✓');
    }
    setModal(null); setForm({});
    loadProducts();
  }

  async function deleteProduct(id, name) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showToast('Error al eliminar: ' + error.message, 'err'); return; }
    showToast('Producto eliminado ✓');
    loadProducts();
  }

  /* ── ADD STOCK ── */
  async function addStock(e) {
    e.preventDefault();
    if (!form.product_id) { showToast('Selecciona un producto primero', 'err'); return; }
    const { error } = await supabase.from('stock_items').insert({
      owner_org_id:  form.owner_org_id || CORP_ID,
      product_id:    form.product_id,
      serial_number: form.serial_number || null,
      imei:          form.imei || null,
      sale_price:    parseFloat(form.sale_price) || 0,
      emoji:         form.emoji || '📦',
      status:        'available',
      imei_check_id: form.imei_check_id || null,
      model_number:  form.model_number  || null,
      color_info:    form.color_info    || form.color   || null,
      storage_info:  form.storage_info  || form.storage || null,
    });
    if (error) { showToast('Error: ' + error.message, 'err'); return; }
    showToast('Stock agregado ✓');
    setModal(null); setForm({}); setProdSearch(''); setStockCatFilter('all');
    loadGlobalStock();
    loadKpis();
  }

  /* ── EXTRAER INFO DEL IMEI RESULT ── */
  function extractDeviceInfo(result, checkId) {
    if (!result) return {};
    const obj = result.object;
    const txt = typeof result.result === 'string' ? result.result : '';

    // Parsear texto plano (Sickw / fallback)
    function parseLines(t) {
      if (!t || typeof t !== 'string') return [];
      const clean = t.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
      const lines = clean.includes('\n')
        ? clean.split('\n')
        : clean.split(/(?=\b(?:IMEI|Find My|Model|Color|Carrier|Blacklist|Serial|Warranty|Capacity|Storage)\b)/i);
      return lines.map(l => l.trim()).filter(Boolean).map(line => {
        const idx = line.indexOf(':');
        return idx > 0 ? { k: line.substring(0, idx).trim(), v: line.substring(idx + 1).trim() } : { k: '', v: line };
      }).filter(r => r.v);
    }
    const lines = parseLines(txt);
    const getLine = (keys) => {
      for (const key of keys) {
        const f = lines.find(l => l.k.toLowerCase().includes(key.toLowerCase()));
        if (f?.v) return f.v;
      }
      return '';
    };

    // Modelo completo ej: "iPhone 17 Pro Max 512GB Deep Blue (A3526) [Global]"
    const fullModel = (
      obj?.model || obj?.Model || obj?.modelName || obj?.ModelName ||
      obj?.deviceName || obj?.DeviceName ||
      getLine(['model','device name','device']) || ''
    ).trim();

    // Extraer número de modelo A####
    const modelNumMatch = fullModel.match(/\(?(A\d{4,5})\)?/);
    const modelNumber   = modelNumMatch ? modelNumMatch[1] : '';

    // Almacenamiento: intentar campos del objeto, luego parsear del nombre
    const storObjFields = ['storage','Storage','capacity','Capacity','internalStorage','InternalStorage','memory','Memory'];
    let storage = '';
    for (const f of storObjFields) {
      if (obj?.[f] && String(obj[f]).trim()) { storage = String(obj[f]).replace(/\s+/g,'').trim(); break; }
    }
    if (!storage) storage = getLine(['storage','capacity','capacidad','gb','memory']).replace(/\s+/g,'').trim();
    if (!storage) {
      // Extraer "512GB", "256 GB", "1TB" del modelo
      const sm = fullModel.match(/(\d+\s*(?:GB|TB|MB))/i);
      if (sm) storage = sm[1].replace(/\s+/g, '');
    }

    // Color: intentar campos del objeto, luego extraer del modelo quitando device y storage
    const colorObjFields = ['color','Color','colour','Colour','colorName','ColorName','bodyColor'];
    let color = '';
    for (const f of colorObjFields) {
      if (obj?.[f] && String(obj[f]).trim()) { color = String(obj[f]).trim(); break; }
    }
    if (!color) color = getLine(['color','colour','color name']).trim();
    if (!color) {
      // Quitar: (A####), [region], storage, nombre del dispositivo conocido
      const stripped = fullModel
        .replace(/\([A-Z]\d{4,5}\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\d+\s*(?:GB|TB|MB)/gi, '')
        .replace(/\b(iPhone\s*\d*\s*(?:Pro\s*Max|Pro|Plus|Mini|Max|SE)?|iPad\s*(?:Pro|Air|Mini|mini)?|MacBook\s*(?:Pro|Air)?|Apple Watch\s*(?:Series\s*\d+|SE|Ultra\s*\d*)?|AirPods?\s*(?:Pro\s*\d*|Max)?|iPod|iMac|Mac\s*(?:Mini|Studio|Pro)?)\s*/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (stripped && stripped.length > 0 && stripped.length < 50) color = stripped;
    }

    // Nombre limpio del dispositivo (quitar model#, región, storage y color)
    const deviceName = fullModel
      .replace(/\([A-Z]\d{4,5}\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\d+\s*(?:GB|TB|MB)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // IMEI
    const imei = (obj?.imei || obj?.IMEI || getLine(['imei']) || '').trim();

    const description = [modelNumber, storage, color].filter(Boolean).join(' · ');

    return {
      deviceName: deviceName || fullModel.replace(/\([A-Z]\d{4,5}\)/g,'').replace(/\[[^\]]*\]/g,'').trim(),
      modelNumber, color, color_info: color,
      storage, storage_info: storage,
      imei, description, fullModel,
      imei_check_id: checkId,
    };
  }

  /* ── IMEI CHECKER ── */
  // imeiProvider: 'auto' | 'sickw' | 'imeicheck'
  const [imeiProvider, setImeiProvider] = useState('auto');

  async function checkImei() {
    if (!imeiInput.trim()) { showToast('Ingresa un IMEI', 'err'); return; }
    const clean = imeiInput.trim().replace(/\D/g, '');
    if (clean.length < 14 || clean.length > 16) { showToast('El IMEI debe tener 14-16 dígitos', 'err'); return; }
    setImeiLoading(true);
    setImeiResult(null);
    try {
      const res  = await fetch('/api/check-imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei: clean, service_id: imeiService, user_id: me?.id, org_id: CORP_ID, provider: imeiProvider }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Error al consultar la API', 'err');
        setImeiResult({ error: data.error });
      } else {
        // Guardar el resultado junto con qué proveedor se usó
        setImeiResult({ ...data.result, _provider: data.provider });
        // Actualizar tokens del proveedor usado
        if (data.provider) {
          setImeiConfig(c => c ? {
            ...c,
            providers: (c.providers || []).map(p =>
              p.provider === data.provider ? { ...p, used: data.tokens_used, remaining: data.tokens_limit - data.tokens_used } : p
            ),
          } : c);
        }
        showToast(`✅ Consulta exitosa vía ${data.provider === 'imeicheck' ? 'IMEICheck' : 'Sickw'}`);
        loadImeiHistory();
      }
    } catch (err) {
      showToast('Error de conexión', 'err');
      setImeiResult({ error: err.message });
    }
    setImeiLoading(false);
  }

  async function loadImeiHistory() {
    const { data } = await supabase
      .from('imei_checks')
      .select('id, imei, service_name, status, result, created_at')
      .eq('org_id', CORP_ID)
      .order('created_at', { ascending: false })
      .limit(20);
    setImeiHistory(data || []);
  }

  async function loadImeiCredits() {
    // Cargar TODOS los proveedores activos para esta org
    const { data } = await supabase
      .from('api_settings')
      .select('id, tokens_used, tokens_limit, is_active, api_key, provider_name, provider, allowed_services')
      .eq('org_id', CORP_ID)
      .eq('service', 'imei')
      .eq('is_active', true);

    if (data && data.length > 0) {
      // Combinar servicios de todos los proveedores para el selector
      const allServices = [];
      data.forEach(cfg => {
        const pKey = cfg.provider || 'sickw';
        (cfg.allowed_services || []).forEach(svc => {
          // Agregar si no está ya (por id+provider)
          if (!allServices.find(s => s.id === svc.id && s.providerKey === pKey)) {
            allServices.push({ ...svc, providerKey: pKey, providerName: cfg.provider_name || pKey });
          }
        });
      });

      // Ordenar por precio ascendente (más barato primero)
      allServices.sort((a, b) => parseFloat(a.price || '999') - parseFloat(b.price || '999'));

      const combined = {
        providers:    data.map(d => ({
          provider:      d.provider || 'sickw',
          provider_name: d.provider_name || 'IMEI API',
          used:          d.tokens_used  || 0,
          limit:         d.tokens_limit || 0,
          remaining:     (d.tokens_limit || 0) - (d.tokens_used || 0),
          hasKey:        !!d.api_key,
        })),
        services:     allServices,
        totalRemaining: data.reduce((s, d) => s + Math.max(0, (d.tokens_limit || 0) - (d.tokens_used || 0)), 0),
      };
      setImeiConfig(combined);
      // Preferir servicio 19 (Apple FULL INFO [+Carrier]) o el más completo con carrier
      const preferred = allServices.find(s => String(s.id) === '19')
        || allServices.find(s => (s.label||'').toLowerCase().includes('full info') && (s.label||'').toLowerCase().includes('carrier'))
        || allServices.find(s => (s.label||'').toLowerCase().includes('full info'))
        || allServices[0];
      if (!imeiService && preferred) setImeiService(preferred.id);
    } else {
      setImeiConfig(null);
    }
  }

  /* ── SOLICITAR RECARGA DE TOKENS ── */
  async function requestRecharge(e) {
    e.preventDefault();
    const soles  = parseFloat(form.recharge_soles) || 0;
    const tokens = Math.floor(soles); // 1 sol = 1 token
    if (soles <= 0) { showToast('Ingresa un monto válido', 'err'); return; }

    let screenshotUrl = null;

    // Subir screenshot a Supabase Storage
    if (rechargeFile) {
      try {
        const ext  = rechargeFile.name.split('.').pop() || 'jpg';
        const path = `${CORP_ID}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('recharge-screenshots')
          .upload(path, rechargeFile, { contentType: rechargeFile.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('recharge-screenshots').getPublicUrl(path);
          screenshotUrl = urlData?.publicUrl || null;
        }
      } catch { /* continuar sin screenshot */ }
    }

    const { error } = await supabase.from('token_recharge_requests').insert({
      org_id:           CORP_ID,
      amount_soles:     soles,
      tokens_requested: tokens,
      payment_method:   form.recharge_method || 'yape',
      screenshot_url:   screenshotUrl,
      notes:            form.recharge_notes || '',
      status:           'pending',
      created_by:       me?.id,
    });
    if (error) { showToast('Error al enviar solicitud: ' + error.message, 'err'); return; }
    showToast(`✅ Solicitud enviada — ${tokens} tokens por S/${soles.toFixed(2)}`);
    setModal(null); setForm({}); setRechargeFile(null);
  }

  /* ── BATCH IMEI — Extracción y Check Masivo ── */
  function extractImeisFromText(text) {
    const raw = typeof text === 'string' ? text : '';
    const matches = raw.match(/\b\d{14,16}\b/g) || [];
    return [...new Set(matches)];
  }

  async function readFileTextBatch(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const bytes = new Uint8Array(e.target.result);
          let str = ''; let run = '';
          for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if (b >= 32 && b <= 126) { run += String.fromCharCode(b); }
            else { if (run.length >= 3) str += run + ' '; run = ''; }
          }
          if (run.length >= 3) str += run;
          resolve(str);
        } else {
          resolve(e.target.result || '');
        }
      };
      reader.onerror = () => resolve('');
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  async function processBatchFile(file) {
    const text = await readFileTextBatch(file);
    const found = extractImeisFromText(text);
    setBatchImeis(found);
    setBatchResults([]);
    setBatchProgress({ done: 0, total: 0 });
    if (found.length === 0) showToast('No se encontraron IMEIs en el archivo', 'err');
    else showToast(`✅ ${found.length} IMEI${found.length !== 1 ? 's' : ''} detectados`);
  }

  function processBatchTextInput(text) {
    const found = extractImeisFromText(text);
    setBatchImeis(found);
    setBatchResults([]);
    setBatchProgress({ done: 0, total: 0 });
    if (found.length > 0) showToast(`✅ ${found.length} IMEI${found.length !== 1 ? 's' : ''} detectados`);
  }

  async function runBatchCheck() {
    if (batchImeis.length === 0) { showToast('No hay IMEIs para consultar', 'err'); return; }
    if (!imeiService)            { showToast('Selecciona un tipo de consulta arriba', 'err'); return; }
    setBatchLoading(true);
    setBatchResults([]);
    setBatchProgress({ done: 0, total: batchImeis.length });
    const results = [];
    for (let i = 0; i < batchImeis.length; i++) {
      const imei = batchImeis[i];
      try {
        const res  = await fetch('/api/check-imei', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imei, service_id: imeiService, user_id: me?.id, org_id: CORP_ID, provider: imeiProvider }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          results.push({ imei, status: 'error', error: data.error || 'Error', result: null, info: null });
        } else {
          const info = extractDeviceInfo(data.result, data.check_id);
          results.push({ imei, status: 'success', error: null, result: data.result, info });
        }
      } catch (err) {
        results.push({ imei, status: 'error', error: err.message, result: null, info: null });
      }
      setBatchProgress({ done: i + 1, total: batchImeis.length });
      setBatchResults([...results]);
      if (i < batchImeis.length - 1) await new Promise(r => setTimeout(r, 350));
    }
    setBatchLoading(false);
    const ok  = results.filter(r => r.status === 'success').length;
    const err = results.filter(r => r.status === 'error').length;
    showToast(`✅ ${ok} exitosos${err > 0 ? ` · ❌ ${err} errores` : ''}`);
    loadImeiCredits();
    loadImeiHistory();
  }

  async function addBatchStock(e) {
    e.preventDefault();
    const successes = batchResults.filter(r => r.status === 'success');
    let added = 0; let errored = 0;
    for (const r of successes) {
      const info = r.info || {};
      const matchedProduct = form.batch_product_id
        ? null
        : products.find(p => {
            const pn = (p.name || '').toLowerCase();
            const dn = (info.deviceName || '').toLowerCase();
            return dn && (pn.includes(dn.split(' ').slice(0, 3).join(' ')) || dn.includes(pn.split(' ').slice(0, 2).join(' ')));
          }) || products[0];
      const { error } = await supabase.from('stock_items').insert({
        product_id:    form.batch_product_id || matchedProduct?.id || null,
        owner_org_id:  form.owner_org_id || CORP_ID,
        serial_number: r.imei,
        imei:          r.imei,
        status:        'available',
        sale_price:    parseFloat(form.sale_price) || 0,
        emoji:         form.emoji || '📱',
        imei_check_id: info.imei_check_id || null,
        model_number:  info.modelNumber   || null,
        color_info:    info.color_info    || info.color   || null,
        storage_info:  info.storage_info  || info.storage || null,
        notes:         info.description   || null,
        created_by:    me?.id,
      });
      if (error) errored++;
      else added++;
    }
    showToast(`✅ ${added} equipos agregados al stock${errored > 0 ? ` · ❌ ${errored} errores` : ''}`);
    setModal(null); setForm({});
    setBatchResults([]); setBatchImeis([]); setBatchText('');
    loadGlobalStock(); loadKpis();
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/ingresar/corp');
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'global')       loadGlobalStock();
    if (t === 'ventas')       loadAllSales();
    if (t === 'equipo')       loadUsers();
    if (t === 'almacenes')    loadWarehouses();
    if (t === 'traslados')  { loadTransfers(); loadCorpStock(); }
    if (t === 'importacion')  loadBatches();
    if (t === 'finanzas')       loadFinanzas();
    if (t === 'liquidaciones') { loadLiquidaciones(); loadPlataformas(); loadLiqPlat(); loadCalendarioAll(); }
    if (t === 'imei')         { loadImeiCredits(); loadImeiHistory(); }
    if (t === 'tiendas')      loadStoreUsers(selectedStoreForUsers);
  }

  async function loadStoreUsers(storeId) {
    setStoreUsersLoading(true);
    const sid = storeId || selectedStoreForUsers;
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, user_roles(role)')
      .eq('org_id', sid)
      .order('full_name');
    setStoreUsers(data || []);
    setStoreUsersLoading(false);
  }

  async function createStoreUser(e) {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const json = await res.json();
      if (!res.ok) { showToast('Error: ' + (json.error || 'Inténtalo de nuevo'), 'err'); return; }
      showToast('✅ Usuario creado correctamente', 'ok');
      setModal(null);
      setNewUserForm({ full_name:'', email:'', password:'', role:'vendedor', org_id: selectedStoreForUsers });
      await loadStoreUsers(selectedStoreForUsers);
    } catch (err) {
      showToast('Error de conexión', 'err');
    } finally {
      setCreatingUser(false);
    }
  }

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'global') loadGlobalStock();
    if (tab === 'ventas') loadAllSales();
    if (tab === 'equipo') loadWorkers();
    if (tab === 'finanzas' && finSubTab === 'sueldos')   loadEmployees();
    if (tab === 'finanzas' && finSubTab === 'deudores')  loadDebtors();
    if (tab === 'finanzas' && finSubTab === 'deudas')    loadCompDebts();
    if (tab === 'finanzas' && finSubTab === 'caja')      loadFinanzas();
  }, [tab, finSubTab]); // eslint-disable-line

  useEffect(() => { if (tab === 'finanzas' && finSubTab === 'sueldos') loadEmployees(); }, [empOrgFilter, empStatusFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'finanzas' && finSubTab === 'deudores') loadDebtors(); }, [debtorOrgFilter, debtorStatusFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'finanzas' && finSubTab === 'deudas') loadCompDebts(); }, [compDebtOrgFilter, compDebtStatusFilter]); // eslint-disable-line

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

  /* ══════════════════════════════════════
     FUNCIONES — GESTIÓN DE TRABAJADORES
  ══════════════════════════════════════ */
  async function loadWorkers() {
    setWorkerLoading(true);
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, org_id, user_roles(role, org_id), organizations(name)')
      .order('full_name');
    setWorkerList(data || []);
    setWorkerLoading(false);
  }

  async function inviteWorker() {
    if (!workerForm.email || !workerForm.full_name || !workerForm.role) return;
    setWorkerSaving(true);
    setWorkerMsg(null);
    try {
      // 1. Crear cuenta en Supabase Auth con password temporal
      const tempPass = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!9';
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: workerForm.email.trim().toLowerCase(),
        password: tempPass,
        options: { data: { full_name: workerForm.full_name } },
      });
      if (authErr) { setWorkerMsg({ type:'err', text: authErr.message }); setWorkerSaving(false); return; }
      const uid = authData.user?.id;
      if (!uid) { setWorkerMsg({ type:'err', text: 'No se pudo crear la cuenta.' }); setWorkerSaving(false); return; }

      // 2. Insertar en tabla users
      await supabase.from('users').upsert({
        id: uid,
        full_name: workerForm.full_name,
        email: workerForm.email.trim().toLowerCase(),
        org_id: workerForm.org_id,
      });

      // 3. Insertar / actualizar rol
      await supabase.from('user_roles').upsert({ user_id: uid, role: workerForm.role, org_id: workerForm.org_id });

      // 4. Enviar email para que el trabajador ponga su propia contraseña
      const originForReset = typeof window !== 'undefined' ? window.location.origin : 'https://corptech.pe';
      await supabase.auth.resetPasswordForEmail(workerForm.email.trim().toLowerCase(), {
        redirectTo: `${originForReset}/corp/login`,
      });

      setWorkerMsg({ type:'ok', text: `✅ Invitación enviada a ${workerForm.email}. El trabajador recibirá un email para crear su contraseña.` });
      setWorkerForm({ full_name:'', email:'', role:'vendedor', org_id: STORES[0].id });
      setWorkerModal(false);
      loadWorkers();
    } catch (e) {
      setWorkerMsg({ type:'err', text: e.message || 'Error desconocido.' });
    }
    setWorkerSaving(false);
  }

  async function updateWorkerRole(userId, newRole, orgId) {
    await supabase.from('user_roles').upsert({ user_id: userId, role: newRole, org_id: orgId });
    setEditWorker(null);
    loadWorkers();
    showToast('Rol actualizado ✓');
  }

  async function revokeWorkerAccess(userId, userEmail) {
    if (!confirm(`¿Revocar acceso a ${userEmail}? El usuario no podrá iniciar sesión en ningún panel.`)) return;
    await supabase.from('user_roles').delete().eq('user_id', userId);
    loadWorkers();
    showToast('Acceso revocado');
  }

  const CORP_NAV = [
    { id: 'dashboard',     ico: '📈', lbl: 'Dashboard'     },
    { id: 'tiendas',       ico: '🏪', lbl: 'Tiendas'       },
    { id: 'global',        ico: '📦', lbl: 'Stock'         },
    { id: 'finanzas',      ico: '💰', lbl: 'Finanzas'      },
    { id: 'liquidaciones', ico: '💳', lbl: 'Liquidaciones'  },
    { id: 'almacenes',     ico: '🏭', lbl: 'Almacenes'     },
    { id: 'traslados',     ico: '🔄', lbl: 'Traslados'     },
    { id: 'importacion',   ico: '📥', lbl: 'Importación'   },
    { id: 'imei',          ico: '🔍', lbl: 'IMEI'          },
    { id: 'ventas',        ico: '📊', lbl: 'Ventas'        },
    { id: 'productos',     ico: '🗂️', lbl: 'Catálogo'      },
    { id: 'equipo',              ico: '👥', lbl: 'Equipo'        },
    { href: '/asistencia',       ico: '✅', lbl: 'Marcar'        },
    { href: '/asistencia-admin', ico: '🗓️', lbl: 'Asistencia'   },
    { href: '/biometrics',       ico: '🔐', lbl: 'Mi Carnet QR' },
  ];

  return (
    <div className="page-wrap">

      {/* ── MOBILE NAV HEADER ── */}
      <div className="mobile-nav-header">
        <div className="mobile-nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Corp Tech" />
          <div className="mobile-nav-title">
            <span>Corp Tech</span>
            <span>{me?.name}</span>
          </div>
        </div>
        <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(o => !o)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-nav-drawer${mobileMenuOpen ? ' open' : ''}`}>
        {CORP_NAV.map(t => (
          t.href
            ? <Link key={t.href} href={t.href} className="tab-btn" onClick={() => setMobileMenuOpen(false)}><span className="ico">{t.ico}</span>{t.lbl}</Link>
            : <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => { switchTab(t.id); setMobileMenuOpen(false); }}>
                <span className="ico">{t.ico}</span>{t.lbl}
              </button>
        ))}
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <button onClick={toggleTheme} style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 0', color:'var(--text2)', cursor:'pointer', fontSize:18 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={doLogout} style={{ flex:2, background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:12, padding:'10px 0', color:'var(--red)', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* TOP BAR — oculto en desktop */}
      <div className="top-bar top-bar-desktop-hidden">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'var(--card2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Corp Tech" style={{ width:28, height:28, objectFit:'contain' }} />
          </div>
          <div>
            <div className="top-bar-title">Corp Tech</div>
            <div className="top-bar-sub">{me?.name}</div>
          </div>
        </div>
        <div className="top-bar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <span className="badge" style={{ background: 'var(--purple)', color: '#fff' }}>CORP</span>
          <button className="top-btn-logout" onClick={doLogout}>Salir</button>
        </div>
      </div>

      {toast && (
        <div className="toast-wrap">
          <div className={`toast-msg ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="content content-no-topbar">

        {/* ══════════════════════════════════════
            TAB: DASHBOARD EJECUTIVO
        ══════════════════════════════════════ */}
        {tab === 'dashboard' && (
          <div style={{ padding: '16px', paddingBottom: 48 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>📈 Dashboard</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Vista ejecutiva · {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
              <button className="section-action" onClick={loadDashboard}>⟳ Actualizar</button>
            </div>

            {dashLoading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                Cargando métricas...
              </div>
            )}

            {!dashLoading && dashData && (() => {
              const fmt  = (n) => `S/ ${parseFloat(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              const fmtU = (n) => `$ ${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              const fmtN = (n) => parseFloat(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const d = dashData;

              return (
                <>
                  {/* ── FILA 1: Capital total KPI banner ── */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0A84FF22 0%, #30D15822 100%)',
                    border: '1px solid rgba(10,132,255,0.3)',
                    borderRadius: 20, padding: '20px 24px', marginBottom: 16,
                    display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
                  }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>💎 Capital Total del Holding</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#0A84FF', lineHeight: 1 }}>{fmt(d.capitalTotal)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{fmtU(d.capitalTotal / d.fx)} · TC: {d.fx.toFixed(3)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(48,209,88,0.1)', borderRadius: 14, border: '1px solid rgba(48,209,88,0.2)' }}>
                        <div style={{ fontSize: 10, color: '#30D158', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>📦 Stock</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#30D158' }}>{fmt(d.stockTotal)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{d.stockCount} equipos</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,214,10,0.1)', borderRadius: 14, border: '1px solid rgba(255,214,10,0.2)' }}>
                        <div style={{ fontSize: 10, color: '#FFD60A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>💵 Caja</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#FFD60A' }}>{fmt(d.cashTotal)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{d.cashDetail.length} cuentas</div>
                      </div>
                      {d.importVal > 0 && (
                        <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(191,90,242,0.1)', borderRadius: 14, border: '1px solid rgba(191,90,242,0.2)' }}>
                          <div style={{ fontSize: 10, color: '#BF5AF2', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>✈️ Importando</div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#BF5AF2' }}>{fmt(d.importVal)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{d.imBatches.length} lotes</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── FILA 2: KPIs rápidos ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                      { ico: '📊', lbl: 'Ventas del Mes', val: fmt(d.ventasMes), sub: `${d.ventasCount} transacciones`, color: '#30D158' },
                      { ico: '🔄', lbl: 'Stock en Tránsito', val: fmt(d.transitVal), sub: 'Entre almacenes', color: '#FF9F0A' },
                      { ico: '⚠️', lbl: 'Deudas Tiendas', val: fmt(d.totalDeuda), sub: `${d.liqByStore.length} tiendas`, color: d.totalDeuda > 0 ? '#FF453A' : '#30D158' },
                      { ico: '🏦', lbl: 'Bancos', val: fmt(d.cashBanks), sub: 'Total en bancos', color: '#0A84FF' },
                      { ico: '📱', lbl: 'Plataformas', val: fmt(d.cashPlats), sub: 'Yape, Plin, etc.', color: '#5E5CE6' },
                      { ico: '💵', lbl: 'Efectivo físico', val: fmt(d.cashEfect), sub: 'En caja', color: '#FFD60A' },
                    ].map((k, i) => (
                      <div key={i} style={{
                        background: 'var(--card)', border: `1px solid var(--border)`,
                        borderRadius: 16, padding: '14px 16px',
                        borderLeft: `3px solid ${k.color}`,
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>{k.ico} {k.lbl}</div>
                        <div style={{ fontWeight: 900, fontSize: 17, color: k.color, lineHeight: 1.1 }}>{k.val}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── FILA 3: Stock por ubicación ── */}
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📦 Stock por Ubicación</div>
                    {d.stockByOrg.map((org, i) => {
                      const pct = d.stockTotal > 0 ? (org.value / d.stockTotal) * 100 : 0;
                      return (
                        <div key={org.id} style={{ marginBottom: i < d.stockByOrg.length - 1 ? 14 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{org.ico}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{org.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{org.count} equipos</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: org.color || '#0A84FF' }}>{fmt(org.value)}</div>
                              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{pct.toFixed(1)}% del total</div>
                            </div>
                          </div>
                          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: org.color || '#0A84FF', borderRadius: 99, transition: 'width .5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── FILA 4: Cuentas de dinero detalladas ── */}
                  {d.cashDetail.length > 0 && (
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', marginBottom: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>💰 Dinero por Cuenta / Ubicación</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                        {d.cashDetail.map(acc => {
                          const tipoColor = acc.tipo === 'banco' ? '#0A84FF' : acc.tipo === 'plataforma' ? '#5E5CE6' : acc.tipo === 'efectivo' ? '#FFD60A' : '#8E8E93';
                          const tipoLbl   = acc.tipo === 'banco' ? '🏦' : acc.tipo === 'plataforma' ? '📱' : acc.tipo === 'efectivo' ? '💵' : '🏷️';
                          return (
                            <div key={acc.id} style={{ background: 'var(--card2)', borderRadius: 14, padding: '12px 14px', border: `1px solid ${tipoColor}22` }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: tipoColor, textTransform: 'uppercase', marginBottom: 4 }}>{tipoLbl} {acc.tipo}</div>
                              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, lineHeight: 1.2 }}>{acc.nombre}</div>
                              <div style={{ fontWeight: 900, fontSize: 16, color: tipoColor }}>
                                {acc.moneda === 'USD' ? `$ ${fmtN(acc.saldo)}` : `S/ ${fmtN(acc.saldo)}`}
                              </div>
                              {acc.moneda === 'USD' && (
                                <div style={{ fontSize: 10, color: 'var(--text3)' }}>≈ S/ {fmtN(acc.saldoPEN)}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── FILA 5: Deudas de tiendas ── */}
                  {d.liqByStore.length > 0 ? (
                    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,69,58,0.3)', borderRadius: 18, padding: '16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>⚠️ Deudas Pendientes de Tiendas</div>
                        <span style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A', fontWeight: 800, fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>{fmt(d.totalDeuda)}</span>
                      </div>
                      {d.liqByStore.map(store => (
                        <div key={store.id} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,69,58,0.05)', border: '1px solid rgba(255,69,58,0.15)', borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{store.ico}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{store.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{store.items.length} liquidación{store.items.length !== 1 ? 'es' : ''} pendiente{store.items.length !== 1 ? 's' : ''}</div>
                              </div>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: 16, color: '#FF453A' }}>{fmt(store.total)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--card)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 18, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>✅</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#30D158' }}>Sin deudas pendientes</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Todas las tiendas están al día</div>
                      </div>
                    </div>
                  )}

                  {/* ── FILA 6: Ventas por tienda ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
                    {d.ventasByStore.map(s => (
                      <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 22 }}>{s.ico}</span>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 20, color: '#30D158', marginBottom: 2 }}>{fmt(s.total)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.count} venta{s.count !== 1 ? 's' : ''} este mes</div>
                      </div>
                    ))}
                  </div>

                  {/* ── FILA 7: Importaciones activas ── */}
                  {d.imBatches.length > 0 && (
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', marginBottom: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>✈️ Importaciones Activas</div>
                      {d.imBatches.map(b => {
                        const estadoColor = b.estado === 'en_transito' ? '#FF9F0A' : b.estado === 'en_aduana' ? '#BF5AF2' : '#30D158';
                        const estadoLbl   = b.estado === 'en_transito' ? '✈️ En tránsito' : b.estado === 'en_aduana' ? '🛃 En aduana' : '📦 En Lima';
                        return (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{b.descripcion || 'Lote sin nombre'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.num_unidades} unid{b.fecha_llegada_est ? ` · Est: ${b.fecha_llegada_est}` : ''}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: '#BF5AF2' }}>{fmt(b.costo_landed_pen)}</div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: estadoColor }}>{estadoLbl}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── FILA 8: Últimas ventas ── */}
                  {d.recentSales.length > 0 && (
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🧾 Últimas Ventas</div>
                      {d.recentSales.map(s => {
                        const store   = ALL_ORGS.find(o => o.id === s.org_id);
                        const hora    = new Date(s.created_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                        const pmColor = s.payment_method === 'efectivo' ? '#FFD60A' : s.payment_method === 'yape' ? '#BF5AF2' : s.payment_method === 'transferencia' ? '#0A84FF' : '#30D158';
                        return (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{store?.ico || '🏢'}</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{store?.name || 'Corp'}</div>
                                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{hora}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: '#30D158' }}>S/ {fmtN(s.total_amount)}</div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: pmColor, textTransform: 'capitalize' }}>{s.payment_method}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {!dashLoading && !dashData && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Dashboard vacío</div>
                <button className="section-action" onClick={loadDashboard}>Cargar métricas</button>
              </div>
            )}
          </div>
        )}

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
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {s.products?.name || 'Producto'}
                          {s.imei_check_id && (
                            <span
                              title="Ver check IMEI"
                              style={{ marginLeft: 6, fontSize: 11, background: 'rgba(10,132,255,0.15)', color: '#0A84FF', borderRadius: 6, padding: '1px 6px', fontWeight: 700, cursor: 'pointer' }}
                              onClick={() => switchTab('imei')}
                            >🔍 IMEI</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {s.imei || s.serial_number || 'Sin serial'}
                          {s.model_number && <span style={{ marginLeft: 5, color: '#0A84FF', fontWeight: 700 }}>{s.model_number}</span>}
                          {s.storage_info && <span style={{ marginLeft: 4, color: '#FF9F0A', fontWeight: 700 }}>{s.storage_info}</span>}
                          {s.color_info   && <span style={{ marginLeft: 4, color: '#BF5AF2' }}>{s.color_info}</span>}
                        </div>
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
        {tab === 'productos' && (() => {
          const CATS = [
            { id: 'all',      lbl: 'Todos',      ico: '🗂️' },
            { id: 'iphone',   lbl: 'iPhone',     ico: '📱' },
            { id: 'ipad',     lbl: 'iPad',       ico: '📟' },
            { id: 'mac',      lbl: 'Mac',        ico: '💻' },
            { id: 'airpods',  lbl: 'AirPods',    ico: '🎧' },
            { id: 'samsung',  lbl: 'Samsung',    ico: '📲' },
            { id: 'accesorio',lbl: 'Accesorios', ico: '🔌' },
            { id: 'otro',     lbl: 'Otro',       ico: '📦' },
          ];
          const CAT_COLORS = {
            iphone: '#0A84FF', ipad: '#5E5CE6', mac: '#636366',
            airpods: '#30D158', samsung: '#FF9F0A', accesorio: '#BF5AF2', otro: '#8E8E93',
          };
          const [catFilter, setCatFilter] = [
            form._cat_filter || 'all',
            (v) => setForm(f => ({ ...f, _cat_filter: v })),
          ];
          const visible = catFilter === 'all'
            ? products
            : products.filter(p => (p.category || 'otro') === catFilter);

          return (
            <div style={{ padding: '16px' }}>
              {/* Header */}
              <div className="section-header">
                <div className="section-title">🗂️ Catálogo</div>
                <button className="section-action"
                  onClick={() => { setModal('add-product'); setForm({ emoji: '📱', category: 'iphone' }); }}>
                  + Nuevo
                </button>
              </div>

              {/* Tip */}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '10px 14px', background: 'rgba(10,132,255,0.07)', borderRadius: 12, border: '1px solid rgba(10,132,255,0.18)' }}>
                💡 Cada producto es una <b>plantilla de modelo</b>. Al registrar un equipo eliges el modelo y solo ingresas IMEI, color, GB y condición.
              </div>

              {/* ── Agregar Rápido por Categoría ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  ➕ Nuevo modelo por categoría
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    { id:'iphone',    lbl:'iPhone',    ico:'📱', color:'#0A84FF', emoji:'📱' },
                    { id:'ipad',      lbl:'iPad',      ico:'📟', color:'#5E5CE6', emoji:'📟' },
                    { id:'mac',       lbl:'Mac',       ico:'💻', color:'#636366', emoji:'💻' },
                    { id:'airpods',   lbl:'AirPods',   ico:'🎧', color:'#30D158', emoji:'🎧' },
                    { id:'samsung',   lbl:'Samsung',   ico:'📲', color:'#FF9F0A', emoji:'📲' },
                    { id:'accesorio', lbl:'Accesorios',ico:'🔌', color:'#BF5AF2', emoji:'🔌' },
                    { id:'otro',      lbl:'Otro',      ico:'📦', color:'#8E8E93', emoji:'📦' },
                  ].map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setModal('add-product'); setForm({ emoji: c.emoji, category: c.id, _cat_filter: c.id }); }}
                      style={{
                        padding: '10px 6px', borderRadius: 14, border: `1.5px dashed ${c.color}55`,
                        background: `${c.color}0d`, cursor: 'pointer', textAlign: 'center',
                        color: c.color, fontWeight: 700, fontSize: 11, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background=`${c.color}22`; e.currentTarget.style.borderColor=c.color; }}
                      onMouseLeave={e => { e.currentTarget.style.background=`${c.color}0d`; e.currentTarget.style.borderColor=`${c.color}55`; }}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{c.ico}</div>
                      <div>{c.lbl}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>
                        {products.filter(p => (p.category||'otro') === c.id).length} modelos
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro de categorías */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
                {CATS.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => setCatFilter(c.id)}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${catFilter === c.id ? (CAT_COLORS[c.id] || '#0A84FF') : 'var(--border)'}`,
                      background: catFilter === c.id ? `${CAT_COLORS[c.id] || '#0A84FF'}20` : 'transparent',
                      color: catFilter === c.id ? (CAT_COLORS[c.id] || '#0A84FF') : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}>
                    {c.ico} {c.lbl}
                    {c.id !== 'all' && (
                      <span style={{ marginLeft: 5, opacity: 0.7 }}>
                        {products.filter(p => (p.category || 'otro') === c.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Grid de productos */}
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 56, marginBottom: 14 }}>📦</div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Sin productos aún</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Agrega el primer modelo base al catálogo</div>
                  <button className="section-action" onClick={() => { setModal('add-product'); setForm({ emoji: '📱', category: 'iphone' }); }}>
                    + Crear primer producto
                  </button>
                </div>
              ) : visible.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>Sin productos en esta categoría</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {visible.map(p => {
                    const catColor = CAT_COLORS[p.category || 'otro'] || '#8E8E93';
                    const catInfo  = CATS.find(c => c.id === (p.category || 'otro'));
                    return (
                      <div key={p.id} style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 20, overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        transition: 'box-shadow .2s, transform .2s',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                      >
                        {/* Imagen / emoji centrado */}
                        <div style={{
                          height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: p.image_url ? 'var(--card2)' : `${catColor}0d`,
                          borderBottom: `1px solid ${catColor}22`,
                          position: 'relative',
                        }}>
                          {p.image_url
                            ? <img
                                src={p.image_url}
                                alt={p.name}
                                style={{ maxHeight: 120, maxWidth: '85%', objectFit: 'contain' }}
                                onError={e => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            : null
                          }
                          <span style={{
                            fontSize: 56,
                            display: p.image_url ? 'none' : 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>{p.emoji || '📦'}</span>
                          {/* Badge categoría */}
                          <span style={{
                            position: 'absolute', top: 10, right: 10,
                            fontSize: 10, padding: '3px 8px', borderRadius: 20,
                            background: `${catColor}22`, color: catColor, fontWeight: 700,
                          }}>
                            {catInfo?.ico} {catInfo?.lbl || 'Otro'}
                          </span>
                        </div>

                        {/* Info */}
                        <div style={{ padding: '14px 16px', flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                          {p.chip && (
                            <div style={{ fontSize: 11, color: '#FF9F0A', fontWeight: 700, marginBottom: 4 }}>⚡ {p.chip}</div>
                          )}
                          {p.description && (
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {p.description}
                            </div>
                          )}
                          {p.sale_price > 0 && (
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#30D158' }}>
                              S/ {parseFloat(p.sale_price).toFixed(2)}
                            </div>
                          )}

                          {/* Chips colores/capacidades */}
                          {((p.default_capacities?.length > 0) || (p.default_colors?.length > 0)) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {(p.default_capacities || []).slice(0, 4).map((c, i) => (
                                <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,159,10,0.14)', color: '#FF9F0A', fontWeight: 700 }}>{c}</span>
                              ))}
                              {(p.default_colors || []).slice(0, 4).map((c, i) => (
                                <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(191,90,242,0.14)', color: '#BF5AF2', fontWeight: 700 }}>{c}</span>
                              ))}
                              {((p.default_capacities?.length || 0) + (p.default_colors?.length || 0)) > 8 && (
                                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'var(--card2)', color: 'var(--text3)', fontWeight: 700 }}>+más</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
                          <button
                            onClick={() => {
                              setForm({ _edit_id: p.id, name: p.name, description: p.description || '', emoji: p.emoji || '📦', sale_price: p.sale_price || '', category: p.category || 'otro', chip: p.chip || '', colors_text: (p.default_colors || []).join(', '), capacities_text: (p.default_capacities || []).join(', '), image_url: p.image_url || '', color_images: p.color_images || {}, _cat_filter: form._cat_filter });
                              setModal('add-product');
                            }}
                            style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: 'rgba(10,132,255,0.12)', color: '#4DA8FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id, p.name)}
                            style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: 'rgba(255,69,58,0.08)', color: '#FF453A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            🗑 Borrar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══════════════════════════════════════
            TAB: TIENDAS
        ══════════════════════════════════════ */}
        {tab === 'tiendas' && (
          <div style={{ padding: '16px', paddingBottom: 48 }}>

            {/* ─ Acceso Rápido ─ */}
            <div className="section-title" style={{ marginBottom: 12 }}>🏪 Acceso Rápido</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
              {STORES.map(s => (
                <div key={s.id} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 18, padding: '16px 10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{s.ico}</div>
                  <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 10, lineHeight: 1.3 }}>{s.name}</div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', fontSize: 11, padding: '8px 4px', borderRadius: 10 }}
                    onClick={() => {
                      localStorage.setItem('corp_selected_store', s.id);
                      localStorage.setItem('corp_selected_store_name', s.name);
                      router.push('/store');
                    }}>
                    Ingresar →
                  </button>
                </div>
              ))}
            </div>

            {/* ─ Gestión de Usuarios ─ */}
            <div className="section-header">
              <div className="section-title">👥 Usuarios por Tienda</div>
              <button className="section-action" onClick={() => {
                setModal('create-user');
                setNewUserForm({ full_name: '', email: '', password: '', role: 'vendedor', org_id: selectedStoreForUsers });
              }}>+ Nuevo</button>
            </div>

            {/* Pills selector de tienda */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {STORES.map(s => (
                <button key={s.id} type="button"
                  onClick={() => { setSelectedStoreForUsers(s.id); loadStoreUsers(s.id); }}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${selectedStoreForUsers === s.id ? '#0A84FF' : 'var(--border)'}`,
                    background: selectedStoreForUsers === s.id ? 'rgba(10,132,255,0.15)' : 'transparent',
                    color: selectedStoreForUsers === s.id ? '#0A84FF' : 'var(--text3)',
                    transition: 'all .15s',
                  }}>
                  {s.ico} {s.name}
                </button>
              ))}
            </div>

            {/* Lista de usuarios */}
            {storeUsersLoading ? (
              <div className="empty-msg">Cargando usuarios...</div>
            ) : storeUsers.length === 0 ? (
              <div className="empty-msg">
                Sin usuarios en esta tienda.{' '}
                <span style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 700 }}
                  onClick={() => {
                    setModal('create-user');
                    setNewUserForm({ full_name: '', email: '', password: '', role: 'vendedor', org_id: selectedStoreForUsers });
                  }}>
                  Crear primero →
                </span>
              </div>
            ) : (
              <div className="card">
                {storeUsers.map(u => {
                  const role = u.user_roles?.[0]?.role || '—';
                  const roleColor = role === 'store_admin' ? '#FF9F0A' : role === 'vendedor' ? '#30D158' : 'var(--text3)';
                  const roleLabel = role === 'store_admin' ? '🏪 Admin Tienda' : role === 'vendedor' ? '🛒 Vendedor' : role;
                  return (
                    <div className="list-item" key={u.id}>
                      <div className="list-item-ico">👤</div>
                      <div className="list-item-body">
                        <div className="list-item-name">{u.full_name}</div>
                        <div className="list-item-sub">
                          <span style={{ color: roleColor, fontWeight: 700 }}>{roleLabel}</span>
                          {' · '}{u.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: EQUIPO — GESTIÓN DE TRABAJADORES
        ══════════════════════════════════════ */}
        {tab === 'equipo' && (() => {
          const ROLE_META = {
            superadmin:  { lbl:'👑 SuperAdmin',   color:'#FF9F0A' },
            corp:        { lbl:'🏢 Corp',          color:'#0A84FF' },
            admin_corp:  { lbl:'🏢 Admin Corp',    color:'#0A84FF' },
            store_admin: { lbl:'🏪 Admin Tienda',  color:'#BF5AF2' },
            vendedor:    { lbl:'🛒 Vendedor',      color:'#30D158' },
          };
          const ORG_META = {
            '00000000-0000-0000-0000-000000000001': { lbl:'Corp Tech',       ico:'🏢' },
            '00000000-0000-0000-0000-000000000002': { lbl:'Futurteck',       ico:'🔵' },
            '00000000-0000-0000-0000-000000000003': { lbl:'Innovatech Store',ico:'🟣' },
            '00000000-0000-0000-0000-000000000004': { lbl:'WeTech Peru',     ico:'🟢' },
          };
          const getRoleMeta = r => ROLE_META[r] || { lbl: r || 'Sin rol', color:'var(--text3)' };
          const getOrgMeta  = id => ORG_META[id] || { lbl:'—', ico:'❓' };

          const filtered = workerFilter === 'all'
            ? workerList
            : workerList.filter(w => (w.user_roles?.[0]?.org_id || w.org_id) === workerFilter);

          return (
            <div style={{ padding:'16px' }}>

              {/* Header */}
              <div className="section-header" style={{ marginBottom:16 }}>
                <div className="section-title">👥 Equipo de trabajo</div>
                <button className="section-action" onClick={() => { setWorkerModal(true); setWorkerMsg(null); }}>
                  + Invitar trabajador
                </button>
              </div>

              {/* Mensaje de éxito / error */}
              {workerMsg && (
                <div style={{
                  padding:'12px 16px', borderRadius:12, marginBottom:16, fontSize:14,
                  background: workerMsg.type==='ok' ? 'rgba(48,209,88,0.1)' : 'rgba(255,59,48,0.1)',
                  border: `1px solid ${workerMsg.type==='ok' ? 'rgba(48,209,88,0.3)' : 'rgba(255,59,48,0.3)'}`,
                  color: workerMsg.type==='ok' ? '#30D158' : '#FF3B30',
                }}>
                  {workerMsg.text}
                </div>
              )}

              {/* Filtros por tienda */}
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {[
                  { id:'all', lbl:'Todos' },
                  { id:'00000000-0000-0000-0000-000000000001', lbl:'🏢 Corp' },
                  { id:'00000000-0000-0000-0000-000000000002', lbl:'🔵 Futurteck' },
                  { id:'00000000-0000-0000-0000-000000000003', lbl:'🟣 Innovatech' },
                  { id:'00000000-0000-0000-0000-000000000004', lbl:'🟢 WeTech' },
                ].map(f => (
                  <button key={f.id} onClick={() => setWorkerFilter(f.id)}
                    style={{
                      padding:'6px 14px', borderRadius:20, border:'1px solid var(--border)',
                      background: workerFilter===f.id ? 'var(--accent)' : 'var(--card)',
                      color: workerFilter===f.id ? '#fff' : 'var(--text2)',
                      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    }}>{f.lbl}</button>
                ))}
              </div>

              {/* Lista de trabajadores */}
              {workerLoading ? (
                <div className="empty-msg">Cargando equipo…</div>
              ) : filtered.length === 0 ? (
                <div className="empty-msg">
                  No hay trabajadores en esta categoría.{' '}
                  <button style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:14 }}
                    onClick={() => setWorkerModal(true)}>Invitar ahora →</button>
                </div>
              ) : (
                <div className="card" style={{ overflow:'hidden' }}>
                  {filtered.map((w, i) => {
                    const role    = w.user_roles?.[0]?.role;
                    const roleOrg = w.user_roles?.[0]?.org_id || w.org_id;
                    const rm  = getRoleMeta(role);
                    const org = getOrgMeta(roleOrg);
                    const isEditing = editWorker?.id === w.id;

                    return (
                      <div key={w.id} className="list-item"
                        style={{ borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', flexWrap:'wrap', gap:10 }}>

                        {/* Avatar */}
                        <div style={{
                          width:40, height:40, borderRadius:12, flexShrink:0,
                          background:'var(--accent-dim)', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:16, fontWeight:800,
                          color:'var(--accent)',
                        }}>
                          {(w.full_name||'?')[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="list-item-body" style={{ flex:1, minWidth:160 }}>
                          <div className="list-item-name">{w.full_name || '—'}</div>
                          <div className="list-item-sub" style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                            <span style={{ color: rm.color, fontWeight:700, fontSize:12 }}>{rm.lbl}</span>
                            <span style={{ opacity:0.4 }}>·</span>
                            <span>{org.ico} {org.lbl}</span>
                            <span style={{ opacity:0.4 }}>·</span>
                            <span style={{ fontSize:11 }}>{w.email}</span>
                          </div>
                        </div>

                        {/* Acciones */}
                        {!isEditing ? (
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button onClick={() => setEditWorker({ id:w.id, role: role||'vendedor', org_id: roleOrg||STORES[0].id })}
                              style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              Editar rol
                            </button>
                            <button onClick={() => revokeWorkerAccess(w.id, w.email)}
                              style={{ padding:'5px 10px', borderRadius:8, border:'1px solid rgba(255,59,48,0.3)', background:'rgba(255,59,48,0.08)', color:'#FF3B30', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          /* Editor de rol inline */
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap', width:'100%', marginTop:8 }}>
                            <select value={editWorker.role} onChange={e => setEditWorker(p=>({...p, role:e.target.value}))}
                              style={{ flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
                              {Object.entries(ROLE_META).map(([k,v]) => <option key={k} value={k}>{v.lbl}</option>)}
                            </select>
                            <select value={editWorker.org_id} onChange={e => setEditWorker(p=>({...p, org_id:e.target.value}))}
                              style={{ flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
                              {Object.entries(ORG_META).map(([k,v]) => <option key={k} value={k}>{v.ico} {v.lbl}</option>)}
                            </select>
                            <button onClick={() => updateWorkerRole(editWorker.id, editWorker.role, editWorker.org_id)}
                              style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                              Guardar
                            </button>
                            <button onClick={() => setEditWorker(null)}
                              style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── MODAL: INVITAR TRABAJADOR ── */}
              {workerModal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
                  onClick={e => { if(e.target===e.currentTarget) setWorkerModal(false); }}>
                  <div style={{
                    width:'100%', maxWidth:420, borderRadius:20, padding:28,
                    background:'var(--card)', border:'1px solid var(--border)',
                    boxShadow:'0 24px 60px rgba(0,0,0,0.4)', position:'relative',
                  }}>
                    {/* X cerrar */}
                    <button onClick={() => setWorkerModal(false)} style={{
                      position:'absolute', top:16, right:16, width:32, height:32,
                      background:'var(--bg)', border:'1px solid var(--border)',
                      borderRadius:8, fontSize:16, cursor:'pointer', color:'var(--text3)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>✕</button>

                    <div style={{ marginBottom:20 }}>
                      <h3 style={{ fontSize:19, fontWeight:800, margin:'0 0 5px', color:'var(--text)' }}>Invitar trabajador</h3>
                      <p style={{ fontSize:13, color:'var(--text3)', margin:0 }}>Le llegará un email para crear su contraseña.</p>
                    </div>

                    {/* Campo reutilizable — función local */}
                    {[
                      { lbl:'Nombre completo', key:'full_name', type:'text',  ph:'Juan Pérez' },
                      { lbl:'Email',           key:'email',     type:'email', ph:'trabajador@email.com' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom:14 }}>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>
                          {f.lbl}
                        </label>
                        <input type={f.type} placeholder={f.ph}
                          value={workerForm[f.key]}
                          onChange={e => setWorkerForm(p=>({...p, [f.key]:e.target.value}))}
                          style={{
                            display:'block', width:'100%', padding:'11px 14px',
                            background:'var(--bg)', border:'1.5px solid var(--border)',
                            borderRadius:12, color:'var(--text)', fontSize:15,
                            fontFamily:'inherit', outline:'none', boxSizing:'border-box',
                          }} />
                      </div>
                    ))}

                    <div style={{ marginBottom:14 }}>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>
                        Rol
                      </label>
                      <select value={workerForm.role} onChange={e => setWorkerForm(p=>({...p, role:e.target.value}))}
                        style={{
                          display:'block', width:'100%', padding:'11px 14px',
                          background:'var(--bg)', border:'1.5px solid var(--border)',
                          borderRadius:12, color:'var(--text)', fontSize:15,
                          fontFamily:'inherit', outline:'none', boxSizing:'border-box', cursor:'pointer',
                        }}>
                        <option value="vendedor">🛒 Vendedor — solo POS de tienda</option>
                        <option value="store_admin">🏪 Admin Tienda — gestiona su tienda</option>
                        <option value="corp">🏢 Corp — panel corporativo</option>
                      </select>
                    </div>

                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>
                        Tienda / Empresa
                      </label>
                      <select value={workerForm.org_id} onChange={e => setWorkerForm(p=>({...p, org_id:e.target.value}))}
                        style={{
                          display:'block', width:'100%', padding:'11px 14px',
                          background:'var(--bg)', border:'1.5px solid var(--border)',
                          borderRadius:12, color:'var(--text)', fontSize:15,
                          fontFamily:'inherit', outline:'none', boxSizing:'border-box', cursor:'pointer',
                        }}>
                        <option value="00000000-0000-0000-0000-000000000001">🏢 Corp Tech</option>
                        <option value="00000000-0000-0000-0000-000000000002">🔵 Futurteck</option>
                        <option value="00000000-0000-0000-0000-000000000003">🟣 Innovatech Store</option>
                        <option value="00000000-0000-0000-0000-000000000004">🟢 WeTech Peru</option>
                      </select>
                    </div>

                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={() => setWorkerModal(false)} style={{
                        flex:1, padding:'12px', borderRadius:12,
                        border:'1px solid var(--border)', background:'var(--bg)',
                        color:'var(--text2)', fontSize:14, fontWeight:600,
                        cursor:'pointer', fontFamily:'inherit',
                      }}>Cancelar</button>
                      <button onClick={inviteWorker}
                        disabled={workerSaving || !workerForm.email || !workerForm.full_name}
                        style={{
                          flex:2, padding:'12px', borderRadius:12, border:'none',
                          background: workerSaving||!workerForm.email||!workerForm.full_name ? 'var(--border)' : 'var(--accent)',
                          color:'#fff', fontSize:14, fontWeight:700,
                          cursor: workerSaving||!workerForm.email||!workerForm.full_name ? 'default' : 'pointer',
                          fontFamily:'inherit', transition:'background .2s',
                        }}>
                        {workerSaving ? '⏳ Enviando…' : '📨 Enviar invitación'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge badge-${w.is_active ? 'green' : 'red'}`}>
                        {w.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => { setModal('edit-warehouse'); setForm({ wh_id: w.id, wh_name: w.name, wh_org_id: w.org_id, wh_type: w.type, wh_aisle: w.aisle || '', wh_shelf: w.shelf || '', wh_active: w.is_active }); }}
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card2)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >✏️ Editar</button>
                    </div>
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
            TAB: IMPORTACIÓN USA — COSTO LANDED
        ══════════════════════════════════════ */}
        {tab === 'importacion' && (() => {
          // KPIs calculados desde batches
          const totalLandedPEN = batches.reduce((s, b) => s + (b.costo_landed_pen || 0), 0);
          const totalLandedUSD = batches.reduce((s, b) => s + (b.costo_landed_usd || 0), 0);
          const enTransito     = batches.filter(b => b.estado === 'en_transito').length;

          const ESTADO_BADGE = {
            en_transito: { lbl: '✈️ En tránsito', color: '#FF9F0A' },
            en_lima:     { lbl: '📦 En Lima',      color: '#30D158' },
            distribuido: { lbl: '✅ Distribuido',   color: '#5E5CE6' },
          };

          return (
            <div style={{ padding: '16px' }}>

              {/* KPIs */}
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
                <div className="kpi">
                  <div className="kpi-ico">💵</div>
                  <div className="kpi-val" style={{ fontSize: 15 }}>${totalLandedUSD.toFixed(0)}</div>
                  <div className="kpi-lbl">Invertido USD</div>
                </div>
                <div className="kpi">
                  <div className="kpi-ico">🪙</div>
                  <div className="kpi-val" style={{ fontSize: 15 }}>S/{totalLandedPEN.toFixed(0)}</div>
                  <div className="kpi-lbl">Costo total PEN</div>
                </div>
                <div className="kpi">
                  <div className="kpi-ico">✈️</div>
                  <div className="kpi-val">{enTransito}</div>
                  <div className="kpi-lbl">En tránsito</div>
                </div>
              </div>

              {/* ── TIPO DE CAMBIO USD → PEN ── */}
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '14px 16px', marginBottom: 14,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  💱 Tipo de Cambio — USD → Soles (PEN)
                </div>

                {/* Toggle Manual / Auto */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {['auto', 'manual'].map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setTcMode(mode)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 10,
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        border: `1.5px solid ${tcMode === mode ? 'var(--blue)' : 'var(--border)'}`,
                        background: tcMode === mode ? 'rgba(10,132,255,0.12)' : 'transparent',
                        color: tcMode === mode ? 'var(--blue)' : 'var(--text3)',
                        transition: 'all .15s',
                      }}>
                      {mode === 'auto' ? '🌐 Automático (API)' : '✏️ Ingresar Manual'}
                    </button>
                  ))}
                </div>

                {tcMode === 'auto' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="btn btn-outline btn-sm" onClick={fetchUsdRate} disabled={loadingRate}
                      style={{ flexShrink: 0 }}>
                      {loadingRate ? '⏳ Consultando…' : '🔄 Obtener TC del día'}
                    </button>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 }}>
                      {usdRate
                        ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ S/ {usdRate} obtenido</span>
                        : 'Consulta el tipo de cambio oficial en tiempo real'
                      }
                    </div>
                  </div>
                )}

                {tcMode === 'manual' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      className="form-input"
                      type="number" step="0.001" min="1"
                      placeholder="Ej: 3.750"
                      value={usdRate}
                      onChange={e => setUsdRate(e.target.value)}
                      style={{ flex: 1, fontFamily: 'monospace', fontWeight: 800, fontSize: 20, textAlign: 'center' }}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, lineHeight: 1.5 }}>
                      soles<br/>por $1 USD
                    </div>
                  </div>
                )}

                {usdRate && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>TC activo para este lote:</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                      $1 = S/ {parseFloat(usdRate).toFixed(3)}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón nuevo lote */}
              <button className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: 16 }}
                onClick={() => {
                  setModal('add-batch');
                  setForm({ imp_igv: '18', imp_margen: '30', imp_unidades: '1', imp_arancel: '0' });
                }}>
                + Nuevo Lote de Importación
              </button>

              {/* Lista de lotes */}
              <div className="section-title" style={{ marginBottom: 12 }}>📥 Lotes de importación</div>
              {batches.length === 0 ? (
                <div className="empty-msg">Sin lotes. Registra tu primera importación.</div>
              ) : (
                batches.map(b => {
                  const badge = ESTADO_BADGE[b.estado] || { lbl: b.estado, color: '#888' };
                  const costPU = b.num_unidades > 0 ? (b.costo_landed_pen || 0) / b.num_unidades : 0;
                  return (
                    <div className="card" key={b.id} style={{ padding: '14px', marginBottom: 12 }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{b.descripcion || 'Lote sin nombre'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {b.proveedor && <span>{b.proveedor} · </span>}
                            {b.num_unidades} unid.
                            {b.fecha_compra && <span> · Compra: {b.fecha_compra}</span>}
                            {b.fecha_llegada_est && <span> · ETA: {b.fecha_llegada_est}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.lbl}</span>
                      </div>

                      {/* Costos */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '8px 12px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Costo Landed</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--red)' }}>S/{(b.costo_landed_pen || 0).toFixed(0)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${(b.costo_landed_usd || 0).toFixed(0)} USD</div>
                        </div>
                        <div style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                          <div style={{ fontSize: 10, color: '#30D158', fontWeight: 700, textTransform: 'uppercase' }}>P. Sugerido x und.</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#30D158' }}>S/{(b.precio_sugerido_pen || 0).toFixed(0)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Margen: {b.margen_pct || 0}% · Costo/u: S/{costPU.toFixed(0)}</div>
                        </div>
                      </div>

                      {/* Desglose colapsado */}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                        Compra: ${(b.costo_usd || 0).toFixed(2)} · Flete: ${(b.flete_usd || 0).toFixed(2)} · Seguro: ${(b.seguro_usd || 0).toFixed(2)} · Arancel: {b.arancel_pct || 0}% · IGV: {b.igv_pct || 18}% · TC: S/{b.tipo_cambio_usado || '—'} · Lima: S/{(b.gastos_lima_pen || 0).toFixed(0)}
                      </div>

                      {/* Botones de estado */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {b.estado === 'en_transito' && (
                          <button className="btn btn-primary btn-sm" style={{ background: '#30D158' }}
                            onClick={() => updateBatchStatus(b.id, 'en_lima')}>
                            📦 Llegó a Lima
                          </button>
                        )}
                        {b.estado === 'en_lima' && (
                          <button className="btn btn-primary btn-sm" style={{ background: '#5E5CE6' }}
                            onClick={() => updateBatchStatus(b.id, 'distribuido')}>
                            ✅ Marcar distribuido
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}

        {/* ══════════════════════════════════════
            TAB: LIQUIDACIONES
        ══════════════════════════════════════ */}
        {tab === 'liquidaciones' && (() => {
          const LIQ_ESTADO = {
            borrador:      { lbl: 'Borrador',       color: '#888'    },
            enviada:       { lbl: '📤 Enviada',      color: '#FF9F0A' },
            pagada_parcial:{ lbl: '💸 Parcial',      color: '#5E5CE6' },
            pagada:        { lbl: '💰 Pagada',       color: '#0A84FF' },
            aprobada:      { lbl: '✅ Aprobada',     color: '#30D158' },
            rechazada:     { lbl: '❌ Rechazada',    color: '#FF453A' },
          };
          const PLAT_ESTADO = {
            pendiente:      { lbl: 'Pendiente',      color: '#888'    },
            subido:         { lbl: '📎 Subido',       color: '#FF9F0A' },
            verificando:    { lbl: '🔍 Verificando',  color: '#5E5CE6' },
            aprobado:       { lbl: '✅ Aprobado',     color: '#30D158' },
            rechazado:      { lbl: '❌ Rechazado',    color: '#FF453A' },
            con_diferencia: { lbl: '⚠️ Diferencia',   color: '#FF6B00' },
          };
          const totalPendiente = liquidaciones
            .filter(l => l.estado === 'enviada' || l.estado === 'pagada_parcial')
            .reduce((s, l) => s + (l.monto_neto_pen || 0), 0);
          const totalAprobado  = liquidaciones
            .filter(l => l.estado === 'aprobada')
            .reduce((s, l) => s + (l.monto_neto_pen || 0), 0);
          const liqFiltradas = liqFilter === 'all'
            ? liquidaciones
            : liquidaciones.filter(l => l.store_org_id === liqFilter);
          const liqPlatFiltradas = liqPlatFilter === 'all'
            ? liqPlat
            : liqPlat.filter(l => l.store_org_id === liqPlatFilter);
          const hoy = new Date();
          const cal7 = calendarioAll.filter(c => {
            const d = new Date(c.fecha_esperada);
            const diff = Math.ceil((d - hoy) / (1000*60*60*24));
            return diff >= 0 && diff <= 30;
          });

          return (
            <div style={{ padding: '16px' }}>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--surface)', borderRadius: 12, padding: 4 }}>
                {[
                  { id: 'corp',       lbl: '🏢 Corp→Tienda'  },
                  { id: 'plataformas',lbl: '🏪 Plataformas'  },
                  { id: 'calendario', lbl: '📅 Calendario'   },
                ].map(st => (
                  <button key={st.id}
                    onClick={() => setLiqSubTab(st.id)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none',
                      background: liqSubTab === st.id ? 'var(--blue, #0A84FF)' : 'transparent',
                      color: liqSubTab === st.id ? '#fff' : 'var(--text-muted)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                    }}>
                    {st.lbl}
                  </button>
                ))}
              </div>

              {/* ── SUB-TAB: Corp → Tienda ── */}
              {liqSubTab === 'corp' && (
                <>
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
                    <div className="kpi">
                      <div className="kpi-ico">⏳</div>
                      <div className="kpi-val" style={{ fontSize: 14 }}>S/{totalPendiente.toFixed(0)}</div>
                      <div className="kpi-lbl">Por cobrar</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-ico">✅</div>
                      <div className="kpi-val" style={{ fontSize: 14 }}>S/{totalAprobado.toFixed(0)}</div>
                      <div className="kpi-lbl">Cobrado</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-ico">📋</div>
                      <div className="kpi-val">{liquidaciones.length}</div>
                      <div className="kpi-lbl">Total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                    {[{ id: 'all', name: 'Todas', ico: '🌐' }, ...STORES].map(s => (
                      <button key={s.id} onClick={() => setLiqFilter(s.id)}
                        className={`btn btn-sm${liqFilter === s.id ? ' btn-primary' : ' btn-outline'}`}>
                        {s.ico} {s.name}
                      </button>
                    ))}
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}
                      onClick={() => { setModal('create-liquidacion'); setForm({ liq_store: STORES[0].id }); setPeriodData(null); }}>
                      + Nueva
                    </button>
                  </div>
                  {liqLoading ? <div className="empty-msg">Cargando…</div>
                  : liqFiltradas.length === 0 ? <div className="empty-msg">Sin liquidaciones. Crea la primera.</div>
                  : liqFiltradas.map(liq => {
                    const store  = STORES.find(s => s.id === liq.store_org_id);
                    const badge  = LIQ_ESTADO[liq.estado] || { lbl: liq.estado, color: '#888' };
                    const pagPend= liq.estado === 'pagada' || liq.estado === 'pagada_parcial';
                    return (
                      <div className="card" key={liq.id} style={{ padding: '14px', marginBottom: 12 }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{store?.ico} {store?.name || 'Tienda'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {liq.periodo_inicio} → {liq.periodo_fin}
                              {liq.descripcion && <span> · {liq.descripcion}</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.lbl}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ventas</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>S/{(liq.total_ventas_pen||0).toFixed(0)}</div>
                          </div>
                          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Productos</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>S/{(liq.valor_productos_pen||0).toFixed(0)}</div>
                          </div>
                          <div style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.25)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: '#4DA8FF', fontWeight: 700, textTransform: 'uppercase' }}>A COBRAR</div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#4DA8FF' }}>S/{(liq.monto_neto_pen||0).toFixed(0)}</div>
                          </div>
                        </div>
                        {liq.comprobante_url && (
                          <a href={liq.comprobante_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', padding: '8px 12px', background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 10, fontSize: 12, color: '#30D158', fontWeight: 600, marginBottom: 10, textDecoration: 'none' }}>
                            🧾 Ver comprobante de pago
                          </a>
                        )}
                        {pagPend && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary btn-sm" style={{ flex: 1, background: '#30D158' }}
                              onClick={() => approveLiquidacion(liq.id)}>✅ Aprobar pago</button>
                            <button className="btn btn-sm btn-outline" style={{ color: '#FF453A', borderColor: '#FF453A33' }}
                              onClick={() => { const m = prompt('Motivo del rechazo:'); if (m !== null) rejectLiquidacion(liq.id, m); }}>
                              ❌ Rechazar
                            </button>
                          </div>
                        )}
                        {liq.notas_corp && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Nota Corp: {liq.notas_corp}</div>}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── SUB-TAB: Plataformas ── */}
              {liqSubTab === 'plataformas' && (
                <>
                  {/* Catálogo de plataformas */}
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <div className="section-title">🏪 Catálogo de Plataformas</div>
                    <button className="section-action"
                      onClick={() => { setModal('add-plataforma'); setForm({ plat_periodicidad: 'mensual', plat_metodo: 'transferencia', plat_emoji: '🏪' }); }}>
                      + Nueva
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {plataformas.map(p => (
                      <div key={p.id} className="card" style={{ padding: '12px', cursor: 'pointer' }}
                        onClick={() => { setModal('add-plataforma'); setForm({ plat_id: p.id, plat_nombre: p.nombre, plat_emoji: p.emoji, plat_comision: p.comision_pct, plat_periodicidad: p.periodicidad, plat_dia: p.dia_liquidacion, plat_metodo: p.metodo_pago, plat_instrucciones: p.instrucciones }); }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          {p.logo_url
                            ? <img src={p.logo_url} alt={p.nombre} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
                            : <span style={{ fontSize: 24 }}>{p.emoji || '🏪'}</span>}
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nombre}</div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Comisión: <b style={{ color: '#FF9F0A' }}>{p.comision_pct}%</b>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Liq. día {p.dia_liquidacion} · {p.periodicidad}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {p.metodo_pago === 'deposito' ? '🏦 Depósito' : p.metodo_pago === 'transferencia' ? '💸 Transferencia' : p.metodo_pago}
                        </div>
                      </div>
                    ))}
                    {plataformas.length === 0 && <div className="empty-msg" style={{ gridColumn: '1/-1' }}>Sin plataformas configuradas</div>}
                  </div>

                  {/* Reportes subidos por tiendas */}
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <div className="section-title">📄 Reportes de plataformas</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    {[{ id: 'all', name: 'Todas', ico: '🌐' }, ...STORES].map(s => (
                      <button key={s.id} onClick={() => { setLiqPlatFilter(s.id); loadLiqPlat(); }}
                        className={`btn btn-sm${liqPlatFilter === s.id ? ' btn-primary' : ' btn-outline'}`}>
                        {s.ico} {s.name}
                      </button>
                    ))}
                  </div>
                  {liqPlatFiltradas.length === 0 ? (
                    <div className="empty-msg">Las tiendas aún no han subido reportes</div>
                  ) : (
                    liqPlatFiltradas.map(lp => {
                      const badge = PLAT_ESTADO[lp.estado] || { lbl: lp.estado, color: '#888' };
                      const puedRevisar = lp.estado === 'subido' || lp.estado === 'verificando';
                      return (
                        <div className="card" key={lp.id} style={{ padding: '14px', marginBottom: 12 }}>
                          <div className="flex-between" style={{ marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>
                                {lp.plataformas_venta?.emoji} {lp.plataformas_venta?.nombre || 'Plataforma'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {lp.organizations?.name} · {lp.periodo_inicio} → {lp.periodo_fin}
                              </div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.lbl}</span>
                          </div>
                          {/* Reconciliación */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ventas brutas</div>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>S/{(lp.ventas_brutas_pen||0).toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,159,10,0.1)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: '#FF9F0A', fontWeight: 700, textTransform: 'uppercase' }}>Comisiones</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#FF9F0A' }}>–S/{(lp.comisiones_pen||0).toFixed(0)}</div>
                            </div>
                            <div style={{ background: 'rgba(10,132,255,0.1)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: '#4DA8FF', fontWeight: 700, textTransform: 'uppercase' }}>Depositado</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#4DA8FF' }}>S/{(lp.monto_depositado_pen||0).toFixed(0)}</div>
                            </div>
                          </div>
                          {lp.diferencia_pen !== 0 && (
                            <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#FF6B00', marginBottom: 10 }}>
                              ⚠️ Diferencia: S/{(lp.diferencia_pen||0).toFixed(2)} — {lp.notas_tienda || 'Verificar con tienda'}
                            </div>
                          )}
                          {lp.archivo_url && (
                            <a href={lp.archivo_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', padding: '8px 12px', background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 10, fontSize: 12, color: '#30D158', fontWeight: 600, marginBottom: 10, textDecoration: 'none' }}>
                              📎 Ver reporte: {lp.archivo_nombre || 'archivo'}
                            </a>
                          )}
                          {puedRevisar && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-primary btn-sm" style={{ flex: 1, background: '#30D158' }}
                                onClick={() => approveLiqPlat(lp.id)}>✅ Aprobar reporte</button>
                              <button className="btn btn-sm btn-outline" style={{ color: '#FF453A', borderColor: '#FF453A33' }}
                                onClick={() => { const m = prompt('Motivo del rechazo:'); if (m !== null) rejectLiqPlat(lp.id, m); }}>
                                ❌
                              </button>
                            </div>
                          )}
                          {lp.notas_corp && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Corp: {lp.notas_corp}</div>}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ── SUB-TAB: Calendario ── */}
              {liqSubTab === 'calendario' && (
                <>
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    <div className="section-title">📅 Próximas liquidaciones (30 días)</div>
                    <button className="section-action"
                      onClick={() => { setModal('add-calendario'); setForm({ cal_tipo: 'plataforma' }); }}>
                      + Evento
                    </button>
                  </div>
                  {cal7.length === 0 ? (
                    <div className="empty-msg">Sin eventos en los próximos 30 días</div>
                  ) : (
                    cal7.map(ev => {
                      const fecha = new Date(ev.fecha_esperada);
                      const diff  = Math.ceil((fecha - hoy) / (1000*60*60*24));
                      const store = ALL_ORGS.find(o => o.id === ev.store_org_id);
                      const urgente = diff <= 3;
                      const proximo = diff <= 7;
                      return (
                        <div key={ev.id} className="card" style={{
                          padding: '14px', marginBottom: 10,
                          borderLeft: `3px solid ${urgente ? '#FF453A' : proximo ? '#FF9F0A' : '#30D158'}`,
                        }}>
                          <div className="flex-between">
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>
                                {ev.plataformas_venta?.emoji || (ev.tipo === 'corp' ? '🏢' : '🏪')} {ev.titulo}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                                {store?.ico} {ev.organizations?.name || store?.name || 'Tienda'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: 13, fontWeight: 800,
                                color: urgente ? '#FF453A' : proximo ? '#FF9F0A' : '#30D158',
                              }}>
                                {diff === 0 ? '¡HOY!' : diff === 1 ? 'Mañana' : `${diff} días`}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Todos los eventos futuros */}
                  <div className="section-title" style={{ marginTop: 20, marginBottom: 12 }}>📋 Todos los eventos</div>
                  {calendarioAll.length === 0 ? (
                    <div className="empty-msg">Sin eventos de calendario. Crea el primero.</div>
                  ) : (
                    calendarioAll.map(ev => {
                      const fecha = new Date(ev.fecha_esperada);
                      const store = ALL_ORGS.find(o => o.id === ev.store_org_id);
                      const ESTADO_COLOR = { pendiente: '#FF9F0A', completado: '#30D158', vencido: '#FF453A' };
                      return (
                        <div key={ev.id} className="card" style={{ padding: '12px 14px', marginBottom: 8 }}>
                          <div className="flex-between">
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {ev.plataformas_venta?.emoji || (ev.tipo === 'corp' ? '🏢' : '🏪')} {ev.titulo}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {store?.ico} {ev.organizations?.name || store?.name} · {fecha.toLocaleDateString('es-PE')}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: ESTADO_COLOR[ev.estado] || '#888' }}>
                              {ev.estado}
                            </span>
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

        {/* ══════════════════════════════════════
            TAB: FINANZAS
        ══════════════════════════════════════ */}
        {tab === 'finanzas' && (
          <div style={{ padding: '16px', paddingBottom: 48 }}>

            {/* ── Sub-nav ── */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
              {[
                { id: 'caja',      ico: '💰', lbl: 'Caja & Stock'  },
                { id: 'sueldos',   ico: '👥', lbl: 'Sueldos'       },
                { id: 'deudores',  ico: '📥', lbl: 'Deudores'      },
                { id: 'deudas',    ico: '📤', lbl: 'Deudas'        },
              ].map(s => (
                <button key={s.id} type="button"
                  onClick={() => setFinSubTab(s.id)}
                  style={{
                    flexShrink: 0, padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${finSubTab === s.id ? '#0A84FF' : 'var(--border)'}`,
                    background: finSubTab === s.id ? 'rgba(10,132,255,0.15)' : 'transparent',
                    color: finSubTab === s.id ? '#0A84FF' : 'var(--text-muted)',
                    transition: 'all .15s',
                  }}>
                  {s.ico} {s.lbl}
                </button>
              ))}
            </div>

            {/* ════════════════ SUB-TAB: CAJA & STOCK (existente) ════════════════ */}
            {finSubTab === 'caja' && <div>

            {/* ── HERO: Valorización total — siempre fondo oscuro para contraste ── */}
            <div style={{
              background: 'linear-gradient(135deg,#0A2540,#1A1A3E)',
              border: '1px solid rgba(10,132,255,0.30)',
              borderRadius: 20, padding: 24, marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
                📊 Valorización Total del Inventario
              </div>
              {finLoading ? (
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Calculando…</div>
              ) : (
                <>
                  <div style={{ fontSize: 38, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                    S/ {finData.stockVal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', marginTop: 4, marginBottom: 20 }}>
                    ≈ ${finData.stockValUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD
                    {finFx && <span style={{ fontSize: 11, marginLeft: 8, background: 'rgba(255,255,255,0.10)', padding: '2px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.70)' }}>TC S/{finFx.toFixed(3)}</span>}
                  </div>

                  {/* Sub-cards: Lima vs Tránsito */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'rgba(48,209,88,0.14)', border: '1px solid rgba(48,209,88,0.30)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#30D158', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>📦 EN LIMA</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>{finData.stockCount}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginBottom: 6 }}>unidades disponibles</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#30D158' }}>
                        S/{finData.stockVal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,159,10,0.14)', border: '1px solid rgba(255,159,10,0.30)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#FF9F0A', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>✈️ EN TRÁNSITO</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>{finData.transitCount}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginBottom: 6 }}>unidades por llegar</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#FF9F0A' }}>
                        S/{finData.inTransitVal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Stock por empresa ── */}
            <div className="section-title">📍 Stock por empresa</div>
            <div className="card" style={{ marginBottom: 20 }}>
              {(finData.byStore || []).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Sin stock registrado</div>
              ) : (
                (finData.byStore || []).map(s => (
                  <div key={s.id} className="list-item" style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 22, marginRight: 2 }}>{s.ico}</div>
                    <div className="list-item-body">
                      <div className="list-item-name">{s.name}</div>
                      <div className="list-item-sub">{s.count} unidades disponibles</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: 14 }}>
                        S/{s.valor.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </div>
                      {finFx && (
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          ≈${(s.valor / finFx).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Flujo de Caja ── */}
            <div className="section-header">
              <div className="section-title">🏦 Flujo de Caja</div>
              <button className="section-action" onClick={() => { setModal('add-account'); setForm({ ca_tipo: 'banco', ca_moneda: 'PEN' }); }}>+ Cuenta</button>
            </div>

            {cashAccounts.length > 0 && (
              <>
                {/* Mini KPIs — siempre fondo sólido con texto legible */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { lbl: 'Bancos',      val: cashTotals.banks_pen,     color: '#0A84FF' },
                    { lbl: 'Plataformas', val: cashTotals.platforms_pen, color: '#A78BFA' },
                    { lbl: 'Efectivo',    val: cashTotals.cash_pen,      color: '#30D158' },
                  ].map(k => (
                    <div key={k.lbl} style={{
                      background: `${k.color}18`, border: `1px solid ${k.color}35`,
                      borderRadius: 14, padding: '10px 8px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 9, color: k.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k.lbl}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>S/{k.val.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</div>
                    </div>
                  ))}
                </div>

                {/* Total hero — siempre oscuro */}
                <div style={{
                  background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                  borderRadius: 16, padding: '16px 20px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.70)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOTAL DISPONIBLE EN CAJA</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                      S/{cashTotals.total_pen.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                  {finFx && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>≈ USD</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                        ${cashTotals.total_usd.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Lista de cuentas */}
            {cashAccounts.length === 0 ? (
              <div className="empty-msg">Agrega tus cuentas: BCP, Interbank, MercadoLibre, etc.</div>
            ) : (
              <div className="card" style={{ marginBottom: 16 }}>
                {cashAccounts.map(acc => (
                  <div key={acc.id} className="list-item">
                    <div className="list-item-ico">
                      {acc.tipo === 'banco' ? '🏦' : acc.tipo === 'plataforma' ? '📱' : acc.tipo === 'efectivo' ? '💵' : '💼'}
                    </div>
                    <div className="list-item-body">
                      <div className="list-item-name">{acc.nombre}</div>
                      <div className="list-item-sub">{acc.tipo} · {acc.moneda}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: 14 }}>
                        {acc.moneda === 'USD' ? '$' : 'S/'}{(acc.saldo || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => { setModal('edit-account'); setForm({ ca_id: acc.id, ca_nombre: acc.nombre, ca_tipo: acc.tipo, ca_moneda: acc.moneda, ca_saldo: acc.saldo }); }}
                        style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                      >
                        ✏️ editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={loadFinanzas}
              disabled={finLoading}
              style={{
                width: '100%', padding: '12px', borderRadius: 14,
                background: 'var(--card2)', border: '1px solid var(--border)',
                color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                cursor: finLoading ? 'not-allowed' : 'pointer', marginBottom: 40,
              }}
            >
              {finLoading ? '⏳ Calculando…' : '🔄 Actualizar datos financieros'}
            </button>
          </div>}
            {/* ════════════════ SUB-TAB: SUELDOS ════════════════ */}
            {finSubTab === 'sueldos' && (() => {
              const fmt = (n) => `S/ ${parseFloat(n||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
              const totalMensual = employees.filter(e => e.is_active).reduce((s,e) => s + (e.salary||0), 0);
              return (
                <>
                  {/* Filtros */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                    <select className="form-select" style={{ flex:1, minWidth:140, maxWidth:200 }} value={empOrgFilter} onChange={e=>setEmpOrgFilter(e.target.value)}>
                      <option value="all">🏢 Todas las empresas</option>
                      <option value={CORP_ID}>🏢 Corp Tech</option>
                      {STORES.map(s=><option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                    <select className="form-select" style={{ flex:1, minWidth:120, maxWidth:160 }} value={empStatusFilter} onChange={e=>setEmpStatusFilter(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="activo">✅ Activos</option>
                      <option value="inactivo">❌ Inactivos</option>
                    </select>
                    <button className="section-action" onClick={()=>{ setModal('add-employee'); setForm({ emp_org: CORP_ID, emp_currency:'PEN', emp_period:'mensual' }); }}>+ Empleado</button>
                  </div>

                  {/* Resumen */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
                    {[
                      { lbl:'Planilla Mensual', val: fmt(totalMensual), ico:'💰', color:'#30D158' },
                      { lbl:'Empleados Activos', val: employees.filter(e=>e.is_active).length, ico:'👥', color:'#0A84FF' },
                      { lbl:'Total Empleados', val: employees.length, ico:'📋', color:'var(--text3)' },
                    ].map((k,i)=>(
                      <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'12px 14px', borderLeft:`3px solid ${k.color}` }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{k.ico} {k.lbl}</div>
                        <div style={{ fontWeight:900, fontSize:18, color:k.color }}>{k.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lista empleados */}
                  {empLoading ? <div className="empty-msg">Cargando...</div>
                  : employees.length === 0 ? <div className="empty-msg">Sin empleados aún</div>
                  : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {employees.map(emp => {
                        const org = ALL_ORGS.find(o=>o.id===emp.org_id);
                        return (
                          <div key={emp.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 16px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(10,132,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                                  {emp.is_active ? '👤' : '🚫'}
                                </div>
                                <div>
                                  <div style={{ fontWeight:800, fontSize:14 }}>{emp.full_name}</div>
                                  <div style={{ fontSize:11, color:'var(--text3)' }}>{emp.role_title} · {org?.ico} {org?.name || 'Corp'}</div>
                                  {emp.phone && <div style={{ fontSize:11, color:'var(--text3)' }}>📞 {emp.phone}</div>}
                                </div>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{ fontWeight:900, fontSize:18, color:'#30D158' }}>{fmt(emp.salary)}</div>
                                <div style={{ fontSize:11, color:'var(--text3)', textTransform:'capitalize' }}>/{emp.salary_period}</div>
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                              <button type="button" onClick={()=>{ setEmpDetailId(emp.id); loadSalaryPayments(emp.id); setModal('pay-salary'); setForm({ sp_emp_id:emp.id, sp_org:emp.org_id, sp_amount:emp.salary, sp_currency:emp.salary_currency||'PEN', sp_method:'efectivo', sp_date:new Date().toISOString().split('T')[0], sp_period_label: new Date().toLocaleString('es-PE',{month:'long',year:'numeric'}) }); }}
                                style={{ flex:1, padding:'7px 0', borderRadius:10, border:'none', background:'rgba(48,209,88,0.12)', color:'#30D158', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                💵 Registrar Pago
                              </button>
                              <button type="button" onClick={()=>{ setModal('add-employee'); setForm({ emp_id:emp.id, emp_name:emp.full_name, emp_email:emp.email||'', emp_phone:emp.phone||'', emp_role:emp.role_title, emp_salary:emp.salary, emp_currency:emp.salary_currency||'PEN', emp_period:emp.salary_period||'mensual', emp_org:emp.org_id, emp_notes:emp.notes||'', emp_start:emp.start_date||'' }); }}
                                style={{ flex:1, padding:'7px 0', borderRadius:10, border:'none', background:'rgba(10,132,255,0.1)', color:'#4DA8FF', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                ✏️ Editar
                              </button>
                              <button type="button" onClick={()=>deleteEmployee(emp.id)}
                                style={{ padding:'7px 14px', borderRadius:10, border:'none', background:'rgba(255,69,58,0.08)', color:'#FF453A', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                🗑
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* ════════════════ SUB-TAB: DEUDORES ════════════════ */}
            {finSubTab === 'deudores' && (() => {
              const fmt = (n) => `S/ ${parseFloat(n||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
              const totalPrincipal = debtors.reduce((s,d)=>s+(d.principal_amount||0),0);
              const totalIntereses = debtors.reduce((s,d)=>s+calcAccruedInterest(d),0);
              const totalCobrado   = debtors.reduce((s,d)=>s+(d.amount_paid||0),0);
              const totalPendiente = (totalPrincipal + totalIntereses) - totalCobrado;
              return (
                <>
                  {/* Filtros */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                    <select className="form-select" style={{ flex:1, minWidth:140, maxWidth:200 }} value={debtorOrgFilter} onChange={e=>setDebtorOrgFilter(e.target.value)}>
                      <option value="all">🏢 Todas las empresas</option>
                      <option value={CORP_ID}>🏢 Corp Tech</option>
                      {STORES.map(s=><option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                    <select className="form-select" style={{ flex:1, minWidth:120, maxWidth:160 }} value={debtorStatusFilter} onChange={e=>setDebtorStatusFilter(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="activo">🔴 Activos</option>
                      <option value="pagado">✅ Pagados</option>
                      <option value="vencido">⚠️ Vencidos</option>
                    </select>
                    <button className="section-action" onClick={()=>{ setModal('add-debtor'); setForm({ dr_org:CORP_ID, dr_currency:'PEN', dr_int_type:'none', dr_start:new Date().toISOString().split('T')[0] }); }}>+ Deudor</button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
                    {[
                      { lbl:'Por Cobrar (neto)', val:fmt(totalPendiente), color:'#FF9F0A' },
                      { lbl:'Intereses Acum.',   val:fmt(totalIntereses), color:'#BF5AF2' },
                      { lbl:'Ya Cobrado',        val:fmt(totalCobrado),   color:'#30D158' },
                      { lbl:'Capital Total',     val:fmt(totalPrincipal), color:'#0A84FF' },
                    ].map((k,i)=>(
                      <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'12px 14px', borderLeft:`3px solid ${k.color}` }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{k.lbl}</div>
                        <div style={{ fontWeight:900, fontSize:16, color:k.color }}>{k.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lista */}
                  {debtorLoading ? <div className="empty-msg">Cargando...</div>
                  : debtors.length === 0 ? <div className="empty-msg">Sin deudores registrados</div>
                  : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {debtors.map(dr => {
                        const interest   = calcAccruedInterest(dr);
                        const total      = (dr.principal_amount||0) + interest;
                        const pending    = total - (dr.amount_paid||0);
                        const pct        = total > 0 ? ((dr.amount_paid||0)/total)*100 : 0;
                        const statusColor= dr.status==='pagado'?'#30D158':dr.status==='vencido'?'#FF453A':'#FF9F0A';
                        const org        = ALL_ORGS.find(o=>o.id===dr.org_id);
                        const dueDate    = dr.due_date ? new Date(dr.due_date) : null;
                        const isOverdue  = dueDate && dueDate < new Date() && dr.status === 'activo';
                        return (
                          <div key={dr.id} style={{ background:'var(--card)', border:`1px solid ${isOverdue?'rgba(255,69,58,0.4)':'var(--border)'}`, borderRadius:16, padding:'14px 16px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                              <div>
                                <div style={{ fontWeight:800, fontSize:14 }}>{dr.name}</div>
                                <div style={{ fontSize:11, color:'var(--text3)' }}>
                                  {org?.ico} {org?.name||'Corp'} · Desde {dr.start_date}
                                  {dr.due_date && ` · Vence ${dr.due_date}`}
                                </div>
                                {dr.phone && <div style={{ fontSize:11, color:'var(--text3)' }}>📞 {dr.phone}</div>}
                                {dr.description && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{dr.description}</div>}
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{ fontWeight:900, fontSize:18, color:statusColor }}>{fmt(pending)}</div>
                                <div style={{ fontSize:11, color:'var(--text3)' }}>pendiente</div>
                                <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:`${statusColor}1a`, padding:'2px 8px', borderRadius:20 }}>{dr.status}</span>
                              </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, fontSize:11, color:'var(--text3)', marginBottom:8 }}>
                              <div>Capital: <b style={{color:'var(--text)'}}>{fmt(dr.principal_amount)}</b></div>
                              <div>Interés: <b style={{color:'#BF5AF2'}}>{fmt(interest)}{dr.interest_rate>0?` (${dr.interest_rate}%/${dr.interest_type==='monthly'?'mes':'año'})`:''}</b></div>
                              <div>Cobrado: <b style={{color:'#30D158'}}>{fmt(dr.amount_paid)}</b></div>
                            </div>
                            {/* Barra de progreso */}
                            <div style={{ height:5, background:'var(--border)', borderRadius:99, marginBottom:10, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:'#30D158', borderRadius:99 }} />
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                              {dr.status !== 'pagado' && (
                                <button type="button"
                                  onClick={()=>{ setModal('register-debtor-payment'); setForm({ drp_id:dr.id, drp_amount: pending.toFixed(2) }); }}
                                  style={{ flex:1, padding:'7px 0', borderRadius:10, border:'none', background:'rgba(48,209,88,0.12)', color:'#30D158', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                  💵 Registrar Cobro
                                </button>
                              )}
                              <button type="button"
                                onClick={()=>{ setModal('add-debtor'); setForm({ dr_id:dr.id, dr_name:dr.name, dr_phone:dr.phone||'', dr_email:dr.email||'', dr_desc:dr.description||'', dr_principal:dr.principal_amount, dr_currency:dr.currency||'PEN', dr_rate:dr.interest_rate||0, dr_int_type:dr.interest_type||'none', dr_start:dr.start_date, dr_due:dr.due_date||'', dr_notes:dr.notes||'', dr_org:dr.org_id }); }}
                                style={{ flex:1, padding:'7px 0', borderRadius:10, border:'none', background:'rgba(10,132,255,0.1)', color:'#4DA8FF', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                ✏️ Editar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* ════════════════ SUB-TAB: DEUDAS EMPRESA ════════════════ */}
            {finSubTab === 'deudas' && (() => {
              const fmt = (n) => `S/ ${parseFloat(n||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
              const totalPrincipal = compDebts.reduce((s,d)=>s+(d.principal_amount||0),0);
              const totalIntereses = compDebts.reduce((s,d)=>s+calcAccruedInterest(d),0);
              const totalPagado    = compDebts.reduce((s,d)=>s+(d.amount_paid||0),0);
              const totalPendiente = (totalPrincipal + totalIntereses) - totalPagado;
              return (
                <>
                  {/* Filtros */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                    <select className="form-select" style={{ flex:1, minWidth:140, maxWidth:200 }} value={compDebtOrgFilter} onChange={e=>setCompDebtOrgFilter(e.target.value)}>
                      <option value="all">🏢 Todas las empresas</option>
                      <option value={CORP_ID}>🏢 Corp Tech</option>
                      {STORES.map(s=><option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                    <select className="form-select" style={{ flex:1, minWidth:120, maxWidth:160 }} value={compDebtStatusFilter} onChange={e=>setCompDebtStatusFilter(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="activo">🔴 Activos</option>
                      <option value="pagado">✅ Pagados</option>
                      <option value="vencido">⚠️ Vencidos</option>
                    </select>
                    <button className="section-action" onClick={()=>{ setModal('add-comp-debt'); setForm({ cd_org:CORP_ID, cd_currency:'PEN', cd_int_type:'none', cd_start:new Date().toISOString().split('T')[0] }); }}>+ Deuda</button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
                    {[
                      { lbl:'Por Pagar (neto)', val:fmt(totalPendiente), color:'#FF453A' },
                      { lbl:'Intereses Acum.',  val:fmt(totalIntereses), color:'#BF5AF2' },
                      { lbl:'Ya Pagado',        val:fmt(totalPagado),    color:'#30D158' },
                      { lbl:'Capital Total',    val:fmt(totalPrincipal), color:'#FF9F0A' },
                    ].map((k,i)=>(
                      <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'12px 14px', borderLeft:`3px solid ${k.color}` }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{k.lbl}</div>
                        <div style={{ fontWeight:900, fontSize:16, color:k.color }}>{k.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lista */}
                  {compDebtLoading ? <div className="empty-msg">Cargando...</div>
                  : compDebts.length === 0 ? <div className="empty-msg">Sin deudas registradas</div>
                  : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {compDebts.map(cd => {
                        const interest   = calcAccruedInterest(cd);
                        const total      = (cd.principal_amount||0) + interest;
                        const pending    = total - (cd.amount_paid||0);
                        const pct        = total > 0 ? ((cd.amount_paid||0)/total)*100 : 0;
                        const statusColor= cd.status==='pagado'?'#30D158':cd.status==='vencido'?'#FF453A':'#FF9F0A';
                        const org        = ALL_ORGS.find(o=>o.id===cd.org_id);
                        const dueDate    = cd.due_date ? new Date(cd.due_date) : null;
                        const isOverdue  = dueDate && dueDate < new Date() && cd.status === 'activo';
                        return (
                          <div key={cd.id} style={{ background:'var(--card)', border:`1px solid ${isOverdue?'rgba(255,69,58,0.4)':'var(--border)'}`, borderRadius:16, padding:'14px 16px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                              <div>
                                <div style={{ fontWeight:800, fontSize:14 }}>{cd.creditor_name}</div>
                                <div style={{ fontSize:11, color:'var(--text3)' }}>
                                  {org?.ico} {org?.name||'Corp'} · Desde {cd.start_date}
                                  {cd.due_date && ` · Vence ${cd.due_date}`}
                                </div>
                                {cd.description && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{cd.description}</div>}
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <div style={{ fontWeight:900, fontSize:18, color:statusColor }}>{fmt(pending)}</div>
                                <div style={{ fontSize:11, color:'var(--text3)' }}>por pagar</div>
                                <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:`${statusColor}1a`, padding:'2px 8px', borderRadius:20 }}>{cd.status}</span>
                              </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, fontSize:11, color:'var(--text3)', marginBottom:8 }}>
                              <div>Capital: <b style={{color:'var(--text)'}}>{fmt(cd.principal_amount)}</b></div>
                              <div>Interés: <b style={{color:'#BF5AF2'}}>{fmt(interest)}{cd.interest_rate>0?` (${cd.interest_rate}%/${cd.interest_type==='monthly'?'mes':'año'})`:''}</b></div>
                              <div>Pagado: <b style={{color:'#30D158'}}>{fmt(cd.amount_paid)}</b></div>
                            </div>
                            <div style={{ height:5, background:'var(--border)', borderRadius:99, marginBottom:10, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:'#30D158', borderRadius:99 }} />
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                              {cd.status !== 'pagado' && (
                                <button type="button"
                                  onClick={()=>{ setModal('register-debt-payment'); setForm({ cdp_id:cd.id, cdp_amount: pending.toFixed(2) }); }}
                                  style={{ flex:1, padding:'7px 0', borderRadius:10, border:'none', background:'rgba(48,209,88,0.12)', color:'#30D158', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                  💵 Registrar Pago
                                </button>
                              )}
                              <button type="button"
                                onClick={()=>{ setModal('add-comp-debt'); setForm({ cd_id:cd.id, cd_creditor:cd.creditor_name, cd_desc:cd.description||'', cd_principal:cd.principal_amount, cd_currency:cd.currency||'PEN', cd_rate:cd.interest_rate||0, cd_int_type:cd.interest_type||'none', cd_start:cd.start_date, cd_due:cd.due_date||'', cd_notes:cd.notes||'', cd_org:cd.org_id }); }}
                                style={{ flex:1, padding:'7px 0', borderRadius:10, border:'none', background:'rgba(10,132,255,0.1)', color:'#4DA8FF', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                ✏️ Editar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

          </div>
        )}

        {/* ── TAB: IMEI CHECKER ── */}
        {tab === 'imei' && (() => {

          // ── helpers internos del tab ──────────────────────────────
          // Nunca exponer nombres reales: Servidor 1, Servidor 2...
          const provLabel = (provKey) => {
            if (!imeiConfig?.providers) return 'Servidor';
            const idx = imeiConfig.providers.findIndex(p => p.provider === provKey);
            return idx >= 0 ? `Servidor ${idx + 1}` : 'Servidor';
          };

          // Emoji de dispositivo según modelo
          function deviceEmoji(model) {
            if (!model) return '📱';
            const m = model.toLowerCase();
            if (m.includes('ipad'))  return '📟';
            if (m.includes('mac'))   return '💻';
            if (m.includes('watch')) return '⌚';
            if (m.includes('airpods')) return '🎧';
            return '📱';
          }

          // Convertir camelCase/key a etiqueta legible — mapa de conocidos
          const FIELD_LABELS = {
            model:'Modelo', imei:'IMEI', imei2:'IMEI 2', serialNumber:'Serial Number',
            color:'Color', capacity:'Capacidad', storage:'Almacenamiento',
            carrier:'Carrier', country:'País', region:'Región',
            fmiOn:'Find My iPhone', fmiON:'Find My iPhone',
            blacklisted:'Lista Negra', blacklistStatus:'Lista Negra',
            warrantyStatus:'Garantía', purchaseDate:'Compra',
            simLock:'SIM Lock', simStatus:'SIM Status',
            mdm:'MDM', mdmStatus:'MDM Status',
            replacementStatus:'Reemplazo', replacedStatus:'Reemplazado',
            icloudStatus:'iCloud', activationStatus:'Activación',
          };
          function fieldLabel(k) {
            return FIELD_LABELS[k] || k.replace(/([A-Z]+)(?=[A-Z][a-z])|([a-z])(?=[A-Z])/g, '$1$2 ').trim();
          }

          // Info de estado para badges (icono + color + texto)
          function statusBadge(k, v) {
            const kl = (k || '').toLowerCase();
            const vl = String(v || '').toLowerCase();
            const isBad  = vl === 'true' || vl === 'on' || vl === 'yes' || vl.includes('block') || vl.includes('report') || vl.includes('stolen') || vl.includes('lost');
            const isGood = vl === 'false' || vl === 'off' || vl === 'no'  || vl.includes('clean');
            if (kl.includes('fmi') || kl.includes('find my') || kl.includes('icloud') || kl.includes('activation lock')) {
              return isBad  ? { ico:'🔒', txt:'BLOQUEADO', color:'#FF453A', bg:'rgba(255,69,58,0.15)' }
                   : isGood ? { ico:'🔓', txt:'LIBRE',     color:'#30D158', bg:'rgba(48,209,88,0.15)' }
                   : null;
            }
            if (kl.includes('blacklist') || kl.includes('stolen') || kl.includes('lost') || kl.includes('block')) {
              return isGood ? { ico:'✅', txt:'LIMPIO',    color:'#30D158', bg:'rgba(48,209,88,0.15)' }
                   : isBad  ? { ico:'🚨', txt:'REPORTADO', color:'#FF453A', bg:'rgba(255,69,58,0.15)' }
                   : null;
            }
            if (kl.includes('mdm')) {
              return isBad  ? { ico:'🏢', txt:'MDM ON',  color:'#FF9F0A', bg:'rgba(255,159,10,0.15)' }
                   : isGood ? { ico:'✅', txt:'MDM OFF', color:'#30D158', bg:'rgba(48,209,88,0.15)' }
                   : null;
            }
            if (kl.includes('sim') && (kl.includes('lock') || kl.includes('status'))) {
              return isBad  ? { ico:'📵', txt:'LOCKED',   color:'#FF453A', bg:'rgba(255,69,58,0.15)' }
                   : isGood ? { ico:'📶', txt:'UNLOCKED', color:'#30D158', bg:'rgba(48,209,88,0.15)' }
                   : null;
            }
            return null;
          }

          function valColor(k, v) {
            const b = statusBadge(k, v);
            return b ? b.color : 'var(--text)';
          }

          // Parsear texto "Key: Value\n..." de Sickw
          function parseLines(txt) {
            if (!txt || typeof txt !== 'string') return [];
            const clean = txt.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').trim();
            // Si es todo en una línea (sin \n), intentar split por palabras clave
            const lines = clean.includes('\n') ? clean.split('\n') : clean.split(/(?=\b(?:IMEI|Find My|Model|Color|Carrier|Blacklist|Serial|Warranty)\b)/);
            return lines.map(l => l.trim()).filter(Boolean).map(line => {
              const idx = line.indexOf(':');
              if (idx > 0) return { k: line.substring(0, idx).trim(), v: line.substring(idx + 1).trim() };
              return { k: '', v: line };
            }).filter(r => r.v);
          }

          // Deduplicar entradas del object (fmiOn y fmiON son lo mismo)
          function dedupeObject(obj) {
            if (!obj) return [];
            const seen = new Set();
            return Object.entries(obj)
              .filter(([k]) => k !== '__v' && k !== '_id')
              .filter(([k, v]) => {
                const norm = k.toLowerCase();
                if (seen.has(norm)) return false;
                seen.add(norm);
                return true;
              });
          }

          return (
          <div style={{ padding: '16px' }}>
            <div className="section-title">🔍 IMEI Checker</div>

            {/* Sin acceso */}
            {imeiConfig === null && (
              <div style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#FF453A', marginBottom: 4 }}>⚠️ Sin acceso habilitado</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pídele al SuperAdmin que configure tu acceso IMEI.</div>
              </div>
            )}

            {/* Tokens por servidor (anónimo) + botón recargar */}
            {imeiConfig && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imeiConfig.providers.length}, 1fr) auto`, gap: 8 }}>
                  {imeiConfig.providers.map((p, idx) => (
                    <div key={p.provider} style={{
                      background: p.remaining > 0 ? 'rgba(10,132,255,0.08)' : 'rgba(255,69,58,0.08)',
                      border: `1px solid ${p.remaining > 0 ? 'rgba(10,132,255,0.25)' : 'rgba(255,69,58,0.25)'}`,
                      borderRadius: 12, padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                        🖥 Servidor {idx + 1}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: p.remaining > 0 ? '#4DA8FF' : '#FF453A' }}>
                        {p.remaining}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>🪙 tokens · {p.used}/{p.limit}</div>
                    </div>
                  ))}
                  {/* Botón recargar */}
                  <button
                    onClick={() => { setModal('recharge-tokens'); setForm({ recharge_method: 'yape', recharge_soles: '' }); setRechargeFile(null); }}
                    style={{
                      borderRadius: 12, border: 'none', padding: '8px 10px',
                      background: 'linear-gradient(135deg,#FF9F0A,#FF6B00)',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', textAlign: 'center', lineHeight: 1.4,
                      boxShadow: '0 4px 12px rgba(255,159,10,0.4)',
                    }}>
                    💳<br/>Recargar<br/>Tokens
                  </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                  1 sol = 1 token · Precio por consulta: S/1.00
                </div>
              </div>
            )}

            {/* Formulario */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">📱 IMEI / Serial Number</label>
                <input
                  className="form-input"
                  placeholder="352999111111111"
                  value={imeiInput}
                  onChange={e => setImeiInput(e.target.value.replace(/\D/g, '').substring(0, 16))}
                  maxLength={16} inputMode="numeric"
                  style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 2, fontWeight: 700 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {imeiInput.length}/15 dígitos{imeiInput.length >= 14 && imeiInput.length <= 16 ? ' ✅' : ''}
                </div>
              </div>

              {/* Tipo de consulta */}
              {imeiConfig && imeiConfig.services.length > 0 && (
                <div className="form-group">
                  <label className="form-label">🛠 Tipo de consulta</label>
                  <select className="form-select" value={imeiService} onChange={e => {
                    setImeiService(e.target.value);
                    setImeiProvider('auto'); // reset a auto al cambiar servicio
                  }}>
                    {imeiConfig.services.map(s => (
                      <option key={`${s.providerKey}-${s.id}`} value={s.id}>
                        {s.label}{s.price ? ` · $${s.price}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {imeiConfig && imeiConfig.services.length === 0 && (
                <div style={{ fontSize: 11, color: '#FF9F0A', marginBottom: 12 }}>⚠️ El SuperAdmin no ha configurado servicios aún.</div>
              )}

              {/* Selector servidor — siempre Auto por defecto, nombres anónimos */}
              {imeiConfig && imeiConfig.providers.length > 1 && (
                <div className="form-group">
                  <label className="form-label">⚡ Servidor</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { key: 'auto', label: '🤖 Auto (más barato)', color: '#FF9F0A' },
                      ...imeiConfig.providers.map((p, idx) => ({
                        key: p.provider, label: `🖥 Servidor ${idx + 1}`, color: '#4DA8FF', disabled: p.remaining <= 0,
                      })),
                    ].map(opt => (
                      <button key={opt.key} type="button"
                        onClick={() => !opt.disabled && setImeiProvider(opt.key)}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          border: `1.5px solid ${imeiProvider === opt.key ? opt.color : 'var(--border)'}`,
                          background: imeiProvider === opt.key ? `${opt.color}22` : 'transparent',
                          color: opt.disabled ? 'var(--text-muted)' : (imeiProvider === opt.key ? opt.color : 'var(--text)'),
                          fontSize: 12, fontWeight: 700, cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        }}>
                        {opt.label}{opt.disabled ? ' (sin tokens)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={checkImei}
                disabled={imeiLoading || !imeiConfig || (imeiConfig?.totalRemaining || 0) <= 0}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: (imeiLoading || !imeiConfig || (imeiConfig?.totalRemaining || 0) <= 0)
                    ? 'var(--surface)' : 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: (imeiLoading || !imeiConfig || (imeiConfig?.totalRemaining || 0) <= 0) ? 'not-allowed' : 'pointer',
                  boxShadow: (imeiLoading || !imeiConfig) ? 'none' : '0 4px 20px rgba(10,132,255,0.35)',
                  opacity: (imeiConfig?.totalRemaining || 0) <= 0 ? 0.5 : 1,
                }}>
                {imeiLoading ? '⏳ Consultando...' : (imeiConfig?.totalRemaining || 0) <= 0 ? '🚫 Sin tokens' : '🔍 Verificar IMEI · 1 🪙'}
              </button>
            </div>

            {/* ── RESULTADO ── */}
            {imeiResult && (() => {
              const isErr   = !!imeiResult.error;
              const objData = imeiResult.object;
              const hasObj  = objData && typeof objData === 'object' && Object.keys(objData).length > 0;
              const resultTxt = typeof imeiResult.result === 'string' ? imeiResult.result : null;
              const lines = parseLines(resultTxt);
              const entries = hasObj ? dedupeObject(objData) : [];

              // Extraer modelo para el header visual
              const modelVal = hasObj
                ? (objData.model || objData.Model || '')
                : (lines.find(l => l.k.toLowerCase() === 'model')?.v || '');

              // Extraer badges de status
              const statusEntries = hasObj
                ? entries.filter(([k, v]) => statusBadge(k, String(v)))
                : lines.filter(r => statusBadge(r.k, r.v));

              // Resto de campos (no status) para la tabla
              const detailEntries = hasObj
                ? entries.filter(([k, v]) => !statusBadge(k, String(v)))
                : lines.filter(r => !statusBadge(r.k, r.v));

              return (
                <div style={{ marginBottom: 16 }}>
                  {isErr ? (
                    <div className="card" style={{ padding: 16, background: 'rgba(255,69,58,0.06)', border: '1px solid rgba(255,69,58,0.2)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#FF453A', marginBottom: 8 }}>❌ Error en la consulta</div>
                      <div style={{ fontSize: 13, color: '#FF6B6B', lineHeight: 1.7 }}>{imeiResult.error}</div>
                    </div>
                  ) : (
                    <>
                      {/* HEADER — dispositivo */}
                      <div className="card" style={{ padding: '18px', marginBottom: 10, background: 'linear-gradient(135deg, rgba(10,132,255,0.1), rgba(94,92,230,0.08))', border: '1px solid rgba(10,132,255,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ fontSize: 50, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                            {deviceEmoji(modelVal)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.2, marginBottom: 3 }}>
                              {modelVal || 'Dispositivo'}
                            </div>
                            {imeiInput && (
                              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
                                IMEI: {imeiInput}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                              🖥 {provLabel(imeiResult._provider)} · ✅ Verificado
                            </div>
                          </div>
                          {/* Botón registrar equipo */}
                          <button
                            onClick={() => {
                              const info = extractDeviceInfo(imeiResult, imeiResult._check_id);
                              setForm({
                                ...info,
                                imei:         imeiInput || info.imei,
                                emoji:        '📱',
                                owner_org_id: CORP_ID,
                                sale_price:   '',
                                // nombre sugerido para buscar producto
                                _suggested_name: info.deviceName,
                              });
                              setModal('imei-to-stock');
                            }}
                            style={{
                              flexShrink: 0,
                              padding: '10px 14px', borderRadius: 12, border: 'none',
                              background: 'linear-gradient(135deg,#30D158,#34C759)',
                              color: '#fff', fontSize: 12, fontWeight: 800,
                              cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
                              boxShadow: '0 4px 14px rgba(48,209,88,0.4)',
                            }}>
                            📲<br/>Registrar<br/>Equipo
                          </button>
                        </div>
                      </div>

                      {/* BADGES — FMI, Blacklist, MDM, SIM */}
                      {statusEntries.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(statusEntries.length, 2)}, 1fr)`, gap: 8, marginBottom: 10 }}>
                          {(hasObj ? statusEntries : statusEntries).map((entry, i) => {
                            const k = hasObj ? entry[0] : entry.k;
                            const v = hasObj ? String(entry[1]) : entry.v;
                            const badge = statusBadge(k, v);
                            if (!badge) return null;
                            return (
                              <div key={i} style={{ background: badge.bg, border: `1px solid ${badge.color}44`, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: 28, marginBottom: 4 }}>{badge.ico}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                                  {fieldLabel(k)}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: badge.color }}>{badge.txt}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TABLA DETALLES */}
                      {detailEntries.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                          {(hasObj ? detailEntries : detailEntries).map((entry, i) => {
                            const k = hasObj ? entry[0] : entry.k;
                            const v = hasObj ? String(entry[1] ?? '') : entry.v;
                            if (!k && !v) return null;
                            return (
                              <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 14px',
                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                borderBottom: i < detailEntries.length - 1 ? '1px solid var(--border)' : 'none',
                              }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, minWidth: 120 }}>
                                  {k ? fieldLabel(k) : ''}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: 13, textAlign: 'right', color: valColor(k, v), wordBreak: 'break-word', maxWidth: '58%' }}>
                                  {v}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* ══ CHECK MASIVO — PDF / Invoice / Texto ══ */}
            {imeiConfig && (
              <div style={{ marginBottom: 16 }}>
                {/* Toggle header */}
                <button
                  onClick={() => setBatchOpen(o => !o)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: batchOpen ? 'rgba(94,92,230,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${batchOpen ? 'rgba(94,92,230,0.4)' : 'var(--border)'}`,
                    borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
                    color: 'var(--text)', fontSize: 14, fontWeight: 800,
                  }}>
                  <span>📋 Check Masivo — PDF / Invoice / Lista</span>
                  <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: batchOpen ? 'rotate(180deg)' : 'none' }}>⌄</span>
                </button>

                {batchOpen && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Zona de upload */}
                    <div
                      onDragOver={e => { e.preventDefault(); }}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processBatchFile(f); }}
                      style={{
                        border: '2px dashed rgba(94,92,230,0.5)', borderRadius: 14,
                        padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                        background: 'rgba(94,92,230,0.04)',
                      }}
                      onClick={() => document.getElementById('batch-file-input').click()}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Arrastra o toca para subir</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, TXT, CSV — detecta IMEIs/serials automáticamente</div>
                      <input
                        id="batch-file-input" type="file" accept=".pdf,.txt,.csv,.xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files[0]; if (f) processBatchFile(f); }}
                      />
                    </div>

                    {/* O pegar texto */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>O pega los IMEIs aquí (uno por línea o separados por coma/espacio):</div>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="352999111111111&#10;352999222222222&#10;352999333333333"
                        value={batchText}
                        onChange={e => { setBatchText(e.target.value); processBatchTextInput(e.target.value); }}
                        style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
                      />
                    </div>

                    {/* IMEIs detectados */}
                    {batchImeis.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                          🔢 {batchImeis.length} IMEI{batchImeis.length !== 1 ? 's' : ''} detectados
                          {(imeiConfig?.totalRemaining || 0) > 0 && (
                            <span style={{ color: (imeiConfig?.totalRemaining || 0) >= batchImeis.length ? '#30D158' : '#FF9F0A', marginLeft: 8 }}>
                              · {(imeiConfig?.totalRemaining || 0) >= batchImeis.length ? '✅ tokens suficientes' : `⚠️ solo ${imeiConfig.totalRemaining} tokens disponibles`}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {batchImeis.map((imei, idx) => {
                            const r = batchResults.find(x => x.imei === imei);
                            return (
                              <span key={idx} style={{
                                fontFamily: 'monospace', fontSize: 11, padding: '4px 9px', borderRadius: 20, fontWeight: 700,
                                background: !r ? 'rgba(255,255,255,0.08)' : r.status === 'success' ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)',
                                color: !r ? 'var(--text-muted)' : r.status === 'success' ? '#30D158' : '#FF453A',
                                border: `1px solid ${!r ? 'transparent' : r.status === 'success' ? 'rgba(48,209,88,0.3)' : 'rgba(255,69,58,0.3)'}`,
                              }}>
                                {!r ? imei : r.status === 'success' ? `✓ ${imei}` : `✕ ${imei}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso */}
                    {batchLoading && batchProgress.total > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                          <span>⏳ Consultando...</span>
                          <span style={{ color: '#4DA8FF' }}>{batchProgress.done}/{batchProgress.total}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 8,
                            background: 'linear-gradient(90deg,#0A84FF,#5E5CE6)',
                            width: `${(batchProgress.done / batchProgress.total) * 100}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={runBatchCheck}
                        disabled={batchLoading || batchImeis.length === 0 || (imeiConfig?.totalRemaining || 0) <= 0}
                        style={{
                          flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                          background: (batchLoading || batchImeis.length === 0 || (imeiConfig?.totalRemaining || 0) <= 0)
                            ? 'var(--surface)' : 'linear-gradient(135deg,#5E5CE6,#0A84FF)',
                          color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                          opacity: batchImeis.length === 0 ? 0.5 : 1,
                        }}>
                        {batchLoading ? `⏳ ${batchProgress.done}/${batchProgress.total}` : `🔍 Verificar ${batchImeis.length > 0 ? batchImeis.length : ''} IMEI${batchImeis.length !== 1 ? 's' : ''}`}
                      </button>
                      {batchResults.filter(r => r.status === 'success').length > 0 && !batchLoading && (
                        <button
                          onClick={() => { setForm({ owner_org_id: CORP_ID, emoji: '📱', sale_price: '' }); setModal('batch-to-stock'); }}
                          style={{
                            flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg,#30D158,#34C759)',
                            color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                          }}>
                          📦 Agregar {batchResults.filter(r => r.status === 'success').length} al Stock
                        </button>
                      )}
                    </div>

                    {/* Resultado grid */}
                    {batchResults.length > 0 && !batchLoading && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, alignItems: 'start' }}>
                        {batchResults.map((r, idx) => {
                          const info = r.info || {};
                          const obj = r.result?.object;
                          const hModel = obj?.model || obj?.Model || info.fullModel || '';
                          const hModelShort = hModel.replace(/\([A-Z]\d{4,5}\)/g,'').replace(/\[[^\]]*\]/g,'').replace(/\d+\s*(?:GB|TB|MB)/gi,'').replace(/\s{2,}/g,' ').trim();
                          return (
                            <div key={idx} style={{
                              borderRadius: 12, overflow: 'hidden',
                              border: `1px solid ${r.status === 'success' ? 'rgba(48,209,88,0.25)' : 'rgba(255,69,58,0.25)'}`,
                              background: r.status === 'success' ? 'rgba(48,209,88,0.04)' : 'rgba(255,69,58,0.04)',
                            }}>
                              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28 }}>{r.status === 'success' ? '✅' : '❌'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{r.imei}</div>
                                  {r.status === 'success' ? (
                                    <>
                                      {hModelShort && <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hModelShort}</div>}
                                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                        {info.modelNumber && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 12, background: 'rgba(10,132,255,0.15)', color: '#4DA8FF', fontWeight: 700 }}>{info.modelNumber}</span>}
                                        {info.storage     && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 12, background: 'rgba(255,159,10,0.15)', color: '#FF9F0A', fontWeight: 700 }}>{info.storage}</span>}
                                        {info.color       && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 12, background: 'rgba(191,90,242,0.15)', color: '#BF5AF2', fontWeight: 700 }}>{info.color}</span>}
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ fontSize: 11, color: '#FF453A', marginTop: 2 }}>{r.error}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* HISTORIAL — grid elegante y uniforme */}
            {imeiHistory.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📋 Últimas consultas</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignItems: 'start' }}>
                  {imeiHistory.map(h => {
                    const raw     = h.result?.result || h.raw_response || '';
                    const isHtml  = typeof raw === 'string' && (raw.trim().startsWith('<!') || raw.trim().toLowerCase().startsWith('<html'));
                    const obj     = h.result?.object;
                    const isOk    = h.status === 'success' && !isHtml;

                    const hModel = obj?.model || obj?.Model || obj?.modelName || parseLines(typeof h.result?.result === 'string' ? h.result.result : '').find(l => l.k.toLowerCase().includes('model'))?.v || '';
                    const hModelNum   = hModel.match(/A\d{4,5}/)?.[0] || '';
                    const hModelShort = hModel.replace(/\([A-Z]\d{4,5}\)/g,'').replace(/\[[^\]]*\]/g,'').replace(/\d+\s*(?:GB|TB|MB)/gi,'').replace(/\s{2,}/g,' ').trim();

                    let hStorage = (obj?.capacity || obj?.storage || obj?.Capacity || obj?.Storage || obj?.internalStorage || '').toString().replace(/\s+/g,'').trim();
                    if (!hStorage) { const sm = hModel.match(/(\d+\s*(?:GB|TB|MB))/i); if (sm) hStorage = sm[1].replace(/\s+/g,''); }

                    const hColor  = (obj?.color || obj?.Color || obj?.colour || obj?.Colour || '').toString().trim();
                    const hBadges = isOk
                      ? (obj ? dedupeObject(obj) : parseLines(h.result?.result || '').map(r => [r.k, r.v]))
                          .filter(([k,v]) => statusBadge(k, String(v))).slice(0,3)
                          .map(([k,v]) => ({ b: statusBadge(k, String(v)) }))
                      : [];

                    const svcLabel = (h.service_name || '').replace(/\[IMEICHECK\]/gi,'[S1]').replace(/\[SICKW\]/gi,'[S2]').replace(/\[S\d\]\s*/,'').trim();
                    const dateStr  = new Date(h.created_at).toLocaleDateString('es-PE', { day:'2-digit', month:'short' }) + ' ' + new Date(h.created_at).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });

                    return (
                      <div key={h.id} style={{
                        background: 'var(--card, rgba(255,255,255,0.04))',
                        border: `1px solid ${isOk ? 'rgba(255,255,255,0.08)' : 'rgba(255,69,58,0.2)'}`,
                        borderRadius: 16,
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                      }}>
                        {/* Header — color según estado */}
                        <div style={{
                          padding: '10px 14px',
                          background: isOk ? 'rgba(10,132,255,0.06)' : isHtml ? 'rgba(255,159,10,0.06)' : 'rgba(255,69,58,0.06)',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span style={{ fontSize: 24, lineHeight: 1 }}>{deviceEmoji(hModel)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{h.imei}</div>
                            {hModelShort
                              ? <div style={{ fontSize: 12, fontWeight: 800, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hModelShort}</div>
                              : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{svcLabel || 'apple info'}</div>
                            }
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: 800, padding: '4px 8px', borderRadius: 8,
                            background: isOk ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)',
                            color: isOk ? '#30D158' : '#FF453A', flexShrink: 0,
                          }}>
                            {isOk ? '✓' : '✕'}
                          </span>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '10px 14px', flex: 1 }}>
                          {/* Chips: modelo, storage, color */}
                          {(hModelNum || hStorage || hColor) && (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                              {hModelNum && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(10,132,255,0.15)', color: '#4DA8FF', fontWeight: 700 }}>{hModelNum}</span>}
                              {hStorage  && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,159,10,0.15)', color: '#FF9F0A', fontWeight: 700 }}>{hStorage}</span>}
                              {hColor    && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(191,90,242,0.15)', color: '#BF5AF2', fontWeight: 700 }}>{hColor}</span>}
                            </div>
                          )}

                          {/* Badges de estado */}
                          {isHtml ? (
                            <div style={{ fontSize: 11, color: '#FF9F0A', fontWeight: 600 }}>⚠️ API key inválida</div>
                          ) : hBadges.length > 0 ? (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {hBadges.map(({ b }, i) => (
                                <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: b.bg, color: b.color, fontWeight: 700 }}>
                                  {b.ico} {b.txt}
                                </span>
                              ))}
                            </div>
                          ) : isOk ? (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin alertas detectadas</div>
                          ) : null}

                          {/* Fecha y servicio */}
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                            {dateStr}{svcLabel ? ` · ${svcLabel}` : ''}
                          </div>
                        </div>

                        {/* Footer — botón registrar */}
                        {isOk && (
                          <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                              onClick={() => {
                                const info = extractDeviceInfo(h.result, h.id);
                                setForm({ ...info, imei: h.imei, emoji: '📱', owner_org_id: CORP_ID, sale_price: '', _suggested_name: info.deviceName });
                                setModal('imei-to-stock');
                              }}
                              style={{
                                width: '100%', padding: '8px', borderRadius: 10, border: 'none',
                                background: 'rgba(48,209,88,0.12)', color: '#30D158',
                                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              }}>
                              📲 Registrar equipo
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          );
        })()}

      </div>{/* end .content */}

      {/* TAB BAR — sidebar desktop con brand */}
      <div className="tab-bar tab-bar-branded">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top">
            <div className="sidebar-brand-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Corp Tech" />
            </div>
            <div className="sidebar-brand-info">
              <div className="sidebar-brand-name-row">
                <div className="sidebar-brand-company">Corp Tech</div>
                <span className="sidebar-brand-badge" style={{ background:'var(--purple)' }}>CORP</span>
              </div>
              <div className="sidebar-brand-user">{me?.name}</div>
            </div>
          </div>
          <div className="sidebar-brand-actions">
            <button onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            <button onClick={doLogout}>Salir</button>
          </div>
        </div>
        {CORP_NAV.map(t => (
          t.href
            ? <Link key={t.href} href={t.href} className="tab-btn"><span className="ico">{t.ico}</span>{t.lbl}</Link>
            : <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => switchTab(t.id)}>
                <span className="ico">{t.ico}</span>{t.lbl}
              </button>
        ))}
        <div className="sidebar-footer">
          Desarrollado por<br />
          <a href="https://pmg-studio.com" target="_blank" rel="noopener noreferrer">pmg-studio.com</a>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MODALS
      ══════════════════════════════════════ */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />

            {/* ── MODAL: Crear Usuario de Tienda ── */}
            {modal === 'create-user' && (
              <>
                <div className="modal-title">👤 Nuevo Usuario de Tienda</div>
                <form onSubmit={createStoreUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div className="form-group">
                    <label className="form-label">Nombre completo</label>
                    <input className="form-input" required
                      placeholder="Juan García"
                      value={newUserForm.full_name}
                      onChange={e => setNewUserForm({ ...newUserForm, full_name: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" required
                      placeholder="juan@correo.com"
                      value={newUserForm.email}
                      onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contraseña inicial</label>
                    <input className="form-input" type="password" required minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newUserForm.password}
                      onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { v: 'store_admin', l: '🏪 Admin Tienda', d: 'Gestiona stock, ventas y equipo' },
                        { v: 'vendedor',    l: '🛒 Vendedor',     d: 'Solo accede al POS para vender' },
                      ].map(r => (
                        <button key={r.v} type="button"
                          onClick={() => setNewUserForm({ ...newUserForm, role: r.v })}
                          style={{
                            flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                            border: `1.5px solid ${newUserForm.role === r.v ? '#0A84FF' : 'var(--border)'}`,
                            background: newUserForm.role === r.v ? 'rgba(10,132,255,0.15)' : 'transparent',
                            color: newUserForm.role === r.v ? '#0A84FF' : 'var(--text)',
                            textAlign: 'center', transition: 'all .15s',
                          }}>
                          <div style={{ fontWeight: 800, fontSize: 12 }}>{r.l}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{r.d}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Asignar a tienda</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {STORES.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => setNewUserForm({ ...newUserForm, org_id: s.id })}
                          style={{
                            flex: 1, padding: '8px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                            border: `1.5px solid ${newUserForm.org_id === s.id ? '#30D158' : 'var(--border)'}`,
                            background: newUserForm.org_id === s.id ? 'rgba(48,209,88,0.15)' : 'transparent',
                            color: newUserForm.org_id === s.id ? '#30D158' : 'var(--text)',
                            fontWeight: 700, fontSize: 12, transition: 'all .15s',
                          }}>
                          {s.ico} {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aviso: necesita SUPABASE_SERVICE_ROLE_KEY */}
                  <div style={{
                    background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.3)',
                    borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#FF9F0A',
                  }}>
                    ⚠️ Requiere <strong>SUPABASE_SERVICE_ROLE_KEY</strong> en variables de entorno Vercel.
                    Ve a Vercel → tu proyecto → Settings → Environment Variables.
                  </div>

                  <button type="submit" className="btn-primary" disabled={creatingUser}
                    style={{ marginTop: 4, padding: '13px', fontSize: 15, fontWeight: 800 }}>
                    {creatingUser ? '⏳ Creando...' : '✅ Crear Usuario'}
                  </button>
                </form>
              </>
            )}

            {/* ── MODAL: Nuevo / Editar Producto ── */}
            {modal === 'add-product' && (() => {
              const EMOJI_QUICK = ['📱','📲','💻','🖥','⌚','🎧','📟','🔋','🔌','📡','🖱','⌨️','🎮','📷','🎙','📦'];
              const CATS_MODAL = [
                { id:'iphone',    lbl:'iPhone',     ico:'📱' },
                { id:'ipad',      lbl:'iPad',       ico:'📟' },
                { id:'mac',       lbl:'Mac',        ico:'💻' },
                { id:'airpods',   lbl:'AirPods',    ico:'🎧' },
                { id:'samsung',   lbl:'Samsung',    ico:'📲' },
                { id:'accesorio', lbl:'Accesorio',  ico:'🔌' },
                { id:'otro',      lbl:'Otro',       ico:'📦' },
              ];
              const CHIPS_QUICK = ['A13 Bionic','A14 Bionic','A15 Bionic','A16 Bionic','A17 Pro','A18','A18 Pro','A19','A19 Pro','Exynos','Snapdragon','M1','M2','M3','M4'];
              return (
                <>
                  <div className="modal-title">{form._edit_id ? '✏️ Editar modelo' : '🗂️ Nuevo modelo base'}</div>

                  {/* Preview en vivo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 16 }}>
                    <span style={{ fontSize: 40 }}>{form.emoji || '📦'}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{form.name || 'Nombre del modelo'}</div>
                      {form.chip && <div style={{ fontSize: 12, color: '#FF9F0A', fontWeight: 700 }}>⚡ {form.chip}</div>}
                      {form.category && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{CATS_MODAL.find(c=>c.id===form.category)?.ico} {CATS_MODAL.find(c=>c.id===form.category)?.lbl}</div>}
                    </div>
                  </div>

                  <form onSubmit={addProduct} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                    {/* Categoría */}
                    <div className="form-group">
                      <label className="form-label">Categoría *</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {CATS_MODAL.map(c => (
                          <button key={c.id} type="button"
                            onClick={() => setForm({ ...form, category: c.id })}
                            style={{
                              padding: '7px 13px', borderRadius: 10, fontWeight: 700, fontSize: 12,
                              border: `1.5px solid ${form.category === c.id ? '#0A84FF' : 'var(--border)'}`,
                              background: form.category === c.id ? 'rgba(10,132,255,0.15)' : 'transparent',
                              color: form.category === c.id ? '#4DA8FF' : 'var(--text)',
                              cursor: 'pointer',
                            }}>
                            {c.ico} {c.lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emoji */}
                    <div className="form-group">
                      <label className="form-label">Ícono</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {EMOJI_QUICK.map(ico => (
                          <button key={ico} type="button"
                            onClick={() => setForm({ ...form, emoji: ico })}
                            style={{
                              fontSize: 22, width: 42, height: 42, borderRadius: 10,
                              border: `2px solid ${form.emoji === ico ? '#0A84FF' : 'var(--border)'}`,
                              background: form.emoji === ico ? 'rgba(10,132,255,0.15)' : 'transparent',
                              cursor: 'pointer',
                            }}>
                            {ico}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="form-group">
                      <label className="form-label">Nombre del modelo *</label>
                      <input
                        className="form-input" required
                        placeholder="iPhone 15 Pro Max · Samsung S24 · AirPods Pro 2"
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    {/* Chip */}
                    <div className="form-group">
                      <label className="form-label">Chip / Procesador</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        {CHIPS_QUICK.map(c => (
                          <button key={c} type="button"
                            onClick={() => setForm({ ...form, chip: form.chip === c ? '' : c })}
                            style={{
                              padding: '5px 10px', borderRadius: 8, fontWeight: 700, fontSize: 11,
                              border: `1.5px solid ${form.chip === c ? '#FF9F0A' : 'var(--border)'}`,
                              background: form.chip === c ? 'rgba(255,159,10,0.15)' : 'transparent',
                              color: form.chip === c ? '#FF9F0A' : 'var(--text)',
                              cursor: 'pointer',
                            }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <input className="form-input" placeholder="O escribe uno personalizado…"
                        value={CHIPS_QUICK.includes(form.chip || '') ? '' : (form.chip || '')}
                        onChange={e => setForm({ ...form, chip: e.target.value })}
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    {/* Capacidades disponibles */}
                    <div className="form-group">
                      <label className="form-label">Capacidades disponibles</label>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        {['64 GB','128 GB','256 GB','512 GB','1 TB'].map(cap => {
                          const list = (form.capacities_text || '').split(',').map(s => s.trim()).filter(Boolean);
                          const active = list.includes(cap);
                          return (
                            <button key={cap} type="button"
                              onClick={() => {
                                const next = active ? list.filter(x => x !== cap) : [...list, cap];
                                setForm({ ...form, capacities_text: next.join(', ') });
                              }}
                              style={{
                                padding: '6px 10px', borderRadius: 8, fontWeight: 700, fontSize: 11,
                                border: `1.5px solid ${active ? '#FF9F0A' : 'var(--border)'}`,
                                background: active ? 'rgba(255,159,10,0.15)' : 'transparent',
                                color: active ? '#FF9F0A' : 'var(--text)', cursor: 'pointer',
                              }}>
                              {cap}
                            </button>
                          );
                        })}
                      </div>
                      <input className="form-input" placeholder="O escribe: 128 GB, 256 GB, 512 GB"
                        value={form.capacities_text || ''}
                        onChange={e => setForm({ ...form, capacities_text: e.target.value })}
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    {/* Colores disponibles */}
                    <div className="form-group">
                      <label className="form-label">Colores disponibles</label>
                      <input className="form-input"
                        placeholder="Titanio Negro, Titanio Blanco, Titanio Natural, Titanio del Desierto"
                        value={form.colors_text || ''}
                        onChange={e => setForm({ ...form, colors_text: e.target.value })}
                        style={{ fontSize: 12 }}
                      />
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Separados por coma. Ejemplo: Negro, Blanco, Rojo</div>
                      {/* Preview chips */}
                      {(form.colors_text || '').split(',').map(s=>s.trim()).filter(Boolean).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                          {(form.colors_text || '').split(',').map(s=>s.trim()).filter(Boolean).map((col, i) => (
                            <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(191,90,242,0.15)', color: '#BF5AF2', fontWeight: 700 }}>{col}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Fotos por color ── */}
                    {(form.colors_text || '').split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                      <div className="form-group">
                        <label className="form-label">📸 Foto por color (opcional)</label>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                          Al escoger un color en la tienda, la foto cambiará automáticamente ✨
                        </div>
                        {(form.colors_text || '').split(',').map(s => s.trim()).filter(Boolean).map((col) => {
                          const imgUrl = (form.color_images || {})[col] || '';
                          return (
                            <div key={col} style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#BF5AF2' }}>🎨 {col}</span>
                                {imgUrl && (
                                  <span style={{ fontSize: 10, color: '#30D158', fontWeight: 700 }}>✓ Foto cargada</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* URL input */}
                                <input
                                  className="form-input"
                                  placeholder="Pega URL de la foto..."
                                  value={imgUrl}
                                  onChange={e => setForm(f => ({ ...f, color_images: { ...(f.color_images || {}), [col]: e.target.value } }))}
                                  style={{ fontSize: 11, flex: 1 }}
                                />
                                {/* File upload button */}
                                <label style={{
                                  padding: '8px 12px', borderRadius: 10, fontWeight: 700, fontSize: 11,
                                  border: '1.5px solid #0A84FF', color: '#4DA8FF',
                                  background: 'rgba(10,132,255,0.10)', cursor: 'pointer', whiteSpace: 'nowrap',
                                }}>
                                  📁 Subir
                                  <input type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const ext  = file.name.split('.').pop() || 'jpg';
                                      const path = `colors/${Date.now()}_${col.replace(/\s+/g,'_')}.${ext}`;
                                      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: true });
                                      if (upErr) { showToast('Error subiendo imagen: ' + upErr.message, 'err'); return; }
                                      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
                                      const publicUrl = urlData?.publicUrl || '';
                                      setForm(f => ({ ...f, color_images: { ...(f.color_images || {}), [col]: publicUrl } }));
                                      showToast(`Foto de "${col}" subida ✓`);
                                    }}
                                  />
                                </label>
                              </div>
                              {/* Preview */}
                              {imgUrl && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div style={{ borderRadius: 10, overflow: 'hidden', background: '#fff', padding: 6, border: '1px solid var(--border)' }}>
                                    <img src={imgUrl} alt={col} style={{ height: 70, objectFit: 'contain' }}
                                      onError={e => { e.target.style.opacity = 0.3; }}
                                    />
                                  </div>
                                  <button type="button"
                                    onClick={() => setForm(f => { const ci = { ...(f.color_images || {}) }; delete ci[col]; return { ...f, color_images: ci }; })}
                                    style={{ fontSize: 11, color: '#FF453A', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', fontWeight: 700 }}>
                                    🗑 Quitar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Descripción */}
                    <div className="form-group">
                      <label className="form-label">Descripción / Características</label>
                      <textarea className="form-input" rows={2}
                        placeholder="Face ID · Cámara 48MP · 5G · Dynamic Island"
                        value={form.description || ''}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        style={{ resize: 'vertical', fontSize: 13 }}
                      />
                    </div>

                    {/* Precio referencia */}
                    <div className="form-group">
                      <label className="form-label">Precio de referencia (S/) — opcional</label>
                      <input className="form-input" type="number" step="0.01" min="0"
                        placeholder="0.00"
                        value={form.sale_price || ''}
                        onChange={e => setForm({ ...form, sale_price: e.target.value })}
                      />
                    </div>

                    {/* Imagen del producto */}
                    <div className="form-group">
                      <label className="form-label">🖼 Foto del producto (URL)</label>
                      <input className="form-input"
                        placeholder="https://store.storeimages.cdn-apple.com/..."
                        value={form.image_url || ''}
                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                        style={{ fontSize: 12 }}
                      />
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                        Pega la URL de la imagen del producto (Apple CDN, tu servidor, etc.)
                      </div>
                      {/* Preview de la imagen */}
                      {form.image_url && (
                        <div style={{
                          marginTop: 10, borderRadius: 14, overflow: 'hidden',
                          background: '#fff', border: '1px solid var(--border)',
                          padding: 12, display: 'flex', justifyContent: 'center',
                          maxHeight: 160,
                        }}>
                          <img
                            src={form.image_url}
                            alt="Preview"
                            style={{ height: 130, objectFit: 'contain' }}
                            onError={e => { e.target.style.opacity = 0.3; e.target.alt = '⚠️ URL inválida'; }}
                          />
                        </div>
                      )}
                    </div>

                    <button className="btn btn-primary" type="submit">
                      {form._edit_id ? '💾 Guardar cambios' : '✅ Crear modelo'}
                    </button>
                  </form>
                </>
              );
            })()}

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
                  {/* ── Filtro de Categoría ── */}
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:4, flexWrap:'nowrap' }}>
                      {[
                        { id:'all',       lbl:'Todos',    ico:'🗂️', color:'#636366' },
                        { id:'iphone',    lbl:'iPhone',   ico:'📱', color:'#0A84FF' },
                        { id:'ipad',      lbl:'iPad',     ico:'📟', color:'#5E5CE6' },
                        { id:'mac',       lbl:'Mac',      ico:'💻', color:'#636366' },
                        { id:'airpods',   lbl:'AirPods',  ico:'🎧', color:'#30D158' },
                        { id:'samsung',   lbl:'Samsung',  ico:'📲', color:'#FF9F0A' },
                        { id:'accesorio', lbl:'Acces.',   ico:'🔌', color:'#BF5AF2' },
                        { id:'otro',      lbl:'Otro',     ico:'📦', color:'#8E8E93' },
                      ].map(c => {
                        const cnt   = c.id === 'all' ? products.length : products.filter(p => (p.category||'otro') === c.id).length;
                        const active = stockCatFilter === c.id;
                        return (
                          <button key={c.id} type="button"
                            onClick={() => { setStockCatFilter(c.id); setForm(f => ({ ...f, product_id:'' })); setProdSearch(''); }}
                            style={{
                              flexShrink:0, padding:'5px 10px', borderRadius:16, fontSize:11, fontWeight:700, cursor:'pointer',
                              border:`1.5px solid ${active ? c.color : 'var(--border)'}`,
                              background: active ? `${c.color}22` : 'transparent',
                              color: active ? c.color : 'var(--text-muted)',
                              transition:'all .15s',
                            }}>
                            {c.ico} {c.lbl}{cnt > 0 && c.id !== 'all' ? ` (${cnt})` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Buscador + Lista de Producto ── */}
                  <div className="form-group">
                    <label className="form-label">Producto</label>
                    {/* Input buscador */}
                    <input
                      className="form-input"
                      placeholder={stockCatFilter === 'all' ? '🔍 Buscar por nombre...' : `🔍 Buscar en ${stockCatFilter}...`}
                      value={prodSearch}
                      onChange={e => { setProdSearch(e.target.value); setForm(f => ({ ...f, product_id:'' })); }}
                      autoComplete="off"
                      style={{ borderColor: form.product_id ? '#30D158' : undefined }}
                    />
                    {/* Chip de producto seleccionado */}
                    {form.product_id && (() => {
                      const sel = products.find(p => p.id === form.product_id);
                      return sel ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, padding:'6px 10px', background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.3)', borderRadius:8 }}>
                          <span style={{ fontSize:18 }}>{sel.emoji || '📦'}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:'#30D158', flex:1 }}>{sel.name}</span>
                          <button type="button" onClick={() => { setForm(f=>({...f,product_id:''})); setProdSearch(''); }}
                            style={{ background:'none', border:'none', color:'#FF453A', cursor:'pointer', fontSize:16, lineHeight:1 }}>✕</button>
                        </div>
                      ) : null;
                    })()}
                    {/* Lista filtrada por categoría + búsqueda */}
                    {!form.product_id && (stockCatFilter !== 'all' || prodSearch) && (() => {
                      const filtered = products.filter(p => {
                        const catOk    = stockCatFilter === 'all' || (p.category||'otro') === stockCatFilter;
                        const searchOk = !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase());
                        return catOk && searchOk;
                      });
                      return (
                        <div style={{ border:'1px solid var(--border)', borderRadius:10, maxHeight:220, overflowY:'auto', marginTop:4, background:'var(--card)', boxShadow:'0 8px 24px rgba(0,0,0,0.2)', position:'relative', zIndex:10 }}>
                          {filtered.length === 0 ? (
                            <div style={{ padding:'12px 14px', fontSize:13, color:'var(--text3)' }}>
                              Sin productos{prodSearch ? ` para "${prodSearch}"` : ''} en esta categoría
                            </div>
                          ) : filtered.map((p, i) => (
                            <div key={p.id}
                              onMouseDown={() => { setForm(f => ({ ...f, product_id:p.id, emoji:p.emoji||'📦', sale_price: p.sale_price||'' })); setProdSearch(''); }}
                              style={{
                                padding:'10px 14px', cursor:'pointer',
                                display:'flex', alignItems:'center', gap:10,
                                fontSize:13, color:'var(--text)',
                                borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background='rgba(10,132,255,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}
                            >
                              <span style={{ fontSize:20 }}>{p.emoji || '📦'}</span>
                              <div>
                                <div style={{ fontWeight:700 }}>{p.name}</div>
                                {p.sale_price > 0 && <div style={{ fontSize:11, color:'#30D158', fontWeight:600 }}>S/ {parseFloat(p.sale_price).toFixed(2)}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
                    <label className="form-label">Precio de venta (S/) <span style={{ color:'var(--text3)', fontSize:11, fontWeight:400 }}>— opcional</span></label>
                    <input className="form-input" type="number" placeholder="0.00" value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color <span style={{ color:'var(--text3)', fontSize:11, fontWeight:400 }}>— opcional</span></label>
                    {/* Chips de colores del modelo */}
                    {form.product_id && (() => {
                      const sel = products.find(p => p.id === form.product_id);
                      const cols = sel?.default_colors || [];
                      if (cols.length === 0) return null;
                      return (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6 }}>
                          {cols.map(c => (
                            <button key={c} type="button"
                              onClick={() => setForm(f => ({ ...f, color_info: f.color_info === c ? '' : c }))}
                              style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:`1.5px solid ${form.color_info===c?'#BF5AF2':'var(--border)'}`, background: form.color_info===c?'rgba(191,90,242,0.15)':'transparent', color: form.color_info===c?'#BF5AF2':'var(--text-muted)' }}>
                              {c}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    <input className="form-input" placeholder="Ej: Deep Blue, Silver..." value={form.color_info || ''} onChange={e => setForm({ ...form, color_info: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacidad (GB/TB) <span style={{ color:'var(--text3)', fontSize:11, fontWeight:400 }}>— opcional</span></label>
                    {/* Chips de capacidades del modelo */}
                    {form.product_id && (() => {
                      const sel = products.find(p => p.id === form.product_id);
                      const caps = sel?.default_capacities || [];
                      if (caps.length === 0) return null;
                      return (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6 }}>
                          {caps.map(c => (
                            <button key={c} type="button"
                              onClick={() => setForm(f => ({ ...f, storage_info: f.storage_info === c ? '' : c }))}
                              style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:`1.5px solid ${form.storage_info===c?'#FF9F0A':'var(--border)'}`, background: form.storage_info===c?'rgba(255,159,10,0.15)':'transparent', color: form.storage_info===c?'#FF9F0A':'var(--text-muted)' }}>
                              {c}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    <input className="form-input" placeholder="Ej: 256GB, 512GB..." value={form.storage_info || ''} onChange={e => setForm({ ...form, storage_info: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar</button>
                </form>
              </>
            )}

            {/* ── MODAL: Empleado ── */}
            {modal === 'add-employee' && (
              <>
                <div className="modal-title">👤 {form.emp_id ? 'Editar' : 'Nuevo'} Empleado</div>
                <form onSubmit={saveEmployee}>
                  <div className="form-group">
                    <label className="form-label">Empresa</label>
                    <select className="form-select" value={form.emp_org||CORP_ID} onChange={e=>setForm({...form,emp_org:e.target.value})}>
                      <option value={CORP_ID}>🏢 Corp Tech</option>
                      {STORES.map(s=><option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" required placeholder="Juan Pérez" value={form.emp_name||''} onChange={e=>setForm({...form,emp_name:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input className="form-input" placeholder="+51 999..." value={form.emp_phone||''} onChange={e=>setForm({...form,emp_phone:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" placeholder="correo@..." value={form.emp_email||''} onChange={e=>setForm({...form,emp_email:e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo / Rol</label>
                    <input className="form-input" placeholder="Vendedor, Encargado..." value={form.emp_role||''} onChange={e=>setForm({...form,emp_role:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Sueldo</label>
                      <input className="form-input" type="number" required placeholder="0.00" value={form.emp_salary||''} onChange={e=>setForm({...form,emp_salary:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Moneda</label>
                      <select className="form-select" value={form.emp_currency||'PEN'} onChange={e=>setForm({...form,emp_currency:e.target.value})}>
                        <option value="PEN">S/ PEN</option>
                        <option value="USD">$ USD</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Periodicidad</label>
                      <select className="form-select" value={form.emp_period||'mensual'} onChange={e=>setForm({...form,emp_period:e.target.value})}>
                        <option value="mensual">Mensual</option>
                        <option value="quincenal">Quincenal</option>
                        <option value="semanal">Semanal</option>
                        <option value="diario">Diario</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de ingreso</label>
                    <input className="form-input" type="date" value={form.emp_start||''} onChange={e=>setForm({...form,emp_start:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <input className="form-input" placeholder="Observaciones..." value={form.emp_notes||''} onChange={e=>setForm({...form,emp_notes:e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">{form.emp_id?'Actualizar':'Guardar'}</button>
                </form>
              </>
            )}

            {/* ── MODAL: Pagar Sueldo ── */}
            {modal === 'pay-salary' && (
              <>
                <div className="modal-title">💵 Registrar Pago de Sueldo</div>
                <form onSubmit={saveSalaryPayment}>
                  <div className="form-group">
                    <label className="form-label">Período</label>
                    <input className="form-input" placeholder="Mayo 2026" value={form.sp_period_label||''} onChange={e=>setForm({...form,sp_period_label:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Monto</label>
                      <input className="form-input" type="number" required value={form.sp_amount||''} onChange={e=>setForm({...form,sp_amount:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Moneda</label>
                      <select className="form-select" value={form.sp_currency||'PEN'} onChange={e=>setForm({...form,sp_currency:e.target.value})}>
                        <option value="PEN">S/</option>
                        <option value="USD">$</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Fecha</label>
                      <input className="form-input" type="date" value={form.sp_date||''} onChange={e=>setForm({...form,sp_date:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Método</label>
                      <select className="form-select" value={form.sp_method||'efectivo'} onChange={e=>setForm({...form,sp_method:e.target.value})}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="yape">Yape</option>
                        <option value="plin">Plin</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <input className="form-input" placeholder="Observaciones..." value={form.sp_notes||''} onChange={e=>setForm({...form,sp_notes:e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Registrar Pago</button>
                </form>
              </>
            )}

            {/* ── MODAL: Deudor ── */}
            {modal === 'add-debtor' && (
              <>
                <div className="modal-title">📥 {form.dr_id?'Editar':'Nuevo'} Deudor</div>
                <form onSubmit={saveDebtor}>
                  <div className="form-group">
                    <label className="form-label">Empresa</label>
                    <select className="form-select" value={form.dr_org||CORP_ID} onChange={e=>setForm({...form,dr_org:e.target.value})}>
                      <option value={CORP_ID}>🏢 Corp Tech</option>
                      {STORES.map(s=><option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del deudor *</label>
                    <input className="form-input" required placeholder="Nombre completo o empresa" value={form.dr_name||''} onChange={e=>setForm({...form,dr_name:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input className="form-input" placeholder="+51 999..." value={form.dr_phone||''} onChange={e=>setForm({...form,dr_phone:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" placeholder="correo@..." value={form.dr_email||''} onChange={e=>setForm({...form,dr_email:e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Concepto</label>
                    <input className="form-input" placeholder="Por qué nos debe..." value={form.dr_desc||''} onChange={e=>setForm({...form,dr_desc:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Monto prestado (capital)</label>
                      <input className="form-input" type="number" required placeholder="0.00" value={form.dr_principal||''} onChange={e=>setForm({...form,dr_principal:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Moneda</label>
                      <select className="form-select" value={form.dr_currency||'PEN'} onChange={e=>setForm({...form,dr_currency:e.target.value})}>
                        <option value="PEN">S/</option>
                        <option value="USD">$</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Tasa de interés (%)</label>
                      <input className="form-input" type="number" placeholder="0" value={form.dr_rate||''} onChange={e=>setForm({...form,dr_rate:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de interés</label>
                      <select className="form-select" value={form.dr_int_type||'none'} onChange={e=>setForm({...form,dr_int_type:e.target.value})}>
                        <option value="none">Sin interés</option>
                        <option value="monthly">% Mensual</option>
                        <option value="annual">% Anual</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Fecha inicio</label>
                      <input className="form-input" type="date" value={form.dr_start||''} onChange={e=>setForm({...form,dr_start:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha vencimiento</label>
                      <input className="form-input" type="date" value={form.dr_due||''} onChange={e=>setForm({...form,dr_due:e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <input className="form-input" placeholder="Garantías, acuerdos..." value={form.dr_notes||''} onChange={e=>setForm({...form,dr_notes:e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">{form.dr_id?'Actualizar':'Guardar Deudor'}</button>
                </form>
              </>
            )}

            {/* ── MODAL: Registrar cobro al deudor ── */}
            {modal === 'register-debtor-payment' && (
              <>
                <div className="modal-title">💵 Registrar Cobro</div>
                <form onSubmit={registerDebtorPayment}>
                  <div className="form-group">
                    <label className="form-label">Monto cobrado</label>
                    <input className="form-input" type="number" required value={form.drp_amount||''} onChange={e=>setForm({...form,drp_amount:e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Registrar Cobro</button>
                </form>
              </>
            )}

            {/* ── MODAL: Deuda empresa ── */}
            {modal === 'add-comp-debt' && (
              <>
                <div className="modal-title">📤 {form.cd_id?'Editar':'Nueva'} Deuda</div>
                <form onSubmit={saveCompDebt}>
                  <div className="form-group">
                    <label className="form-label">Empresa</label>
                    <select className="form-select" value={form.cd_org||CORP_ID} onChange={e=>setForm({...form,cd_org:e.target.value})}>
                      <option value={CORP_ID}>🏢 Corp Tech</option>
                      {STORES.map(s=><option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Acreedor (a quien debemos) *</label>
                    <input className="form-input" required placeholder="Banco, persona, empresa..." value={form.cd_creditor||''} onChange={e=>setForm({...form,cd_creditor:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Concepto</label>
                    <input className="form-input" placeholder="Por qué debemos..." value={form.cd_desc||''} onChange={e=>setForm({...form,cd_desc:e.target.value})} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Monto (capital)</label>
                      <input className="form-input" type="number" required placeholder="0.00" value={form.cd_principal||''} onChange={e=>setForm({...form,cd_principal:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Moneda</label>
                      <select className="form-select" value={form.cd_currency||'PEN'} onChange={e=>setForm({...form,cd_currency:e.target.value})}>
                        <option value="PEN">S/</option>
                        <option value="USD">$</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Tasa de interés (%)</label>
                      <input className="form-input" type="number" placeholder="0" value={form.cd_rate||''} onChange={e=>setForm({...form,cd_rate:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de interés</label>
                      <select className="form-select" value={form.cd_int_type||'none'} onChange={e=>setForm({...form,cd_int_type:e.target.value})}>
                        <option value="none">Sin interés</option>
                        <option value="monthly">% Mensual</option>
                        <option value="annual">% Anual</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group">
                      <label className="form-label">Fecha inicio</label>
                      <input className="form-input" type="date" value={form.cd_start||''} onChange={e=>setForm({...form,cd_start:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha vencimiento</label>
                      <input className="form-input" type="date" value={form.cd_due||''} onChange={e=>setForm({...form,cd_due:e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <input className="form-input" placeholder="Garantías, cuotas..." value={form.cd_notes||''} onChange={e=>setForm({...form,cd_notes:e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">{form.cd_id?'Actualizar':'Guardar Deuda'}</button>
                </form>
              </>
            )}

            {/* ── MODAL: Registrar pago de deuda empresa ── */}
            {modal === 'register-debt-payment' && (
              <>
                <div className="modal-title">💵 Registrar Pago</div>
                <form onSubmit={registerDebtPayment}>
                  <div className="form-group">
                    <label className="form-label">Monto pagado</label>
                    <input className="form-input" type="number" required value={form.cdp_amount||''} onChange={e=>setForm({...form,cdp_amount:e.target.value})} />
                  </div>
                  <button className="btn btn-primary" type="submit">Registrar Pago</button>
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

            {/* ── MODAL: Editar Almacén ── */}
            {modal === 'edit-warehouse' && (
              <>
                <div className="modal-title">✏️ Editar almacén</div>
                <form onSubmit={editWarehouse}>
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
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select className="form-select" value={form.wh_active ? 'true' : 'false'} onChange={e => setForm({ ...form, wh_active: e.target.value === 'true' })}>
                      <option value="true">✅ Activo</option>
                      <option value="false">🔴 Inactivo</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar cambios</button>
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

            {/* ── MODAL: Costo Landed Calculator ── */}
            {modal === 'add-batch' && (() => {
              const C = calcLanded(form, usdRate);
              return (
                <>
                  <div className="modal-title">📥 Registrar Lote de Importación</div>
                  <form onSubmit={addBatch}>
                    {/* Info del lote */}
                    <div className="form-group">
                      <label className="form-label">Descripción del lote</label>
                      <input className="form-input" required placeholder="10x iPhone 15 — Miami" value={form.imp_desc || ''} onChange={e => setForm({ ...form, imp_desc: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Proveedor</label>
                        <input className="form-input" placeholder="Swappa, eBay..." value={form.imp_proveedor || ''} onChange={e => setForm({ ...form, imp_proveedor: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"># Unidades</label>
                        <input className="form-input" type="number" min="1" value={form.imp_unidades || '1'} onChange={e => setForm({ ...form, imp_unidades: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Fecha de compra</label>
                        <input className="form-input" type="date" value={form.imp_fecha_compra || ''} onChange={e => setForm({ ...form, imp_fecha_compra: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">ETA llegada</label>
                        <input className="form-input" type="date" value={form.imp_fecha_llegada || ''} onChange={e => setForm({ ...form, imp_fecha_llegada: e.target.value })} />
                      </div>
                    </div>

                    {/* Separador */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '14px 0 8px' }}>💵 Costos en USD</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Precio compra</label>
                        <input className="form-input" type="number" step="0.01" required placeholder="0.00" value={form.imp_compra || ''} onChange={e => setForm({ ...form, imp_compra: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Flete</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.imp_flete || ''} onChange={e => setForm({ ...form, imp_flete: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Seguro</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.imp_seguro || ''} onChange={e => setForm({ ...form, imp_seguro: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Arancel (%)</label>
                        <input className="form-input" type="number" step="0.1" placeholder="0" value={form.imp_arancel || '0'} onChange={e => setForm({ ...form, imp_arancel: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">IGV (%)</label>
                        <input className="form-input" type="number" step="0.1" placeholder="18" value={form.imp_igv || '18'} onChange={e => setForm({ ...form, imp_igv: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
                      <div className="form-group" style={{ gridColumn: '1/3', marginBottom: 0 }}>
                        <label className="form-label">Gastos Lima (S/)</label>
                        <input className="form-input" type="number" step="0.01" placeholder="Agencia, movilidad..." value={form.imp_gastos || ''} onChange={e => setForm({ ...form, imp_gastos: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">TC S/$</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input className="form-input" type="number" step="0.001" placeholder="3.75" value={usdRate || form.imp_rate || ''} onChange={e => setUsdRate(e.target.value)} style={{ flex: 1 }} />
                          <button type="button" className="btn btn-outline btn-sm" onClick={fetchUsdRate} style={{ padding: '8px 6px', flexShrink: 0 }}>🔄</button>
                        </div>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Margen objetivo (%)</label>
                      <input className="form-input" type="number" step="1" placeholder="30" value={form.imp_margen || '30'} onChange={e => setForm({ ...form, imp_margen: e.target.value })} />
                    </div>

                    {/* ── PREVIEW LIVE ── */}
                    {(parseFloat(form.imp_compra) > 0) && (
                      <div style={{
                        background: 'linear-gradient(135deg,rgba(10,132,255,0.1),rgba(94,92,230,0.1))',
                        border: '1px solid rgba(10,132,255,0.25)',
                        borderRadius: 14, padding: '14px 16px', marginBottom: 14,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#4DA8FF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                          🧮 Desglose Costo Landed
                        </div>
                        {[
                          { lbl: 'Subtotal (compra+flete+seguro)', val: `$${C.subtotalUSD.toFixed(2)}`, color: 'var(--text)' },
                          { lbl: `Arancel (${form.imp_arancel||0}%)`, val: `$${C.arancelUSD.toFixed(2)}`, color: 'var(--text)' },
                          { lbl: `IGV (${form.imp_igv||18}%)`, val: `$${C.igvUSD.toFixed(2)}`, color: 'var(--text)' },
                          { lbl: 'Costo Landed USD', val: `$${C.landedUSD.toFixed(2)}`, color: '#FF9F0A', bold: true },
                          { lbl: `Costo Landed PEN (TC ${C.rate.toFixed(3)})`, val: `S/${C.landedPEN.toFixed(2)}`, color: '#FF9F0A', bold: true },
                        ].map(r => (
                          <div key={r.lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{r.lbl}</span>
                            <span style={{ color: r.color, fontWeight: r.bold ? 800 : 500 }}>{r.val}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Costo por unidad</span>
                            <span style={{ color: '#fff', fontWeight: 700 }}>S/{C.costoPorUnd.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                            <span style={{ color: '#30D158', fontWeight: 700 }}>💡 Precio sugerido/und ({form.imp_margen||30}%)</span>
                            <span style={{ color: '#30D158', fontWeight: 900 }}>S/{C.precioSug.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>
                            Margen: S/{C.margenSoles.toFixed(2)} por unidad
                          </div>
                        </div>
                      </div>
                    )}

                    <button className="btn btn-primary" type="submit">💾 Guardar lote</button>
                  </form>
                </>
              );
            })()}

            {/* ── MODAL: Nueva Liquidación ── */}
            {modal === 'create-liquidacion' && (() => {
              const montoNeto = (parseFloat(form.liq_productos) || 0)
                              - (parseFloat(form.liq_comision)  || 0)
                              + (parseFloat(form.liq_ajuste)    || 0);
              return (
                <>
                  <div className="modal-title">💳 Nueva Liquidación</div>
                  <form onSubmit={createLiquidacion}>
                    <div className="form-group">
                      <label className="form-label">Tienda</label>
                      <select className="form-select" required value={form.liq_store || ''} onChange={e => { setForm({ ...form, liq_store: e.target.value }); setPeriodData(null); }}>
                        {STORES.map(s => <option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Período inicio</label>
                        <input className="form-input" type="date" required value={form.liq_inicio || ''} onChange={e => setForm({ ...form, liq_inicio: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Período fin</label>
                        <input className="form-input" type="date" required value={form.liq_fin || ''} onChange={e => setForm({ ...form, liq_fin: e.target.value })} />
                      </div>
                    </div>
                    <button type="button"
                      onClick={() => fetchPeriodData(form.liq_store, form.liq_inicio, form.liq_fin)}
                      disabled={!form.liq_store || !form.liq_inicio || !form.liq_fin}
                      style={{
                        width: '100%', margin: '10px 0', padding: '10px', borderRadius: 12,
                        background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)',
                        color: '#4DA8FF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}>
                      🔍 Auto-calcular período
                    </button>

                    {/* Preview auto-cálculo */}
                    {periodData && (
                      <div style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: '#30D158', marginBottom: 6 }}>✅ Datos del período calculados</div>
                        <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                          {periodData.numVentas} ventas · S/{periodData.totalVentas.toFixed(0)} brutos<br/>
                          {periodData.numProductos} traslados recibidos · S/{periodData.valorProductos.toFixed(0)} en productos
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Descripción</label>
                      <input className="form-input" placeholder="Quincena 1-15 Mayo 2026" value={form.liq_desc || ''} onChange={e => setForm({ ...form, liq_desc: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total ventas brutas (S/) — referencia</label>
                      <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.liq_ventas || ''} onChange={e => setForm({ ...form, liq_ventas: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Valor productos extraídos (S/) — LO QUE DEBE</label>
                      <input className="form-input" type="number" step="0.01" required placeholder="0.00" value={form.liq_productos || ''} onChange={e => setForm({ ...form, liq_productos: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Comisión plataforma (S/)</label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.liq_comision || ''} onChange={e => setForm({ ...form, liq_comision: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Ajuste (S/) ± </label>
                        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.liq_ajuste || ''} onChange={e => setForm({ ...form, liq_ajuste: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notas del ajuste</label>
                      <input className="form-input" placeholder="Devolución equipo, descuento especial..." value={form.liq_notas || ''} onChange={e => setForm({ ...form, liq_notas: e.target.value })} />
                    </div>

                    {/* Total final */}
                    <div style={{
                      background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                      borderRadius: 12, padding: '12px 16px', marginBottom: 14,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>MONTO NETO A COBRAR</span>
                      <span style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>S/{montoNeto.toFixed(2)}</span>
                    </div>

                    <button className="btn btn-primary" type="submit">📤 Crear y enviar a tienda</button>
                  </form>
                </>
              );
            })()}

            {/* ── MODAL: Agregar cuenta de caja ── */}
            {(modal === 'add-account' || modal === 'edit-account') && (
              <>
                <div className="modal-title">{modal === 'add-account' ? '🏦 Nueva cuenta' : '🏦 Editar cuenta'}</div>
                <form onSubmit={modal === 'add-account' ? addCashAccount : updateCashAccount}>
                  <div className="form-group">
                    <label className="form-label">Nombre de la cuenta</label>
                    <input className="form-input" required placeholder="Ej: BCP Soles, MercadoLibre, Caja chica" value={form.ca_nombre || ''} onChange={e => setForm({ ...form, ca_nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.ca_tipo || 'banco'} onChange={e => setForm({ ...form, ca_tipo: e.target.value })}>
                      <option value="banco">🏦 Banco</option>
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="plataforma">📱 Plataforma (ML, Saga, Falabella...)</option>
                      <option value="otro">💼 Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Moneda</label>
                    <select className="form-select" value={form.ca_moneda || 'PEN'} onChange={e => setForm({ ...form, ca_moneda: e.target.value })}>
                      <option value="PEN">🇵🇪 Soles (PEN)</option>
                      <option value="USD">🇺🇸 Dólares (USD)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Saldo actual</label>
                    <input className="form-input" type="number" step="0.01" required placeholder="0.00" value={form.ca_saldo ?? ''} onChange={e => setForm({ ...form, ca_saldo: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit">Guardar</button>
                  {modal === 'edit-account' && (
                    <button type="button" className="btn btn-red btn-block" style={{ marginTop: 8 }} onClick={() => deleteCashAccount(form.ca_id)}>
                      🗑 Eliminar cuenta
                    </button>
                  )}
                </form>
              </>
            )}

            {/* ── MODAL: Nueva / Editar Plataforma ── */}
            {modal === 'add-plataforma' && (
              <>
                <div className="modal-title">{form.plat_id ? '✏️ Editar Plataforma' : '🏪 Nueva Plataforma'}</div>
                <form onSubmit={savePlataforma}>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8, marginBottom: 4 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Emoji</label>
                      <input className="form-input" style={{ textAlign: 'center', fontSize: 20 }} maxLength={2} value={form.plat_emoji || '🏪'} onChange={e => setForm({ ...form, plat_emoji: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Nombre de la plataforma</label>
                      <input className="form-input" required placeholder="MercadoLibre, Saga..." value={form.plat_nombre || ''} onChange={e => setForm({ ...form, plat_nombre: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Comisión (%)</label>
                      <input className="form-input" type="number" step="0.01" placeholder="12.00" value={form.plat_comision || ''} onChange={e => setForm({ ...form, plat_comision: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Día de liquidación</label>
                      <input className="form-input" type="number" min="1" max="31" placeholder="20" value={form.plat_dia || ''} onChange={e => setForm({ ...form, plat_dia: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Periodicidad</label>
                    <select className="form-select" value={form.plat_periodicidad || 'mensual'} onChange={e => setForm({ ...form, plat_periodicidad: e.target.value })}>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="bimestral">Bimestral</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Método de pago</label>
                    <select className="form-select" value={form.plat_metodo || 'transferencia'} onChange={e => setForm({ ...form, plat_metodo: e.target.value })}>
                      <option value="deposito">🏦 Depósito bancario</option>
                      <option value="transferencia">💸 Transferencia</option>
                      <option value="plataforma">📱 Pago en plataforma</option>
                      <option value="cheque">🗒 Cheque</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Instrucciones (cómo interpretar el reporte)</label>
                    <textarea className="form-input" rows={3} placeholder="El reporte viene en PDF con columnas: fecha, producto, comisión..." style={{ resize: 'vertical' }} value={form.plat_instrucciones || ''} onChange={e => setForm({ ...form, plat_instrucciones: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit">💾 Guardar plataforma</button>
                  {form.plat_id && (
                    <button type="button" className="btn btn-red btn-block" style={{ marginTop: 8 }} onClick={() => deletePlataforma(form.plat_id)}>
                      🗑 Eliminar plataforma
                    </button>
                  )}
                </form>
              </>
            )}

            {/* ── MODAL: Crear evento de calendario ── */}
            {modal === 'add-calendario' && (
              <>
                <div className="modal-title">📅 Nuevo Evento de Calendario</div>
                <form onSubmit={async e => {
                  e.preventDefault();
                  await generarCalendarioTienda(form.cal_store, form.cal_plat || null, form.cal_fecha, form.cal_titulo, form.cal_tipo);
                  setModal(null); setForm({});
                }}>
                  <div className="form-group">
                    <label className="form-label">Tienda</label>
                    <select className="form-select" required value={form.cal_store || ''} onChange={e => setForm({ ...form, cal_store: e.target.value })}>
                      <option value="">Seleccionar…</option>
                      {STORES.map(s => <option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plataforma (opcional)</label>
                    <select className="form-select" value={form.cal_plat || ''} onChange={e => setForm({ ...form, cal_plat: e.target.value })}>
                      <option value="">— Sin plataforma (Corp directo) —</option>
                      {plataformas.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Título</label>
                    <input className="form-input" required placeholder="Liquidación mensual MercadoLibre" value={form.cal_titulo || ''} onChange={e => setForm({ ...form, cal_titulo: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha esperada</label>
                    <input className="form-input" type="date" required value={form.cal_fecha || ''} onChange={e => setForm({ ...form, cal_fecha: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.cal_tipo || 'plataforma'} onChange={e => setForm({ ...form, cal_tipo: e.target.value })}>
                      <option value="plataforma">🏪 Plataforma externa</option>
                      <option value="corp">🏢 Corp Tech directo</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" type="submit">📅 Crear evento</button>
                </form>
              </>
            )}

            {/* ── MODAL: Registrar Batch al Stock ── */}
            {modal === 'batch-to-stock' && (
              <>
                <div className="modal-title">📦 Agregar {batchResults.filter(r => r.status === 'success').length} equipos al Stock</div>

                {/* Resumen de equipos */}
                <div style={{ marginBottom: 14, maxHeight: 160, overflowY: 'auto' }}>
                  {batchResults.filter(r => r.status === 'success').map((r, idx) => {
                    const info = r.info || {};
                    const label = info.fullModel
                      ? info.fullModel.replace(/\([A-Z]\d{4,5}\)/g,'').replace(/\[[^\]]*\]/g,'').trim()
                      : r.imei;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <span>📱</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)' }}>{r.imei}{info.storage ? ` · ${info.storage}` : ''}{info.color ? ` · ${info.color}` : ''}</div>
                        </div>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(48,209,88,0.15)', color: '#30D158', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={addBatchStock}>
                  <div className="form-group">
                    <label className="form-label">Asignar a</label>
                    <select className="form-select" value={form.owner_org_id || CORP_ID} onChange={e => setForm({ ...form, owner_org_id: e.target.value })}>
                      {ALL_ORGS.map(o => <option key={o.id} value={o.id}>{o.ico} {o.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Producto (opcional — se detecta automáticamente)</label>
                    <select className="form-select" value={form.batch_product_id || ''} onChange={e => setForm({ ...form, batch_product_id: e.target.value })}>
                      <option value="">🤖 Detectar automáticamente</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio de venta S/ (se aplica a todos)</label>
                    <input className="form-input" type="number" placeholder="0.00" step="0.01"
                      value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emoji</label>
                    <input className="form-input" placeholder="📱" value={form.emoji || '📱'}
                      onChange={e => setForm({ ...form, emoji: e.target.value })} style={{ fontSize: 24 }} />
                  </div>

                  <div style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#30D158', fontWeight: 600 }}>
                    ✅ Se registrarán {batchResults.filter(r => r.status === 'success').length} equipos con la info de cada IMEI check.
                  </div>

                  <button className="btn btn-primary" type="submit" style={{ background: 'linear-gradient(135deg,#30D158,#34C759)' }}>
                    📦 Registrar {batchResults.filter(r => r.status === 'success').length} equipos
                  </button>
                </form>
              </>
            )}

            {/* ── MODAL: Recargar Tokens IMEI ── */}
            {modal === 'recharge-tokens' && (
              <>
                <div className="modal-title">💳 Recargar Tokens</div>

                {/* Precio */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 14, background: 'rgba(255,159,10,0.1)', borderRadius: 10, padding: '8px 14px' }}>
                  <span style={{ fontSize: 13, color: '#FF9F0A', fontWeight: 800 }}>S/1.00 = 1 token</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· 1 token = 1 consulta IMEI completa</span>
                </div>

                <form onSubmit={requestRecharge}>
                  {/* Selector de método */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { id: 'yape', label: '💜 Yape', color: '#9B59B6' },
                      { id: 'transferencia', label: '🏦 Transferencia', color: '#0A84FF' },
                    ].map(m => (
                      <button key={m.id} type="button"
                        onClick={() => setForm({ ...form, recharge_method: m.id })}
                        style={{
                          padding: '12px 8px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                          border: form.recharge_method === m.id ? `2px solid ${m.color}` : '2px solid transparent',
                          background: form.recharge_method === m.id ? `${m.color}22` : 'var(--surface)',
                          color: form.recharge_method === m.id ? m.color : 'var(--text-muted)',
                          transition: 'all 0.15s',
                        }}>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* DATOS DE PAGO — Yape */}
                  {form.recharge_method === 'yape' && (
                    <div style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.25)', borderRadius: 14, padding: '14px', marginBottom: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9B59B6', textTransform: 'uppercase', marginBottom: 10 }}>Escanea el QR con Yape</div>
                      <img src="/yape-qr.png" alt="Yape QR" onError={e => { e.target.style.display='none'; }}
                        style={{ width: 160, height: 160, borderRadius: 14, objectFit: 'contain', background: '#fff', padding: 6 }} />
                      <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>Phillip Mendoza Gonzales</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Yape al número vinculado</div>
                    </div>
                  )}

                  {/* DATOS DE PAGO — Transferencia */}
                  {form.recharge_method === 'transferencia' && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase', marginBottom: 8 }}>Cuentas en Soles — Phillip Mendoza Gonzales</div>
                      {[
                        { banco: 'BCP', color: '#003087', bg: '#E8F0FE', cta: '19172716515023', cci: '00219117271651502353' },
                        { banco: 'BBVA', color: '#004A97', bg: '#E3EDF7', cta: '0011-0482-0200339128', cci: '011-814-000241193514-17' },
                        { banco: 'Scotiabank', color: '#CC0000', bg: '#FFF0F0', cta: '8983463567141', cci: '003-898-013463567141-42' },
                      ].map(b => (
                        <div key={b.banco} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px', marginBottom: 6, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: b.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, flexShrink: 0, textAlign: 'center', padding: 2 }}>
                            {b.banco}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{b.cta}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CCI: {b.cci}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Monto */}
                  <div className="form-group">
                    <label className="form-label">Monto depositado (S/)</label>
                    <input className="form-input" type="number" required min="1" step="1" placeholder="100"
                      value={form.recharge_soles || ''}
                      onChange={e => setForm({ ...form, recharge_soles: e.target.value })}
                      style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', letterSpacing: 1 }} />
                    {parseFloat(form.recharge_soles) > 0 && (
                      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 13, fontWeight: 700, color: '#FF9F0A' }}>
                        = {Math.floor(parseFloat(form.recharge_soles))} tokens 🪙
                      </div>
                    )}
                  </div>

                  {/* Screenshot */}
                  <div className="form-group">
                    <label className="form-label">📸 Comprobante de pago</label>
                    <input type="file" accept="image/*" onChange={e => setRechargeFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="recharge-file-input" />
                    <label htmlFor="recharge-file-input" style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '16px', borderRadius: 12, border: '2px dashed var(--border)', cursor: 'pointer',
                      background: rechargeFile ? 'rgba(48,209,88,0.06)' : 'transparent', minHeight: 60,
                    }}>
                      {rechargeFile ? (
                        <>
                          <span style={{ fontSize: 24 }}>✅</span>
                          <span style={{ color: '#30D158', fontWeight: 700, fontSize: 12 }}>{rechargeFile.name}</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: 24 }}>📷</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Subir comprobante (screenshot del pago)</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Notas */}
                  <div className="form-group">
                    <label className="form-label">Referencia / Notas</label>
                    <input className="form-input" placeholder="Nombre del titular, operación #..." value={form.recharge_notes || ''} onChange={e => setForm({ ...form, recharge_notes: e.target.value })} />
                  </div>

                  <button className="btn btn-primary" type="submit"
                    style={{ background: 'linear-gradient(135deg,#FF9F0A,#FF6B00)', fontWeight: 800, fontSize: 15, padding: '14px', borderRadius: 14 }}>
                    📤 Enviar solicitud
                  </button>
                </form>
              </>
            )}

            {/* ── MODAL: Registrar Equipo desde IMEI Check ── */}
            {modal === 'imei-to-stock' && (
              <>
                <div className="modal-title">📲 Registrar Equipo</div>

                {/* Preview del dispositivo detectado */}
                {(form.deviceName || form.modelNumber || form.color || form.storage) && (
                  <div style={{
                    background: 'var(--card2, rgba(255,255,255,0.06))',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 16,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      📡 Datos del check IMEI
                    </div>
                    {form.deviceName && (
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {form.emoji || '📱'} {form.deviceName}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {form.modelNumber && (
                        <span style={{ background: '#0A84FF22', color: '#0A84FF', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                          {form.modelNumber}
                        </span>
                      )}
                      {form.storage && (
                        <span style={{ background: '#FF9F0A22', color: '#FF9F0A', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                          {form.storage}
                        </span>
                      )}
                      {form.color && (
                        <span style={{ background: '#BF5AF222', color: '#BF5AF2', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                          {form.color}
                        </span>
                      )}
                      {form.imei && (
                        <span style={{ background: 'var(--border)', color: 'var(--text3)', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>
                          IMEI: {form.imei}
                        </span>
                      )}
                    </div>
                    {form.imei_check_id && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                        🔗 Vinculado al check #{form.imei_check_id.substring(0, 8)}…
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={addStock}>
                  {/* Asignar a */}
                  <div className="form-group">
                    <label className="form-label">Asignar a</label>
                    <select className="form-select" value={form.owner_org_id || CORP_ID} onChange={e => setForm({ ...form, owner_org_id: e.target.value })}>
                      <option value={CORP_ID}>🏢 Corp Tech (Almacén Central)</option>
                      {STORES.map(s => <option key={s.id} value={s.id}>{s.ico} {s.name}</option>)}
                    </select>
                  </div>

                  {/* Seleccionar producto del catálogo */}
                  <div className="form-group">
                    <label className="form-label">Producto del catálogo</label>
                    <select
                      className="form-select"
                      required
                      value={form.product_id || ''}
                      onChange={e => {
                        const prod = products.find(p => p.id === e.target.value);
                        setForm({ ...form, product_id: e.target.value, emoji: prod?.emoji || form.emoji || '📱' });
                      }}
                    >
                      <option value="">Seleccionar producto…</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.emoji || '📦'} {p.name}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Si no existe, créalo primero en el catálogo
                    </div>
                  </div>

                  {/* IMEI (pre-llenado) */}
                  <div className="form-group">
                    <label className="form-label">IMEI</label>
                    <input
                      className="form-input"
                      placeholder="352999111111111"
                      value={form.imei || ''}
                      onChange={e => setForm({ ...form, imei: e.target.value })}
                    />
                  </div>

                  {/* Precio */}
                  <div className="form-group">
                    <label className="form-label">Precio de venta (S/)</label>
                    <input
                      className="form-input"
                      type="number"
                      required
                      placeholder="0.00"
                      value={form.sale_price || ''}
                      onChange={e => setForm({ ...form, sale_price: e.target.value })}
                    />
                  </div>

                  {/* Campos del check — editable por si viene mal */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '8px 0 10px' }}>
                    Detalles del equipo (editables)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Modelo #</label>
                      <input
                        className="form-input"
                        placeholder="A3526"
                        value={form.model_number || ''}
                        onChange={e => setForm({ ...form, model_number: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Almacenamiento</label>
                      <input
                        className="form-input"
                        placeholder="256GB"
                        value={form.storage || ''}
                        onChange={e => setForm({ ...form, storage_info: e.target.value, storage: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="form-label">Color</label>
                    <input
                      className="form-input"
                      placeholder="Natural Titanium"
                      value={form.color || ''}
                      onChange={e => setForm({ ...form, color_info: e.target.value, color: e.target.value })}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit" style={{ marginTop: 4 }}>
                    📦 Guardar en stock
                  </button>
                </form>
              </>
            )}

            <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => { setModal(null); setProdSearch(''); setStockCatFilter('all'); }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
