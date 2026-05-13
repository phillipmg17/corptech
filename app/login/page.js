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
  { id: '00000000-0000-0000-0000-000000000001', name: 'Corp Tech',     ico: '🏢', slug: 'corp' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',     ico: '🔵', slug: 'store' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech',    ico: '🟣', slug: 'store' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru',   ico: '🟢', slug: 'store' },
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
  const [mode, setMode]         = useState('login');  // login | register | recover
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [orgId, setOrgId]       = useState('');
  const [role, setRole]         = useState('vendedor');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [checking, setChecking] = useState(true);

  /* ── Redirect if already logged in ── */
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
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .single();
    const r = data?.role || 'vendedor';
    if (r === 'superadmin')                          return '/superadmin';
    if (r === 'corp'      || r === 'admin_corp')     return '/corp';
    if (r === 'gerente'   || r === 'store_manager'
                          || r === 'store_admin')    return '/store';
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

  if (checking) {
    return (
      <div className="auth-screen">
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <button className="auth-theme-btn" onClick={toggleTheme} title="Cambiar tema">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="auth-card">
        <div className="auth-logo">🏢</div>
        <div className="auth-title">Corp Tech ERP</div>
        <div className="auth-sub">
          {mode === 'login'   && 'Ingresa a tu panel'}
          {mode === 'register'&& 'Crear nueva cuenta'}
          {mode === 'recover' && 'Recuperar contraseña'}
        </div>

        {mode !== 'recover' && (
          <div className="auth-tabs">
            <button className={`auth-tab${mode==='login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
              Iniciar sesión
            </button>
            <button className={`auth-tab${mode==='register' ? ' active' : ''}`} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>
              Registrarse
            </button>
          </div>
        )}

        {error   && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form onSubmit={doLogin}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '...' : 'Ingresar →'}
            </button>
            <div className="auth-link">
              <button type="button" onClick={() => { setMode('recover'); setError(''); setSuccess(''); }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <form onSubmit={doRegister}>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" type="text" placeholder="Tu nombre"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" placeholder="Mínimo 6 caracteres"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <div className="org-grid">
                {ORGS.map(o => (
                  <div key={o.id} className={`org-card${orgId===o.id ? ' selected' : ''}`} onClick={() => setOrgId(o.id)}>
                    <div className="org-card-ico">{o.ico}</div>
                    <div className="org-card-name">{o.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                {ROLE_OPTS.map(r => (
                  <option key={r.val} value={r.val}>{r.lbl}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {/* ── RECOVER FORM ── */}
        {mode === 'recover' && (
          <form onSubmit={doRecover}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '...' : 'Enviar enlace de recuperación'}
            </button>
            <div className="auth-link">
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                ← Volver a iniciar sesión
              </button>
            </div>
          </form>
        )}
      </div>

      {/* QR Login button */}
      <a href="/login/qr" style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        marginTop:16, padding:'13px 20px', borderRadius:14,
        background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)',
        color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:600, textDecoration:'none',
        width:'100%', maxWidth:360, boxSizing:'border-box',
      }}>
        <span style={{fontSize:18}}>📷</span> Acceso con Carnet QR
      </a>
    </div>
  );
}
