'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const ORGS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Corp Tech',   ico: '🏢' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',   ico: '🔵' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech',  ico: '🟣' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru', ico: '🟢' },
];

const ROLE_OPTS = [
  { val: 'superadmin', lbl: '⚡ Super Admin' },
  { val: 'corp',       lbl: '🏢 Corporación' },
  { val: 'gerente',    lbl: '👔 Gerente' },
  { val: 'vendedor',   lbl: '🛒 Vendedor' },
];

export default function AuthPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mode,     setMode]     = useState('login');   // login | register | recover
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [orgId,    setOrgId]    = useState('');
  const [role,     setRole]     = useState('vendedor');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [checking, setChecking] = useState(true);
  const [showPass, setShowPass] = useState(false);

  /* ── Redirect si ya está logueado ── */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const dest = await getRedirectPath(session.user.id);
        router.replace(dest);
      } else {
        setChecking(false);
      }
    });
  }, []);

  async function getRedirectPath(userId) {
    const { data } = await supabase
      .from('user_roles').select('role').eq('user_id', userId).limit(1).single();
    const r = data?.role || 'vendedor';
    if (r === 'superadmin')                         return '/superadmin';
    if (r === 'corp'      || r === 'admin_corp')    return '/corp';
    if (r === 'gerente'   || r === 'store_manager'
                          || r === 'store_admin')   return '/store';
    return '/pos';
  }

  /* ── LOGIN ── */
  async function doLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    const dest = await getRedirectPath(data.user.id);
    router.push(dest);
  }

  /* ── REGISTER ── */
  async function doRegister(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!orgId) { setError('Selecciona una empresa.'); return; }
    setLoading(true);
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    const uid = authData.user.id;
    await supabase.from('users').insert({ id: uid, org_id: orgId, full_name: name, email });
    await supabase.from('user_roles').insert({ user_id: uid, org_id: orgId, role });
    setSuccess('¡Cuenta creada! Revisa tu email para confirmar, luego inicia sesión.');
    setLoading(false);
    setMode('login');
  }

  /* ── RECOVER ── */
  async function doRecover(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) { setError(err.message); } else { setSuccess('¡Revisa tu correo para restablecer la contraseña!'); }
    setLoading(false);
  }

  function switchMode(m) {
    setMode(m);
    setError('');
    setSuccess('');
  }

  if (checking) {
    return (
      <div style={styles.screen}>
        <div style={styles.spinnerWrap}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.screen} data-theme={theme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        [data-theme="light"] { --bg: #f0f2f5; --card: #ffffff; --border: rgba(0,0,0,0.08); --text: #111; --text2: #555; --input-bg: #f7f8fa; --input-border: rgba(0,0,0,0.1); --muted: #888; }
        [data-theme="dark"]  { --bg: #0a0a0f; --card: #131318; --border: rgba(255,255,255,0.08); --text: #fff; --text2: rgba(255,255,255,0.6); --input-bg: rgba(255,255,255,0.05); --input-border: rgba(255,255,255,0.1); --muted: rgba(255,255,255,0.35); }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        .auth-input { width:100%; padding:14px 16px; border-radius:14px; border:1.5px solid var(--input-border); background:var(--input-bg); color:var(--text); font-size:15px; font-family:inherit; outline:none; transition:border-color 0.2s; }
        .auth-input:focus { border-color:#0A84FF; }
        .auth-input::placeholder { color:var(--muted); }
        .org-pill { flex:1; min-width:0; padding:10px 8px; border-radius:14px; border:1.5px solid var(--border); background:var(--input-bg); cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; transition:all 0.15s; }
        .org-pill:hover { border-color:rgba(10,132,255,0.4); }
        .org-pill.sel { border-color:#0A84FF; background:rgba(10,132,255,0.1); }
        .role-select { width:100%; padding:13px 16px; border-radius:14px; border:1.5px solid var(--input-border); background:var(--input-bg); color:var(--text); font-size:15px; font-family:inherit; outline:none; appearance:none; cursor:pointer; }
        .btn-primary { width:100%; padding:15px; border-radius:15px; border:none; background:linear-gradient(135deg,#0A84FF,#5E5CE6); color:#fff; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; transition:opacity 0.15s,transform 0.1s; box-shadow:0 6px 24px rgba(10,132,255,0.3); }
        .btn-primary:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform:translateY(0); }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed; box-shadow:none; }
        .link-btn { background:none; border:none; color:#0A84FF; font-family:inherit; font-size:13px; cursor:pointer; padding:2px 0; font-weight:600; }
        .link-btn:hover { opacity:0.8; }
        .tab-btn { flex:1; padding:10px; border:none; background:none; font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; border-radius:10px; transition:all 0.15s; color:var(--text2); }
        .tab-btn.active { background:var(--card); color:var(--text); box-shadow:0 2px 8px rgba(0,0,0,0.12); }
      `}</style>

      {/* Fondo decorativo */}
      <div style={{
        position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none',
      }}>
        <div style={{
          position:'absolute', top:'-20%', left:'-10%',
          width:'60vw', height:'60vw', maxWidth:500, maxHeight:500,
          borderRadius:'50%',
          background: theme==='dark'
            ? 'radial-gradient(circle,rgba(10,132,255,0.12) 0%,transparent 70%)'
            : 'radial-gradient(circle,rgba(10,132,255,0.08) 0%,transparent 70%)',
        }} />
        <div style={{
          position:'absolute', bottom:'-15%', right:'-10%',
          width:'50vw', height:'50vw', maxWidth:400, maxHeight:400,
          borderRadius:'50%',
          background: theme==='dark'
            ? 'radial-gradient(circle,rgba(94,92,230,0.1) 0%,transparent 70%)'
            : 'radial-gradient(circle,rgba(94,92,230,0.06) 0%,transparent 70%)',
        }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position:'fixed', top:16, right:16, zIndex:10,
          width:40, height:40, borderRadius:12,
          background: theme==='dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
          border:'none', fontSize:18, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Card */}
      <div style={{
        position:'relative', zIndex:1,
        width:'100%', maxWidth:400,
        margin:'0 auto',
        padding:'0 16px',
        animation:'fadeIn 0.4s ease',
      }}>
        <div style={{
          background: 'var(--card)',
          borderRadius:28,
          padding:'32px 24px 28px',
          border:'1px solid var(--border)',
          boxShadow: theme==='dark'
            ? '0 24px 64px rgba(0,0,0,0.5)'
            : '0 12px 40px rgba(0,0,0,0.1)',
        }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{
              width:80, height:80, borderRadius:22,
              background:'#fff',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              marginBottom:12,
              boxShadow:'0 8px 28px rgba(10,132,255,0.18)',
              overflow:'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Corp Tech" style={{ width:72, height:72, objectFit:'contain' }} />
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', lineHeight:1.2 }}>
              Corp Tech
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
              {mode === 'login'    && 'Ingresa a tu panel'}
              {mode === 'register' && 'Crear nueva cuenta'}
              {mode === 'recover'  && 'Recuperar contraseña'}
            </div>
          </div>

          {/* Tabs (solo login / register) */}
          {mode !== 'recover' && (
            <div style={{
              display:'flex', gap:4,
              background: theme==='dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius:14, padding:4, marginBottom:24,
            }}>
              <button className={`tab-btn${mode==='login' ? ' active' : ''}`} onClick={() => switchMode('login')}>
                Iniciar sesión
              </button>
              <button className={`tab-btn${mode==='register' ? ' active' : ''}`} onClick={() => switchMode('register')}>
                Registrarse
              </button>
            </div>
          )}

          {/* Alertas */}
          {error && (
            <div style={{
              background:'rgba(255,59,48,0.1)', border:'1px solid rgba(255,59,48,0.2)',
              borderRadius:12, padding:'11px 14px', color:'#FF453A',
              fontSize:13, marginBottom:16, animation:'shake 0.3s ease',
            }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{
              background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.2)',
              borderRadius:12, padding:'11px 14px', color:'#30D158',
              fontSize:13, marginBottom:16,
            }}>
              ✅ {success}
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={doLogin}>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Correo electrónico
                </label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Contraseña
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    className="auth-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight:48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--muted)',
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ Ingresando...' : 'Ingresar →'}
              </button>
              <div style={{ textAlign:'center', marginTop:14 }}>
                <button type="button" className="link-btn" onClick={() => switchMode('recover')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <form onSubmit={doRegister}>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Nombre completo
                </label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Correo electrónico
                </label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Contraseña
                </label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:8 }}>
                  Empresa
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  {ORGS.map(o => (
                    <div
                      key={o.id}
                      className={`org-pill${orgId===o.id ? ' sel' : ''}`}
                      onClick={() => setOrgId(o.id)}
                    >
                      <span style={{ fontSize:22 }}>{o.ico}</span>
                      <span style={{ fontSize:10, fontWeight:600, color:'var(--text2)', textAlign:'center', lineHeight:1.2 }}>
                        {o.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Rol
                </label>
                <select
                  className="role-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  {ROLE_OPTS.map(r => (
                    <option key={r.val} value={r.val}>{r.lbl}</option>
                  ))}
                </select>
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          {/* ── RECOVER ── */}
          {mode === 'recover' && (
            <form onSubmit={doRecover}>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
                  Correo electrónico
                </label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ Enviando...' : 'Enviar enlace de recuperación'}
              </button>
              <div style={{ textAlign:'center', marginTop:14 }}>
                <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          {/* ── QR Login button ── */}
          {mode === 'login' && (
            <a
              href="/login/qr"
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                marginTop:16, padding:'13px 16px', borderRadius:15,
                background: theme==='dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: `1px solid var(--border)`,
                color:'var(--text2)', fontSize:14, fontWeight:600, textDecoration:'none',
                width:'100%', transition:'all 0.15s',
              }}
            >
              <span style={{ fontSize:18 }}>📷</span>
              Acceso con Carnet QR
            </a>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign:'center', marginTop:20,
          fontSize:12, color: theme==='dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
        }}>
          Corp Tech ERP · Sistema interno
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    minHeight:'100dvh', display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    background:'var(--bg,#0a0a0f)',
    fontFamily:"'Urbanist','Inter',sans-serif",
    padding:'24px 0',
  },
  spinnerWrap: {
    display:'flex', alignItems:'center', justifyContent:'center',
    height:'100dvh',
  },
  spinner: {
    width:40, height:40,
    border:'3px solid rgba(255,255,255,0.1)',
    borderTopColor:'#0A84FF',
    borderRadius:'50%',
    animation:'spin 0.8s linear infinite',
  },
};
