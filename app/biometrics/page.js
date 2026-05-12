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

  const [loading,    setLoading]    = useState(true);
  const [profile,    setProfile]    = useState(null);
  const [userId,     setUserId]     = useState('');
  const [orgName,    setOrgName]    = useState('');
  const [role,       setRole]       = useState('');
  const [biometrics, setBiometrics] = useState([]);
  const [toast,      setToast]      = useState(null);
  const [registering,setRegistering]= useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [qrUrl,      setQrUrl]      = useState('');

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const uid = session.user.id;
    setUserId(uid);

    const { data: prof }    = await supabase.from('users').select('*, organizations(name)').eq('id', uid).single();
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();

    setProfile(prof);
    setOrgName(prof?.organizations?.name || 'Corp Tech');
    setRole(roleRow?.role || 'vendedor');

    // Detectar nombre de dispositivo
    const ua = navigator.userAgent;
    let dn = 'Mi dispositivo';
    if (/iPhone/.test(ua))       dn = 'iPhone';
    else if (/iPad/.test(ua))    dn = 'iPad';
    else if (/Mac/.test(ua))     dn = 'Mac';
    else if (/Android/.test(ua)) dn = 'Android';
    setDeviceName(dn);

    // QR carnet
    const qrData = encodeURIComponent(`corptech:uid:${uid}`);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&color=000000&bgcolor=ffffff&qzone=2&format=png`);

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

  /* ── Registrar biometría en este dispositivo ── */
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
            { type: 'public-key', alg: -7   },   // ES256
            { type: 'public-key', alg: -257 },   // RS256
          ],
          authenticatorSelection: {
            userVerification:        'required',
            residentKey:             'preferred',
            authenticatorAttachment: 'platform',  // FaceID / huella del dispositivo
          },
          timeout: 60000,
        },
      });

      if (!cred) { showToast('Registro cancelado', 'error'); setRegistering(false); return; }

      // Convertir credential ID a base64
      const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));

      // Obtener sesión actual para guardar refresh token
      const { data: { session } } = await supabase.auth.getSession();
      const refreshToken = session?.refresh_token || null;

      // Guardar en Supabase
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

        {/* CARNET QR */}
        <div style={{
          background:'linear-gradient(135deg,#0A84FF18,#5E5CE618)',
          border:'1px solid rgba(10,132,255,0.25)',
          borderRadius:20, padding:24, marginBottom:20,
          display:'flex', flexDirection:'column', alignItems:'center',
        }}>
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Tu Carnet Digital
          </div>

          {/* Carnet visual */}
          <div style={{
            background:'#fff', borderRadius:16, padding:20,
            display:'flex', flexDirection:'column', alignItems:'center',
            width:220, boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#0A84FF', letterSpacing:'0.1em', marginBottom:10 }}>CORP TECH</div>
            <div style={{
              width:60, height:60, borderRadius:14,
              background:'linear-gradient(135deg,#0A84FF,#5E5CE6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, marginBottom:10, color:'#fff', fontWeight:800,
            }}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:2, textAlign:'center' }}>{profile?.full_name}</div>
            <div style={{ fontSize:10, color:'#888', marginBottom:12 }}>{orgName}</div>
            {qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR Carnet" width={140} height={140} style={{ borderRadius:8 }} />
            )}
            <div style={{ fontSize:9, color:'#aaa', marginTop:8, textAlign:'center' }}>
              {userId.slice(0,8).toUpperCase()}
            </div>
          </div>

          <a href={qrUrl} download="carnet-qr.png" style={{
            marginTop:16, padding:'10px 24px', borderRadius:12,
            background:'rgba(10,132,255,0.15)', border:'1px solid rgba(10,132,255,0.3)',
            color:'#4DA8FF', fontSize:13, fontWeight:600, textDecoration:'none',
          }}>
            ⬇️ Descargar QR
          </a>

          <div style={{ marginTop:10, fontSize:12, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
            Comparte este QR solo con personas de confianza.<br />Úsalo para acceder al sistema sin contraseña.
          </div>
        </div>

        {/* BIOMETRÍAS REGISTRADAS */}
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
              Se abrirá FaceID o huella dactilar para verificar tu identidad. Solo funciona en este dispositivo.
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
            ['2️⃣', 'Descarga o imprime tu carnet QR.'],
            ['3️⃣', 'En el login, elige "Acceso QR" y escanea tu carnet.'],
            ['4️⃣', 'Confirma con FaceID/huella — ¡y listo, sin contraseña!'],
          ].map(([n,t]) => (
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
