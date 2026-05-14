'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CORP_ID = '00000000-0000-0000-0000-000000000001';

const STORE_DEFAULTS = {
  '00000000-0000-0000-0000-000000000002': { primary: '#007AFF', secondary: '#0A84FF', bg: '#000000', text: '#FFFFFF', name: 'Futurteck' },
  '00000000-0000-0000-0000-000000000003': { primary: '#BF5AF2', secondary: '#9B59B6', bg: '#0D0010', text: '#FFFFFF', name: 'Innovatech' },
  '00000000-0000-0000-0000-000000000004': { primary: '#30D158', secondary: '#25A244', bg: '#000A00', text: '#FFFFFF', name: 'WeTech Peru' },
};

const FONTS = ['Urbanist', 'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Raleway'];

const STEPS = [
  { id: 1, ico: '🏪', label: 'Identidad'  },
  { id: 2, ico: '🎨', label: 'Diseño'     },
  { id: 3, ico: '🏢', label: 'Negocio'    },
  { id: 4, ico: '📱', label: 'Contacto'   },
  { id: 5, ico: '💳', label: 'Pagos'      },
];

export default function SetupPage() {
  const router = useRouter();
  const [me,      setMe]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const def = STORE_DEFAULTS['00000000-0000-0000-0000-000000000002'];

  const [form, setForm] = useState({
    store_name:        '',
    store_slogan:      '',
    store_description: '',
    logo_url:          '',
    banner_url:        '',
    color_primary:     def.primary,
    color_secondary:   def.secondary,
    color_bg:          def.bg,
    color_text:        def.text,
    font_family:       'Urbanist',
    ruc:               '',
    razon_social:      '',
    phone:             '',
    address:           '',
    instagram_url:     '',
    facebook_url:      '',
    whatsapp_phone:    '',
    izipay_key:        '',
    izipay_secret:     '',
    paypal_client_id:  '',
    efact_token:       '',
    efact_ruc:         '',
  });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/ingresar/corp'); return; }
    const uid = session.user.id;
    const { data: roleRow } = await supabase.from('user_roles').select('role, org_id').eq('user_id', uid).single();
    const r = roleRow?.role;
    if (!['store_manager', 'corp', 'superadmin', 'admin_corp'].includes(r)) {
      router.replace('/dashboard'); return;
    }
    const { data: prof } = await supabase.from('users').select('full_name, org_id').eq('id', uid).single();
    const orgId = prof?.org_id || roleRow?.org_id;
    setMe({ id: uid, name: prof?.full_name, role: r, org_id: orgId });

    // Cargar settings existentes si hay
    const { data: existing } = await supabase.from('org_settings').select('*').eq('org_id', orgId).single();
    if (existing) {
      setForm(f => ({ ...f, ...existing }));
      // Si ya completó onboarding, mandar al store panel
      if (existing.onboarding_done) { router.replace('/store'); return; }
    } else {
      // Aplicar defaults según tienda
      const d = STORE_DEFAULTS[orgId];
      if (d) setForm(f => ({ ...f, color_primary: d.primary, color_secondary: d.secondary, color_bg: d.bg, color_text: d.text, store_name: d.name }));
    }
    setLoading(false);
  }

  function f(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function saveAndFinish() {
    setSaving(true);
    const { error } = await supabase.from('org_settings').upsert({
      org_id: me.org_id,
      ...form,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id' });

    if (error) { showToast('Error: ' + error.message, 'err'); setSaving(false); return; }
    showToast('¡Tienda configurada! 🎉');
    setTimeout(() => router.replace('/store'), 1500);
  }

  async function saveStep() {
    if (!me) return;
    await supabase.from('org_settings').upsert({
      org_id: me.org_id,
      ...form,
      onboarding_done: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id' });
  }

  function next() {
    saveStep();
    if (step < 5) setStep(s => s + 1);
  }
  function back() { if (step > 1) setStep(s => s - 1); }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  const preview = { primary: form.color_primary, bg: form.color_bg, text: form.color_text };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Urbanist, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>⚙️ Configura tu tienda</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Esta información personaliza tu e-commerce público</div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: toast.type === 'err' ? '#FF3B30' : '#30D158', color: '#fff', padding: '10px 20px',
          borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '20px 20px 0', overflowX: 'auto' }}>
        {STEPS.map(s => (
          <div key={s.id} onClick={() => setStep(s.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
              opacity: step === s.id ? 1 : 0.4, transition: 'opacity .2s', minWidth: 56 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              background: step === s.id ? form.color_primary : 'rgba(255,255,255,0.1)',
              border: step > s.id ? `2px solid ${form.color_primary}` : '2px solid transparent' }}>
              {step > s.id ? '✓' : s.ico}
            </div>
            <div style={{ fontSize: 10, fontWeight: step === s.id ? 700 : 400 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ margin: '16px 20px 0', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
        <div style={{ height: '100%', borderRadius: 99, background: form.color_primary, width: `${(step / 5) * 100}%`, transition: 'width .3s' }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 120px' }}>

        {/* ── STEP 1: IDENTIDAD ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🏪 Identidad de tu tienda</div>

            <div className="form-group">
              <label className="form-label">Nombre de la tienda *</label>
              <input className="form-input" placeholder="Ej: Futurteck" value={form.store_name} onChange={e => f('store_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Slogan</label>
              <input className="form-input" placeholder="Ej: La mejor tecnología al mejor precio" value={form.store_slogan} onChange={e => f('store_slogan', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción breve</label>
              <textarea className="form-input" rows={3} placeholder="Cuéntale a tus clientes qué vendes..." value={form.store_description} onChange={e => f('store_description', e.target.value)}
                style={{ resize: 'none' }} />
            </div>
            <div className="form-group">
              <label className="form-label">URL del Logo (imagen)</label>
              <input className="form-input" placeholder="https://..." value={form.logo_url} onChange={e => f('logo_url', e.target.value)} />
              {form.logo_url && <img src={form.logo_url} alt="logo" style={{ marginTop: 8, height: 60, objectFit: 'contain', borderRadius: 8 }} onError={e => e.target.style.display='none'} />}
            </div>
            <div className="form-group">
              <label className="form-label">URL del Banner (imagen ancha)</label>
              <input className="form-input" placeholder="https://..." value={form.banner_url} onChange={e => f('banner_url', e.target.value)} />
              {form.banner_url && <img src={form.banner_url} alt="banner" style={{ marginTop: 8, width: '100%', height: 100, objectFit: 'cover', borderRadius: 12 }} onError={e => e.target.style.display='none'} />}
            </div>
          </div>
        )}

        {/* ── STEP 2: DISEÑO ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🎨 Diseño y colores</div>

            {/* Preview card */}
            <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ background: form.color_bg, padding: 20 }}>
                <div style={{ color: form.color_text, fontWeight: 800, fontSize: 18, fontFamily: form.font_family }}>{form.store_name || 'Tu Tienda'}</div>
                <div style={{ color: form.color_primary, fontSize: 13, marginTop: 4, fontFamily: form.font_family }}>{form.store_slogan || 'Tu slogan aquí'}</div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <div style={{ background: form.color_primary, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Ver productos</div>
                  <div style={{ background: 'transparent', color: form.color_primary, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid ${form.color_primary}` }}>Contactar</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color principal</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={form.color_primary} onChange={e => f('color_primary', e.target.value)}
                  style={{ width: 48, height: 48, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="form-input" value={form.color_primary} onChange={e => f('color_primary', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color de fondo</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={form.color_bg} onChange={e => f('color_bg', e.target.value)}
                  style={{ width: 48, height: 48, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="form-input" value={form.color_bg} onChange={e => f('color_bg', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color de texto</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={form.color_text} onChange={e => f('color_text', e.target.value)}
                  style={{ width: 48, height: 48, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="form-input" value={form.color_text} onChange={e => f('color_text', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tipografía</label>
              <select className="form-select" value={form.font_family} onChange={e => f('font_family', e.target.value)}>
                {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>

            {/* Paletas predefinidas */}
            <div className="form-label" style={{ marginBottom: 10 }}>Paletas rápidas</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { name: 'Noche Azul',   primary: '#007AFF', bg: '#000000', text: '#FFFFFF' },
                { name: 'Galaxia',      primary: '#BF5AF2', bg: '#0D0010', text: '#FFFFFF' },
                { name: 'Bosque',       primary: '#30D158', bg: '#000A00', text: '#FFFFFF' },
                { name: 'Fuego',        primary: '#FF3B30', bg: '#0A0000', text: '#FFFFFF' },
                { name: 'Dorado',       primary: '#FFD60A', bg: '#0A0800', text: '#FFFFFF' },
                { name: 'Blanco Limpio',primary: '#007AFF', bg: '#F2F2F7', text: '#1C1C1E' },
              ].map(p => (
                <button key={p.name} type="button"
                  onClick={() => { f('color_primary', p.primary); f('color_bg', p.bg); f('color_text', p.text); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: p.bg, color: p.text, border: `2px solid ${p.primary}`,
                    borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.primary, display: 'inline-block' }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: NEGOCIO ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🏢 Datos del negocio</div>
            <div className="form-group">
              <label className="form-label">RUC</label>
              <input className="form-input" placeholder="20XXXXXXXXX" maxLength={11} value={form.ruc} onChange={e => f('ruc', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Razón Social</label>
              <input className="form-input" placeholder="FUTURTECK S.A.C." value={form.razon_social} onChange={e => f('razon_social', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" placeholder="+51 999 999 999" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" placeholder="Av. Principal 123, Lima" value={form.address} onChange={e => f('address', e.target.value)} />
            </div>
          </div>
        )}

        {/* ── STEP 4: CONTACTO / REDES ── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>📱 Redes y contacto</div>
            <div className="form-group">
              <label className="form-label">WhatsApp (número con código de país)</label>
              <input className="form-input" placeholder="51999999999" value={form.whatsapp_phone} onChange={e => f('whatsapp_phone', e.target.value)} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Los clientes te escribirán por aquí al hacer un pedido</div>
            </div>
            <div className="form-group">
              <label className="form-label">Instagram</label>
              <input className="form-input" placeholder="https://instagram.com/tu_tienda" value={form.instagram_url} onChange={e => f('instagram_url', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Facebook</label>
              <input className="form-input" placeholder="https://facebook.com/tu_tienda" value={form.facebook_url} onChange={e => f('facebook_url', e.target.value)} />
            </div>
          </div>
        )}

        {/* ── STEP 5: PAGOS ── */}
        {step === 5 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>💳 Pasarelas de pago</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Opcional — puedes configurar esto después. Por ahora los pedidos llegarán por WhatsApp.</div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🇵🇪 Izipay</div>
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.izipay_key} onChange={e => f('izipay_key', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Secret Key</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.izipay_secret} onChange={e => f('izipay_secret', e.target.value)} />
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🌐 PayPal</div>
              <div className="form-group">
                <label className="form-label">Client ID</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.paypal_client_id} onChange={e => f('paypal_client_id', e.target.value)} />
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🧾 EFACT (Facturación electrónica)</div>
              <div className="form-group">
                <label className="form-label">RUC emisor</label>
                <input className="form-input" placeholder="20XXXXXXXXX" value={form.efact_ruc} onChange={e => f('efact_ruc', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Token API</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.efact_token} onChange={e => f('efact_token', e.target.value)} />
              </div>
            </div>

            <div style={{ background: `${form.color_primary}22`, border: `1px solid ${form.color_primary}44`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, color: form.color_primary, marginBottom: 6 }}>✅ Todo listo</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                Al finalizar, tu tienda <b style={{ color: '#fff' }}>{form.store_name || 'sin nombre'}</b> estará publicada y lista para recibir pedidos.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom buttons — fixed */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px',
        background: 'linear-gradient(to top, #000 60%, transparent)', display: 'flex', gap: 10 }}>
        {step > 1 && (
          <button onClick={back}
            style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            ← Atrás
          </button>
        )}
        {step < 5 ? (
          <button onClick={next}
            style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none',
              background: form.color_primary, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Siguiente →
          </button>
        ) : (
          <button onClick={saveAndFinish} disabled={saving}
            style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none',
              background: form.color_primary, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : '🚀 Publicar mi tienda'}
          </button>
        )}
      </div>
    </div>
  );
}
