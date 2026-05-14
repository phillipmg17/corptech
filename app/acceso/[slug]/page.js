'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SLUG_MAP = {
  futurteck:  '00000000-0000-0000-0000-000000000002',
  innovatech: '00000000-0000-0000-0000-000000000003',
  wetech:     '00000000-0000-0000-0000-000000000004',
};
const SLUG_DEFAULTS = {
  futurteck:  { name: 'Futurteck',        primary: '#007AFF', emoji: '🔵', id: '00000000-0000-0000-0000-000000000002' },
  innovatech: { name: 'Innovatech Store',  primary: '#BF5AF2', emoji: '🟣', id: '00000000-0000-0000-0000-000000000003' },
  wetech:     { name: 'WeTech Peru',       primary: '#30D158', emoji: '🟢', id: '00000000-0000-0000-0000-000000000004' },
};

function hexAlpha(hex, a) {
  try {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return `rgba(128,128,128,${a})`; }
}

export default function AccesoSlugPage({ params }) {
  const slug   = params.slug?.toLowerCase();
  const def    = SLUG_DEFAULTS[slug] || { name: 'Tienda', primary: '#0A84FF', emoji: '🏪', id: null };
  const router = useRouter();

  const [checking,   setChecking]   = useState(true);
  const [store,      setStore]      = useState(null);
  const [tab,        setTab]        = useState('login');   // 'login' | 'register'
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  /* Campos login */
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);

  /* Campos registro */
  const [regName,   setRegName]   = useState('');
  const [regEmail,  setRegEmail]  = useState('');
  const [regPass,   setRegPass]   = useState('');
  const [regPhone,  setRegPhone]  = useState('');

  /* Recuperar contraseña */
  const [showForgot,  setShowForgot]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [isRecovery,  setIsRecovery]  = useState(false);

  const P = store?.color_primario || def.primary;

  /* ── Detectar tipo de redirect desde email (sin useSearchParams) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qp = new URLSearchParams(window.location.search);
    const type = qp.get('type');
    if (type === 'signup' || type === 'email_change') {
      setSuccess('✅ ¡Email confirmado! Ya puedes iniciar sesión.');
      setTab('login');
    }
    if (type === 'recovery') setIsRecovery(true);
  }, []);

  /* ── Cargar datos de tienda ── */
  useEffect(() => {
    const orgId = SLUG_MAP[slug];
    if (!orgId) return;
    supabase.from('tiendas_config')
      .select('org_id, store_name, logo_url, color_primario, whatsapp')
      .eq('org_id', orgId).maybeSingle()
      .then(({ data }) => setStore(data));
  }, [slug]);

  /* ── Redirect si ya hay sesión ── */
  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => { if (mounted) setChecking(false); }, 4000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      clearTimeout(fallback);
      if (!session) { setChecking(false); return; }
      router.replace(await getRedirectPath(session.user.id));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && mounted) {
        router.replace(await getRedirectPath(session.user.id));
      }
    });

    return () => { mounted = false; clearTimeout(fallback); subscription.unsubscribe(); };
  }, []);

  async function getRedirectPath(userId) {
    const { data } = await supabase
      .from('user_roles').select('role').eq('user_id', userId).limit(1).maybeSingle();
    const r = data?.role;
    if (!r || r === 'cliente') return `/cliente/${slug}`;
    // Si un trabajador entra por /acceso → redirigir a su panel
    if (r === 'superadmin') return '/superadmin';
    if (r === 'corp' || r === 'admin_corp') return '/corp';
    if (r === 'gerente' || r === 'store_manager' || r === 'store_admin') return '/store';
    return '/pos';
  }

  function clearAlerts() { setError(''); setSuccess(''); }

  /* ── OLVIDÉ MI CONTRASEÑA ── */
  async function doForgotPassword(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/acceso?type=recovery`,
    });
    if (err) setError('No se pudo enviar el correo. Verifica el email ingresado.');
    else {
      setSuccess('✅ Te enviamos un correo. Haz clic en el link para crear tu nueva contraseña.');
      setShowForgot(false);
    }
    setLoading(false);
  }

  /* ── CAMBIAR CONTRASEÑA ── */
  async function doChangePassword(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); setLoading(false); return; }
    const { error: err } = await supabase.auth.updateUser({ password: newPass });
    if (err) setError('No se pudo actualizar. El link puede haber expirado.');
    else { setSuccess('✅ ¡Contraseña actualizada! Ahora inicia sesión.'); setIsRecovery(false); setTab('login'); }
    setLoading(false);
  }

  /* ── LOGIN ── */
  async function doLogin(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError('Email o contraseña incorrectos.'); setLoading(false); return; }
    router.replace(await getRedirectPath(data.user.id));
  }

  /* ── REGISTRO CLIENTE ── */
  async function doRegister(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    if (regPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); setLoading(false); return; }

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: regEmail, password: regPass,
      options: {
        data: { full_name: regName },
        emailRedirectTo: `${window.location.origin}/acceso?type=signup`,
      },
    });
    if (authErr) {
      setError(authErr.message === 'User already registered' ? 'Ya existe una cuenta con ese email. Inicia sesión.' : 'Error al registrarse.');
      setLoading(false); return;
    }

    const orgId = store?.org_id || def.id;
    if (orgId && authData.user) {
      await supabase.from('customers').upsert({
        org_id: orgId, full_name: regName, email: regEmail,
        phone: regPhone || null, auth_user_id: authData.user.id,
      }, { onConflict: 'org_id,email', ignoreDuplicates: false });
    }

    if (authData.session) { router.replace(`/cliente/${slug}`); return; }

    setSuccess('¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión aquí.');
    setLoading(false); setTab('login'); setEmail(regEmail);
  }

  /* ── LOADING ── */
  if (checking) return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.1)', borderTopColor: def.primary, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const storeName = store?.store_name || def.name;
  const logoUrl   = store?.logo_url   || null;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${hexAlpha(P, 0.12)} 0%, #080808 45%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Urbanist','SF Pro Display',system-ui,sans-serif",
      padding: '20px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #1c1c1e inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        .acc-input {
          display:block; width:100%; padding:13px 14px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10);
          border-radius:12px; color:#fff; font-size:16px; font-family:inherit;
          outline:none; box-sizing:border-box; transition:border-color .2s;
        }
        .acc-input:focus { border-color: ${P}; }
        .acc-btn-main {
          width:100%; padding:14px; border-radius:14px; border:none; cursor:pointer;
          font-size:16px; font-weight:700; font-family:inherit; transition:all 0.2s;
          margin-top:8px;
        }
      `}</style>

      <div style={{ width:'100%', maxWidth:400, animation:'fadeUp 0.35s ease' }}>

        {/* LOGO */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          {logoUrl
            ? <img src={logoUrl} alt={storeName} style={{ height:64, objectFit:'contain', marginBottom:14 }} onError={e => e.target.style.display='none'} />
            : <div style={{
                width:72, height:72, borderRadius:22,
                background: hexAlpha(P, 0.18), border: `1.5px solid ${hexAlpha(P, 0.35)}`,
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                fontSize:36, marginBottom:14,
              }}>{def.emoji}</div>
          }
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.4px' }}>{storeName}</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, margin:0 }}>Ingresa a tu cuenta</p>
        </div>

        {/* CARD */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:22, padding:'24px 22px' }}>

          {/* CAMBIAR CONTRASEÑA */}
          {isRecovery && (
            <form onSubmit={doChangePassword} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ textAlign:'center', marginBottom:4 }}>
                <p style={{ fontSize:18, fontWeight:800, color:'#fff', margin:'0 0 6px' }}>🔑 Nueva contraseña</p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Elige una contraseña segura</p>
              </div>
              {error && <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.25)', borderRadius:10, padding:'10px 14px', color:'#FF3B30', fontSize:13 }}>{error}</div>}
              {success && <div style={{ background:'rgba(48,209,88,0.12)', border:'1px solid rgba(48,209,88,0.25)', borderRadius:10, padding:'10px 14px', color:'#30D158', fontSize:13 }}>{success}</div>}
              <div>
                <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Nueva contraseña</label>
                <input type="password" required minLength={6} value={newPass} onChange={e=>setNewPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres" className="acc-input" style={{ marginTop:6 }} />
              </div>
              <button type="submit" disabled={loading} className="acc-btn-main"
                style={{ background: loading ? 'rgba(255,255,255,0.08)' : P, color: loading ? 'rgba(255,255,255,0.35)' : '#fff' }}>
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}

          {/* OLVIDÉ MI CONTRASEÑA */}
          {!isRecovery && showForgot && (
            <form onSubmit={doForgotPassword} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ textAlign:'center', marginBottom:4 }}>
                <p style={{ fontSize:18, fontWeight:800, color:'#fff', margin:'0 0 6px' }}>📧 Recuperar contraseña</p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Te enviaremos un link a tu correo</p>
              </div>
              {error && <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.25)', borderRadius:10, padding:'10px 14px', color:'#FF3B30', fontSize:13 }}>{error}</div>}
              {success && <div style={{ background:'rgba(48,209,88,0.12)', border:'1px solid rgba(48,209,88,0.25)', borderRadius:10, padding:'10px 14px', color:'#30D158', fontSize:13 }}>{success}</div>}
              <div>
                <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Tu email</label>
                <input type="email" required value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}
                  placeholder="tu@email.com" className="acc-input" style={{ marginTop:6 }} />
              </div>
              <button type="submit" disabled={loading} className="acc-btn-main"
                style={{ background: loading ? 'rgba(255,255,255,0.08)' : P, color: loading ? 'rgba(255,255,255,0.35)' : '#fff' }}>
                {loading ? 'Enviando…' : 'Enviar link de recuperación'}
              </button>
              <p style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, margin:0 }}>
                <button type="button" onClick={() => { setShowForgot(false); clearAlerts(); }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:P, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                  ← Volver al login
                </button>
              </p>
            </form>
          )}

          {/* FORMULARIOS NORMALES */}
          {!isRecovery && !showForgot && (<>

            {/* Sub-tabs login | registro */}
            <div style={{ display:'flex', marginBottom:18, gap:0, background:'rgba(255,255,255,0.05)', borderRadius:10, padding:3 }}>
              {[{ id:'login', lbl:'Iniciar sesión' }, { id:'register', lbl:'Crear cuenta' }].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); clearAlerts(); }}
                  style={{
                    flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
                    fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all .2s',
                    background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color:      tab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>{t.lbl}</button>
              ))}
            </div>

            {/* Alertas */}
            {error && <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:14, color:'#FF3B30', fontSize:13 }}>{error}</div>}
            {success && <div style={{ background:'rgba(48,209,88,0.12)', border:'1px solid rgba(48,209,88,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:14, color:'#30D158', fontSize:13 }}>{success}</div>}

            {/* LOGIN */}
            {tab === 'login' && (
              <form onSubmit={doLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Email</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="tu@email.com" className="acc-input" style={{ marginTop:6 }} autoFocus />
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Contraseña</label>
                  <div style={{ position:'relative', marginTop:6 }}>
                    <input type={showPass ? 'text' : 'password'} required value={password} onChange={e=>setPassword(e.target.value)}
                      placeholder="••••••••" className="acc-input" style={{ paddingRight:42 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:18 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="acc-btn-main"
                  style={{ background: loading ? 'rgba(255,255,255,0.08)' : P, color: loading ? 'rgba(255,255,255,0.35)' : '#fff' }}>
                  {loading ? 'Ingresando…' : 'Ingresar'}
                </button>
                <p style={{ textAlign:'center', margin:'2px 0 0' }}>
                  <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); clearAlerts(); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:12, fontFamily:'inherit' }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </p>
                <p style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, margin:'4px 0 0' }}>
                  ¿No tienes cuenta?{' '}
                  <button type="button" onClick={() => { setTab('register'); clearAlerts(); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:P, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                    Regístrate gratis
                  </button>
                </p>
              </form>
            )}

            {/* REGISTRO */}
            {tab === 'register' && (
              <form onSubmit={doRegister} style={{ display:'flex', flexDirection:'column', gap:12 }} autoComplete="off">
                <div>
                  <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Nombre completo</label>
                  <input type="text" required value={regName} onChange={e=>setRegName(e.target.value)}
                    placeholder="Juan Pérez" className="acc-input" style={{ marginTop:6 }} autoFocus />
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Email</label>
                  <input type="email" required value={regEmail} onChange={e=>setRegEmail(e.target.value)}
                    placeholder="tu@email.com" className="acc-input" style={{ marginTop:6 }} />
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Teléfono <span style={{ fontWeight:400, textTransform:'none', fontSize:10 }}>(opcional)</span></label>
                  <input type="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value)}
                    placeholder="+51 999 999 999" className="acc-input" style={{ marginTop:6 }} />
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase' }}>Contraseña</label>
                  <div style={{ position:'relative', marginTop:6 }}>
                    <input type={showPass ? 'text' : 'password'} required value={regPass} onChange={e=>setRegPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres" className="acc-input" style={{ paddingRight:42 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:18 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="acc-btn-main"
                  style={{ background: loading ? 'rgba(255,255,255,0.08)' : P, color: loading ? 'rgba(255,255,255,0.35)' : '#fff' }}>
                  {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
                </button>
                <p style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, margin:'4px 0 0' }}>
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={() => { setTab('login'); clearAlerts(); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:P, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                    Iniciar sesión
                  </button>
                </p>
              </form>
            )}
          </>)}
        </div>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <a href="/" style={{ color:'rgba(255,255,255,0.25)', fontSize:13, textDecoration:'none', fontWeight:500 }}>
            ← Volver a la tienda
          </a>
        </div>
      </div>
    </div>
  );
}
