'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccesoPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [mgEmail,  setMgEmail]  = useState('');
  const [mgSent,   setMgSent]   = useState(false);
  const [view,     setView]     = useState('password'); // 'password' | 'magic'

  /* Redirect si ya hay sesión */
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
    if (r === 'superadmin')                                               return '/superadmin';
    if (r === 'corp'    || r === 'admin_corp')                           return '/corp';
    if (r === 'gerente' || r === 'store_manager' || r === 'store_admin') return '/store';
    return '/pos';
  }

  async function doLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError('Credenciales incorrectas.'); setLoading(false); return; }
    const dest = await getRedirectPath(data.user.id);
    router.replace(dest);
  }

  async function doMagicLink(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: mgEmail,
      options: { emailRedirectTo: `${window.location.origin}/acceso` },
    });
    setLoading(false);
    if (err) { setError('No se pudo enviar el enlace.'); return; }
    setMgSent(true);
  }

  if (checking) return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#0a0a0a 0%,#111 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Urbanist','SF Pro Display',system-ui,sans-serif",
      padding: '20px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #1c1c1e inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: 380,
        animation: 'fadeUp 0.4s ease',
      }}>

        {/* Lock icon */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>🔐</div>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:700, margin:0, letterSpacing:'-0.5px' }}>
            Acceso al Panel
          </h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, marginTop:6 }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          gap: 4,
        }}>
          {[
            { id:'password', label:'Contraseña' },
            { id:'magic',    label:'Magic Link'  },
          ].map(t => (
            <button key={t.id} onClick={() => { setView(t.id); setError(''); setMgSent(false); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor:'pointer',
                fontSize: 14, fontWeight: 600, fontFamily:'inherit', transition:'all 0.2s',
                background: view === t.id ? '#fff' : 'transparent',
                color:      view === t.id ? '#000' : 'rgba(255,255,255,0.5)',
              }}>{t.label}</button>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 24,
        }}>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.25)',
              borderRadius:10, padding:'10px 14px', marginBottom:16,
              color:'#FF3B30', fontSize:14,
            }}>{error}</div>
          )}

          {/* PASSWORD VIEW */}
          {view === 'password' && (
            <form onSubmit={doLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  Email
                </label>
                <input
                  type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{
                    display:'block', width:'100%', marginTop:6, padding:'13px 14px',
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:12, color:'#fff', fontSize:16, fontFamily:'inherit',
                    outline:'none', boxSizing:'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  Contraseña
                </label>
                <div style={{ position:'relative', marginTop:6 }}>
                  <input
                    type={showPass ? 'text' : 'password'} required value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      display:'block', width:'100%', padding:'13px 44px 13px 14px',
                      background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:12, color:'#fff', fontSize:16, fontFamily:'inherit',
                      outline:'none', boxSizing:'border-box',
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:18,
                    }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{
                  marginTop:8, padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
                  background: loading ? 'rgba(255,255,255,0.1)' : '#fff',
                  color: loading ? 'rgba(255,255,255,0.3)' : '#000',
                  fontSize:16, fontWeight:700, fontFamily:'inherit', transition:'all 0.2s',
                }}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          )}

          {/* MAGIC LINK VIEW */}
          {view === 'magic' && !mgSent && (
            <form onSubmit={doMagicLink} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  Email
                </label>
                <input
                  type="email" required value={mgEmail} onChange={e=>setMgEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{
                    display:'block', width:'100%', marginTop:6, padding:'13px 14px',
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:12, color:'#fff', fontSize:16, fontFamily:'inherit',
                    outline:'none', boxSizing:'border-box',
                  }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{
                  marginTop:8, padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
                  background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#30D158,#34C759)',
                  color: '#fff', fontSize:16, fontWeight:700, fontFamily:'inherit', transition:'all 0.2s',
                }}>
                {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
              </button>
            </form>
          )}

          {view === 'magic' && mgSent && (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📩</div>
              <p style={{ color:'#30D158', fontSize:16, fontWeight:700, margin:'0 0 8px' }}>Enlace enviado</p>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:0 }}>
                Revisa tu correo y haz clic en el enlace para ingresar.
              </p>
              <button onClick={() => { setMgSent(false); setMgEmail(''); }}
                style={{
                  marginTop:20, background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.4)', fontSize:14, fontFamily:'inherit',
                }}>Usar otro correo</button>
            </div>
          )}
        </div>

        {/* Footer discreto */}
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:12, marginTop:24 }}>
          Panel de gestión · Acceso autorizado
        </p>
      </div>
    </div>
  );
}
