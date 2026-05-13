'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function QRLoginPage() {
  const router     = useRouter();
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const scannerRef = useRef(null);

  const [step,       setStep]       = useState('scan'); // scan | loading | confirm | register | error
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [cameraOk,   setCameraOk]   = useState(false);
  const [foundUser,  setFoundUser]  = useState(null);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [manualId,   setManualId]   = useState('');
  const [showManual, setShowManual] = useState(false);

  /* registro */
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading,  setRegLoading]  = useState(false);

  /* ── cargar jsQR ── */
  useEffect(() => {
    const s = document.createElement('script');
    s.src    = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    s.onload = () => setJsQRLoaded(true);
    document.head.appendChild(s);
    return () => stopCamera();
  }, []);

  useEffect(() => { if (jsQRLoaded) startCamera(); }, [jsQRLoaded]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraOk(true);
        startScanLoop();
      }
    } catch {
      setShowManual(true);
    }
  }

  function stopCamera() {
    clearInterval(scannerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  function startScanLoop() {
    scannerRef.current = setInterval(() => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !window.jsQR || video.readyState !== 4) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        clearInterval(scannerRef.current);
        handleQRData(code.data);
      }
    }, 300);
  }

  async function handleQRData(raw) {
    try {
      let uid = raw;
      if (raw.startsWith('corptech:uid:')) uid = raw.split('corptech:uid:')[1];
      await lookupUser(uid);
    } catch {
      setErrorMsg('QR inválido. Intenta de nuevo.');
      setStep('error');
    }
  }

  async function lookupUser(uid) {
    setStep('loading');
    const { data: prof } = await supabase
      .from('users')
      .select('id, full_name, org_id, email, organizations(name)')
      .eq('id', uid)
      .maybeSingle();

    if (!prof) { setErrorMsg('Usuario no encontrado.'); setStep('error'); return; }

    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', uid).maybeSingle();

    const { data: bk } = await supabase
      .from('biometric_keys').select('credential_id, device_name').eq('user_id', uid).maybeSingle();

    stopCamera();

    const user = {
      id:            prof.id,
      full_name:     prof.full_name,
      email:         prof.email || '',
      org_name:      prof.organizations?.name || 'Corp Tech',
      role:          roleRow?.role || 'vendedor',
      credential_id: bk?.credential_id || null,
      device_name:   bk?.device_name   || null,
    };
    setFoundUser(user);

    /* si no tiene biometría registrada → paso de registro */
    if (!bk?.credential_id) {
      setStep('register');
    } else {
      setStep('confirm');
    }
  }

  async function doManualSearch() {
    if (!manualId.trim()) return;
    await lookupUser(manualId.trim());
  }

  /* ── REGISTRO: email+password → WebAuthn → guardar ── */
  async function doRegisterBiometric(e) {
    e.preventDefault();
    if (!regEmail || !regPassword) return;
    setRegLoading(true);
    setErrorMsg('');

    try {
      /* 1. Verificar identidad con contraseña */
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: regEmail, password: regPassword,
      });

      if (authErr || !authData.session) {
        setErrorMsg('Correo o contraseña incorrectos.');
        setRegLoading(false);
        return;
      }

      /* 2. Verificar que coincide con el QR escaneado */
      if (authData.user.id !== foundUser.id) {
        setErrorMsg('Las credenciales no corresponden a este carnet QR.');
        await supabase.auth.signOut();
        setRegLoading(false);
        return;
      }

      /* 3. Registrar WebAuthn si está disponible */
      if (window.PublicKeyCredential) {
        try {
          const challenge = crypto.getRandomValues(new Uint8Array(32));
          const uid8      = new TextEncoder().encode(foundUser.id);

          const cred = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp:   { name: 'Corp Tech ERP', id: window.location.hostname },
              user: { id: uid8, name: regEmail, displayName: foundUser.full_name || 'Usuario' },
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

          if (cred) {
            const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
            const ua = navigator.userAgent;
            let dn = 'Dispositivo';
            if (/iPhone/.test(ua))       dn = 'iPhone';
            else if (/iPad/.test(ua))    dn = 'iPad';
            else if (/Mac/.test(ua))     dn = 'Mac';
            else if (/Android/.test(ua)) dn = 'Android';

            await supabase.from('biometric_keys').upsert({
              user_id:       foundUser.id,
              credential_id: credIdBase64,
              device_name:   dn,
              refresh_token: authData.session.refresh_token,
              created_at:    new Date().toISOString(),
            }, { onConflict: 'user_id' });
          }
        } catch (webAuthnErr) {
          /* si el usuario cancela WebAuthn, igual lo logueamos */
          if (webAuthnErr.name !== 'NotAllowedError') console.warn('WebAuthn:', webAuthnErr.message);
        }
      }

      /* 4. Redirigir */
      redirectByRole(foundUser.role);

    } catch (err) {
      setErrorMsg('Error inesperado: ' + err.message);
    }
    setRegLoading(false);
  }

  /* ── LOGIN BIOMÉTRICO (ya tiene clave guardada) ── */
  async function confirmBiometric() {
    setStep('loading');
    try {
      const credId      = foundUser.credential_id;
      const credIdBytes = Uint8Array.from(atob(credId), c => c.charCodeAt(0));
      const challenge   = crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: credIdBytes }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (!assertion) { setErrorMsg('Verificación cancelada.'); setStep('confirm'); return; }

      const { data: bk } = await supabase
        .from('biometric_keys')
        .select('refresh_token')
        .eq('user_id', foundUser.id)
        .single();

      if (!bk?.refresh_token) {
        setErrorMsg('Sesión biométrica expirada. Escanea de nuevo e ingresa tu contraseña para renovarla.');
        setStep('error');
        return;
      }

      const { data: { session }, error } = await supabase.auth.refreshSession({
        refresh_token: bk.refresh_token,
      });

      if (error || !session) {
        setErrorMsg('Sesión expirada. Escanea de nuevo e ingresa tu contraseña para renovarla.');
        setStep('error');
        return;
      }

      await supabase.from('biometric_keys').update({
        refresh_token: session.refresh_token,
        last_used:     new Date().toISOString(),
      }).eq('user_id', foundUser.id);

      redirectByRole(foundUser.role);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Verificación biométrica denegada o cancelada.');
      } else {
        setErrorMsg('Error de autenticación: ' + err.message);
      }
      setStep('confirm');
    }
  }

  function redirectByRole(r) {
    if (r === 'superadmin')                                                      router.replace('/superadmin');
    else if (r === 'corp' || r === 'admin_corp')                                 router.replace('/corp');
    else if (r === 'store_manager' || r === 'gerente' || r === 'store_admin')   router.replace('/store');
    else                                                                          router.replace('/pos');
  }

  function retry() {
    setStep('scan');
    setFoundUser(null);
    setErrorMsg('');
    setRegEmail('');
    setRegPassword('');
    startCamera();
  }

  const ROLE_LABEL = {
    superadmin:    '⚡ Super Admin',
    corp:          '🏢 Corporación',
    admin_corp:    '🏢 Admin Corp',
    gerente:       '👔 Gerente',
    store_manager: '👔 Gerente',
    store_admin:   '🏪 Admin Tienda',
    vendedor:      '🛒 Vendedor',
    seller:        '🛒 Vendedor',
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#050508',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Urbanist','Inter',sans-serif",
      padding: '0 0 40px',
      userSelect: 'none',
    }}>
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine { 0%{top:10%} 100%{top:88%} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        input::placeholder  { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* Header */}
      <div style={{ position:'fixed', top:0, left:0, right:0, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:10, backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'#fff', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Corp Tech" style={{ width:28, height:28, objectFit:'contain' }} />
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Corp Tech</span>
        </div>
        <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textDecoration:'none', fontWeight:600 }}>
          Contraseña →
        </Link>
      </div>

      {/* ── SCAN ── */}
      {step === 'scan' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', padding:'60px 20px 0', animation:'slideUp 0.3s ease' }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:10 }}>
            Acceso con Carnet QR
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:6 }}>Escanea tu carnet</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:32, textAlign:'center', lineHeight:1.6 }}>
            Apunta la cámara al código QR<br/>de tu carnet de trabajo
          </div>

          <div style={{ position:'relative', width:264, height:264, borderRadius:24, overflow:'hidden', background:'#111', boxShadow:'0 0 0 3px rgba(10,132,255,0.35)', marginBottom:28 }}>
            <video ref={videoRef} playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <canvas ref={canvasRef} style={{ display:'none' }} />

            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{
                position:'absolute',
                top:    c.startsWith('t') ? 12 : 'auto',
                bottom: c.startsWith('b') ? 12 : 'auto',
                left:   c.endsWith('l')   ? 12 : 'auto',
                right:  c.endsWith('r')   ? 12 : 'auto',
                width:28, height:28,
                borderTop:    c.startsWith('t') ? '3px solid #0A84FF' : 'none',
                borderBottom: c.startsWith('b') ? '3px solid #0A84FF' : 'none',
                borderLeft:   c.endsWith('l')   ? '3px solid #0A84FF' : 'none',
                borderRight:  c.endsWith('r')   ? '3px solid #0A84FF' : 'none',
                borderRadius: c==='tl'?'6px 0 0 0':c==='tr'?'0 6px 0 0':c==='bl'?'0 0 0 6px':'0 0 6px 0',
              }} />
            ))}

            {cameraOk && (
              <div style={{
                position:'absolute', left:20, right:20, height:2,
                background:'linear-gradient(90deg,transparent,#0A84FF,transparent)',
                animation:'scanLine 2s ease-in-out infinite alternate',
                borderRadius:2,
              }} />
            )}

            {!cameraOk && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:13, textAlign:'center', padding:20 }}>
                {jsQRLoaded ? 'Sin acceso a cámara' : 'Iniciando cámara...'}
              </div>
            )}
          </div>

          {showManual && (
            <div style={{ width:'100%', maxWidth:300, marginBottom:16 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8, textAlign:'center' }}>O ingresa tu ID de empleado:</div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  placeholder="UUID del usuario..."
                  style={{ flex:1, padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit' }}
                />
                <button onClick={doManualSearch} style={{ padding:'10px 16px', borderRadius:12, background:'#0A84FF', border:'none', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  Buscar
                </button>
              </div>
            </div>
          )}

          <button onClick={() => setShowManual(o => !o)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:13, cursor:'pointer', padding:'4px 0' }}>
            {showManual ? 'Ocultar entrada manual' : '¿Sin cámara? Ingresa manualmente'}
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {step === 'loading' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, animation:'slideUp 0.2s ease' }}>
          <div style={{ width:52, height:52, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#0A84FF', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:15 }}>Verificando...</div>
        </div>
      )}

      {/* ── CONFIRM (tiene biometría) ── */}
      {step === 'confirm' && foundUser && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 24px 0', maxWidth:360, width:'100%', animation:'slideUp 0.3s ease' }}>
          <div style={{
            width:88, height:88, borderRadius:28,
            background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:40, marginBottom:16,
            boxShadow:'0 8px 32px rgba(10,132,255,0.4)',
          }}>
            {foundUser.full_name?.charAt(0)?.toUpperCase() || '👤'}
          </div>

          <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>{foundUser.full_name}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>{foundUser.org_name}</div>
          <div style={{
            padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:600,
            background:'rgba(10,132,255,0.15)', color:'#4DA8FF', marginBottom:36,
          }}>
            {ROLE_LABEL[foundUser.role] || foundUser.role}
          </div>

          {errorMsg && (
            <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.25)', borderRadius:12, padding:'10px 16px', color:'#FF6B60', fontSize:13, marginBottom:20, textAlign:'center', width:'100%' }}>
              {errorMsg}
            </div>
          )}

          <button onClick={confirmBiometric} style={{
            width:'100%', padding:'16px', borderRadius:16,
            background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
            border:'none', color:'#fff', fontSize:16, fontWeight:700,
            cursor:'pointer', marginBottom:14,
            boxShadow:'0 8px 28px rgba(10,132,255,0.35)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
            <span style={{ fontSize:22 }}>🔐</span>
            Confirmar con FaceID / Huella
          </button>

          <button onClick={retry} style={{
            background:'none', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:14, padding:'12px', width:'100%',
            color:'rgba(255,255,255,0.5)', fontSize:14, cursor:'pointer',
          }}>
            ← Escanear otro carnet
          </button>
        </div>
      )}

      {/* ── REGISTER (primera vez en este dispositivo) ── */}
      {step === 'register' && foundUser && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 24px 20px', maxWidth:360, width:'100%', animation:'slideUp 0.3s ease' }}>
          <div style={{
            width:78, height:78, borderRadius:24,
            background:'linear-gradient(135deg,#30D158,#34C759)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:36, marginBottom:14,
            boxShadow:'0 8px 28px rgba(48,209,88,0.35)',
          }}>
            {foundUser.full_name?.charAt(0)?.toUpperCase() || '👤'}
          </div>

          <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:2 }}>{foundUser.full_name}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>{foundUser.org_name}</div>
          <div style={{
            padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:600,
            background:'rgba(48,209,88,0.15)', color:'#30D158', marginBottom:16,
          }}>
            {ROLE_LABEL[foundUser.role] || foundUser.role}
          </div>

          <div style={{
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:14, padding:'12px 16px', marginBottom:20, width:'100%',
            fontSize:13, color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:1.6,
          }}>
            📲 Primera vez en este dispositivo.<br/>
            Ingresa tu contraseña para vincular tu FaceID o huella.
          </div>

          {errorMsg && (
            <div style={{ background:'rgba(255,59,48,0.12)', border:'1px solid rgba(255,59,48,0.25)', borderRadius:12, padding:'10px 16px', color:'#FF6B60', fontSize:13, marginBottom:16, textAlign:'center', width:'100%' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={doRegisterBiometric} style={{ width:'100%' }}>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:6, fontWeight:600 }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setErrorMsg(''); }}
                placeholder="tu@email.com"
                required
                style={{
                  width:'100%', boxSizing:'border-box',
                  padding:'13px 16px', borderRadius:14,
                  border:'1px solid rgba(255,255,255,0.12)',
                  background:'rgba(255,255,255,0.06)',
                  color:'#fff', fontSize:15, outline:'none', fontFamily:'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'block', marginBottom:6, fontWeight:600 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => { setRegPassword(e.target.value); setErrorMsg(''); }}
                placeholder="••••••••"
                required
                style={{
                  width:'100%', boxSizing:'border-box',
                  padding:'13px 16px', borderRadius:14,
                  border:'1px solid rgba(255,255,255,0.12)',
                  background:'rgba(255,255,255,0.06)',
                  color:'#fff', fontSize:15, outline:'none', fontFamily:'inherit',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={regLoading}
              style={{
                width:'100%', padding:'16px', borderRadius:16,
                background: regLoading ? 'rgba(48,209,88,0.3)' : 'linear-gradient(135deg,#30D158,#34C759)',
                border:'none', color:'#fff', fontSize:15, fontWeight:700,
                cursor: regLoading ? 'not-allowed' : 'pointer',
                marginBottom:12,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                boxShadow:'0 6px 24px rgba(48,209,88,0.3)',
              }}
            >
              {regLoading
                ? <><span style={{ display:'inline-block', width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> Verificando...</>
                : <><span style={{ fontSize:20 }}>🔐</span> Ingresar y vincular FaceID</>
              }
            </button>
          </form>

          <button onClick={retry} style={{
            background:'none', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:14, padding:'11px', width:'100%',
            color:'rgba(255,255,255,0.4)', fontSize:14, cursor:'pointer',
          }}>
            ← Escanear otro carnet
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {step === 'error' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 24px', maxWidth:340, width:'100%', textAlign:'center', animation:'slideUp 0.3s ease' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:10 }}>No se pudo verificar</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginBottom:32, lineHeight:1.6 }}>{errorMsg}</div>
          <button onClick={retry} style={{
            width:'100%', padding:'14px', borderRadius:14,
            background:'#0A84FF', border:'none', color:'#fff',
            fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:14,
          }}>
            Intentar de nuevo
          </button>
          <Link href="/login" style={{ color:'rgba(255,255,255,0.35)', fontSize:13, textDecoration:'none' }}>
            Iniciar sesión con contraseña
          </Link>
        </div>
      )}
    </div>
  );
}
