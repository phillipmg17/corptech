'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/*
  Página de carnet en pantalla completa.
  - No requiere login para ver (solo muestra QR + nombre)
  - Se puede guardar en pantalla de inicio iPhone/Android como acceso directo
  - Diseñada para que parezca una tarjeta de Wallet
*/

export default function CarnetPage() {
  const { userId } = useParams();
  const router     = useRouter();
  const qrRef      = useRef(null);
  const qrLibRef   = useRef(false);

  const [profile,  setProfile]  = useState(null);
  const [orgName,  setOrgName]  = useState('');
  const [role,     setRole]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isIOS,    setIsIOS]    = useState(false);

  /* detectar iOS */
  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  /* cargar datos del usuario */
  useEffect(() => {
    if (!userId) return;
    loadUser();
    loadQRLib();
  }, [userId]);

  async function loadUser() {
    try {
      const { data: prof } = await supabase
        .from('users')
        .select('full_name, email, organizations(name)')
        .eq('id', userId)
        .single();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);
      setOrgName(prof.organizations?.name || 'Corp Tech');

      const { data: rRow } = await supabase
        .from('user_roles').select('role').eq('user_id', userId).maybeSingle();
      setRole(rRow?.role || 'vendedor');
    } catch {}
    setLoading(false);
  }

  function loadQRLib() {
    if (document.getElementById('qrcodejs-c')) { qrLibRef.current = true; renderQR(); return; }
    const s = document.createElement('script');
    s.id  = 'qrcodejs-c';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => { qrLibRef.current = true; renderQR(); };
    document.head.appendChild(s);
  }

  function renderQR() {
    if (!qrRef.current || !qrLibRef.current || !window.QRCode) {
      setTimeout(renderQR, 200);
      return;
    }
    qrRef.current.innerHTML = '';
    new window.QRCode(qrRef.current, {
      text:         `corptech:uid:${userId}`,
      width:        260,
      height:       260,
      colorDark:    '#0a0a0a',
      colorLight:   '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  }

  /* re-renderizar QR cuando la lib carga */
  useEffect(() => {
    if (profile && qrRef.current) renderQR();
  }, [profile]);

  const ROLE_LABEL = {
    superadmin:    'Super Admin',
    corp:          'Corporación',
    admin_corp:    'Admin Corp',
    gerente:       'Gerente',
    store_manager: 'Gerente',
    store_admin:   'Admin Tienda',
    vendedor:      'Vendedor',
  };

  const ROLE_COLOR = {
    superadmin:    '#BF5AF2',
    corp:          '#0A84FF',
    admin_corp:    '#0A84FF',
    gerente:       '#30D158',
    store_manager: '#30D158',
    store_admin:   '#FF9F0A',
    vendedor:      '#FF9F0A',
  };

  if (loading) {
    return (
      <div style={S.screen}>
        <div style={S.spinner} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={S.screen}>
        <div style={{ textAlign:'center', color:'#fff' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700 }}>Carnet no encontrado</div>
          <button onClick={() => router.push('/login')} style={{ marginTop:20, padding:'12px 24px', borderRadius:14, background:'#0A84FF', border:'none', color:'#fff', fontWeight:700, cursor:'pointer' }}>
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  const roleColor = ROLE_COLOR[role] || '#0A84FF';

  return (
    <div style={S.screen}>
      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(10,132,255,0.4)} 50%{box-shadow:0 0 0 16px rgba(10,132,255,0)} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* ─── Tarjeta principal ─── */}
      <div style={{
        background:'#fff', borderRadius:28,
        width:'min(340px,90vw)',
        overflow:'hidden',
        boxShadow:'0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
        animation:'fadeIn 0.4s ease',
      }}>
        {/* Header */}
        <div style={{
          background:`linear-gradient(135deg,${roleColor},${roleColor}cc)`,
          padding:'18px 20px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', marginBottom:2 }}>
              CORP TECH · CARNET DIGITAL
            </div>
            <div style={{ color:'#fff', fontSize:16, fontWeight:800 }}>
              {ROLE_LABEL[role] || role?.toUpperCase()}
            </div>
          </div>
          <div style={{
            width:44, height:44, borderRadius:13,
            background:'rgba(255,255,255,0.95)',
            display:'flex', alignItems:'center', justifyContent:'center',
            overflow:'hidden',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Corp Tech" style={{ width:36, height:36, objectFit:'contain' }} />
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          {/* Avatar */}
          <div style={{
            width:72, height:72, borderRadius:22,
            background:`linear-gradient(135deg,${roleColor},${roleColor}88)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:34, color:'#fff', fontWeight:900, marginBottom:12,
            boxShadow:`0 6px 20px ${roleColor}44`,
          }}>
            {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          <div style={{ fontSize:20, fontWeight:800, color:'#111', marginBottom:2, textAlign:'center' }}>
            {profile.full_name}
          </div>
          <div style={{ fontSize:13, color:'#888', marginBottom:20 }}>{orgName}</div>

          {/* QR */}
          <div style={{
            padding:12, background:'#fff',
            borderRadius:18, border:'2px solid #f0f0f0',
            boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
            animation:'pulse 3s ease-in-out infinite',
          }}>
            <div ref={qrRef} style={{ lineHeight:0 }} />
          </div>

          <div style={{ marginTop:14, fontSize:11, color:'#bbb', letterSpacing:'0.12em', fontFamily:'monospace' }}>
            {userId?.slice(0, 8).toUpperCase()} · {userId?.slice(-4).toUpperCase()}
          </div>

          {/* Barra de estado */}
          <div style={{
            marginTop:20, padding:'8px 16px', borderRadius:20,
            background:`${roleColor}14`,
            border:`1px solid ${roleColor}30`,
            display:'flex', alignItems:'center', gap:6,
          }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#30D158' }} />
            <span style={{ fontSize:12, color:'#555', fontWeight:600 }}>Activo · Corp Tech ERP</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:'12px 20px',
          background:'#f8f8f8',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ fontSize:10, color:'#ccc' }}>Solo para uso interno</div>
          <div style={{ fontSize:10, color:'#ccc' }}>
            {new Date().getFullYear()} · Corp Tech
          </div>
        </div>
      </div>

      {/* ─── Botones debajo ─── */}
      <div style={{ marginTop:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12, width:'min(340px,90vw)' }}>
        <button
          onClick={() => setShowHelp(h => !h)}
          style={{
            width:'100%', padding:'14px', borderRadius:14,
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
            color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
        >
          {showHelp ? '▲ Ocultar instrucciones' : '📲 Cómo guardar en pantalla de inicio'}
        </button>

        {showHelp && (
          <div style={{
            width:'100%', borderRadius:16, overflow:'hidden',
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
          }}>
            {/* iOS */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:8 }}>
                🍎 iPhone / iPad (Safari)
              </div>
              {[
                'Toca el botón Compartir ⬆️ en la barra de Safari',
                'Desplázate y elige "Añadir a pantalla de inicio"',
                'Ponle el nombre "Carnet Corp Tech" y confirma',
                '¡Listo! Aparecerá como un app en tu inicio',
              ].map((t, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:5, alignItems:'flex-start' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>{i+1}.</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            {/* Android */}
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:8 }}>
                🤖 Android (Chrome)
              </div>
              {[
                'Toca el menú ⋮ en la esquina superior derecha',
                'Toca "Añadir a pantalla de inicio"',
                'Confirma el nombre y toca "Añadir"',
                '¡Aparecerá como ícono en tu inicio!',
              ].map((t, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:5, alignItems:'flex-start' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>{i+1}.</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push('/login')}
          style={{
            background:'none', border:'none',
            color:'rgba(255,255,255,0.25)', fontSize:13,
            cursor:'pointer', padding:'4px 0',
          }}
        >
          ← Ir al login
        </button>
      </div>
    </div>
  );
}

const S = {
  screen: {
    minHeight: '100dvh',
    background: 'radial-gradient(ellipse at top,#0d1117 0%,#050508 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Urbanist','Inter',sans-serif",
    padding: '24px 16px 48px',
  },
  spinner: {
    width: 44, height: 44,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#0A84FF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
