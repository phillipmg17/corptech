import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente con service_role — solo corre en el servidor, nunca en el browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Sickw ──────────────────────────────────────────────────────────────────────
// Endpoint: https://sickw.com/api.php?format=json&key=KEY&imei=IMEI&service=SVC
// Respuesta OK : { status:"1", credits:"N", result:"Key: Value\n..." }
// Error        : { status:"0", result:"msg" }  o HTML cuando la key es inválida
async function callSickw(cfg, imei, svcId) {
  const endpoint = cfg.api_endpoint || 'https://sickw.com/api.php';
  const url = `${endpoint}?format=json&key=${cfg.api_key}&imei=${encodeURIComponent(imei)}&service=${svcId}`;
  try {
    const res     = await fetch(url, { cache: 'no-store' });
    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')) {
      return {
        ok: false,
        error: 'Sickw devolvió HTML — verifica: (1) API key correcta, (2) endpoint https://sickw.com/api.php, (3) ID de servicio válido en tu plan.',
        raw: rawText,
      };
    }

    let data;
    try { data = JSON.parse(rawText); } catch { data = { result: rawText }; }

    if (data?.status && data.status !== '1' && data.status !== 1) {
      return { ok: false, error: data?.result || data?.message || `Error Sickw (status ${data.status})`, raw: rawText, data };
    }

    return { ok: true, data, raw: rawText };
  } catch (e) {
    return { ok: false, error: 'No se pudo conectar con Sickw: ' + e.message, raw: '' };
  }
}

// ── IMEICheck (DHRU Bulk API v6.1) ─────────────────────────────────────────────
// Endpoint: https://alpha.imeicheck.com/api/php-api/create?key=KEY&service=SVC&imei=IMEI
// Respuesta OK : { orderId, status:"success", imei, price, result:"texto...", object:{...} }
// Error        : { status:"failed"|"error", result:"mensaje" }
async function callImeiCheck(cfg, imei, svcId) {
  const endpoint = cfg.api_endpoint || 'https://alpha.imeicheck.com/api/php-api/create';
  const url = `${endpoint}?key=${cfg.api_key}&service=${svcId}&imei=${encodeURIComponent(imei)}`;
  try {
    const res     = await fetch(url, { cache: 'no-store' });
    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')) {
      return { ok: false, error: 'IMEICheck devolvió HTML — verifica la API key y el endpoint.', raw: rawText };
    }

    let data;
    try { data = JSON.parse(rawText); } catch { data = { result: rawText }; }

    if (data?.status === 'error' || data?.status === 'failed') {
      const raw = data?.result || data?.message || `Error IMEICheck: ${data.status}`;
      const friendly = raw.includes('Invalid ApiKey')  ? 'API key inválida — verifica en tu cuenta IMEICheck.'
        : raw.includes('Wrong IP')          ? 'IP no autorizada — ve a IMEICheck > Linked IP y habilita tu IP.'
        : raw.includes('Insufficient')      ? 'Créditos insuficientes en tu cuenta IMEICheck.'
        : raw;
      return { ok: false, error: friendly, raw: rawText, data };
    }

    return { ok: true, data, raw: rawText };
  } catch (e) {
    return { ok: false, error: 'No se pudo conectar con IMEICheck: ' + e.message, raw: '' };
  }
}

// ── Handler principal ──────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { imei, service_id, user_id, org_id, provider } = await req.json();

    if (!imei || !org_id) {
      return NextResponse.json({ error: 'Faltan datos: IMEI y org_id son requeridos.' }, { status: 400 });
    }

    // 1. Cargar todos los configs activos para esta org (todos los proveedores)
    const { data: allCfgs, error: cfgErr } = await supabaseAdmin
      .from('api_settings')
      .select('*')
      .eq('org_id', org_id)
      .eq('service', 'imei')
      .eq('is_active', true);

    if (cfgErr || !allCfgs || allCfgs.length === 0) {
      return NextResponse.json({ error: 'Sin API configurada. Pide al SuperAdmin que habilite tu acceso IMEI.' }, { status: 403 });
    }

    // 2. Filtrar los que tienen key y tienen tokens disponibles
    const available = allCfgs.filter(c =>
      c.api_key && (c.tokens_used || 0) < (c.tokens_limit || 100)
    );

    if (available.length === 0) {
      return NextResponse.json({ error: 'Sin tokens disponibles en ningún proveedor. Contacta al SuperAdmin.' }, { status: 402 });
    }

    // 3. Elegir proveedor
    let cfg;
    if (provider && provider !== 'auto') {
      // Usuario eligió proveedor específico
      cfg = available.find(c => (c.provider || 'sickw') === provider);
      if (!cfg) return NextResponse.json({ error: `Proveedor "${provider}" no disponible o sin tokens.` }, { status: 403 });
    } else {
      // Auto: elegir el más barato para el servicio solicitado
      let cheapest = null;
      let cheapestPrice = Infinity;
      for (const c of available) {
        const svcInCfg = (c.allowed_services || []).find(
          s => s.id === service_id || s.id === String(service_id)
        );
        if (!service_id || svcInCfg) {
          const price = parseFloat(svcInCfg?.price ?? '999');
          if (price < cheapestPrice) { cheapestPrice = price; cheapest = c; }
        }
      }
      cfg = cheapest || available[0];
    }

    const providerKey = cfg.provider || 'sickw';

    // 4. Validar que el servicio esté en la lista permitida de este proveedor
    const allowed  = cfg.allowed_services || [];
    const svcId    = service_id || (allowed[0]?.id) || '1';
    const svcMatch = allowed.find(s => s.id === svcId || s.id === String(svcId));

    if (allowed.length > 0 && !svcMatch) {
      return NextResponse.json({ error: `Servicio "${svcId}" no habilitado en ${providerKey}. El SuperAdmin debe activarlo.` }, { status: 403 });
    }
    const svcLabel = svcMatch?.label || `Servicio ${svcId}`;

    // 5. Llamar a la API del proveedor
    let apiResult;
    if (providerKey === 'imeicheck') {
      apiResult = await callImeiCheck(cfg, imei, svcId);
    } else {
      apiResult = await callSickw(cfg, imei, svcId);
    }

    const status   = apiResult.ok ? 'success' : 'error';
    const errorMsg = apiResult.ok ? null : apiResult.error;

    // 6. Guardar historial
    const { data: row } = await supabaseAdmin.from('imei_checks').insert({
      org_id,
      checked_by:   user_id || null,
      imei,
      service_id:   svcId,
      service_name: `[${providerKey === 'imeicheck' ? 'IMEICHECK' : 'SICKW'}] ${svcLabel}`,
      result:       apiResult.data || null,
      raw_response: (apiResult.raw || '').substring(0, 2000),
      status,
      error_msg:    errorMsg,
    }).select('id').single();

    // 7. Sumar token usado al proveedor específico (por ID de row)
    await supabaseAdmin.from('api_settings').update({
      tokens_used: (cfg.tokens_used || 0) + 1,
      updated_at:  new Date().toISOString(),
    }).eq('id', cfg.id);

    if (!apiResult.ok) {
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({
      ok:           true,
      result:       apiResult.data,
      provider:     providerKey,
      tokens_used:  (cfg.tokens_used || 0) + 1,
      tokens_limit: cfg.tokens_limit,
      check_id:     row?.id,
    });

  } catch (err) {
    console.error('[check-imei]', err);
    return NextResponse.json({ error: 'Error interno: ' + err.message }, { status: 500 });
  }
}
