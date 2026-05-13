'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ─── Iconos SVG estilo Apple SF Symbols ─── */
const IconPasskey = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="10" cy="11" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 11h8M19 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 16v3a2 2 0 002 2h10a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconMagic = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M4 20L14 6l10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="22" cy="6" r="2" fill="currentColor"/>
    <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
    <circle cx="14" cy="22" r="1.5" fill="currentColor"/>
  </svg>
);
const IconQR = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    <rect x="16" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    <rect x="4" y="16" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    <rect x="6.5" y="6.5" width="3" height="3" rx="0.5" fill="currentColor"/>
    <rect x="18.5" y="6.5" width="3" height="3" rx="0.5" fill="currentColor"/>
    <rect x="6.5" y="18.5" width="3" height="3" rx="0.5" fill="currentColor"/>
    <path d="M16 16h2v2h-2zM20 16h2v2h-2zM16 20h2v4M20 20h4v4M22 20v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconPassword = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="6" y="12" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 12V9a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="14" cy="17.5" r="1.5" fill="currentColor"/>
    <path d="M14 19v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconFaceID = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 7V4.5A1.5 1.5 0 014.5 3H7M13 3h2.5A1.5 1.5 0 0117 4.5V7M17 13v2.5A1.5 1.5 0 0115.5 17H13M7 17H4.5A1.5 1.5 0 013 15.5V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="7.5" cy="8.5" r="1" fill="currentColor"/>
    <circle cx="12.5" cy="8.5" r="1" fill="currentColor"/>
    <path d="M7 12.5c.8 1 5.2 1 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const ORGS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Corp Tech',   ico: '🏢' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',   ico: '🔵' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech',  ico: '🟣' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru', ico: '🟢' },
];

const ROLE_OPTS = [
  { val: 'superadmin', lbl: '⚡ Super Admin' },
  { val: 'corp',       lbl: '🏢 Corporación' },
  { val: 'gerente',    lbl: '👔 Gerente'      },
  { val: 'vendedor',   lbl: '🛒 Vendedor'     },
];

