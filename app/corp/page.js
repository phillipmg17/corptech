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
  const [batches,     setBatches]     = useState([]);
  const [usdRate,     setUsdRate]     = useState('');
  const [loadingRate, setLoadingRate] = useState(false);

  /* ── FINANZAS ── */
  const [finFx,       setFinFx]       = useState(null);
  const [finData,     setFinData]     = useState({ stockVal: 0, stockValUSD: 0, inTransitVal: 0, stockCount: 0, transitCount: 0, byStore: [] });
  const [cashAccounts,setCashAccounts]= useState([]);
  const [cashTotals,  setCashTotals]  = useState({ banks_pen: 0, platforms_pen: 0, cash_pen: 0, total_pen: 0, total_usd: 0 });
  const [finLoading,  setFinLoading]  = useState(false);

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
  const [imeiConfig,   setImeiConfig]   = useState(null); // {tokens_used, tokens_limit, active, services, provider_name}

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
    const r = roleRow?.role;
    if (r !== 'corp' && r !== 'superadmin' && r !== 'admin_corp') { router.replace('/dashboard'); return; }
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

  /* ── IMEI CHECKER ── */
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
        body: JSON.stringify({ imei: clean, service_id: imeiService, user_id: me?.id, org_id: CORP_ID }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || 'Error al consultar la API', 'err');
        setImeiResult({ error: data.error });
      } else {
        setImeiResult(data.result);
        if (data.tokens_used != null) setImeiConfig(c => c ? { ...c, used: data.tokens_used } : c);
        showToast('✅ Consulta exitosa');
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
    const { data } = await supabase
      .from('api_settings')
      .select('tokens_used, tokens_limit, is_active, api_key, provider_name, allowed_services')
      .eq('org_id', CORP_ID)
      .eq('service', 'imei')
      .single();
    if (data) {
      const cfg = {
        used:          data.tokens_used      || 0,
        limit:         data.tokens_limit     || 0,
        active:        data.is_active,
        hasKey:        !!data.api_key,
        provider_name: data.provider_name    || 'IMEI API',
        services:      data.allowed_services || [],
      };
      setImeiConfig(cfg);
      // auto-seleccionar primer servicio si no hay uno elegido
      if (!imeiService && cfg.services.length > 0) setImeiService(cfg.services[0].id);
    } else {
      setImeiConfig(null);
    }
  }

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
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

              {/* TC + botón nuevo lote */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  type="number" step="0.001"
                  placeholder="Tipo de cambio USD→PEN"
                  value={usdRate}
                  onChange={e => setUsdRate(e.target.value)}
                />
                <button className="btn btn-outline btn-sm" onClick={fetchUsdRate} disabled={loadingRate}>
                  {loadingRate ? '…' : '🔄 TC'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setModal('add-batch');
                  setForm({ imp_igv: '18', imp_margen: '30', imp_unidades: '1', imp_arancel: '0' });
                }}>
                  + Lote
                </button>
              </div>
              {usdRate && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 14 }}>✓ TC: S/{usdRate} por $1 USD</div>}

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
          <div style={{ padding: '16px' }}>

            {/* ── HERO: Valorización total ── */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(10,132,255,0.12),rgba(94,92,230,0.12))',
              border: '1px solid rgba(10,132,255,0.22)', borderRadius: 20,
              padding: 24, marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
                📊 Valorización Total del Inventario
              </div>
              {finLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Calculando…</div>
              ) : (
                <>
                  <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                    S/ {finData.stockVal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 4, marginBottom: 20 }}>
                    ≈ ${finData.stockValUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD
                    {finFx && <span style={{ fontSize: 11, marginLeft: 8, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6 }}>TC S/{finFx.toFixed(3)}</span>}
                  </div>

                  {/* Sub-cards: Lima vs Tránsito */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#30D158', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>📦 EN LIMA</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{finData.stockCount}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>unidades disponibles</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#30D158' }}>
                        S/{finData.stockVal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#FF9F0A', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>✈️ EN TRÁNSITO</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{finData.transitCount}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>unidades por llegar</div>
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
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin stock registrado</div>
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
                {/* Mini KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { lbl: 'Bancos',      val: cashTotals.banks_pen,     color: '#0A84FF' },
                    { lbl: 'Plataformas', val: cashTotals.platforms_pen, color: '#A78BFA' },
                    { lbl: 'Efectivo',    val: cashTotals.cash_pen,      color: '#30D158' },
                  ].map(k => (
                    <div key={k.lbl} style={{
                      background: `${k.color}14`, border: `1px solid ${k.color}30`,
                      borderRadius: 14, padding: '10px 10px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 9, color: k.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k.lbl}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>S/{k.val.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</div>
                    </div>
                  ))}
                </div>

                {/* Total hero */}
                <div style={{
                  background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                  borderRadius: 16, padding: '16px 20px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOTAL DISPONIBLE EN CAJA</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                      S/{cashTotals.total_pen.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                  {finFx && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>≈ USD</div>
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
                        style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
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
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
                cursor: finLoading ? 'not-allowed' : 'pointer', marginBottom: 40,
              }}
            >
              {finLoading ? '⏳ Calculando…' : '🔄 Actualizar datos financieros'}
            </button>
          </div>
        )}

        {/* ── TAB: IMEI CHECKER ── */}
        {tab === 'imei' && (
          <div style={{ padding: '16px' }}>
            <div className="section-title">🔍 IMEI Checker</div>

            {/* Estado de tokens */}
            {imeiConfig === null ? (
              <div style={{
                background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.3)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              }}>
                <div style={{ fontWeight: 700, color: '#FF453A', marginBottom: 4 }}>⚠️ Sin acceso habilitado</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Pídele al SuperAdmin que configure tu acceso IMEI en su panel (🔑 APIs).
                </div>
              </div>
            ) : (
              <div style={{
                background: imeiConfig.active ? 'rgba(48,209,88,0.08)' : 'rgba(255,69,58,0.08)',
                border: `1px solid ${imeiConfig.active ? 'rgba(48,209,88,0.25)' : 'rgba(255,69,58,0.25)'}`,
                borderRadius: 14, padding: '12px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: imeiConfig.active ? '#30D158' : '#FF453A' }}>
                    {imeiConfig.active ? `✅ ${imeiConfig.provider_name} activo` : `🔴 ${imeiConfig.provider_name} desactivado`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Tokens usados: {imeiConfig.used} / {imeiConfig.limit}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: imeiConfig.used >= imeiConfig.limit ? '#FF453A' : '#30D158' }}>
                    {imeiConfig.limit - imeiConfig.used}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    🪙 tokens
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de consulta */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Consultar IMEI</div>

              <div className="form-group">
                <label className="form-label">📱 IMEI (15 dígitos)</label>
                <input
                  className="form-input"
                  placeholder="352999111111111"
                  value={imeiInput}
                  onChange={e => setImeiInput(e.target.value.replace(/\D/g, '').substring(0, 16))}
                  maxLength={16}
                  inputMode="numeric"
                  style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 2, fontWeight: 700 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {imeiInput.length}/15 dígitos{imeiInput.length >= 14 && imeiInput.length <= 16 ? ' ✅' : ''}
                </div>
              </div>

              {/* Servicios habilitados por superadmin */}
              {imeiConfig && imeiConfig.services.length > 0 && (
                <div className="form-group">
                  <label className="form-label">🛠 Tipo de consulta</label>
                  <select className="form-select" value={imeiService} onChange={e => setImeiService(e.target.value)}>
                    {imeiConfig.services.map(s => (
                      <option key={s.id} value={s.id}>{s.id} — {s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {imeiConfig && imeiConfig.services.length === 0 && (
                <div style={{ fontSize: 12, color: '#FF9F0A', marginBottom: 12 }}>
                  ⚠️ El SuperAdmin no ha configurado servicios aún. Pídele que los agregue en 🔑 APIs.
                </div>
              )}

              <button
                onClick={checkImei}
                disabled={imeiLoading || !imeiConfig?.active || (imeiConfig?.limit - imeiConfig?.used) <= 0}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: (imeiLoading || !imeiConfig?.active)
                    ? 'var(--surface)'
                    : 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: (imeiLoading || !imeiConfig?.active) ? 'not-allowed' : 'pointer',
                  boxShadow: (imeiLoading || !imeiConfig?.active) ? 'none' : '0 4px 20px rgba(10,132,255,0.35)',
                }}>
                {imeiLoading ? '⏳ Consultando...' : '🔍 Verificar IMEI (-1 🪙)'}
              </button>
            </div>

            {/* Resultado */}
            {imeiResult && (() => {
              const isErr = !!imeiResult.error;

              // Parsear el string "Key: Value\nKey: Value\n..." de Sickw
              function parseResultLines(txt) {
                if (!txt || typeof txt !== 'string') return [];
                return txt.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
                  const idx = line.indexOf(':');
                  if (idx > 0) return { k: line.substring(0, idx).trim(), v: line.substring(idx + 1).trim() };
                  return { k: '', v: line };
                });
              }

              // Colorear valores clave
              function valColor(k, v) {
                const kl = k.toLowerCase(); const vl = (v || '').toLowerCase();
                if (kl.includes('blacklist') || kl.includes('lost') || kl.includes('stolen')) {
                  return vl.includes('clean') || vl.includes('no') ? '#30D158' : '#FF453A';
                }
                if (kl.includes('find my') || kl.includes('fmi') || kl.includes('activation lock')) {
                  return vl === 'off' || vl === 'no' ? '#30D158' : vl === 'on' || vl === 'yes' ? '#FF453A' : 'var(--text)';
                }
                if (kl.includes('status') || kl.includes('state')) {
                  return vl.includes('activ') ? '#30D158' : vl.includes('block') || vl.includes('lost') ? '#FF453A' : 'var(--text)';
                }
                return 'var(--text)';
              }

              const lines = parseResultLines(imeiResult.result);

              return (
                <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {isErr ? '❌ Error' : '✅ Resultado'}
                    </div>
                    {!isErr && imeiResult.service && (
                      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(10,132,255,0.15)', color: '#4DA8FF' }}>
                        {imeiResult.service}
                      </span>
                    )}
                  </div>

                  {isErr ? (
                    <div style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#FF6B6B', lineHeight: 1.6 }}>
                      {imeiResult.error}
                    </div>
                  ) : lines.length > 0 ? (
                    /* Tabla key-value parseada */
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {lines.map((row, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          padding: '9px 12px',
                          background: i % 2 === 0 ? 'var(--surface)' : 'transparent',
                        }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, minWidth: 110, paddingRight: 8 }}>
                            {row.k || '—'}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 13, textAlign: 'right', color: valColor(row.k, row.v), wordBreak: 'break-word', maxWidth: '60%' }}>
                            {row.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback: raw text */
                    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                      {JSON.stringify(imeiResult, null, 2)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Historial */}
            {imeiHistory.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text-muted)' }}>
                  📋 Últimas consultas
                </div>
                {imeiHistory.map(h => (
                  <div key={h.id} className="card" style={{ padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                          {h.imei}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {h.service_name} · {new Date(h.created_at).toLocaleDateString('es-PE')} {new Date(h.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                        background: h.status === 'success' ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)',
                        color: h.status === 'success' ? '#30D158' : '#FF453A',
                      }}>
                        {h.status === 'success' ? '✅' : '❌'}
                      </span>
                    </div>
                    {/* Snippet del resultado — primeras 3 líneas */}
                    {h.result?.result && typeof h.result.result === 'string' && (
                      <div style={{ marginTop: 8 }}>
                        {h.result.result.split('\n').slice(0, 3).filter(Boolean).map((line, li) => {
                          const idx = line.indexOf(':');
                          const k = idx > 0 ? line.substring(0, idx).trim() : '';
                          const v = idx > 0 ? line.substring(idx + 1).trim() : line;
                          return (
                            <div key={li} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                              <span style={{ fontWeight: 600 }}>{v}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
          { id: 'global',        ico: '📦', lbl: 'Stock'        },
          { id: 'finanzas',      ico: '💰', lbl: 'Finanzas'     },
          { id: 'liquidaciones', ico: '💳', lbl: 'Liquidaciones' },
          { id: 'almacenes',   ico: '🏭', lbl: 'Almacenes'  },
          { id: 'traslados',   ico: '🔄', lbl: 'Traslados'  },
          { id: 'importacion', ico: '📥', lbl: 'Importación' },
          { id: 'imei',        ico: '🔍', lbl: 'IMEI'       },
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

            <button className="btn btn-outline btn-block" style={{ marginTop: 12 }} onClick={() => setModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
