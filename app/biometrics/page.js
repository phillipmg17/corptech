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
  const cardRef = useRef(null);

  const [loading,     setLoading]     = useState(true);
  const [profile,     setProfile]     = useState(null);
  const [userId,      setUserId]      = useState('');
  const [orgName,     setOrgName]     = useState('');
  const [role,        setRole]        = useState('');
  const [biometrics,  setBiometrics]  = useState([]);
  const [toast,       setToast]       = useState(null);
  const [registering, setRegistering] = useState(false);
  const [deviceName,  setDeviceName]  = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [qrUrl,       setQrUrl]       = useState('');
  const [savingImg,   setSavingImg]   = useState(false);

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

    const qrData = encodeURIComponent(`corptech:uid:${uid}`);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}&color=0A0A0A&bgcolor=ffffff&qzone=2&format=png`);

    await loadBiometrics(uid);
    setLoading(false);
  }

  async function loadBiometrics(uid) {
    const { data } = await supabase
      .from('biometric_keys')
      .select('id, device_name, credential_id, last_used, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    setBiometrics(data || []);
  }

  /* ── Guardar carnet como imagen PNG ── */
  async function saveCardAsImage() {
    if (!qrUrl || !profile) return;
    setSavingImg(true);
    try {
      // Crear canvas
      const canvas  = document.createElement('canvas');
      const W = 800, H = 480;
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      /* fondo blanco con esquinas redondeadas */
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 0, 0, W, H, 32);
      ctx.fill();

      /* barra superior azul */
      ctx.fillStyle = '#0A84FF';
      roundRect(ctx, 0, 0, W, 90, { tl:32, tr:32, bl:0, br:0 });
      ctx.fill();

      /* texto "CORP TECH" en la barra */
      ctx.fillStyle = '#ffffff';
      ctx.font      = 'bold 20px Urbanist,Inter,Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🏢  CORP TECH', 40, 56);

      /* rol en la esquina */
      ctx.font      = '14px Urbanist,Inter,Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(role?.toUpperCase() || 'EMPLEADO', W - 40, 56);

      /* avatar círculo */
      ctx.fillStyle = 'linear-gradient(135deg,#0A84FF,#5E5CE6)';
      const avatarX = 60, avatarY = 150, avatarR = 50;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(avatarX - avatarR, avatarY - avatarR, avatarX + avatarR, avatarY + avatarR);
      grad.addColorStop(0, '#0A84FF');
      grad.addColorStop(1, '#5E5CE6');
      ctx.fillStyle = grad;
      ctx.fill();

      /* inicial en el avatar */
      ctx.fillStyle   = '#fff';
      ctx.font        = 'bold 40px Urbanist,Inter,Arial';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(profile?.full_name?.charAt(0)?.toUpperCase() || '?', avatarX, avatarY);
      ctx.textBaseline = 'alphabetic';

      /* nombre */
      ctx.fillStyle   = '#111111';
      ctx.font        = 'bold 26px Urbanist,Inter,Arial';
      ctx.textAlign   = 'left';
      ctx.fillText(profile?.full_name || '—', 130, 130);

      /* empresa */
      ctx.fillStyle = '#666';
      ctx.font      = '16px Urbanist,Inter,Arial';
      ctx.fillText(orgName, 130, 158);

      /* ID */
      ctx.fillStyle = '#aaa';
      ctx.font      = '13px monospace';
      ctx.fillText('ID: ' + userId.slice(0,8).toUpperCase() + '...', 130, 182);

      /* línea separadora */
      ctx.strokeStyle = '#eee';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(40, 215);
      ctx.lineTo(W - 40, 215);
      ctx.stroke();

      /* texto instrucción */
      ctx.fillStyle   = '#999';
      ctx.font        = '14px Urbanist,Inter,Arial';
      ctx.textAlign   = 'left';
      ctx.fillText('Presenta este carnet para acceder al sistema Corp Tech', 40, 250);

      /* cargar imagen QR */
      const qrImg = await loadImage(qrUrl);
      const qrSize = 200;
      const qrX = W - qrSize - 50;
      const qrY = 110;

      /* fondo blanco para QR */
      ctx.fillStyle = '#f8f8f8';
      roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
      ctx.fill();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      /* "Escanea para acceder" */
      ctx.fillStyle   = '#888';
      ctx.font        = '12px Urbanist,Inter,Arial';
      ctx.textAlign   = 'center';
      ctx.fillText('Escanea para acceder', qrX + qrSize / 2, qrY + qrSize + 20);

      /* footer */
      ctx.fillStyle   = '#ccc';
      ctx.font        = '12px Urbanist,Inter,Arial';
      ctx.textAlign   = 'center';
      ctx.fillText('Corp Tech ERP · Sistema interno · No compartir con terceros', W / 2, H - 22);

      /* descargar */
      const link = document.createElement('a');
      link.download = `carnet-${(profile?.full_name || 'empleado').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      showToast('✅ Carnet guardado como imagen', 'ok');
    } catch (err) {
      console.error(err);
      showToast('Error al generar imagen. Intenta descargar solo el QR.', 'error');
    }
    setSavingImg(false);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = typeof r === 'number'
      ? { tl: r, tr: r, bl: r, br: r }
      : r;
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + w - radius.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
    ctx.lineTo(x + w, y + h - radius.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
    ctx.lineTo(x + radius.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
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
      const refreshToken = session?.refresh_token || null;

      const { error } = await supabase.from('biometric_keys').upsert({
        user_id:       userId,
        credential_id: credIdBase64,
        device_name:   deviceName.trim(),
        refresh_token: refreshToken,
        created_at:    new Date().toISOString(),
      }, { onConflict: 'user_id' });

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

  return (
    <div className="page-wrap">
      {/* TOP BAR */}
      <div className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/dashboard" style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer', textDecoration:'none' }}>←</Link>
          <div>
            <div className="top-bar-title">🔐 Biometría y Carnet</div>
            <div className="top-bar-sub">{orgName}</div>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>{theme==='dark'?'☀️':'🌙'}</button>
      </div>

      {toast && <div className="toast-wrap"><div className={`toast-msg ${toast.type}`}>{toast.msg}</div></div>}

      <div className="content" style={{ padding:16 }}>

        {/* CARNET VISUAL */}
        <div style={{
          background:'linear-gradient(135deg,#0A84FF18,#5E5CE618)',
          border:'1px solid rgba(10,132,255,0.25)',
          borderRadius:20, padding:24, marginBottom:20,
          display:'flex', flexDirection:'column', alignItems:'center',
        }}>
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Tu Carnet Digital
          </div>

          {/* Carnet preview */}
          <div ref={cardRef} style={{
            background:'#fff', borderRadius:18, overflow:'hidden',
            width:240, boxShadow:'0 10px 40px rgba(0,0,0,0.4)',
          }}>
            {/* Header azul */}
            <div style={{
              background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
              padding:'12px 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ color:'#fff', fontWeight:800, fontSize:13 }}>🏢 CORP TECH</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:10, fontWeight:600 }}>
                {role?.toUpperCase()}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', alignItems:'center' }}>
              {/* Avatar */}
              <div style={{
                width:56, height:56, borderRadius:16,
                background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26, color:'#fff', fontWeight:800, marginBottom:8,
              }}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:2, textAlign:'center' }}>
                {profile?.full_name}
              </div>
              <div style={{ fontSize:10, color:'#888', marginBottom:12 }}>{orgName}</div>

              {qrUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR Carnet" width={150} height={150} style={{ borderRadius:10 }} />
              )}
              <div style={{ fontSize:9, color:'#bbb', marginTop:8 }}>
                {userId.slice(0,8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Botones guardar */}
          <div style={{ display:'flex', gap:10, marginTop:18, width:'100%', maxWidth:320 }}>
            <button
              onClick={saveCardAsImage}
              disabled={savingImg}
              style={{
                flex:1, padding:'12px', borderRadius:13,
                background: savingImg ? 'rgba(10,132,255,0.3)' : 'rgba(10,132,255,0.15)',
                border:'1px solid rgba(10,132,255,0.3)',
                color:'#4DA8FF', fontSize:13, fontWeight:700,
                cursor: savingImg ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}
            >
              {savingImg ? '⏳...' : '🖼️ Carnet completo'}
            </button>

            <a
              href={qrUrl}
              download="qr-carnet.png"
              style={{
                flex:1, padding:'12px', borderRadius:13,
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.12)',
                color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:700,
                textDecoration:'none', textAlign:'center',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}
            >
              📷 Solo QR
            </a>
          </div>

          {/* Nota wallet */}
          <div style={{
            marginTop:14, padding:'10px 14px', borderRadius:12,
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            fontSize:12, color:'rgba(255,255,255,0.35)', textAlign:'center', lineHeight:1.6, width:'100%', maxWidth:320,
          }}>
            💡 En iPhone: descarga la imagen → guárdala en Fotos → desde Safari puedes agregarla a Wallet con Shortcuts.
          </div>
        </div>

        {/* DISPOSITIVOS REGISTRADOS */}
        <div className="section-title">🔐 Dispositivos registrados</div>

        {!webAuthnSupported && (
          <div style={{ background:'rgba(255,159,10,0.12)', border:'1px solid rgba(255,159,10,0.25)', borderRadius:12, padding:'12px 16px', color:'#FF9F0A', fontSize:13, marginBottom:16 }}>
            ⚠️ Tu navegador no soporta biometría WebAuthn. Usa Safari en iPhone/Mac o Chrome actualizado.
          </div>
        )}

        {biometrics.length === 0 ? (
          <div style={{ background:'var(--card)', borderRadius:16, padding:20, textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📵</div>
            <div style={{ color:'var(--text-muted)', fontSize:14 }}>No tienes biometría registrada todavía.</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>Regístrala para poder acceder con QR + FaceID.</div>
          </div>
        ) : (
          <div className="card" style={{ marginBottom:16 }}>
            {biometrics.map(b => (
              <div key={b.id} className="list-item">
                <div className="list-item-ico">📱</div>
                <div className="list-item-body">
                  <div className="list-item-name">{b.device_name || 'Dispositivo'}</div>
                  <div className="list-item-sub">
                    Registrado: {fmtDate(b.created_at)} · Último uso: {fmtDate(b.last_used)}
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

        {/* REGISTRAR NUEVO */}
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
              Se abrirá FaceID o huella dactilar para verificar tu identidad.
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del dispositivo</label>
              <input
                className="form-input"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder="ej. iPhone de Phillip"
              />
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
                boxShadow:'0 4px 16px rgba(10,132,255,0.3)',
              }}>
                {registering ? '⏳ Esperando biometría...' : '🔐 Registrar FaceID / Huella'}
              </button>
            </div>
          </div>
        )}

        {/* INSTRUCCIONES */}
        <div style={{ marginTop:24, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px 18px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:10 }}>¿Cómo funciona?</div>
          {[
            ['1️⃣', 'Registra tu FaceID/huella en este dispositivo (botón de arriba).'],
            ['2️⃣', 'Descarga tu carnet como imagen y guárdala en tu teléfono.'],
            ['3️⃣', 'En el login, elige "Acceso QR" y escanea tu carnet.'],
            ['4️⃣', 'La primera vez ingresa tu contraseña para vincular el dispositivo.'],
            ['5️⃣', 'Desde la próxima vez, confirma con FaceID/huella — ¡sin contraseña!'],
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
