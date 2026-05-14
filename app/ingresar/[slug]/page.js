'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ─── Config por tienda ─── */
const STORE_CONFIG = {
  futurteck:  { name: 'Futurteck',       logo: null,        emoji: '📱', accent: '#0A84FF', footer: 'Futurteck · Panel del equipo' },
  wetech:     { name: 'WeTech Perú',     logo: null,        emoji: '💻', accent: '#30D158', footer: 'WeTech Perú · Panel del equipo' },
  innovatech: { name: 'InnovaTech',      logo: null,        emoji: '🔧', accent: '#BF5AF2', footer: 'InnovaTech · Panel del equipo' },
  corp:       { name: 'Corp Tech',       logo: '/logo.png', emoji: '🏢', accent: '#0A84FF', footer: 'Corp Tech ERP · Sistema interno · v2.0' },
};

/* ─── Roles que pueden usar este panel ─── */
const STAFF_ROLES = ['store_admin','vendedor','gerente','store_manager','superadmin','corp','admin_corp'];

/* ─── Iconos SVG ─── */
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

function Spinner() {
  return <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', verticalAlign:'middle' }} />;
}

export default function IngresarPage() {
  const router = useRouter();
  const params = useParams();
  const slug   = params?.slug?.toLowerCase() || 'corp';
  const cfg    = STORE_CONFIG[slug] || STORE_CONFIG.corp;

  // Métodos con acento de la tienda
  const METHODS = [
    { id:'passkey',  icon:<IconPasskey />,  title:'Passkey',    sub:'Face ID · Touch ID',      gradient:`linear-gradient(135deg,${cfg.accent}22,${cfg.accent}11)`, border:`${cfg.accent}44`, accent:cfg.accent },
    { id:'magic',    icon:<IconMagic />,    title:'Magic Link', sub:'Link en tu correo',       gradient:'linear-gradient(135deg,#30D15822,#34C75911)', border:'rgba(48,209,88,0.25)', accent:'#30D158' },
    { id:'qr',       icon:<IconQR />,       title:'QR / Wallet',sub:'Carnet · Apple Wallet',   gradient:'linear-gradient(135deg,#FF9F0A22,#FF6B0011)', border:'rgba(255,159,10,0.25)', accent:'#FF9F0A' },
    { id:'password', icon:<IconPassword />, title:'Contraseña', sub:'Email y contraseña',      gradient:'linear-gradient(135deg,#BF5AF222,#9B59B611)', border:'rgba(191,90,242,0.25)', accent:'#BF5AF2' },
  ];

  const [checking,   setChecking]   = useState(true);
  const [method,     setMethod]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  /* password */
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  /* passkey */
  const [pkEmail,   setPkEmail]   = useState('');
  const [pkRenew,   setPkRenew]   = useState(null);
  const [pkPwd,     setPkPwd]     = useState('');
  /* magic link */
  const [mgEmail,   setMgEmail]   = useState('');
  const [mgSent,    setMgSent]    = useState(false);

  /* ── Redirect si ya hay sesión ── */
  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => { if (mounted) setChecking(false); }, 4000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      clearTimeout(fallback);
      if (!session) { setChecking(false); return; }
      // Sesión activa → redirigir (ej. magic link o refresh)
      const dest = await getRedirectPath(session.user.id);
      window.location.href = dest;
    });

    // Solo escuchamos SIGNED_OUT para limpiar estado si el usuario cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) setChecking(false);
    });

    return () => { mounted = false; clearTimeout(fallback); subscription.unsubscribe(); };
  }, []);

  async function getRedirectPath(userId) {
    try {
      const { data } = await supabase
        .from('user_roles').select('role').eq('user_id', userId);
      const roles = (data || []).map(r => r.role);
      if (roles.includes('superadmin'))                                                          return '/superadmin';
      if (roles.includes('corp') || roles.includes('admin_corp'))                               return '/corp';
      if (roles.includes('store_admin') || roles.includes('gerente') || roles.includes('store_manager')) return '/store';
      if (roles.includes('vendedor'))                                                            return '/pos';
    } catch (_) { /* RLS u otro error → fallback por slug */ }
    // Fallback: si la DB no responde, ir al panel según el slug de esta página
    if (slug === 'corp') return '/corp';
    return '/store';
  }

  function clearAlerts() { setError(''); setSuccess(''); }
  function selectMethod(id) { setMethod(id); setPkRenew(null); setPkPwd(''); clearAlerts(); }
  function goBack() { setMethod(null); setMgSent(false); setPkRenew(null); setPkPwd(''); clearAlerts(); }

  /* ── PASSKEY LOGIN ── */
  async function doPasskeyLogin(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    try {
      let allowCreds = undefined;
      let userId = null;

      if (pkEmail.trim()) {
        const { data: userRow } = await supabase.from('users').select('id').eq('email', pkEmail.trim()).maybeSingle();
        if (userRow?.id) {
          userId = userRow.id;
          const { data: bkList } = await supabase.from('biometric_keys').select('credential_id').eq('user_id', userId);
          if (bkList?.length > 0) {
            allowCreds = bkList
              .filter(b => !b.credential_id.startsWith('token-only-'))
              .map(b => { try { return { type:'public-key', id: Uint8Array.from(atob(b.credential_id), c=>c.charCodeAt(0)) }; } catch { return null; } })
              .filter(Boolean);
          }
        }
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: { challenge, allowCredentials: allowCreds?.length > 0 ? allowCreds : undefined, userVerification:'required', timeout:60000 },
      });

      if (!assertion) { setError('Verificación cancelada.'); setLoading(false); return; }

      const assertCredId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
      const { data: bkRow } = await supabase.from('biometric_keys').select('refresh_token, user_id').eq('credential_id', assertCredId).maybeSingle();

      if (!bkRow?.refresh_token) { setPkRenew({ credId: assertCredId, userId: bkRow?.user_id || userId }); setLoading(false); return; }

      const { data: { session }, error: refreshErr } = await supabase.auth.refreshSession({ refresh_token: bkRow.refresh_token });
      if (refreshErr || !session) { setPkRenew({ credId: assertCredId, userId: bkRow.user_id }); setLoading(false); return; }

      await supabase.from('biometric_keys').update({ refresh_token: session.refresh_token, last_used: new Date().toISOString() }).eq('credential_id', assertCredId);
      window.location.href = await getRedirectPath(bkRow.user_id);
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('Verificación cancelada. Inténtalo de nuevo.');
      else if (err.name === 'NotSupportedError') setError('Tu dispositivo no soporta Passkeys. Usa otro método.');
      else setError('Error: ' + err.message);
      setLoading(false);
    }
  }

  /* ── RENOVAR SESIÓN PASSKEY ── */
  async function doRenewPasskey(e) {
    e.preventDefault();
    if (!pkRenew || !pkPwd) return;
    setLoading(true); clearAlerts();
    const emailToUse = pkEmail.trim();
    if (!emailToUse) { setError('Ingresa tu email para renovar.'); setLoading(false); return; }

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password: pkPwd });
    if (authErr || !authData?.session) { setError('Contraseña incorrecta.'); setLoading(false); return; }

    await supabase.from('biometric_keys').update({ refresh_token: authData.session.refresh_token, last_used: new Date().toISOString() }).eq('credential_id', pkRenew.credId);
    await supabase.from('biometric_keys').update({ refresh_token: authData.session.refresh_token }).eq('user_id', authData.user.id).neq('credential_id', pkRenew.credId);
    window.location.href = await getRedirectPath(authData.user.id);
  }

  /* ── MAGIC LINK ── */
  async function doMagicLink(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: mgEmail.trim(),
      options: { emailRedirectTo: window.location.origin + '/ingresar/' + slug },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setMgSent(true); setLoading(false);
  }

  /* ── PASSWORD LOGIN ── */
  async function doLogin(e) {
    e.preventDefault();
    setLoading(true); clearAlerts();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError('Correo o contraseña incorrectos.'); setLoading(false); return; }
    // window.location.href = recarga completa → sesión en cookies antes de que la próxima página haga queries RLS
    const dest = await getRedirectPath(data.user.id);
    window.location.href = dest;
  }

  /* ── SPINNER ── */
  if (checking) return (
    <div style={{ position:'fixed', inset:0, background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:`3px solid rgba(255,255,255,0.07)`, borderTopColor: cfg.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── RENDER ── */
  return (
    <div style={{
      position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
      background:'#000000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      fontFamily:"'Urbanist','SF Pro Display',system-ui,sans-serif",
      overflowY:'auto', padding:'20px 16px', zIndex:9999,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .qi { width:100%; padding:13px 15px; border-radius:13px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff; font-size:15px; font-family:inherit; outline:none; transition:border-color 0.2s; }
        .qi:focus { border-color:rgba(255,255,255,0.3); }
        .qi::placeholder { color:rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #1c1c1e inset!important; -webkit-text-fill-color:#fff!important; }
        .qb { width:100%; padding:14px; border-radius:14px; border:none; color:#fff; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:8px; transition:opacity .15s,transform .1s; }
        .qb:hover:not(:disabled){opacity:.9;transform:translateY(-1px);}
        .qb:active:not(:disabled){transform:translateY(0);}
        .qb:disabled{opacity:.45;cursor:not-allowed;}
        .ql { background:none; border:none; color:rgba(255,255,255,0.35); font-family:inherit; font-size:12px; cursor:pointer; font-weight:600; transition:color .15s; }
        .ql:hover{color:rgba(255,255,255,0.6);}
      `}</style>

      {/* Fondo ambiance */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-25%', left:'-15%', width:'70vw', height:'70vw', maxWidth:560, maxHeight:560, borderRadius:'50%', background:`radial-gradient(circle,${cfg.accent}12 0%,transparent 70%)` }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'55vw', height:'55vw', maxWidth:440, maxHeight:440, borderRadius:'50%', background:'radial-gradient(circle,rgba(94,92,230,0.06) 0%,transparent 70%)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400, margin:'0 auto', animation:'fadeIn 0.35s ease' }}>

        {/* LOGO */}
        <div style={{ textAlign:'center', marginBottom: method ? 20 : 32, paddingTop: method ? 16 : 40 }}>
          {cfg.logo
            ? <div style={{ width:72, height:72, borderRadius:20, background:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10, boxShadow:`0 8px 32px ${cfg.accent}33`, overflow:'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.logo} alt={cfg.name} style={{ width:64, height:64, objectFit:'contain' }} />
              </div>
            : <div style={{ width:72, height:72, borderRadius:22, background:`${cfg.accent}22`, border:`1.5px solid ${cfg.accent}44`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:10 }}>
                {cfg.emoji}
              </div>
          }
          <div style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.3px', marginTop:4 }}>{cfg.name}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:3, fontWeight:500 }}>
            {!method && 'Elige cómo ingresar'}
            {method === 'passkey'  && 'Face ID · Touch ID · iCloud Keychain'}
            {method === 'magic'    && 'Acceso sin contraseña'}
            {method === 'qr'       && 'Carnet · Apple Wallet · QR'}
            {method === 'password' && 'Acceso con email y contraseña'}
          </div>
        </div>

        {/* SELECTOR DE MÉTODOS */}
        {!method && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
            {METHODS.map(m => (
              <button key={m.id} onClick={() => selectMethod(m.id)} style={{
                background: m.gradient, border:`1.5px solid ${m.border}`, borderRadius:20,
                padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s', color:m.accent,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${m.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ color:m.accent }}>{m.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>{m.title}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontWeight:500 }}>{m.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PANEL DEL MÉTODO */}
        {method && (
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:'24px 20px 20px', animation:'slideUp 0.3s ease' }}>
            {error && <div style={{ background:'rgba(255,59,48,0.1)', border:'1px solid rgba(255,59,48,0.2)', borderRadius:12, padding:'10px 14px', color:'#FF453A', fontSize:13, marginBottom:16, animation:'shake 0.3s ease' }}>⚠️ {error}</div>}
            {success && <div style={{ background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.2)', borderRadius:12, padding:'10px 14px', color:'#30D158', fontSize:13, marginBottom:16 }}>✅ {success}</div>}

            {/* ── PASSKEY ── */}
            {method === 'passkey' && !pkRenew && (
              <form onSubmit={doPasskeyLogin}>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:18, textAlign:'center' }}>
                  Ingresa tu email para encontrar tu llave, o déjalo vacío si usas una Passkey de iCloud.
                </p>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase' }}>Correo (opcional)</label>
                  <input className="qi" type="email" placeholder="tu@email.com" value={pkEmail} onChange={e=>{setPkEmail(e.target.value);clearAlerts();}} />
                </div>
                <button className="qb" type="submit" disabled={loading} style={{ background:`linear-gradient(135deg,${cfg.accent},#5E5CE6)`, boxShadow:`0 6px 24px ${cfg.accent}44` }}>
                  {loading ? <><Spinner /> Verificando...</> : <><IconFaceID /> &nbsp;Usar Face ID / Touch ID</>}
                </button>
                <div style={{ textAlign:'center', marginTop:12 }}>
                  <button type="button" className="ql" onClick={()=>{selectMethod('magic');setMgEmail(pkEmail);}}>¿Sin acceso? Usa Magic Link →</button>
                </div>
              </form>
            )}

            {/* ── RENOVAR PASSKEY ── */}
            {method === 'passkey' && pkRenew && (
              <form onSubmit={doRenewPasskey}>
                <div style={{ textAlign:'center', marginBottom:18 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>Face ID verificado</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>Tu sesión expiró. Ingresa tu contraseña una vez para renovarla.</div>
                </div>
                {pkEmail && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'rgba(255,255,255,0.05)', borderRadius:10, marginBottom:12 }}><span>✉️</span><span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{pkEmail}</span></div>}
                {!pkEmail && (
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase' }}>Correo electrónico</label>
                    <input className="qi" type="email" placeholder="tu@email.com" value={pkEmail} onChange={e=>{setPkEmail(e.target.value);clearAlerts();}} required />
                  </div>
                )}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase' }}>Contraseña (una sola vez)</label>
                  <input className="qi" type="password" placeholder="••••••••" value={pkPwd} onChange={e=>{setPkPwd(e.target.value);clearAlerts();}} required autoFocus />
                </div>
                <button className="qb" type="submit" disabled={loading} style={{ background:`linear-gradient(135deg,${cfg.accent},#5E5CE6)`, boxShadow:`0 6px 24px ${cfg.accent}44`, marginBottom:10 }}>
                  {loading ? <><Spinner /> Renovando...</> : '🔑 Renovar sesión y entrar'}
                </button>
                <button type="button" className="qb" onClick={()=>{setPkRenew(null);setPkPwd('');clearAlerts();}} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>← Volver a Face ID</button>
              </form>
            )}

            {/* ── MAGIC LINK ── */}
            {method === 'magic' && !mgSent && (
              <form onSubmit={doMagicLink}>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:18, textAlign:'center' }}>
                  Te enviaremos un enlace de un solo uso. Sin contraseña.
                </p>
                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase' }}>Correo electrónico</label>
                  <input className="qi" type="email" placeholder="tu@email.com" value={mgEmail} onChange={e=>{setMgEmail(e.target.value);clearAlerts();}} required autoFocus />
                </div>
                <button className="qb" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#30D158,#34C759)', boxShadow:'0 6px 24px rgba(48,209,88,0.25)' }}>
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
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>Expira en 1 hora · Un solo uso</span>
                </div>
                <button type="button" className="qb" onClick={()=>{setMgSent(false);setMgEmail('');clearAlerts();}} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)' }}>Cambiar correo</button>
              </div>
            )}

            {/* ── QR / WALLET ── */}
            {method === 'qr' && (
              <div style={{ textAlign:'center', padding:'4px 0' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📲</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:8 }}>Escanea tu Carnet</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:22 }}>
                  Usa el QR de tu carnet de trabajo o el pase de Apple Wallet.
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <a href="/ingresar/corp" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px', borderRadius:14, background:'linear-gradient(135deg,#FF9F0A,#FF6B00)', color:'#fff', fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:'0 6px 24px rgba(255,159,10,0.3)' }}>
                    <IconQR /> &nbsp;Abrir Escáner QR
                  </a>
                  <a href="/biometrics" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'13px', borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:14, textDecoration:'none' }}>
                    🔐 &nbsp;Ver mi Carnet / Wallet
                  </a>
                </div>
              </div>
            )}

            {/* ── CONTRASEÑA ── */}
            {method === 'password' && (
              <form onSubmit={doLogin}>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase' }}>Correo electrónico</label>
                  <input className="qi" type="email" placeholder="tu@email.com" value={email} onChange={e=>{setEmail(e.target.value);clearAlerts();}} required autoFocus />
                </div>
                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:7, letterSpacing:'0.04em', textTransform:'uppercase' }}>Contraseña</label>
                  <div style={{ position:'relative' }}>
                    <input className="qi" type={showPass?'text':'password'} placeholder="••••••••" value={password} onChange={e=>{setPassword(e.target.value);clearAlerts();}} required style={{ paddingRight:46 }} />
                    <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'rgba(255,255,255,0.3)' }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button className="qb" type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#BF5AF2,#9B59B6)', boxShadow:'0 6px 24px rgba(191,90,242,0.25)' }}>
                  {loading ? <><Spinner /> Ingresando...</> : 'Ingresar →'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* BOTÓN VOLVER */}
        {method && (
          <button onClick={goBack} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', padding:'12px', marginTop:12, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
            ← Otros métodos de acceso
          </button>
        )}

        {/* FOOTER */}
        <div style={{ textAlign:'center', marginTop: method ? 8 : 28, paddingBottom:32, fontSize:11, color:'rgba(255,255,255,0.14)', fontWeight:500 }}>
          {cfg.footer}
        </div>
      </div>
    </div>
  );
}
