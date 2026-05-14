export const metadata = {
  title: 'Guía de Acceso — Panel del Equipo | Corp Tech ERP',
  description: 'Cómo ingresar al sistema, crear usuarios, generar QR y activar Face ID / Passkeys.',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --blue:#0A84FF; --green:#30D158; --orange:#FF9F0A; --purple:#BF5AF2; --red:#FF453A;
    --bg:#08080C; --card:rgba(255,255,255,0.04); --border:rgba(255,255,255,0.08);
    --text:#ffffff; --muted:rgba(255,255,255,0.45); --subtle:rgba(255,255,255,0.18);
  }
  body { background:var(--bg); color:var(--text); font-family:'Urbanist',-apple-system,sans-serif; line-height:1.6; min-height:100vh; }
  .hero { background:linear-gradient(160deg,rgba(10,132,255,0.12) 0%,#08080C 50%); padding:64px 24px 48px; text-align:center; border-bottom:1px solid var(--border); }
  .hero-badge { display:inline-flex; align-items:center; gap:7px; background:rgba(10,132,255,0.12); border:1px solid rgba(10,132,255,0.25); border-radius:999px; padding:5px 14px; font-size:12px; font-weight:700; color:var(--blue); margin-bottom:20px; letter-spacing:0.04em; text-transform:uppercase; }
  .hero h1 { font-size:clamp(28px,5vw,48px); font-weight:900; letter-spacing:-0.5px; margin-bottom:12px; }
  .hero h1 span { color:var(--blue); }
  .hero p { font-size:16px; color:var(--muted); max-width:520px; margin:0 auto; }
  .container { max-width:860px; margin:0 auto; padding:0 24px 80px; }
  .section { margin-top:56px; }
  .section-header { display:flex; align-items:center; gap:14px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border); }
  .section-num { width:36px; height:36px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; }
  .section-num.blue   { background:rgba(10,132,255,0.15); color:var(--blue); }
  .section-num.green  { background:rgba(48,209,88,0.15);  color:var(--green); }
  .section-num.orange { background:rgba(255,159,10,0.15); color:var(--orange); }
  .section-num.purple { background:rgba(191,90,242,0.15); color:var(--purple); }
  .section-title { font-size:20px; font-weight:800; }
  .section-subtitle { font-size:13px; color:var(--muted); margin-top:2px; font-weight:500; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:22px 24px; margin-bottom:14px; }
  .card-title { font-size:14px; font-weight:800; margin-bottom:6px; }
  .card p { font-size:14px; color:var(--muted); line-height:1.65; }
  .steps { display:flex; flex-direction:column; gap:0; }
  .step { display:flex; gap:16px; align-items:flex-start; padding:18px 0; border-bottom:1px solid var(--border); }
  .step:last-child { border-bottom:none; }
  .step-dot { width:32px; height:32px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; margin-top:1px; }
  .step-label { font-size:14px; font-weight:800; margin-bottom:4px; }
  .step-desc { font-size:13px; color:var(--muted); line-height:1.65; }
  .url-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:8px 14px; font-size:14px; font-weight:700; color:var(--blue); font-family:'SF Mono','Fira Code',monospace; margin:12px 0; word-break:break-all; }
  .method-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px; }
  @media(max-width:520px){ .method-grid{ grid-template-columns:1fr; } }
  .method-card { border-radius:16px; padding:18px; border:1.5px solid; display:flex; flex-direction:column; gap:8px; }
  .method-icon { font-size:28px; }
  .method-name { font-size:14px; font-weight:800; }
  .method-desc { font-size:12px; line-height:1.55; }
  .role-table { width:100%; border-collapse:collapse; margin-top:12px; }
  .role-table th { text-align:left; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--subtle); padding:10px 14px; border-bottom:1px solid var(--border); }
  .role-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:top; }
  .role-table tr:last-child td { border-bottom:none; }
  .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:0.03em; }
  .badge-admin   { background:rgba(191,90,242,0.15); color:var(--purple); }
  .badge-gerente { background:rgba(255,159,10,0.15);  color:var(--orange); }
  .badge-vend    { background:rgba(48,209,88,0.15);   color:var(--green); }
  .alert { border-radius:13px; padding:14px 16px; margin-top:16px; display:flex; gap:12px; align-items:flex-start; font-size:13px; line-height:1.6; }
  .alert-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
  .alert.tip  { background:rgba(10,132,255,0.08); border:1px solid rgba(10,132,255,0.2);  color:rgba(255,255,255,0.75); }
  .alert.warn { background:rgba(255,159,10,0.08);  border:1px solid rgba(255,159,10,0.22); color:rgba(255,255,255,0.75); }
  .alert.ok   { background:rgba(48,209,88,0.08);   border:1px solid rgba(48,209,88,0.2);  color:rgba(255,255,255,0.75); }
  code { background:rgba(255,255,255,0.07); padding:2px 7px; border-radius:6px; font-size:13px; font-family:'SF Mono','Fira Code',monospace; }
  .divider { border:none; border-top:1px solid var(--border); margin:48px 0 0; }
  .page-footer { text-align:center; padding:32px 24px; border-top:1px solid var(--border); font-size:12px; color:var(--subtle); }
  @media print {
    body { background:#fff; color:#111; }
    .hero { background:#f5f5f7; }
    .card { background:#fafafa; border-color:#e0e0e0; }
    :root { --muted:#555; --subtle:#888; --border:#ddd; --text:#111; }
    .url-pill { background:#f0f4ff; color:#1a56db; }
  }
`;

export default function GuiaPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">📋 Guía Oficial</div>
        <h1>Acceso al Sistema<br /><span>ERP · Panel del Equipo</span></h1>
        <p>Todo lo que necesitas saber para que tus trabajadores ingresen, cómo crear sus cuentas y cómo activar el login con QR y Face ID.</p>
      </div>

      <div className="container">

        {/* ── SECCIÓN 1: CÓMO INGRESAN ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-num blue">1</div>
            <div>
              <div className="section-title">¿Cómo ingresan los trabajadores?</div>
              <div className="section-subtitle">La URL del panel del equipo para cada tienda</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🌐 URL de acceso por tienda</div>
            <p>Cada tienda tiene su propia dirección de acceso. Los trabajadores deben entrar por aquí, <strong style={{color:'#fff'}}>no</strong> por la tienda de clientes.</p>
            <div className="url-pill">🔗 tutienda.pe<strong>/ingresar</strong></div>
            <p style={{marginTop:8}}>Por ejemplo: <span style={{color:'#0A84FF',fontWeight:700}}>futurteck.pe/ingresar</span> · <span style={{color:'#30D158',fontWeight:700}}>wetechperu.pe/ingresar</span></p>
          </div>

          <p style={{fontSize:14,color:'rgba(255,255,255,0.45)',marginBottom:16}}>Al entrar a <code>/ingresar</code> el trabajador verá esta pantalla con <strong style={{color:'#fff'}}>4 métodos de acceso</strong>:</p>

          <div className="method-grid">
            <div className="method-card" style={{borderColor:'rgba(10,132,255,0.3)',background:'rgba(10,132,255,0.07)'}}>
              <div className="method-icon">🔑</div>
              <div className="method-name" style={{color:'#0A84FF'}}>Passkey</div>
              <div className="method-desc" style={{color:'rgba(255,255,255,0.55)'}}>Face ID, Touch ID o iCloud Keychain. El método más rápido y seguro. Sin contraseña.</div>
            </div>
            <div className="method-card" style={{borderColor:'rgba(48,209,88,0.3)',background:'rgba(48,209,88,0.07)'}}>
              <div className="method-icon">✉️</div>
              <div className="method-name" style={{color:'#30D158'}}>Magic Link</div>
              <div className="method-desc" style={{color:'rgba(255,255,255,0.55)'}}>Se envía un enlace al correo del trabajador. Un clic y entra. Sin recordar contraseña.</div>
            </div>
            <div className="method-card" style={{borderColor:'rgba(255,159,10,0.3)',background:'rgba(255,159,10,0.07)'}}>
              <div className="method-icon">📲</div>
              <div className="method-name" style={{color:'#FF9F0A'}}>QR / Wallet</div>
              <div className="method-desc" style={{color:'rgba(255,255,255,0.55)'}}>Escanea el carnet digital del trabajador. Compatible con Apple Wallet.</div>
            </div>
            <div className="method-card" style={{borderColor:'rgba(191,90,242,0.3)',background:'rgba(191,90,242,0.07)'}}>
              <div className="method-icon">🔐</div>
              <div className="method-name" style={{color:'#BF5AF2'}}>Contraseña</div>
              <div className="method-desc" style={{color:'rgba(255,255,255,0.55)'}}>Email + contraseña. El método clásico para el primer ingreso.</div>
            </div>
          </div>

          <div className="alert tip">
            <div className="alert-icon">💡</div>
            <div><strong>Primer ingreso siempre con Contraseña.</strong> El trabajador usa el email y la contraseña que le asignaste. Después puede activar Face ID o QR para futuros accesos.</div>
          </div>
        </div>

        {/* ── SECCIÓN 2: CREAR USUARIOS ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-num green">2</div>
            <div>
              <div className="section-title">Crear usuarios para tu tienda</div>
              <div className="section-subtitle">Tipos de rol y cómo registrarlos en el sistema</div>
            </div>
          </div>

          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table className="role-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>¿Qué puede hacer?</th>
                  <th>Accede a</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge badge-admin">store_admin</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)'}}>Ve todo: ventas, stock, finanzas, configuración. Puede aprobar descuentos.</td>
                  <td style={{color:'rgba(255,255,255,0.45)'}}>/store · /pos</td>
                </tr>
                <tr>
                  <td><span className="badge badge-gerente">gerente</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)'}}>Panel completo. Reportes y gestión. No cambia configuración.</td>
                  <td style={{color:'rgba(255,255,255,0.45)'}}>/store · /pos</td>
                </tr>
                <tr>
                  <td><span className="badge badge-vend">vendedor</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)'}}>Solo usa el POS para hacer ventas. No ve finanzas ni reportes.</td>
                  <td style={{color:'rgba(255,255,255,0.45)'}}>/pos</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{fontSize:14,color:'rgba(255,255,255,0.45)',margin:'20px 0 14px'}}>Sigue estos pasos para crear un usuario nuevo:</p>

          <div className="card">
            <div className="steps">
              {[
                { n:1, label:'Ir al Panel de Tienda', desc:<>Ingresa a tu tienda en <code>tutienda.pe/ingresar</code> como <strong style={{color:'#fff'}}>store_admin</strong> y entra al panel de gestión.</> },
                { n:2, label:'Tab "Personal" o "Equipo"', desc:'Dentro del panel busca la sección de Personal. Ahí verás la lista de trabajadores registrados.' },
                { n:3, label:'Clic en "Agregar usuario"', desc:<>Completa: <strong style={{color:'#fff'}}>Nombre, Email y Rol</strong>. El sistema le enviará un correo de bienvenida automáticamente.</> },
                { n:4, label:'El trabajador activa su cuenta', desc:'Desde el link del correo crea su contraseña. Después puede usar cualquiera de los 4 métodos.' },
              ].map(s => (
                <div className="step" key={s.n}>
                  <div className="step-dot" style={{background:'rgba(48,209,88,0.15)',color:'#30D158'}}>{s.n}</div>
                  <div>
                    <div className="step-label">{s.label}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="alert warn">
            <div className="alert-icon">⚠️</div>
            <div><strong>Importante:</strong> Usa correos reales que los trabajadores revisen. No uses correos temporales. El email de registro es el mismo que usarán para ingresar.</div>
          </div>

          <div className="alert ok">
            <div className="alert-icon">✅</div>
            <div><strong>Alternativa rápida:</strong> El administrador del sistema puede crear el usuario en Supabase → Authentication → Users → &quot;Invite user&quot; y luego asignar el rol en la tabla <code>user_roles</code>.</div>
          </div>
        </div>

        {/* ── SECCIÓN 3: QR ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-num orange">3</div>
            <div>
              <div className="section-title">Login con QR — Carnet Digital</div>
              <div className="section-subtitle">Cómo generar el carnet y cómo usarlo para ingresar</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📲 ¿Qué es el carnet digital?</div>
            <p>Cada trabajador tiene un <strong style={{color:'#fff'}}>carnet digital único</strong> con su nombre, rol y un código QR personal. Con ese QR ingresa al sistema sin escribir nada. También se guarda en Apple Wallet.</p>
          </div>

          <p style={{fontSize:14,color:'rgba(255,255,255,0.45)',margin:'20px 0 14px'}}><strong style={{color:'#fff'}}>Para generar el carnet (lo hace cada trabajador una sola vez):</strong></p>

          <div className="card">
            <div className="steps">
              {[
                { n:1, color:'#FF9F0A', label:'Ingresar al sistema por primera vez', desc:<>Entrar con <strong style={{color:'#fff'}}>email + contraseña</strong> usando el método Contraseña en <code>/ingresar</code>.</> },
                { n:2, color:'#FF9F0A', label:'Ir a /biometrics', desc:<>Desde el panel ir a: <div className="url-pill" style={{marginTop:8}}>🔗 tutienda.pe<strong>/biometrics</strong></div></> },
                { n:3, color:'#FF9F0A', label:'Clic en "Generar mi carnet"', desc:<>El sistema crea el carnet con el QR. El trabajador puede <strong style={{color:'#fff'}}>descargar la imagen</strong> o <strong style={{color:'#fff'}}>guardarlo en Apple Wallet</strong>.</> },
                { n:4, color:'#FF9F0A', label:'Para ingresar: escanear el carnet', desc:<>En <code>/ingresar</code> → elegir <strong style={{color:'#FF9F0A'}}>QR / Wallet</strong> → se abre el escáner → apuntar la cámara al carnet → acceso instantáneo.</> },
              ].map(s => (
                <div className="step" key={s.n}>
                  <div className="step-dot" style={{background:'rgba(255,159,10,0.15)',color:s.color}}>{s.n}</div>
                  <div>
                    <div className="step-label">{s.label}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="alert tip">
            <div className="alert-icon">🍎</div>
            <div><strong>Apple Wallet:</strong> Si el trabajador guarda el carnet en Wallet, puede mostrarlo desde la pantalla de bloqueo del iPhone sin abrir el sistema. Solo mostrar el pase y escanear.</div>
          </div>
        </div>

        {/* ── SECCIÓN 4: PASSKEYS ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-num purple">4</div>
            <div>
              <div className="section-title">Passkeys — Face ID y Llaves digitales</div>
              <div className="section-subtitle">El método más seguro. Sin contraseñas, sin hackeos posibles.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🔑 ¿Qué es una Passkey?</div>
            <p>Una Passkey es una <strong style={{color:'#fff'}}>llave digital cifrada</strong> guardada en el iPhone o Mac del trabajador. Al ingresar, el dispositivo usa <strong style={{color:'#fff'}}>Face ID o Touch ID</strong> para verificar su identidad. No hay contraseña que robar ni olvidar.</p>
          </div>

          <p style={{fontSize:14,color:'rgba(255,255,255,0.45)',margin:'20px 0 14px'}}><strong style={{color:'#fff'}}>Cómo registrar la Passkey (una sola vez por dispositivo):</strong></p>

          <div className="card">
            <div className="steps">
              {[
                { n:1, label:'Ir a /biometrics desde el iPhone o Mac', desc:<>El trabajador debe hacerlo <strong style={{color:'#fff'}}>desde el dispositivo que usará para trabajar</strong>. La llave queda guardada en ese dispositivo.</> },
                { n:2, label:'Clic en "Registrar Face ID / Touch ID"', desc:'El sistema pedirá confirmación biométrica. El trabajador acepta y la llave se crea y guarda automáticamente en el iPhone.' },
                { n:3, label:'¡Listo! Próximo ingreso sin contraseña', desc:<>En <code>/ingresar</code> → elegir <strong style={{color:'#BF5AF2'}}>Passkey</strong> → Face ID escanea el rostro → acceso en menos de 1 segundo.</> },
                { n:4, label:'Sincronización con iCloud Keychain', desc:<>Si tiene <strong style={{color:'#fff'}}>iCloud Keychain activado</strong>, la llave se sincroniza entre todos sus dispositivos Apple automáticamente.</> },
              ].map(s => (
                <div className="step" key={s.n}>
                  <div className="step-dot" style={{background:'rgba(191,90,242,0.15)',color:'#BF5AF2'}}>{s.n}</div>
                  <div>
                    <div className="step-label">{s.label}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{marginTop:14}}>
            <div className="card-title">🛡️ Buenas prácticas para guardar las llaves</div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:12}}>
              {[
                { ok:true,  t:'Activa iCloud Keychain', d:'Ajustes → Tu nombre → iCloud → Contraseñas y llaves de acceso → ON' },
                { ok:true,  t:'Usa el dispositivo personal',     d:'No compartas el teléfono. La llave está ligada a tu biometría.' },
                { ok:true,  t:'Guarda también tu contraseña',    d:'Como respaldo por si el dispositivo se daña. El admin puede enviarte un Magic Link de emergencia.' },
                { ok:false, t:'Si pierdes el teléfono',          d:'Avisa al administrador inmediatamente para revocar el acceso y registrar nueva llave en el dispositivo nuevo.' },
              ].map((item, i) => (
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',fontSize:13,color:'rgba(255,255,255,0.45)'}}>
                  <span style={{color:item.ok?'#30D158':'#FF453A',fontSize:16,flexShrink:0}}>{item.ok?'✓':'✗'}</span>
                  <span><strong style={{color:'#fff'}}>{item.t}:</strong> {item.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="alert warn">
            <div className="alert-icon">⚠️</div>
            <div><strong>Sesión expirada:</strong> Si después de usar Face ID el sistema pide la contraseña, es seguridad normal por inactividad. Solo se pide <strong>una vez</strong> para renovarla; después vuelve a funcionar Face ID solo.</div>
          </div>
        </div>

        {/* ── RESUMEN ── */}
        <hr className="divider" />

        <div className="section">
          <div className="section-header" style={{borderBottom:'none',marginBottom:16}}>
            <div>
              <div className="section-title">⚡ Resumen rápido — Onboarding completo</div>
              <div className="section-subtitle">El proceso de inicio de un trabajador nuevo, de la A a la E</div>
            </div>
          </div>

          <div className="card" style={{borderColor:'rgba(10,132,255,0.2)',background:'rgba(10,132,255,0.05)'}}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                { l:'A', t:'Admin crea el usuario', d:'En el panel de tienda con nombre, email y rol asignado.' },
                { l:'B', t:'Trabajador recibe email', d:'Abre el link y crea su contraseña inicial.' },
                { l:'C', t:'Primer ingreso', d:<>En <code>tutienda.pe/ingresar</code> → método Contraseña.</> },
                { l:'D', t:'Ir a /biometrics', d:'Generar el carnet QR y registrar Face ID / Passkey.' },
                { l:'E', t:'Guardar carnet en Wallet (opcional)', d:'Desde ese momento: ingreso en 1 segundo con Face ID o QR.' },
              ].map(item => (
                <div key={item.l} style={{display:'flex',gap:12,alignItems:'flex-start',fontSize:14}}>
                  <span style={{background:'rgba(10,132,255,0.2)',color:'#0A84FF',width:26,height:26,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:12,flexShrink:0}}>{item.l}</span>
                  <span style={{color:'rgba(255,255,255,0.45)'}}><strong style={{color:'#fff'}}>{item.t}:</strong> {item.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="page-footer">
        Corp Tech ERP · Guía de Acceso v1.0 · Solo para uso de administradores y trabajadores autorizados
      </div>
    </>
  );
}
