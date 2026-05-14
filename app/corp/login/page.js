'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CorpLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setError('Credenciales incorrectas.');
      setLoading(false);
      return;
    }

    // Verificar rol corp
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', data.session.user.id).maybeSingle();
    const r = roleRow?.role;
    const CORP_ROLES = ['corp', 'superadmin', 'admin_corp'];

    if (!r || !CORP_ROLES.includes(r)) {
      await supabase.auth.signOut();
      setError('Sin acceso a este panel.');
      setLoading(false);
      return;
    }

    router.replace('/corp');
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
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@600;700;800&display=swap');
        * { box-sizing:border-box; }
        .ci { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:14px; color:#fff; font-size:15px; font-family:inherit; outline:none; transition:border-color .2s; }
        .ci:focus { border-color:#0A84FF; background:rgba(255,255,255,0.08); }
        .ci::placeholder { color:rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #1c1c1e inset!important; -webkit-text-fill-color:#fff!important; }
      `}</style>

      <form onSubmit={handleLogin} style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 24, padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Logo pequeño y neutral */}
        <div style={{ textAlign:'center', marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff',
          }}>CT</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>Acceso interno</h1>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, margin:'6px 0 0' }}>Solo personal autorizado</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <input className="ci" type="email" placeholder="Correo electrónico"
            value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" />
          <input className="ci" type="password" placeholder="Contraseña"
            value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" />
        </div>

        {error && (
          <div style={{ background:'rgba(255,59,48,0.1)', border:'1px solid rgba(255,59,48,0.2)', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#FF3B30', textAlign:'center' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          background: loading ? 'rgba(10,132,255,0.5)' : '#0A84FF',
          border: 'none', color: '#fff', borderRadius: 14,
          padding: '14px', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading
            ? <><span style={{ width:16,height:16,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Verificando…</>
            : 'Ingresar'}
        </button>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </form>
    </div>
  );
}
