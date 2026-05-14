'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Configuración de cada tienda
const STORE_CONFIG = {
  futurteck:   { name: 'Futurteck',       logo: '📱', color: '#0A84FF' },
  wetech:      { name: 'WeTech Perú',     logo: '💻', color: '#30D158' },
  innovatech:  { name: 'InnovaTech',      logo: '🔧', color: '#FF9F0A' },
};

// Roles permitidos para este panel
const STAFF_ROLES = ['store_admin', 'vendedor', 'gerente', 'superadmin', 'corp', 'admin_corp'];

export default function StaffLoginPage() {
  const router   = useRouter();
  const params   = useParams();
  const slug     = params?.slug || 'futurteck';
  const store    = STORE_CONFIG[slug] || { name: slug, logo: '🏪', color: '#0A84FF' };

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  // Si ya hay sesión activa con rol de staff → redirigir
  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => { if (mounted) setChecking(false); }, 4000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      clearTimeout(fallback);
      if (!session) { setChecking(false); return; }

      const { data: roleRow } = await supabase
        .from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();
      const r = roleRow?.role;

      if (r && STAFF_ROLES.includes(r)) {
        router.replace('/store');
      } else {
        setChecking(false);
      }
    });

    return () => { mounted = false; clearTimeout(fallback); };
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    // Verificar rol de staff
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', data.session.user.id).maybeSingle();
    const r = roleRow?.role;

    if (!r || !STAFF_ROLES.includes(r)) {
      await supabase.auth.signOut();
      setError('No tienes acceso a este panel.');
      setLoading(false);
      return;
    }

    // Redirigir según rol
    if (r === 'vendedor') {
      router.replace('/pos');
    } else {
      router.replace('/store');
    }
  }

  if (checking) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: store.color, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Urbanist','SF Pro Display',system-ui,sans-serif",
      padding: 20, zIndex: 9999,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        .si { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:14px; color:#fff; font-size:15px; font-family:inherit; outline:none; transition:border-color .2s; }
        .si:focus { border-color:${store.color}; background:rgba(255,255,255,0.08); }
        .si::placeholder { color:rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #1c1c1e inset!important; -webkit-text-fill-color:#fff!important; }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <form onSubmit={handleLogin} style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 24, padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 16,
        animation: 'fadeIn .4s ease',
      }}>
        {/* Header tienda */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${store.color}33, ${store.color}22)`,
            border: `1.5px solid ${store.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>{store.logo}</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#fff' }}>{store.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '5px 0 0' }}>Panel del equipo</p>
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="si"
            type="email"
            placeholder="Correo del equipo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />

          <div style={{ position: 'relative' }}>
            <input
              className="si"
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: 18, padding: 0,
              }}
            >{showPass ? '🙈' : '👁️'}</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)',
            borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#FF3B30', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? `${store.color}88` : store.color,
            border: 'none', color: '#fff', borderRadius: 14,
            padding: '14px', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .2s',
          }}
        >
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Verificando…</>
            : 'Ingresar al panel'}
        </button>

        {/* Footer discreto */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.12)', margin: 0 }}>
          Solo personal autorizado • {store.name}
        </p>
      </form>
    </div>
  );
}