const METHODS = [
  {
    id:       'passkey',
    icon:     <IconPasskey />,
    title:    'Passkey',
    sub:      'Face ID · Touch ID',
    gradient: 'linear-gradient(135deg,#0A84FF22,#5E5CE622)',
    border:   'rgba(10,132,255,0.25)',
    accent:   '#0A84FF',
  },
  {
    id:       'magic',
    icon:     <IconMagic />,
    title:    'Magic Link',
    sub:      'Link en tu correo',
    gradient: 'linear-gradient(135deg,#30D15822,#34C75922)',
    border:   'rgba(48,209,88,0.25)',
    accent:   '#30D158',
  },
  {
    id:       'qr',
    icon:     <IconQR />,
    title:    'QR / Wallet',
    sub:      'Carnet · Apple Wallet',
    gradient: 'linear-gradient(135deg,#FF9F0A22,#FF6B0022)',
    border:   'rgba(255,159,10,0.25)',
    accent:   '#FF9F0A',
  },
  {
    id:       'password',
    icon:     <IconPassword />,
    title:    'Contraseña',
    sub:      'Email y contraseña',
    gradient: 'linear-gradient(135deg,#BF5AF222,#9B59B622)',
    border:   'rgba(191,90,242,0.25)',
    accent:   '#BF5AF2',
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [checking,   setChecking]   = useState(true);
  const [method,     setMethod]     = useState(null); // null | 'passkey'|'magic'|'qr'|'password'
  const [subMode,    setSubMode]    = useState('login'); // login | register | recover
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  /* password */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  /* register */
  const [name,   setName]   = useState('');
  const [orgId,  setOrgId]  = useState('');
  const [role,   setRole]   = useState('vendedor');
  /* passkey */
  const [pkEmail,    setPkEmail]    = useState('');
  const [pkRenew,    setPkRenew]    = useState(null); // { credId, userId } cuando token expiró
  const [pkPassword, setPkPassword] = useState('');
  /* magic link */
  const [mgEmail,  setMgEmail]  = useState('');
  const [mgSent,   setMgSent]   = useState(false);

  /* ── Redirect si ya hay sesión activa (incluye magic link callback) ── */
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const dest = await getRedirectPath(session.user.id);
        router.replace(dest);
      } else {
        setChecking(false);
      }
    };
    check();

    /* Escuchar cuando el magic link activa la sesión */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        const dest = await getRedirectPath(session.user.id);
        router.replace(dest);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function getRedirectPath(userId) {
    const { data } = await supabase
      .from('user_roles').select('role').eq('user_id', userId).limit(1).maybeSingle();
    const r = data?.role || 'vendedor';
    if (r === 'superadmin')                                              return '/superadmin';
    if (r === 'corp'    || r === 'admin_corp')                          return '/corp';
    if (r === 'gerente' || r === 'store_manager' || r === 'store_admin') return '/store';
    return '/pos';
  }

  function clearAlerts() { setError(''); setSuccess(''); }
  function selectMethod(id) { setMethod(id); setSubMode('login'); setPkRenew(null); setPkPassword(''); clearAlerts(); }
  function goBack() { setMethod(null); setMgSent(false); setPkRenew(null); setPkPassword(''); clearAlerts(); }

  /* ──────────────── PASSKEY LOGIN ──────────────── */
  async function doPasskeyLogin(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    try {
      let allowCreds = undefined;
      let userId     = null;

      if (pkEmail.trim()) {
        /* Buscar credenciales del usuario por email */
        const { data: userRow } = await supabase
          .from('users').select('id').eq('email', pkEmail.trim()).maybeSingle();

        if (userRow?.id) {
          userId = userRow.id;
          const { data: bkList } = await supabase
            .from('biometric_keys').select('credential_id').eq('user_id', userId);

          if (bkList?.length > 0) {
            allowCreds = bkList
              .filter(b => !b.credential_id.startsWith('token-only-'))
              .map(b => {
                try { return { type:'public-key', id: Uint8Array.from(atob(b.credential_id), c=>c.charCodeAt(0)) }; }
                catch { return null; }
              }).filter(Boolean);
          }
        }
      }

      /* Solicitar FaceID / Touch ID / Passkey de iCloud */
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials:  allowCreds?.length > 0 ? allowCreds : undefined,
          userVerification:  'required',
          timeout:           60000,
        },
      });

      if (!assertion) { setError('Verificación cancelada.'); setLoading(false); return; }

      const assertCredId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));

      /* Buscar refresh_token asociado a este credential */
      const { data: bkRow } = await supabase
        .from('biometric_keys')
        .select('refresh_token, user_id')
        .eq('credential_id', assertCredId)
        .maybeSingle();

      if (!bkRow?.refresh_token) {
        /* Passkey encontrada pero sin token → pedir contraseña para vincular */
        setPkRenew({ credId: assertCredId, userId: bkRow?.user_id || userId });
        setLoading(false); return;
      }

      const { data: { session }, error: refreshErr } = await supabase.auth.refreshSession({
        refresh_token: bkRow.refresh_token,
      });

      if (refreshErr || !session) {
        /* Token expirado → pedir contraseña para renovar (Face ID ya probó identidad) */
        setPkRenew({ credId: assertCredId, userId: bkRow.user_id });
        setLoading(false); return;
      }

      /* ✓ Todo ok: actualizar token y redirigir */
      await supabase.from('biometric_keys')
        .update({ refresh_token: session.refresh_token, last_used: new Date().toISOString() })
        .eq('credential_id', assertCredId);

      const dest = await getRedirectPath(bkRow.user_id);
      router.replace(dest);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Verificación cancelada. Inténtalo de nuevo.');
      } else if (err.name === 'NotSupportedError') {
        setError('Tu dispositivo no soporta Passkeys. Usa otro método.');
      } else {
        setError('Error con Passkey: ' + err.message);
      }
      setLoading(false);
    }
  }

  /* ──────────────── RENOVAR SESIÓN PASSKEY (token expirado) ──────────────── */
  async function doRenewPasskey(e) {
    e.preventDefault();
    if (!pkRenew || !pkPassword) return;
    setLoading(true); clearAlerts();

    /* Iniciar sesión con contraseña para obtener token fresco */
    const emailToUse = pkEmail.trim() || '';
    if (!emailToUse) { setError('Ingresa tu email para renovar.'); setLoading(false); return; }

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: emailToUse, password: pkPassword,
    });

    if (authErr || !authData?.session) {
      setError('Contraseña incorrecta. Intenta de nuevo.');
      setLoading(false); return;
    }

    /* Actualizar refresh_token en biometric_keys para este credential */
    await supabase.from('biometric_keys')
      .update({ refresh_token: authData.session.refresh_token, last_used: new Date().toISOString() })
      .eq('credential_id', pkRenew.credId);

    /* También actualizar otros credentials del mismo usuario por si acaso */
    await supabase.from('biometric_keys')
      .update({ refresh_token: authData.session.refresh_token })
      .eq('user_id', authData.user.id)
      .neq('credential_id', pkRenew.credId);

    const dest = await getRedirectPath(authData.user.id);
    router.replace(dest);
  }

  /* ──────────────── MAGIC LINK ──────────────── */
  async function doMagicLink(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: mgEmail.trim(),
      options: { emailRedirectTo: window.location.origin + '/login' },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setMgSent(true);
    setLoading(false);
  }

  /* ──────────────── PASSWORD LOGIN ──────────────── */
  async function doLogin(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    const dest = await getRedirectPath(data.user.id);
    router.replace(dest);
  }

  /* ──────────────── REGISTER ──────────────── */
  async function doRegister(e) {
    e.preventDefault();
    if (!orgId) { setError('Selecciona una empresa.'); return; }
    setLoading(true); clearAlerts();
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    const uid = authData.user.id;
    await supabase.from('users').insert({ id: uid, org_id: orgId, full_name: name, email });
    await supabase.from('user_roles').insert({ user_id: uid, org_id: orgId, role });
    setSuccess('¡Cuenta creada! Revisa tu email para confirmar, luego inicia sesión.');
    setLoading(false);
    setSubMode('login');
  }

  /* ──────────────── RECOVER ──────────────── */
  async function doRecover(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (err) { setError(err.message); }
    else { setSuccess('¡Enlace enviado! Revisa tu correo para restablecer la contraseña.'); }
    setLoading(false);
  }

  /* ─────────────── SPINNER INICIAL ─────────────── */
  if (checking) {
    return (
      <div style={S.screen}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ width:44, height:44, border:'2.5px solid rgba(255,255,255,0.08)', borderTopColor:'#0A84FF', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  /* ─────────────── RENDER PRINCIPAL ─────────────── */
  return (
    <div style={S.screen}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Fondo ambiance ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-25%', left:'-15%', width:'70vw', height:'70vw', maxWidth:560, maxHeight:560, borderRadius:'50%', background:'radial-gradient(circle,rgba(10,132,255,0.07) 0%,transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'55vw', height:'55vw', maxWidth:440, maxHeight:440, borderRadius:'50%', background:'radial-gradient(circle,rgba(94,92,230,0.06) 0%,transparent 70%)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400, margin:'0 auto', padding:'0 16px', animation:'fadeIn 0.35s ease' }}>

        {/* ── LOGO ── */}
        <div style={{ textAlign:'center', marginBottom: method ? 20 : 32, paddingTop: method ? 16 : 40 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10, boxShadow:'0 8px 32px rgba(10,132,255,0.2)', overflow:'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Corp Tech" style={{ width:64, height:64, objectFit:'contain' }} />
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>Corp Tech</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:3, fontWeight:500 }}>
            {!method && 'Elige cómo ingresar'}
            {method === 'passkey'  && 'Face ID · Touch ID · iCloud Keychain'}
            {method === 'magic'    && 'Acceso sin contraseña'}
            {method === 'qr'       && 'Carnet · Apple Wallet · QR'}
            {method === 'password' && (subMode === 'register' ? 'Nueva cuenta' : subMode === 'recover' ? 'Recuperar acceso' : 'Acceso clásico')}
          </div>
        </div>

        {/* ── SELECTOR DE MÉTODOS ── */}
        {!method && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
            {METHODS.map(m => (
              <button key={m.id} onClick={() => selectMethod(m.id)} style={{
                background: m.gradient,
                border: `1.5px solid ${m.border}`,
                borderRadius:20, padding:'20px 16px',
                display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s',
                color: m.accent,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${m.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ color: m.accent }}>{m.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>{m.title}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontWeight:500 }}>{m.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── PANEL DE MÉTODO SELECCIONADO ── */}
        {method && (
          <div style={{
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:24, padding:'24px 20px 20px',
            animation:'slideUp 0.3s ease',
          }}>
            {/* Alertas */}
            {error && (
              <div style={{ background:'rgba(255,59,48,0.1)', border:'1px solid rgba(255,59,48,0.2)', borderRadius:12, padding:'10px 14px', color:'#FF453A', fontSize:13, marginBottom:16, animation:'shake 0.3s ease' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.2)', borderRadius:12, padding:'10px 14px', color:'#30D158', fontSize:13, marginBottom:16 }}>
                ✅ {success}
              </div>
            )}

            {/* ══════════ PASSKEY ══════════ */}
            {method === 'passkey' && !pkRenew && (
              <form onSubmit={doPasskeyLogin}>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:18, textAlign:'center' }}>
                  Ingresa tu email para encontrar tu llave, o déjalo vacío si usas una Passkey descubrible de iCloud.
                </p>
                <div style={{ marginBottom:16 }}>
                  <label style={S.label}>Correo electrónico (opcional)</label>
                  <input
                    className="q-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={pkEmail}
                    onChange={e => { setPkEmail(e.target.value); clearAlerts(); }}
                  />
                </div>
                <button className="q-btn" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#0A84FF,#5E5CE6)', boxShadow:'0 6px 24px rgba(10,132,255,0.3)' }}>
                  {loading
                    ? <><Spinner /> Verificando...</>
                    : <><IconFaceID /> &nbsp;Usar Face ID / Touch ID</>}
                </button>
                <div style={{ textAlign:'center', marginTop:12 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>¿Sin acceso? </span>
                  <button type="button" className="q-link" onClick={() => { selectMethod('magic'); setMgEmail(pkEmail); }}>
                    Usa Magic Link →
                  </button>
                </div>
              </form>
            )}

            {/* ── Renovación de sesión expirada (Face ID verificó identidad, solo falta contraseña) ── */}
            {method === 'passkey' && pkRenew && (
              <form onSubmit={doRenewPasskey}>
                {/* Encabezado informativo */}
                <div style={{ textAlign:'center', marginBottom:18 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>Face ID verificado</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>
                    Tu sesión expiró por inactividad.<br/>
                    Ingresa tu contraseña una última vez para renovarla. Después usarás solo Face ID.
                  </div>
                </div>

                {/* Email (puede estar pre-llenado o necesitar ingresarlo) */}
                {!pkEmail && (
                  <div style={{ marginBottom:12 }}>
                    <label style={S.label}>Correo electrónico</label>
                    <input
                      className="q-input"
                      type="email"
                      placeholder="tu@email.com"
                      value={pkEmail}
                      onChange={e => { setPkEmail(e.target.value); clearAlerts(); }}
                      required
                    />
                  </div>
                )}
                {pkEmail && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'rgba(255,255,255,0.05)', borderRadius:10, marginBottom:12 }}>
                    <span style={{ fontSize:14 }}>✉️</span>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{pkEmail}</span>
                  </div>
                )}

                <div style={{ marginBottom:16 }}>
                  <label style={S.label}>Contraseña (una sola vez)</label>
                  <input
                    className="q-input"
                    type="password"
                    placeholder="••••••••"
                    value={pkPassword}
                    onChange={e => { setPkPassword(e.target.value); clearAlerts(); }}
                    required
                    autoFocus
                  />
                </div>

                <button className="q-btn" type="submit" disabled={loading}
                  style={{ background:'linear-gradient(135deg,#0A84FF,#5E5CE6)', boxShadow:'0 6px 24px rgba(10,132,255,0.3)', marginBottom:10 }}>
                  {loading ? <><Spinner /> Renovando...</> : '🔑 Renovar sesión y entrar'}
                </button>

                <button type="button" className="q-btn"
                  onClick={() => { setPkRenew(null); setPkPassword(''); clearAlerts(); }}
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  ← Volver a Face ID
                </button>
              </form>
            )}

            {/* ══════════ MAGIC LINK ══════════ */}
            {method === 'magic' && !mgSent && (
              <form onSubmit={doMagicLink}>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:18, textAlign:'center' }}>
                  Te enviaremos un enlace de un solo uso. Sin contraseña. Sin Passkey.
                </p>
                <div style={{ marginBottom:18 }}>
                  <label style={S.label}>Correo electrónico</label>
                  <input
                    className="q-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={mgEmail}
                    onChange={e => { setMgEmail(e.target.value); clearAlerts(); }}
                    required
                    autoFocus
                  />
                </div>
                <button className="q-btn" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#30D158,#34C759)', boxShadow:'0 6px 24px rgba(48,209,88,0.25)' }}>
                  {loading ? <><Spinner /> Enviando...</> : '✉️  Enviar Magic Link'}
                </button>
              </form>
            )}
            {method === 'magic' && mgSent && (
              <div style={{ textAlign:'center', padding:'8px 0' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>📬</div>
                <div style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:8 }}>Revisa tu correo</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:20 }}>
                  Enviamos un link a <strong style={{ color:'#30D158' }}>{mgEmail}</strong>.<br/>
                  Haz clic en el enlace para ingresar.<br/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>Expira en 1 hora · Un solo uso</span>
                </div>
                <button type="button" className="q-btn" onClick={() => { setMgSent(false); setMgEmail(''); clearAlerts(); }} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  Cambiar correo
                </button>
              </div>
            )}

            {/* ══════════ QR / WALLET ══════════ */}
            {method === 'qr' && (
              <div style={{ textAlign:'center', padding:'4px 0' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📲</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:8 }}>Escanea tu Carnet</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:22 }}>
                  Usa el QR de tu carnet de trabajo o el pase de Apple Wallet. El sistema validará tu identidad automáticamente.
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <a href="/login/qr" style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'14px', borderRadius:14,
                    background:'linear-gradient(135deg,#FF9F0A,#FF6B00)',
                    color:'#fff', fontWeight:700, fontSize:15, textDecoration:'none',
                    boxShadow:'0 6px 24px rgba(255,159,10,0.3)',
                  }}>
                    <IconQR /> &nbsp;Abrir Escáner QR
                  </a>
                  <a href="/biometrics" style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'13px', borderRadius:14,
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                    color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:14, textDecoration:'none',
                  }}>
                    🔐 &nbsp;Ver mi Carnet / Wallet
                  </a>
                </div>
              </div>
            )}

            {/* ══════════ CONTRASEÑA ══════════ */}
            {method === 'password' && (
              <>
                {/* Sub-tabs */}
                {subMode !== 'recover' && (
                  <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4, marginBottom:20 }}>
                    {['login','register'].map(m => (
                      <button key={m} className={`q-tab${subMode===m?' active':''}`} onClick={() => { setSubMode(m); clearAlerts(); }}>
                        {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                      </button>
                    ))}
                  </div>
                )}

                {/* LOGIN */}
                {subMode === 'login' && (
                  <form onSubmit={doLogin}>
                    <div style={{ marginBottom:12 }}>
                      <label style={S.label}>Correo electrónico</label>
                      <input className="q-input" type="email" placeholder="tu@email.com" value={email} onChange={e=>{setEmail(e.target.value);clearAlerts();}} required />
                    </div>
                    <div style={{ marginBottom:18 }}>
                      <label style={S.label}>Contraseña</label>
                      <div style={{ position:'relative' }}>
                        <input className="q-input" type={showPass?'text':'password'} placeholder="••••••••" value={password} onChange={e=>{setPassword(e.target.value);clearAlerts();}} required style={{ paddingRight:46 }} />
                        <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'rgba(255,255,255,0.3)' }}>
                          {showPass ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <button className="q-btn" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#BF5AF2,#9B59B6)', boxShadow:'0 6px 24px rgba(191,90,242,0.25)' }}>
                      {loading ? <><Spinner /> Ingresando...</> : 'Ingresar →'}
                    </button>
                    <div style={{ textAlign:'center', marginTop:12 }}>
                      <button type="button" className="q-link" onClick={() => { setSubMode('recover'); clearAlerts(); }}>
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTER */}
                {subMode === 'register' && (
                  <form onSubmit={doRegister}>
                    <div style={{ marginBottom:10 }}>
                      <label style={S.label}>Nombre completo</label>
                      <input className="q-input" type="text" placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label style={S.label}>Correo electrónico</label>
                      <input className="q-input" type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label style={S.label}>Contraseña</label>
                      <input className="q-input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label style={S.label}>Empresa</label>
                      <div style={{ display:'flex', gap:6 }}>
                        {ORGS.map(o => (
                          <button key={o.id} type="button" onClick={()=>setOrgId(o.id)} style={{
                            flex:1, padding:'10px 4px', borderRadius:12,
                            border: `1.5px solid ${orgId===o.id ? '#0A84FF' : 'rgba(255,255,255,0.1)'}`,
                            background: orgId===o.id ? 'rgba(10,132,255,0.12)' : 'rgba(255,255,255,0.04)',
                            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                          }}>
                            <span style={{ fontSize:18 }}>{o.ico}</span>
                            <span style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:1.2 }}>{o.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom:18 }}>
                      <label style={S.label}>Rol</label>
                      <select className="q-select" value={role} onChange={e=>setRole(e.target.value)}>
                        {ROLE_OPTS.map(r => <option key={r.val} value={r.val}>{r.lbl}</option>)}
                      </select>
                    </div>
                    <button className="q-btn" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#BF5AF2,#9B59B6)', boxShadow:'0 6px 24px rgba(191,90,242,0.25)' }}>
                      {loading ? <><Spinner /> Creando cuenta...</> : 'Crear cuenta'}
                    </button>
                  </form>
                )}

                {/* RECOVER */}
                {subMode === 'recover' && (
                  <form onSubmit={doRecover}>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:16, lineHeight:1.6 }}>
                      Te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                    <div style={{ marginBottom:18 }}>
                      <label style={S.label}>Correo electrónico</label>
                      <input className="q-input" type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                    </div>
                    <button className="q-btn" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#BF5AF2,#9B59B6)', boxShadow:'0 6px 24px rgba(191,90,242,0.25)' }}>
                      {loading ? <><Spinner /> Enviando...</> : 'Enviar enlace'}
                    </button>
                    <div style={{ textAlign:'center', marginTop:12 }}>
                      <button type="button" className="q-link" onClick={()=>{setSubMode('login');clearAlerts();}}>
                        ← Volver al inicio de sesión
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* ── BOTÓN VOLVER ── */}
        {method && (
          <button onClick={goBack} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            width:'100%', padding:'12px', marginTop:12,
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(255,255,255,0.25)', fontSize:13, fontWeight:600,
          }}>
            ← Otros métodos de acceso
          </button>
        )}

        {/* ── FOOTER ── */}
        <div style={{ textAlign:'center', marginTop: method ? 8 : 28, paddingBottom:32, fontSize:11, color:'rgba(255,255,255,0.14)', fontWeight:500 }}>
          Corp Tech ERP · Sistema interno · v2.0
        </div>
      </div>
    </div>
  );
}

