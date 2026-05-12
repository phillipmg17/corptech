'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function QRLoginPage() {
  const router  = useRouter();
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const scannerRef = useRef(null);

  const [step,       setStep]       = useState('scan');   // scan | confirm | loading | error
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [cameraOk,   setCameraOk]   = useState(false);
  const [foundUser,  setFoundUser]  = useState(null);     // { id, full_name, org_name, role }
  const [errorMsg,   setErrorMsg]   = useState('');
  const [manualId,   setManualId]   = useState('');
  const [showManual, setShowManual] = useState(false);
  const [scanPulse,  setScanPulse]  = useState(false);

  /* ── Cargar jsQR desde CDN ── */
  useEffect(() => {
    const s = document.createElement('script');
    s.src   = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    s.onload= () => setJsQRLoaded(true);
    document.head.appendChild(s);
    return () => stopCamera();
  }, []);

  /* ── Iniciar cámara cuando jsQR esté listo ── */
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
    setScanPulse(true);
    try {
      let uid = raw;
      // Formato: "corptech:uid:UUID" o directo UUID
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
      .select('id, full_name, org_id, organizations(name)')
      .eq('id', uid)
      .single();
    if (!prof) { setErrorMsg('Usuario no encontrado.'); setStep('error'); return; }

    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', uid).single();

    const { data: bk } = await supabase
      .from('biometric_keys').select('credential_id, device_name').eq('user_id', uid).single();

    if (!bk?.credential_id) {
      setErrorMsg('Este usuario no tiene biometría registrada en ningún dispositivo.');
      setStep('error');
      return;
    }

    stopCamera();
    setFoundUser({
      id:        prof.id,
      full_name: prof.full_name,
      org_name:  prof.organizations?.name || 'Corp Tech',
      role:      roleRow?.role || 'vendedor',
      credential_id: bk.credential_id,
      device_name:   bk.device_name,
    });
    setStep('confirm');
  }

  async function doManualSearch() {
    if (!manualId.trim()) return;
    await lookupUser(manualId.trim());
  }

  /* ── WebAuthn Authentication ── */
  async function confirmBiometric() {
    setStep('loading');
    try {
      const credId = foundUser.credential_id;
      // Decodificar credential ID de base64
      const credIdBytes = Uint8Array.from(atob(credId), c => c.charCodeAt(0));

      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: credIdBytes }],
          userVerification: 'required',   // FaceID / huella obligatoria
          timeout: 60000,
        },
      });

      if (!assertion) { setErrorMsg('Verificación cancelada.'); setStep('confirm'); return; }

      // Obtener refresh token guardado
      const { data: bk } = await supabase
        .from('biometric_keys')
        .select('refresh_token')
        .eq('user_id', foundUser.id)
        .single();

      if (!bk?.refresh_token) {
        setErrorMsg('Sesión biométrica expirada. Inicia sesión normal una vez para renovarla.');
        setStep('error');
        return;
      }

      // Restaurar sesión con refresh token
      const { data: { session }, error } = await supabase.auth.refreshSession({
        refresh_token: bk.refresh_token,
      });

      if (error || !session) {
        setErrorMsg('Sesión expirada. Inicia sesión con contraseña una vez para renovar.');
        setStep('error');
        return;
      }

      // Actualizar refresh token rotado
      await supabase.from('biometric_keys').update({
        refresh_token: session.refresh_token,
        last_used: new Date().toISOString(),
      }).eq('user_id', foundUser.id);

      // Redirigir según rol
      const r = foundUser.role;
      if (r === 'superadmin')                      router.replace('/superadmin');
      else if (r === 'corp')                       router.replace('/corp');
      else if (r === 'store_manager' || r === 'gerente') router.replace('/store');
      else                                         router.replace('/pos');

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Verificación biométrica denegada o cancelada.');
      } else {
        setErrorMsg('Error de autenticación: ' + err.message);
      }
      setStep('confirm');
    }
  }

  function retry() {
    setStep('scan');
    setFoundUser(null);
    setErrorMsg('');
    setScanPulse(false);
    startCamera();
  }

  const ROLE_LABEL = {
    superadmin: '⚡ Super Admin', corp: '🏢 Corporación', gerente: '👔 Gerente',
    store_manager: '👔 Gerente', vendedor: '🛒 Vendedor', seller: '🛒 Vendedor',
    cashier: '💰 Cajero', warehouse: '📦 Almacenero',
  };

  return (
    <div style={{
      minHeight: '100dvh', background: '#050508',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Urbanist','Inter',sans-serif", padding: '0 0 40px',
      userSelect: 'none',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine { 0%{top:10%} 100%{top:88%} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes success { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      `}</style>

      {/* Header */}
      <div style={{ position:'fixed', top:0, left:0, right:0, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:10 }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>🏢 Corp Tech</div>
        <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>
          Contraseña →
        </Link>
      </div>

      {/* ── SCAN STEP ── */}
      {(step === 'scan') && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', padding:'60px 20px 0', animation:'slideUp 0.3s ease' }}>
          <div style={{ fontSize:13, fontWeight:600, letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:12 }}>
            Acceso con Carnet QR
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:6 }}>Escanea tu carnet</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:32, textAlign:'center' }}>
            Apunta la cámara al código QR de tu carnet de trabajo
          </div>

          {/* Visor de cámara */}
          <div style={{ position:'relative', width:260, height:260, borderRadius:24, overflow:'hidden', background:'#111', boxShadow:'0 0 0 3px rgba(10,132,255,0.4)', marginBottom:28 }}>
            <video ref={videoRef} playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <canvas ref={canvasRef} style={{ display:'none' }} />

            {/* Esquinas decorativas */}
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{
                position:'absolute',
                top:    c.startsWith('t') ? 12 : 'auto',
                bottom: c.startsWith('b') ? 12 : 'auto',
                left:   c.endsWith('l')  ? 12 : 'auto',
                right:  c.endsWith('r')  ? 12 : 'auto',
                width:28, height:28,
                borderTop:    c.startsWith('t') ? '3px solid #0A84FF' : 'none',
                borderBottom: c.startsWith('b') ? '3px solid #0A84FF' : 'none',
                borderLeft:   c.endsWith('l')   ? '3px solid #0A84FF' : 'none',
                borderRight:  c.endsWith('r')   ? '3px solid #0A84FF' : 'none',
                borderRadius: c==='tl'?'6px 0 0 0':c==='tr'?'0 6px 0 0':c==='bl'?'0 0 0 6px':'0 0 6px 0',
              }} />
            ))}

            {/* Línea de escaneo */}
            {cameraOk && (
              <div style={{
                position:'absolute', left:16, right:16, height:2,
                background:'linear-gradient(90deg,transparent,#0A84FF,transparent)',
                animation:'scanLine 2s ease-in-out infinite alternate',
                borderRadius:2,
              }} />
            )}

            {!cameraOk && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:13, textAlign:'center', padding:20 }}>
                {jsQRLoaded ? 'Sin acceso a cámara' : 'Iniciando...'}
              </div>
            )}
          </div>

          {/* Manual fallback */}
          {showManual && (
            <div style={{ width:'100%', maxWidth:300, marginBottom:16 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8, textAlign:'center' }}>O ingresa tu ID de empleado:</div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={manualId}
                  onChange={e=>setManualId(e.target.value)}
                  placeholder="UUID del usuario..."
                  style={{ flex:1, padding:'10px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit' }}
                />
                <button onClick={doManualSearch} style={{ padding:'10px 16px', borderRadius:12, background:'#0A84FF', border:'none', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  Buscar
                </button>
              </div>
            </div>
          )}

          <button onClick={()=>setShowManual(o=>!o)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:13, cursor:'pointer', padding:'4px 0' }}>
            {showManual ? 'Ocultar entrada manual' : '¿Sin cámara? Ingresa manualmente'}
          </button>
        </div>
      )}

      {/* ── LOADING STEP ── */}
      {step === 'loading' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, animation:'slideUp 0.2s ease' }}>
          <div style={{ width:52, height:52, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#0A84FF', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:15 }}>Verificando...</div>
        </div>
      )}

      {/* ── CONFIRM STEP ── */}
      {step === 'confirm' && foundUser && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 24px 0', maxWidth:360, width:'100%', animation:'slideUp 0.3s ease' }}>
          {/* Avatar */}
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

          {/* Botón FaceID / Huella */}
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

      {/* ── ERROR STEP ── */}
      {step === 'error' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 24px', maxWidth:340, width:'100%', textAlign:'center', animation:'slideUp 0.3s ease' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:10 }}>No se pudo verificar</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginBottom:32, lineHeight:1.6 }}>{errorMsg}</div>
          <button onClick={retry} style={{
            width:'100%', padding:'14px', borderRadius:14,
            background:'#0A84FF', border:'none', color:'#fff',
            fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:14,
          }}>Intentar de nuevo</button>
          <Link href="/login" style={{ color:'rgba(255,255,255,0.35)', fontSize:13, textDecoration:'none' }}>
            Iniciar sesión con contraseña
          </Link>
        </div>
      )}
    </div>
  );
}
