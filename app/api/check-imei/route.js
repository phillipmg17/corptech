import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente Supabase con service_role (solo servidor — nunca llega al browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { imei, service_id, user_id, org_id } = body;

    if (!imei || !org_id) {
      return NextResponse.json({ error: 'IMEI y org_id son requeridos' }, { status: 400 });
    }

    // 1. Leer la API key de Sickw para esta org
    const { data: apiSetting, error: apiErr } = await supabaseAdmin
      .from('api_settings')
      .select('api_key, credits_limit, credits_used, is_active')
      .eq('org_id', org_id)
      .eq('service', 'sickw')
      .single();

    if (apiErr || !apiSetting) {
      return NextResponse.json({ error: 'No tienes Sickw configurado. Pide al SuperAdmin que habilite tu API key.' }, { status: 403 });
    }
    if (!apiSetting.is_active) {
      return NextResponse.json({ error: 'Tu acceso a Sickw está desactivado. Contacta al SuperAdmin.' }, { status: 403 });
    }
    if (apiSetting.credits_used >= apiSetting.credits_limit) {
      return NextResponse.json({ error: `Límite de créditos alcanzado (${apiSetting.credits_limit}). Pide más créditos al SuperAdmin.` }, { status: 402 });
    }

    const svc = service_id || '12'; // Default: Apple basic info

    // 2. Llamar a Sickw API
    const sickwUrl = `https://sickw.com/api.php?format=json&key=${apiSetting.api_key}&imei=${encodeURIComponent(imei)}&service=${svc}`;
    let sickwData = null;
    let rawResponse = '';
    let checkStatus = 'success';
    let errorMsg = null;

    try {
      const sickwRes = await fetch(sickwUrl, { cache: 'no-store' });
      rawResponse = await sickwRes.text();
      try { sickwData = JSON.parse(rawResponse); } catch { sickwData = { result: rawResponse }; }
    } catch (fetchErr) {
      checkStatus = 'error';
      errorMsg = 'No se pudo conectar con Sickw: ' + fetchErr.message;
    }

    // 3. Guardar en historial
    const { data: checkRow } = await supabaseAdmin.from('imei_checks').insert({
      org_id,
      checked_by:   user_id || null,
      imei,
      service_id:   svc,
      service_name: sickwData?.service || `Servicio ${svc}`,
      result:       sickwData,
      raw_response: rawResponse.substring(0, 2000),
      status:       checkStatus,
      error_msg:    errorMsg,
    }).select('id').single();

    // 4. Incrementar credits_used
    await supabaseAdmin.from('api_settings').update({
      credits_used: (apiSetting.credits_used || 0) + 1,
      updated_at:   new Date().toISOString(),
    }).eq('org_id', org_id).eq('service', 'sickw');

    if (checkStatus === 'error') {
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({
      ok:           true,
      result:       sickwData,
      credits_used: (apiSetting.credits_used || 0) + 1,
      credits_limit: apiSetting.credits_limit,
      check_id:     checkRow?.id,
    });

  } catch (err) {
    console.error('check-imei error:', err);
    return NextResponse.json({ error: 'Error interno: ' + err.message }, { status: 500 });
  }
}
