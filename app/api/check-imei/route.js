import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente con service_role — solo corre en el servidor, nunca en el browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { imei, service_id, user_id, org_id } = await req.json();

    if (!imei || !org_id) {
      return NextResponse.json({ error: 'Faltan datos: IMEI y org_id son requeridos.' }, { status: 400 });
    }

    // 1. Leer configuración de API para esta org
    const { data: cfg, error: cfgErr } = await supabaseAdmin
      .from('api_settings')
      .select('api_key, api_endpoint, provider_name, tokens_limit, tokens_used, is_active, allowed_services')
      .eq('org_id', org_id)
      .eq('service', 'imei')
      .single();

    if (cfgErr || !cfg) {
      return NextResponse.json({ error: 'Sin API configurada. Pide al SuperAdmin que habilite tu acceso IMEI.' }, { status: 403 });
    }
    if (!cfg.is_active) {
      return NextResponse.json({ error: 'Tu acceso IMEI está desactivado. Contacta al SuperAdmin.' }, { status: 403 });
    }
    if (!cfg.api_key) {
      return NextResponse.json({ error: 'No hay API key configurada. El SuperAdmin debe ingresarla.' }, { status: 403 });
    }
    if (cfg.tokens_used >= cfg.tokens_limit) {
      return NextResponse.json({ error: `Sin tokens disponibles (${cfg.tokens_limit} usados). Pide más tokens al SuperAdmin.` }, { status: 402 });
    }

    // 2. Validar que el service_id esté en la lista permitida
    const allowed = cfg.allowed_services || [];
    const svcId   = service_id || (allowed[0]?.id) || '12';
    if (allowed.length > 0 && !allowed.find(s => s.id === svcId)) {
      return NextResponse.json({ error: `Servicio "${svcId}" no está habilitado. Pide al SuperAdmin que lo active.` }, { status: 403 });
    }
    const svcLabel = allowed.find(s => s.id === svcId)?.label || `Servicio ${svcId}`;

    // 3. Llamar a la API externa
    const endpoint = cfg.api_endpoint || 'https://sickw.com/api.php';
    const apiUrl   = `${endpoint}?format=json&key=${cfg.api_key}&imei=${encodeURIComponent(imei)}&service=${svcId}`;
    let apiData    = null;
    let rawResp    = '';
    let status     = 'success';
    let errorMsg   = null;

    try {
      const res = await fetch(apiUrl, { cache: 'no-store' });
      rawResp   = await res.text();

      // Detectar si Sickw devolvió HTML (API key inválida o endpoint incorrecto)
      const trimmed = rawResp.trim();
      if (trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')) {
        status   = 'error';
        errorMsg = 'La API devolvió HTML en lugar de datos. Revisa: (1) que la API key sea correcta, (2) que el endpoint sea exactamente https://sickw.com/api.php, (3) que el ID de servicio exista en tu plan.';
        apiData  = null;
      } else {
        try { apiData = JSON.parse(rawResp); } catch { apiData = { result: rawResp }; }
        // Si Sickw devuelve status != 1, marcarlo como error descriptivo
        if (apiData?.status && apiData.status !== '1' && apiData.status !== 1) {
          status   = 'error';
          errorMsg = apiData?.result || apiData?.message || `Error Sickw status: ${apiData.status}`;
        }
      }
    } catch (e) {
      status   = 'error';
      errorMsg = 'No se pudo conectar con la API: ' + e.message;
    }

    // 4. Guardar historial
    const { data: row } = await supabaseAdmin.from('imei_checks').insert({
      org_id,
      checked_by:   user_id || null,
      imei,
      service_id:   svcId,
      service_name: svcLabel,
      result:       apiData,
      raw_response: rawResp.substring(0, 2000),
      status,
      error_msg:    errorMsg,
    }).select('id').single();

    // 5. Sumar token usado
    await supabaseAdmin.from('api_settings').update({
      tokens_used: (cfg.tokens_used || 0) + 1,
      updated_at:  new Date().toISOString(),
    }).eq('org_id', org_id).eq('service', 'imei');

    if (status === 'error') {
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({
      ok:           true,
      result:       apiData,
      tokens_used:  (cfg.tokens_used || 0) + 1,
      tokens_limit: cfg.tokens_limit,
      check_id:     row?.id,
    });

  } catch (err) {
    console.error('[check-imei]', err);
    return NextResponse.json({ error: 'Error interno: ' + err.message }, { status: 500 });
  }
}
