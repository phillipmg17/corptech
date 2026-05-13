'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function BiometricsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const qrPreviewRef  = useRef(null);   // div donde va el QR preview
  const qrLibLoaded   = useRef(false);

  const [loading,        setLoading]        = useState(true);
  const [profile,        setProfile]        = useState(null);
  const [userId,         setUserId]         = useState('');
  const [orgName,        setOrgName]        = useState('');
  const [role,           setRole]           = useState('');
  const [biometrics,     setBiometrics]     = useState([]);
  const [toast,          setToast]          = useState(null);
  const [registering,    setRegistering]    = useState(false);
  const [deviceName,     setDeviceName]     = useState('');
  const [showForm,       setShowForm]       = useState(false);
  const [savingImg,      setSavingImg]      = useState(false);
  const [showWallet,     setShowWallet]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qrUnlocked,     setQrUnlocked]     = useState(false);   // FaceID desbloqueó el QR
  const [unlocking,      setUnlocking]      = useState(false);

  /* ── cargar qrcodejs una sola vez ── */
  useEffect(() => {
    if (document.getElementById('qrcodejs')) { qrLibLoaded.current = true; return; }
    const s = document.createElement('script');
    s.id  = 'qrcodejs';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => { qrLibLoaded.current = true; };
    document.head.appendChild(s);
  }, []);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;
    setUserId(uid);

    const { data: prof }    = await supabase.from('users').select('*, organizations(name)').eq('id', uid).single();
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).maybeSingle();

    setProfile(prof);
    setOrgName(prof?.organizations?.name || 'Corp Tech');
    setRole(roleRow?.role || 'vendedor');

    const ua = navigator.userAgent;
    let dn = 'Mi dispositivo';
    if (/iPhone/.test(ua))       dn = 'iPhone';
    else if (/iPad/.test(ua))    dn = 'iPad';
    else if (/Mac/.test(ua))     dn = 'Mac';
    else if (/Android/.test(ua)) dn = 'Android';
    setDeviceName(dn);

    await loadBiometrics(uid);
    setLoading(false);
  }

  /* ── generar QR solo cuando está desbloqueado ── */
  useEffect(() => {
    if (!userId || !qrUnlocked || !qrPreviewRef.current) return;
    const tryRender = () => {
      if (!qrLibLoaded.current || !window.QRCode) {
        setTimeout(tryRender, 200);
        return;
      }
      qrPreviewRef.current.innerHTML = '';
      new window.QRCode(qrPreviewRef.current, {
        text:          `corptech:uid:${userId}`,
        width:         150,
        height:        150,
        colorDark:     '#0a0a0a',
        colorLight:    '#ffffff',
        correctLevel:  window.QRCode.CorrectLevel.H,
      });
    };
    tryRender();
  }, [userId, qrUnlocked]);

  /* ── Desbloquear QR con FaceID/Huella ── */
  async function unlockQR() {
    if (!window.PublicKeyCredential) { setQrUnlocked(true); return; } // Si no hay WebAuthn, mostrar directo
    setUnlocking(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: 'required',
          timeout: 60000,
        },
      });
      setQrUnlocked(true);
    } catch (err) {
      if (err.name !== 'NotAllowedError') setQrUnlocked(true); // si no hay cred aún, igual mostrar
    }
    setUnlocking(false);
  }

  async function loadBiometrics(uid) {
    const { data } = await supabase
      .from('biometric_keys')
      .select('id, device_name, credential_id, last_used')
      .eq('user_id', uid)
      .order('last_used', { ascending: false, nullsFirst: false });
    setBiometrics(data || []);
  }

  /* ── Guardar carnet como imagen PNG (QR generado inline, sin CORS) ── */
  async function saveCardAsImage() {
    if (!userId || !profile) return;
    setSavingImg(true);
    try {
      /* 1. Generar QR en div temporal con qrcodejs */
      await waitForQRLib();
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
      document.body.appendChild(tempDiv);

      await new Promise(resolve => {
        new window.QRCode(tempDiv, {
          text:         `corptech:uid:${userId}`,
          width:        220,
          height:       220,
          colorDark:    '#0a0a0a',
          colorLight:   '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.H,
        });
        setTimeout(resolve, 300); // esperar render
      });

      const qrCanvas = tempDiv.querySelector('canvas');

      /* 2. Dibujar la tarjeta principal */
      const canvas = document.createElement('canvas');
      const W = 760, H = 440;
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      /* fondo blanco */
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      rrect(ctx, 0, 0, W, H, 28);
      ctx.fill();

      /* franja superior azul */
      ctx.fillStyle = '#0A84FF';
      ctx.beginPath();
      rrect(ctx, 0, 0, W, 82, { tl:28, tr:28, bl:0, br:0 });
      ctx.fill();

      /* logo + nombre empresa */
      ctx.fillStyle = '#fff';
      ctx.font      = 'bold 18px Arial,sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('CORP TECH', 32, 41);

      /* rol */
      ctx.font      = '13px Arial,sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'right';
      ctx.fillText(role?.toUpperCase() || 'EMPLEADO', W - 32, 41);

      /* avatar circle */
      const ax = 68, ay = 82 + 90, ar = 48;
      ctx.beginPath();
      ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(ax - ar, ay - ar, ax + ar, ay + ar);
      grad.addColorStop(0, '#0A84FF');
      grad.addColorStop(1, '#5E5CE6');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.fillStyle    = '#fff';
      ctx.font         = 'bold 38px Arial,sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        profile?.full_name?.charAt(0)?.toUpperCase() || '?',
        ax, ay
      );

      /* nombre */
      ctx.fillStyle    = '#111';
      ctx.font         = 'bold 24px Arial,sans-serif';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(profile?.full_name || '—', 140, 82 + 64);

      /* empresa */
      ctx.fillStyle = '#666';
      ctx.font      = '15px Arial,sans-serif';
      ctx.fillText(orgName, 140, 82 + 90);

      /* ID corto */
      ctx.fillStyle = '#aaa';
      ctx.font      = '12px monospace';
      ctx.fillText('ID: ' + userId.slice(0, 8).toUpperCase(), 140, 82 + 114);

      /* línea */
      ctx.strokeStyle = '#efefef';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(32, 82 + 148);
      ctx.lineTo(W - 32, 82 + 148);
      ctx.stroke();

      /* instrucción */
      ctx.fillStyle    = '#999';
      ctx.font         = '13px Arial,sans-serif';
      ctx.textAlign    = 'left';
      ctx.fillText('Presenta este carnet para ingresar al sistema Corp Tech', 32, 82 + 172);

      /* QR desde canvas temporal */
      if (qrCanvas) {
        const qrX = W - 260, qrY = 100, qrS = 220;
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        rrect(ctx, qrX - 12, qrY - 12, qrS + 24, qrS + 24, 16);
        ctx.fill();
        ctx.drawImage(qrCanvas, qrX, qrY, qrS, qrS);

        ctx.fillStyle    = '#888';
        ctx.font         = '12px Arial,sans-serif';
        ctx.textAlign    = 'center';
        ctx.fillText('Escanear para acceder', qrX + qrS / 2, qrY + qrS + 20);
      }

      /* footer */
      ctx.fillStyle    = '#ccc';
      ctx.font         = '11px Arial,sans-serif';
      ctx.textAlign    = 'center';
      ctx.fillText('Corp Tech ERP · Sistema interno · No compartir con terceros', W / 2, H - 18);

      /* descargar */
      const link = document.createElement('a');
      link.download = `carnet-${(profile?.full_name || 'empleado').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      document.body.removeChild(tempDiv);
      showToast('✅ Carnet guardado como imagen', 'ok');
    } catch (err) {
      console.error(err);
      showToast('Error al generar imagen: ' + err.message, 'error');
    }
    setSavingImg(false);
  }

  function waitForQRLib() {
    return new Promise(resolve => {
      const check = () => (qrLibLoaded.current && window.QRCode) ? resolve() : setTimeout(check, 150);
      check();
    });
  }

  /* roundedRect helper */
  function rrect(ctx, x, y, w, h, r) {
    const R = typeof r === 'number' ? { tl:r, tr:r, bl:r, br:r } : r;
    ctx.moveTo(x + R.tl, y);
    ctx.lineTo(x + w - R.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + R.tr);
    ctx.lineTo(x + w, y + h - R.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - R.br, y + h);
    ctx.lineTo(x + R.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - R.bl);
    ctx.lineTo(x, y + R.tl);
    ctx.quadraticCurveTo(x, y, x + R.tl, y);
    ctx.closePath();
  }

  /* ── Abrir carnet en pantalla completa (para guardar en inicio / Wallet) ── */
  function openWalletCard() {
    window.open(`/carnet/${userId}`, '_blank');
  }

  /* ── Registrar biometría ── */
  async function registerBiometric() {
    if (!deviceName.trim()) { showToast('Ingresa un nombre para este dispositivo', 'error'); return; }
    if (!window.PublicKeyCredential) { showToast('Tu navegador no soporta biometría WebAuthn', 'error'); return; }

    setRegistering(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const uid8      = new TextEncoder().encode(userId);

      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp:   { name: 'Corp Tech ERP', id: window.location.hostname },
          user: { id: uid8, name: profile?.email || userId, displayName: profile?.full_name || 'Usuario' },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7   },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            userVerification:        'required',
            residentKey:             'preferred',
            authenticatorAttachment: 'platform',
          },
          timeout: 60000,
        },
      });

      if (!cred) { showToast('Registro cancelado', 'error'); setRegistering(false); return; }

      const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
      const { data: { session } } = await supabase.auth.getSession();

      // Extraer public key del response WebAuthn
      let publicKeyB64 = credIdBase64; // fallback: usar credId como placeholder
      try {
        if (cred.response.getPublicKey) {
          const pkBytes = cred.response.getPublicKey();
          if (pkBytes) publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pkBytes)));
        }
      } catch {}

      const { error } = await supabase.from('biometric_keys').upsert({
        user_id:       userId,
        credential_id: credIdBase64,
        device_id:     credIdBase64.slice(0, 36),
        device_name:   deviceName.trim(),
        public_key:    publicKeyB64,
        refresh_token: session?.refresh_token || null,
      }, { onConflict: 'credential_id' }); // multi-dispositivo: conflicto por credential, no por user

      if (error) throw error;

      showToast('✅ Biometría registrada exitosamente', 'ok');
      setShowForm(false);
      await loadBiometrics(userId);
    } catch (err) {
      if (err.name === 'NotAllowedError') showToast('Registro cancelado por el usuario', 'error');
      else showToast('Error: ' + err.message, 'error');
    }
    setRegistering(false);
  }

  async function deleteBiometric(id) {
    if (!confirm('¿Eliminar esta biometría? Deberás registrarla de nuevo para usar QR login.')) return;
    await supabase.from('biometric_keys').delete().eq('id', id);
    showToast('Biometría eliminada', 'ok');
    await loadBiometrics(userId);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
  }

  if (loading) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  const webAuthnSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  /* Nav completo según rol — mismo menú que el panel principal */
  const BADGE_COLOR = { superadmin:'#BF5AF2', corp:'#0A84FF', admin_corp:'#0A84FF', gerente:'#30D158', store_manager:'#30D158', store_admin:'#30D158', vendedor:'#FF9F0A' };

  const NAV_BY_ROLE = {
    superadmin: [
      { href:'/superadmin', ico:'⚡', lbl:'Dashboard'    },
      { href:'/superadmin', ico:'👥', lbl:'Usuarios'     },
      { href:'/superadmin', ico:'💎', lbl:'Créditos'     },
      { href:'/superadmin', ico:'🔑', lbl:'APIs'         },
      { href:'/superadmin', ico:'🧩', lbl:'Funciones'    },
    ],
    corp: [
      { href:'/corp', ico:'🏪', lbl:'Tiendas'      },
      { href:'/corp', ico:'📦', lbl:'Stock'        },
      { href:'/corp', ico:'💰', lbl:'Finanzas'     },
      { href:'/corp', ico:'💳', lbl:'Liquidaciones'},
      { href:'/corp', ico:'🏭', lbl:'Almacenes'    },
      { href:'/corp', ico:'🔄', lbl:'Traslados'    },
      { href:'/corp', ico:'📥', lbl:'Importación'  },
      { href:'/corp', ico:'🔍', lbl:'IMEI'         },
      { href:'/corp', ico:'📊', lbl:'Ventas'       },
      { href:'/corp', ico:'🗂️', lbl:'Catálogo'     },
      { href:'/corp', ico:'👥', lbl:'Equipo'       },
    ],
    store: [
      { href:'/store', ico:'📦', lbl:'Stock'    },
      { href:'/store', ico:'👥', lbl:'Clientes' },
      { href:'/store', ico:'📊', lbl:'Ventas'   },
      { href:'/store', ico:'💳', lbl:'Deudas'   },
      { href:'/store', ico:'⚙️', lbl:'Config'   },
    ],
    dashboard: [
      { href:'/dashboard', ico:'🏠', lbl:'Inicio'   },
      { href:'/dashboard', ico:'📦', lbl:'Stock'    },
      { href:'/dashboard', ico:'👥', lbl:'Clientes' },
      { href:'/dashboard', ico:'📊', lbl:'Ventas'   },
    ],
  };
  const roleGroup = ['corp','admin_corp'].includes(role) ? 'corp'
                  : ['gerente','store_manager','store_admin'].includes(role) ? 'store'
                  : role === 'superadmin' ? 'superadmin'
                  : 'dashboard';
  const BIO_NAV = [
    ...NAV_BY_ROLE[roleGroup],
    { id:'carnet', ico:'🔐', lbl:'Mi Carnet QR' },  // activo
  ];

  return (
    <div className="page-wrap">

      {/* ── MOBILE NAV HEADER ── */}
      <div className="mobile-nav-header">
        <div className="mobile-nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Corp Tech" />
          <div className="mobile-nav-title">
            <span>{orgName}</span>
            <span>Mi Carnet QR</span>
          </div>
        </div>
        <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(o => !o)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-nav-drawer${mobileMenuOpen ? ' open' : ''}`}>
        {BIO_NAV.map(t => (
          t.href
            ? <Link key={t.href} href={t.href} className="tab-btn" onClick={() => setMobileMenuOpen(false)}><span className="ico">{t.ico}</span>{t.lbl}</Link>
            : <button key={t.id} className="tab-btn active" onClick={() => setMobileMenuOpen(false)}><span className="ico">{t.ico}</span>{t.lbl}</button>
        ))}
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <button onClick={toggleTheme} style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 0', color:'var(--text2)', cursor:'pointer', fontSize:18 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      {/* ── SIDEBAR DESKTOP ── */}
      <div className="tab-bar tab-bar-branded">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top">
            <div className="sidebar-brand-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Corp Tech" />
            </div>
            <div className="sidebar-brand-info">
              <div className="sidebar-brand-name-row">
                <div className="sidebar-brand-company">{orgName}</div>
                <span className="sidebar-brand-badge" style={{ background: BADGE_COLOR[role] || '#0A84FF' }}>{role?.toUpperCase()?.slice(0,4)}</span>
              </div>
              <div className="sidebar-brand-user">{profile?.full_name}</div>
            </div>
          </div>
          <div className="sidebar-brand-actions">
            <button onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            <button onClick={() => router.push(BIO_NAV[0]?.href || '/dashboard')}>← Salir</button>
          </div>
        </div>
        {BIO_NAV.map(t => (
          t.href
            ? <Link key={t.href} href={t.href} className="tab-btn"><span className="ico">{t.ico}</span>{t.lbl}</Link>
            : <button key={t.id} className="tab-btn active"><span className="ico">{t.ico}</span>{t.lbl}</button>
        ))}
        <div className="sidebar-footer">
          Desarrollado por<br />
          <a href="https://pmg-studio.com" target="_blank" rel="noopener noreferrer">pmg-studio.com</a>
        </div>
      </div>

      <div className="content-no-topbar" style={{ padding:24, maxWidth:680, margin:'0 auto' }}>

        {/* ─── CARNET VISUAL ─── */}
        <div style={{
          background:'linear-gradient(135deg,#0A84FF18,#5E5CE618)',
          border:'1px solid rgba(10,132,255,0.25)',
          borderRadius:20, padding:24, marginBottom:20,
          display:'flex', flexDirection:'column', alignItems:'center',
        }}>
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Tu Carnet Digital
          </div>

          {/* Tarjeta preview */}
          <div style={{
            background:'#fff', borderRadius:18, overflow:'hidden',
            width:230, boxShadow:'0 12px 48px rgba(0,0,0,0.45)',
          }}>
            <div style={{
              background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
              padding:'11px 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ color:'#fff', fontWeight:800, fontSize:13, letterSpacing:'0.05em' }}>🏢 CORP TECH</div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:10, fontWeight:700 }}>
                {role?.toUpperCase()}
              </div>
            </div>
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{
                width:52, height:52, borderRadius:14,
                background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:24, color:'#fff', fontWeight:800, marginBottom:8,
              }}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:2, textAlign:'center' }}>
                {profile?.full_name}
              </div>
              <div style={{ fontSize:10, color:'#888', marginBottom:12 }}>{orgName}</div>

              {/* QR — bloqueado por FaceID hasta que el usuario verifique */}
              {qrUnlocked ? (
                <div ref={qrPreviewRef} style={{ borderRadius:10, overflow:'hidden', background:'#fff', lineHeight:0 }} />
              ) : (
                <div style={{ width:150, height:150, borderRadius:12, background:'#f0f0f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer' }}
                  onClick={unlockQR}>
                  <div style={{ fontSize:36 }}>{unlocking ? '⏳' : '🔐'}</div>
                  <div style={{ fontSize:10, color:'#888', fontWeight:700, textAlign:'center', lineHeight:1.4 }}>
                    {unlocking ? 'Verificando...' : 'Toca para\nver QR'}
                  </div>
                </div>
              )}

              <div style={{ fontSize:9, color:'#bbb', marginTop:8 }}>
                {userId.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* ─── Botones ─── */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:18, width:'100%', maxWidth:320 }}>

            {/* Guardar en inicio / Wallet */}
            <button
              onClick={openWalletCard}
              style={{
                width:'100%', padding:'14px 16px', borderRadius:14,
                background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                border:'none', color:'#fff', fontSize:14, fontWeight:700,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:'0 6px 24px rgba(10,132,255,0.35)',
              }}
            >
              <span style={{ fontSize:18 }}>📲</span>
              Abrir carnet (guardar en Inicio)
            </button>

            <div style={{ display:'flex', gap:10 }}>
              {/* Descargar imagen */}
              <button
                onClick={saveCardAsImage}
                disabled={savingImg}
                style={{
                  flex:1, padding:'12px', borderRadius:13,
                  background:'rgba(10,132,255,0.15)',
                  border:'1px solid rgba(10,132,255,0.3)',
                  color:'#4DA8FF', fontSize:13, fontWeight:700,
                  cursor: savingImg ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  opacity: savingImg ? 0.6 : 1,
                }}
              >
                {savingImg ? '⏳...' : '🖼️ Guardar imagen'}
              </button>
            </div>
          </div>

          {/* Instrucción wallet */}
          <div style={{
            marginTop:12, padding:'12px 14px', borderRadius:12,
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.7,
            width:'100%', maxWidth:320, textAlign:'center',
          }}>
            <b style={{ color:'rgba(255,255,255,0.5)' }}>📲 Cómo guardarlo como acceso directo:</b><br/>
            iPhone: abre el carnet → toca Compartir <b>⬆️</b> → <i>"Añadir a pantalla de inicio"</i><br/>
            Android: toca Menú <b>⋮</b> → <i>"Añadir a pantalla de inicio"</i>
          </div>
        </div>

        {/* ─── DISPOSITIVOS ─── */}
        <div className="section-title">🔐 Dispositivos registrados</div>

        {!webAuthnSupported && (
          <div style={{ background:'rgba(255,159,10,0.12)', border:'1px solid rgba(255,159,10,0.25)', borderRadius:12, padding:'12px 16px', color:'#FF9F0A', fontSize:13, marginBottom:16 }}>
            ⚠️ Tu navegador no soporta biometría. Usa Safari en iPhone/Mac o Chrome actualizado.
          </div>
        )}

        {biometrics.length === 0 ? (
          <div style={{ background:'var(--card)', borderRadius:16, padding:20, textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📵</div>
            <div style={{ color:'var(--text-muted)', fontSize:14 }}>No tienes biometría registrada.</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>Regístrala abajo para acceder con QR + FaceID.</div>
          </div>
        ) : (
          <div className="card" style={{ marginBottom:16 }}>
            {biometrics.map(b => (
              <div key={b.id} className="list-item">
                <div className="list-item-ico">📱</div>
                <div className="list-item-body">
                  <div className="list-item-name">{b.device_name || 'Dispositivo'}</div>
                  <div className="list-item-sub">
                    Último uso: {fmtDate(b.last_used) || 'Nunca'}
                  </div>
                </div>
                <button onClick={() => deleteBiometric(b.id)} style={{
                  background:'none', border:'none', color:'#FF453A',
                  fontSize:18, cursor:'pointer', padding:'4px 8px',
                }}>🗑</button>
              </div>
            ))}
          </div>
        )}

        {/* Registrar nuevo dispositivo */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} disabled={!webAuthnSupported} style={{
            width:'100%', padding:'14px', borderRadius:16,
            background: webAuthnSupported ? 'linear-gradient(135deg,#0A84FF,#5E5CE6)' : 'var(--card)',
            border:'none', color: webAuthnSupported ? '#fff' : 'var(--text-muted)',
            fontSize:15, fontWeight:700, cursor: webAuthnSupported ? 'pointer' : 'not-allowed',
            boxShadow: webAuthnSupported ? '0 4px 20px rgba(10,132,255,0.3)' : 'none',
          }}>
            + Registrar FaceID / Huella en este dispositivo
          </button>
        ) : (
          <div style={{ background:'var(--card)', borderRadius:16, padding:20, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Nuevo dispositivo</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
              Se abrirá FaceID o huella dactilar. Solo funciona en este dispositivo.
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del dispositivo</label>
              <input className="form-input" value={deviceName} onChange={e => setDeviceName(e.target.value)} placeholder="ej. iPhone de Phillip" />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex:1, padding:'12px', borderRadius:14,
                background:'var(--surface)', border:'1px solid var(--border)',
                color:'var(--text-muted)', fontSize:14, cursor:'pointer',
              }}>Cancelar</button>
              <button onClick={registerBiometric} disabled={registering} style={{
                flex:2, padding:'12px', borderRadius:14,
                background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
              }}>
                {registering ? '⏳ Esperando...' : '🔐 Registrar FaceID / Huella'}
              </button>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div style={{ marginTop:24, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px 18px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:10 }}>¿Cómo funciona?</div>
          {[
            ['1️⃣', 'Registra tu FaceID/huella en este dispositivo.'],
            ['2️⃣', 'Pulsa "Abrir carnet" y guárdalo en tu pantalla de inicio.'],
            ['3️⃣', 'En el login, elige "Acceso QR" y escanea tu carnet.'],
            ['4️⃣', 'La primera vez ingresa tu contraseña para vincular el dispositivo.'],
            ['5️⃣', 'Desde la próxima vez: solo QR + FaceID, sin contraseña.'],
          ].map(([n, t]) => (
            <div key={n} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{n}</span>
              <span style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5 }}>{t}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