/* ─── Spinner inline ─── */
function Spinner() {
  return (
    <span style={{
      display:'inline-block', width:16, height:16,
      border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff',
      borderRadius:'50%', animation:'spin 0.7s linear infinite', verticalAlign:'middle',
    }} />
  );
}

/* ─── Estilos globales ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin:0; padding:0; }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }

  .q-input {
    width:100%; padding:13px 15px;
    border-radius:13px;
    border:1.5px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.05);
    color:#fff; font-size:15px;
    font-family:'Urbanist','Inter',sans-serif;
    outline:none; transition:border-color 0.2s;
  }
  .q-input:focus { border-color:rgba(255,255,255,0.3); }
  .q-input::placeholder { color:rgba(255,255,255,0.2); }

  .q-select {
    width:100%; padding:13px 15px;
    border-radius:13px;
    border:1.5px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.05);
    color:#fff; font-size:15px;
    font-family:'Urbanist','Inter',sans-serif;
    outline:none; appearance:none; cursor:pointer;
  }

  .q-btn {
    width:100%; padding:14px;
    border-radius:14px; border:none;
    color:#fff; font-size:15px; font-weight:700;
    cursor:pointer; font-family:'Urbanist','Inter',sans-serif;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:opacity 0.15s, transform 0.1s;
  }
  .q-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
  .q-btn:active:not(:disabled) { transform:translateY(0); }
  .q-btn:disabled { opacity:0.45; cursor:not-allowed; }

  .q-tab {
    flex:1; padding:9px; border:none; background:none;
    font-family:'Urbanist','Inter',sans-serif;
    font-size:13px; font-weight:600; cursor:pointer;
    border-radius:9px; transition:all 0.15s;
    color:rgba(255,255,255,0.35);
  }
  .q-tab.active {
    background:rgba(255,255,255,0.08);
    color:#fff;
  }

  .q-link {
    background:none; border:none;
    color:rgba(255,255,255,0.35); font-family:'Urbanist','Inter',sans-serif;
    font-size:12px; cursor:pointer; font-weight:600;
    transition:color 0.15s;
  }
  .q-link:hover { color:rgba(255,255,255,0.6); }
`;

const S = {
  screen: {
    minHeight:'100dvh', display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    background:'#000000',
    fontFamily:"'Urbanist','Inter',sans-serif",
  },
  label: {
    fontSize:11, fontWeight:600,
    color:'rgba(255,255,255,0.35)',
    display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase',
  },
};
