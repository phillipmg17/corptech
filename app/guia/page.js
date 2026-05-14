export const metadata = {
  title: 'Guía Completa del Sistema | Corp Tech ERP',
  description: 'Todo lo que necesitas saber para usar el sistema: roles, tiendas, ventas, e-commerce, asistencia y más.',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --blue:#0A84FF; --green:#30D158; --orange:#FF9F0A; --purple:#BF5AF2; --red:#FF453A; --teal:#5AC8FA;
    --bg:#08080C; --card:rgba(255,255,255,0.04); --border:rgba(255,255,255,0.08);
    --text:#ffffff; --muted:rgba(255,255,255,0.45); --subtle:rgba(255,255,255,0.18);
  }
  body { background:var(--bg); color:var(--text); font-family:'Urbanist',-apple-system,sans-serif; line-height:1.6; min-height:100vh; }

  /* HERO */
  .hero { background:linear-gradient(160deg,rgba(10,132,255,0.14) 0%,rgba(191,90,242,0.06) 40%,#08080C 65%); padding:72px 24px 56px; text-align:center; border-bottom:1px solid var(--border); }
  .hero-badge { display:inline-flex; align-items:center; gap:7px; background:rgba(10,132,255,0.12); border:1px solid rgba(10,132,255,0.25); border-radius:999px; padding:5px 16px; font-size:12px; font-weight:700; color:var(--blue); margin-bottom:22px; letter-spacing:0.05em; text-transform:uppercase; }
  .hero h1 { font-size:clamp(30px,6vw,52px); font-weight:900; letter-spacing:-0.5px; margin-bottom:14px; line-height:1.1; }
  .hero h1 span { color:var(--blue); }
  .hero p { font-size:17px; color:var(--muted); max-width:580px; margin:0 auto 28px; }
  .hero-pills { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
  .hero-pill { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:999px; padding:5px 14px; font-size:12px; font-weight:600; color:rgba(255,255,255,0.6); }

  /* TOC */
  .toc { background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:20px; padding:24px 28px; max-width:860px; margin:40px auto 0; }
  .toc-title { font-size:13px; font-weight:700; color:var(--muted); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:16px; }
  .toc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; }
  .toc-item { display:flex; align-items:center; gap:9px; padding:8px 12px; border-radius:10px; text-decoration:none; color:rgba(255,255,255,0.65); font-size:14px; font-weight:600; transition:background .15s; }
  .toc-item:hover { background:rgba(255,255,255,0.06); color:#fff; }
  .toc-item span { font-size:16px; }

  /* LAYOUT */
  .container { max-width:860px; margin:0 auto; padding:0 24px 100px; }
  .section { margin-top:72px; }
  .section-header { display:flex; align-items:center; gap:16px; margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid var(--border); }
  .section-ico { width:44px; height:44px; border-radius:14px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:22px; }
  .section-title { font-size:22px; font-weight:900; }
  .section-subtitle { font-size:14px; color:var(--muted); margin-top:3px; font-weight:500; }

  /* CARDS */
  .card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:24px; margin-bottom:14px; }
  .card-title { font-size:15px; font-weight:800; margin-bottom:8px; }
  .card p, .card li { font-size:14px; color:var(--muted); line-height:1.7; }
  .card ul { padding-left:18px; }
  .card ul li { margin-bottom:4px; }
  .card strong { color:#fff; }

  /* GRID DE FEATURES */
  .feat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; margin-top:4px; }
  .feat-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:20px; }
  .feat-icon { font-size:26px; margin-bottom:10px; }
  .feat-name { font-size:14px; font-weight:800; margin-bottom:5px; }
  .feat-desc { font-size:13px; color:var(--muted); line-height:1.6; }

  /* STEPS */
  .steps { display:flex; flex-direction:column; }
  .step { display:flex; gap:16px; padding:18px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
  .step:last-child { border-bottom:none; }
  .step-num { width:32px; height:32px; border-radius:50%; background:rgba(10,132,255,0.15); color:var(--blue); flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; margin-top:2px; }
  .step-title { font-size:14px; font-weight:800; margin-bottom:4px; }
  .step-desc { font-size:13px; color:var(--muted); line-height:1.65; }

  /* ROLES TABLE */
  .role-table { width:100%; border-collapse:collapse; margin-top:4px; }
  .role-table th { text-align:left; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--subtle); padding:10px 16px; border-bottom:1px solid var(--border); }
  .role-table td { padding:13px 16px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:top; line-height:1.5; }
  .role-table tr:last-child td { border-bottom:none; }
  .badge { display:inline-block; padding:3px 11px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:0.02em; }
  .badge-corp    { background:rgba(10,132,255,0.2);   color:var(--blue);   }
  .badge-sadmin  { background:rgba(255,159,10,0.2);   color:var(--orange); }
  .badge-admin   { background:rgba(191,90,242,0.15);  color:var(--purple); }
  .badge-gerente { background:rgba(255,159,10,0.15);  color:var(--orange); }
  .badge-vend    { background:rgba(48,209,88,0.15);   color:var(--green);  }

  /* ALERTS */
  .alert { border-radius:14px; padding:14px 18px; margin-top:16px; display:flex; gap:12px; align-items:flex-start; font-size:13px; line-height:1.65; }
  .alert-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
  .alert.tip   { background:rgba(10,132,255,0.08);  border:1px solid rgba(10,132,255,0.22);  color:rgba(255,255,255,0.75); }
  .alert.warn  { background:rgba(255,159,10,0.08);  border:1px solid rgba(255,159,10,0.22);  color:rgba(255,255,255,0.75); }
  .alert.ok    { background:rgba(48,209,88,0.08);   border:1px solid rgba(48,209,88,0.22);   color:rgba(255,255,255,0.75); }
  .alert.promo { background:rgba(191,90,242,0.08);  border:1px solid rgba(191,90,242,0.22);  color:rgba(255,255,255,0.75); }

  /* URL PILL */
  .url-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:8px 14px; font-size:14px; font-weight:700; color:var(--blue); font-family:'SF Mono','Fira Code',monospace; margin:10px 0; word-break:break-all; }

  /* ACCESS METHODS */
  .method-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px; }
  @media(max-width:520px){ .method-grid{ grid-template-columns:1fr; } }
  .method-card { border-radius:16px; padding:18px; border:1.5px solid; display:flex; flex-direction:column; gap:8px; }
  .method-icon { font-size:28px; }
  .method-name { font-size:14px; font-weight:800; }
  .method-desc { font-size:12px; line-height:1.55; color:rgba(255,255,255,0.5); }

  /* TABS LIST */
  .tab-list { display:flex; flex-direction:column; gap:0; }
  .tab-item { display:flex; align-items:flex-start; gap:14px; padding:16px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
  .tab-item:last-child { border-bottom:none; }
  .tab-ico { font-size:22px; flex-shrink:0; margin-top:2px; }
  .tab-name { font-size:14px; font-weight:800; margin-bottom:4px; }
  .tab-desc { font-size:13px; color:var(--muted); line-height:1.6; }

  /* ECOMMERCE SETTINGS */
  .setting-list { display:flex; flex-direction:column; gap:10px; margin-top:4px; }
  .setting-item { display:flex; gap:12px; align-items:flex-start; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 16px; }
  .setting-ico { font-size:20px; flex-shrink:0; }
  .setting-name { font-size:14px; font-weight:700; margin-bottom:3px; }
  .setting-desc { font-size:13px; color:var(--muted); line-height:1.6; }

  /* CLICK DOTS */
  .click-dots { display:flex; gap:6px; margin:10px 0; }
  .click-dot  { width:10px; height:10px; border-radius:50%; background:rgba(255,255,255,0.15); }
  .click-dot.on { background:var(--blue); box-shadow:0 0 8px rgba(10,132,255,0.6); }

  code { background:rgba(255,255,255,0.07); padding:2px 7px; border-radius:6px; font-size:13px; font-family:'SF Mono','Fira Code',monospace; }

  /* FOOTER */
  .page-footer { text-align:center; padding:40px 24px; border-top:1px solid var(--border); font-size:12px; color:var(--subtle); }
  .page-footer a { color:var(--blue); text-decoration:none; }

  @media(max-width:600px) {
    .feat-grid { grid-template-columns:1fr; }
    .toc-grid  { grid-template-columns:1fr 1fr; }
  }
`;

export default function GuiaPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-badge">📋 Guía Oficial del Sistema</div>
        <h1>Todo lo que necesitas<br /><span>para usar el ERP</span></h1>
        <p>Aquí encontrarás cómo funciona cada parte del sistema: desde cómo crear usuarios hasta cómo configurar tu tienda online y registrar ventas.</p>
        <div className="hero-pills">
          <span className="hero-pill">👥 Roles y usuarios</span>
          <span className="hero-pill">🏪 Panel de tienda</span>
          <span className="hero-pill">🛒 POS y ventas</span>
          <span className="hero-pill">🌐 Tienda online</span>
          <span className="hero-pill">✅ Asistencia</span>
          <span className="hero-pill">📦 Stock e IMEI</span>
          <span className="hero-pill">💰 Finanzas</span>
        </div>
      </div>

      {/* ── ÍNDICE ── */}
      <div style={{maxWidth:860,margin:'0 auto',padding:'0 24px'}}>
        <div className="toc">
          <div className="toc-title">Ir a una sección</div>
          <div className="toc-grid">
            {[
              ['🏗️','¿Qué es el sistema?','#que-es'],
              ['🔐','Cómo ingresar','#acceso'],
              ['👥','Roles y permisos','#roles'],
              ['🏢','Panel Corp Tech','#corp'],
              ['🏪','Panel de Tienda','#tienda'],
              ['🛒','POS — Punto de Venta','#pos'],
              ['🌐','Tienda Online','#ecommerce'],
              ['📦','Stock y productos','#stock'],
              ['✅','Asistencia','#asistencia'],
              ['💰','Finanzas','#finanzas'],
              ['⚙️','Configurar empresa','#config'],
              ['📲','Carnet QR','#carnet'],
            ].map(([ico,lbl,href]) => (
              <a key={href} href={href} className="toc-item"><span>{ico}</span>{lbl}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="container">

        {/* ══════════════════════════════════════
            QUÉ ES EL SISTEMA
        ══════════════════════════════════════ */}
        <div className="section" id="que-es">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(10,132,255,0.12)'}}>🏗️</div>
            <div>
              <div className="section-title">¿Qué es este sistema?</div>
              <div className="section-subtitle">Una visión general de cómo está organizado todo</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🏢 Un holding tecnológico con 3 tiendas</div>
            <p>Este sistema maneja una <strong>empresa matriz (Corp Tech)</strong> que controla el stock y las finanzas de 3 tiendas independientes. Cada tienda tiene su propio dominio, su propia tienda online y sus propios clientes — pero el stock y los reportes se ven desde arriba, desde Corp Tech.</p>
          </div>

          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">🏢</div>
              <div className="feat-name">Corp Tech (Matriz)</div>
              <div className="feat-desc">Ve y controla todo: stock global, finanzas de las 3 tiendas, importaciones, traslados y reportes combinados.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🔵</div>
              <div className="feat-name">Futurteck</div>
              <div className="feat-desc">Tienda 1. Dominio propio, tienda online, POS, clientes y equipo de trabajo independiente.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🟢</div>
              <div className="feat-name">WeTech Perú</div>
              <div className="feat-desc">Tienda 2. Igual que Futurteck pero con su propia marca, precios, colores y catálogo.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🟣</div>
              <div className="feat-name">InnovaTech</div>
              <div className="feat-desc">Tienda 3. Misma estructura. Los clientes de InnovaTech no mezclan información con las otras tiendas.</div>
            </div>
          </div>

          <div className="alert tip">
            <div className="alert-icon">💡</div>
            <div><strong>Datos separados por diseño.</strong> Cada tienda tiene su propia lista de clientes. Un cliente de Futurteck no aparece en WeTech. Pero el stock de productos sí se puede ver y compartir entre tiendas desde Corp Tech.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            ACCESO
        ══════════════════════════════════════ */}
        <div className="section" id="acceso">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(48,209,88,0.12)'}}>🔐</div>
            <div>
              <div className="section-title">¿Cómo ingresan al sistema?</div>
              <div className="section-subtitle">Acceso para trabajadores, admins y corp</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🏪 Trabajadores de tienda</div>
            <p>Entran por la URL de su tienda más <code>/ingresar</code>:</p>
            <div className="url-pill">🔗 futurteck.pe/ingresar</div>
            <p style={{marginTop:8}}>También pueden ir al final de la tienda online y tocar el botón <strong>"Acceso equipo"</strong> en el pie de página.</p>
          </div>

          <p style={{fontSize:14,color:'var(--muted)',marginBottom:16,marginTop:4}}>Al entrar verán una pantalla con <strong style={{color:'#fff'}}>4 métodos de login</strong>:</p>

          <div className="method-grid">
            <div className="method-card" style={{borderColor:'rgba(10,132,255,0.3)',background:'rgba(10,132,255,0.06)'}}>
              <div className="method-icon">🔑</div>
              <div className="method-name" style={{color:'var(--blue)'}}>Passkey (Face ID / Huella)</div>
              <div className="method-desc">El más rápido. Un vistazo o un toque y entras. Sin contraseña. Se activa una sola vez en el carnet.</div>
            </div>
            <div className="method-card" style={{borderColor:'rgba(48,209,88,0.3)',background:'rgba(48,209,88,0.06)'}}>
              <div className="method-icon">✉️</div>
              <div className="method-name" style={{color:'var(--green)'}}>Magic Link</div>
              <div className="method-desc">Escribe tu correo, recibes un enlace por email, haces clic y entras. Sin recordar contraseña.</div>
            </div>
            <div className="method-card" style={{borderColor:'rgba(255,159,10,0.3)',background:'rgba(255,159,10,0.06)'}}>
              <div className="method-icon">📲</div>
              <div className="method-name" style={{color:'var(--orange)'}}>QR del Carnet</div>
              <div className="method-desc">Escanea el código QR de tu carnet digital desde la cámara. También funciona con Apple Wallet.</div>
            </div>
            <div className="method-card" style={{borderColor:'rgba(191,90,242,0.3)',background:'rgba(191,90,242,0.06)'}}>
              <div className="method-icon">🔐</div>
              <div className="method-name" style={{color:'var(--purple)'}}>Contraseña</div>
              <div className="method-desc">Email + contraseña. Para el primer ingreso y como respaldo siempre disponible.</div>
            </div>
          </div>

          <div className="card" style={{marginTop:24}}>
            <div className="card-title">🏢 Acceso a Corp Tech (secreto)</div>
            <p>En <code>corptech.pe</code> no hay ningún botón de login visible — está diseñado así para que los clientes no lo vean. El acceso es con un <strong>código secreto de 5 clics en el logo</strong>.</p>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:14}}>
              <div className="click-dots">
                {[0,1,2,3,4].map(i => <div key={i} className={`click-dot on`} />)}
              </div>
              <span style={{fontSize:13,color:'var(--muted)'}}>→ 5 clics rápidos en el logo → pantalla de login</span>
            </div>
            <div className="alert warn" style={{marginTop:12}}>
              <div className="alert-icon">🤫</div>
              <div>Este método es <strong>confidencial</strong>. No lo compartas con clientes ni lo menciones en público.</div>
            </div>
          </div>

          <div className="alert tip" style={{marginTop:4}}>
            <div className="alert-icon">💡</div>
            <div><strong>Primer ingreso siempre con contraseña.</strong> Después el trabajador puede activar Face ID desde su Carnet QR para futuros accesos sin contraseña.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            ROLES
        ══════════════════════════════════════ */}
        <div className="section" id="roles">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(191,90,242,0.12)'}}>👥</div>
            <div>
              <div className="section-title">Roles y permisos</div>
              <div className="section-subtitle">Quién puede hacer qué dentro del sistema</div>
            </div>
          </div>

          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table className="role-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>¿Quién es?</th>
                  <th>¿Qué puede hacer?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge badge-corp">corp / admin_corp</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)',fontWeight:700}}>Dueño / Director general</td>
                  <td style={{color:'rgba(255,255,255,0.6)'}}>Ve y controla todo el holding. Stock de todas las tiendas, finanzas combinadas, asistencia global, puede crear/editar cualquier cosa.</td>
                </tr>
                <tr>
                  <td><span className="badge badge-sadmin">superadmin</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)',fontWeight:700}}>Administrador técnico</td>
                  <td style={{color:'rgba(255,255,255,0.6)'}}>Acceso técnico completo. Para configuraciones avanzadas del sistema.</td>
                </tr>
                <tr>
                  <td><span className="badge badge-admin">store_admin</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)',fontWeight:700}}>Administrador de tienda</td>
                  <td style={{color:'rgba(255,255,255,0.6)'}}>Ve todo de su tienda: ventas, stock, clientes, finanzas, equipo. Puede configurar la tienda online y aprobar descuentos.</td>
                </tr>
                <tr>
                  <td><span className="badge badge-gerente">gerente</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)',fontWeight:700}}>Gerente de tienda</td>
                  <td style={{color:'rgba(255,255,255,0.6)'}}>Panel completo y reportes. No puede cambiar la configuración de la tienda.</td>
                </tr>
                <tr>
                  <td><span className="badge badge-vend">vendedor</span></td>
                  <td style={{color:'rgba(255,255,255,0.8)',fontWeight:700}}>Vendedor / cajero</td>
                  <td style={{color:'rgba(255,255,255,0.6)'}}>Solo usa el POS para hacer ventas. No ve finanzas ni reportes. Es el rol más limitado, ideal para personal de caja.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{marginTop:14}}>
            <div className="card-title">➕ ¿Cómo crear un usuario nuevo?</div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div><div className="step-title">Entra al panel de tu tienda</div><div className="step-desc">Desde <code>tutienda.pe/ingresar</code> con tu cuenta de store_admin o gerente.</div></div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div><div className="step-title">Ve a la pestaña "Equipo"</div><div className="step-desc">En el menú del panel verás el tab 👥 Equipo. Ahí están todos los trabajadores activos de tu tienda.</div></div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div><div className="step-title">Agrega un trabajador nuevo</div><div className="step-desc">Haz clic en "Agregar trabajador", ingresa nombre completo, correo y elige el rol (vendedor, gerente, store_admin). El sistema crea su cuenta automáticamente.</div></div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div><div className="step-title">El trabajador recibe su acceso</div><div className="step-desc">Entrégale el correo y la contraseña temporal. En su primer ingreso puede activar Face ID para futuros accesos sin contraseña.</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            PANEL CORP TECH
        ══════════════════════════════════════ */}
        <div className="section" id="corp">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(10,132,255,0.12)'}}>🏢</div>
            <div>
              <div className="section-title">Panel de Corp Tech</div>
              <div className="section-subtitle">El centro de control de todo el holding — solo para admins corp</div>
            </div>
          </div>

          <div className="card">
            <p>El panel de Corp Tech se accede desde <code>corptech.pe</code> (5 clics en el logo → login). Desde aquí puedes ver y gestionar <strong>las 3 tiendas al mismo tiempo</strong>. Es el panel más completo del sistema.</p>
          </div>

          <div className="tab-list">
            {[
              ['📈','Dashboard','Resumen ejecutivo con métricas clave: ventas totales, ingresos, costos, productos más vendidos y rendimiento por tienda. Todo en una sola pantalla.'],
              ['🏪','Tiendas','Lista de las 3 tiendas con su estado, ventas del mes y acceso rápido a cada panel. Puedes ver cuál tienda está vendiendo más.'],
              ['📦','Stock Global','Ve el inventario completo de todas las tiendas en un solo lugar. Filtra por tienda, categoría o producto. Ves cuánto hay en total y en cada sede.'],
              ['💰','Finanzas','Flujo de caja combinado, valorización del inventario, costos de importación. Puedes ver cuánto vale todo el stock al precio de costo y al precio de venta.'],
              ['💳','Liquidaciones','Aquí Corp crea las liquidaciones mensuales para cada tienda: cuánto debe pagar cada tienda por el stock que usó o vendió.'],
              ['🏭','Almacenes','Gestión de los almacenes físicos de Corp. Cada almacén tiene sus pasillos y estantes. Sabes exactamente dónde está cada producto.'],
              ['🔄','Traslados','Mueve stock de un almacén a una tienda o entre tiendas. Registra el movimiento con fecha, cantidad y responsable.'],
              ['📥','Importación','Registra las compras de importación desde USA. Calcula el costo landed (precio + flete + impuestos) para saber el verdadero costo de cada producto.'],
              ['🔍','IMEI / Serial','Busca cualquier equipo por su número IMEI o serial. Ve su historial: cuándo entró, en qué tienda está, si fue vendido. Conecta con API de CheckIMEI.'],
              ['📊','Ventas','Reporte de ventas de todas las tiendas con filtros por fecha, tienda y vendedor.'],
              ['🗂️','Catálogo','Gestiona los productos del catálogo general: fotos, variantes de color, precios, descripciones. Estos productos se replican a las tiendas.'],
              ['👥','Equipo','Gestión de todos los trabajadores del holding. Crea, edita o desactiva cuentas de cualquier tienda.'],
              ['✅','Marcar','Marca tu propia entrada/salida (también para personal corp).'],
              ['🗓️','Asistencia','Panel con mapa de dónde marcaron todos los trabajadores. Filtra por tienda y fecha. Ve quién llegó tarde, quién faltó.'],
              ['🔐','Mi Carnet QR','Tu carnet digital personal con QR para login rápido y opción de agregar a Apple Wallet.'],
            ].map(([ico,nom,desc]) => (
              <div className="tab-item" key={nom}>
                <div className="tab-ico">{ico}</div>
                <div><div className="tab-name">{nom}</div><div className="tab-desc">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            PANEL TIENDA
        ══════════════════════════════════════ */}
        <div className="section" id="tienda">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(48,209,88,0.12)'}}>🏪</div>
            <div>
              <div className="section-title">Panel de Tienda</div>
              <div className="section-subtitle">Lo que ve el store_admin y gerente de cada tienda</div>
            </div>
          </div>

          <div className="card">
            <p>Cada tienda tiene su panel en <code>tutienda.pe/ingresar</code>. El store_admin y gerente tienen acceso completo a su tienda. Los vendedores solo acceden al POS.</p>
          </div>

          <div className="tab-list">
            {[
              ['📈','Dashboard','Resumen del día: ventas de hoy, cuántos productos en stock, clientes nuevos. Gráficos de ventas por semana y mes.'],
              ['📦','Stock','El inventario de tu tienda. Puedes ver qué tienes, agregar productos, actualizar cantidades y ver alertas de stock bajo.'],
              ['👥','Clientes','Base de datos de tus clientes: nombre, teléfono, historial de compras, deuda pendiente. Solo tu tienda puede ver sus propios clientes.'],
              ['📊','Ventas','Historial completo de todas las ventas con filtros por fecha, vendedor y producto. Exporta reportes.'],
              ['💰','Finanzas','Flujo de caja de tu tienda, liquidaciones pendientes con Corp, sueldos del equipo, deudas por cobrar y por pagar.'],
              ['🛒','POS','Atajo directo al Punto de Venta para cobrar rápidamente.'],
              ['✅','Marcar','Marcar entrada/salida para trabajadores de tienda.'],
              ['🗓️','Asistencia','Panel de asistencia de tu tienda: quién marcó hoy, a qué hora, desde dónde.'],
              ['⚙️','Configuración','Personaliza tu tienda: nombre, logo, colores, horarios, redes sociales. También configuras los productos que aparecen en la tienda online.'],
              ['🔐','Mi Carnet QR','Carnet personal del trabajador actualmente logueado.'],
            ].map(([ico,nom,desc]) => (
              <div className="tab-item" key={nom}>
                <div className="tab-ico">{ico}</div>
                <div><div className="tab-name">{nom}</div><div className="tab-desc">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            POS
        ══════════════════════════════════════ */}
        <div className="section" id="pos">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(255,159,10,0.12)'}}>🛒</div>
            <div>
              <div className="section-title">POS — Punto de Venta</div>
              <div className="section-subtitle">Cómo hacer una venta paso a paso</div>
            </div>
          </div>

          <div className="card">
            <p>El POS está diseñado para usarse desde el celular. Es rápido, simple y funciona sin imprimir nada. Cualquier vendedor puede usarlo aunque no sepa nada de tecnología.</p>
          </div>

          <div className="card">
            <div className="card-title">📱 ¿Cómo hacer una venta?</div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div><div className="step-title">Busca el producto</div><div className="step-desc">Escribe el nombre del producto o escanea el código. Aparecerá con su precio y stock disponible.</div></div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div><div className="step-title">Agrega al carrito</div><div className="step-desc">Toca "Agregar" para añadir el producto. Puedes agregar varios productos a la misma venta. El total se actualiza al instante.</div></div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div><div className="step-title">Elige el método de pago</div><div className="step-desc">Efectivo, tarjeta, transferencia, Yape o cuenta corriente (fiado). Si es efectivo, el sistema calcula el vuelto automáticamente.</div></div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div><div className="step-title">Aplica descuento si corresponde</div><div className="step-desc">Puedes aplicar un porcentaje de descuento. Si supera el límite, se pide confirmación al store_admin.</div></div>
              </div>
              <div className="step">
                <div className="step-num">5</div>
                <div><div className="step-title">Confirma la venta</div><div className="step-desc">Toca "Cobrar". La venta queda registrada, el stock baja automáticamente y queda en el historial.</div></div>
              </div>
            </div>
          </div>

          <div className="alert ok">
            <div className="alert-icon">✅</div>
            <div>El stock <strong>baja automáticamente</strong> al confirmar una venta. No tienes que actualizarlo a mano. Si un producto llega a 0 unidades, el sistema lo marca como agotado.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            E-COMMERCE / TIENDA ONLINE
        ══════════════════════════════════════ */}
        <div className="section" id="ecommerce">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(191,90,242,0.12)'}}>🌐</div>
            <div>
              <div className="section-title">Tienda Online (E-commerce)</div>
              <div className="section-subtitle">Cómo configurar y usar la tienda que ven los clientes</div>
            </div>
          </div>

          <div className="card">
            <p>Cada tienda tiene su propio sitio web público donde los clientes pueden ver los productos, hacer pedidos y contactarte. La URL es simplemente el dominio de la tienda, por ejemplo <strong style={{color:'var(--blue)'}}>futurteck.pe</strong>.</p>
          </div>

          <div className="card">
            <div className="card-title">⚙️ ¿Cómo configuro mi tienda online?</div>
            <p style={{marginBottom:14}}>Desde el panel de tu tienda, ve a la pestaña <strong>⚙️ Configuración</strong>. Ahí controlas todo lo que ven tus clientes:</p>
            <div className="setting-list">
              {[
                ['🏷️','Nombre y logo','El nombre y logo que aparece en la barra de navegación de tu tienda. Sube tu logo en PNG o SVG.'],
                ['🎨','Colores y estilo','El color principal de tu tienda. Los botones, banners y acentos usarán este color. Cada tienda puede tener su propia identidad visual.'],
                ['🕐','Horarios de atención','Los días y horas en que atiendes. Aparecen en la tienda online para que los clientes sepan cuándo contactarte.'],
                ['📱','Redes sociales y WhatsApp','Tu número de WhatsApp, Instagram, Facebook. Aparecen como botones en tu tienda para que los clientes te contacten directo.'],
                ['🏠','Dirección y mapa','Tu dirección física. Aparece en la tienda con un mapa para que los clientes lleguen fácilmente.'],
                ['📝','Descripción','Un texto corto que describe tu tienda. Aparece en la página de inicio y en Google.'],
                ['⭐','Reseñas y Google','Conecta tus reseñas de Google para mostrarlas en la tienda y generar más confianza.'],
              ].map(([ico,nom,desc]) => (
                <div className="setting-item" key={nom}>
                  <div className="setting-ico">{ico}</div>
                  <div><div className="setting-name">{nom}</div><div className="setting-desc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">📦 ¿Cómo aparecen los productos en la tienda?</div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div><div className="step-title">Los productos vienen del catálogo de Corp</div><div className="step-desc">El catálogo general lo gestiona Corp Tech. Desde ahí se definen nombres, fotos, variantes de color y descripción base.</div></div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div><div className="step-title">Cada tienda personaliza sus precios</div><div className="step-desc">Desde el panel de tu tienda, en la pestaña de Stock, puedes editar el precio de venta de cada producto para tu tienda específica.</div></div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div><div className="step-title">Los productos con stock &gt; 0 aparecen online</div><div className="step-desc">Si un producto tiene unidades disponibles en tu tienda, automáticamente aparece en la tienda online con el botón de "Consultar" o "Pedir".</div></div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div><div className="step-title">Los clientes hacen su pedido</div><div className="step-desc">El cliente elige el producto, lo agrega al carrito y envía el pedido. Tú recibes la notificación y lo atiendes por WhatsApp o en tienda.</div></div>
              </div>
            </div>
          </div>

          <div className="alert tip">
            <div className="alert-icon">💡</div>
            <div><strong>Portal de clientes.</strong> Los clientes pueden registrarse en tu tienda online para ver su historial de pedidos. Ingresan por <code>tutienda.pe/acceso</code>. Sus datos son privados de tu tienda.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            STOCK Y PRODUCTOS
        ══════════════════════════════════════ */}
        <div className="section" id="stock">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(255,159,10,0.12)'}}>📦</div>
            <div>
              <div className="section-title">Stock y Productos</div>
              <div className="section-subtitle">Cómo gestionar el inventario y los productos</div>
            </div>
          </div>

          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">📥</div>
              <div className="feat-name">Entrada de stock</div>
              <div className="feat-desc">Cuando llega mercancía nueva, se registra en el sistema con cantidad, costo y proveedor. El stock sube automáticamente.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📤</div>
              <div className="feat-name">Salida de stock</div>
              <div className="feat-desc">Cada venta que registras en el POS descuenta automáticamente del inventario. No tienes que restar a mano.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🔄</div>
              <div className="feat-name">Traslados entre tiendas</div>
              <div className="feat-desc">Si una tienda tiene mucho stock y otra poco, Corp Tech puede trasladar unidades entre almacenes y tiendas con un registro.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📱</div>
              <div className="feat-name">Control por IMEI/Serial</div>
              <div className="feat-desc">Cada celular o equipo electrónico se registra con su número IMEI. Puedes rastrearlo: saber dónde está, si fue vendido, y su historial completo.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🚨</div>
              <div className="feat-name">Alerta de stock bajo</div>
              <div className="feat-desc">Si un producto baja de cierto número de unidades, el sistema te avisa para que hagas un nuevo pedido antes de quedarte sin stock.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🎨</div>
              <div className="feat-name">Variantes de color</div>
              <div className="feat-desc">Un mismo producto puede tener versiones en distintos colores. Cada color tiene su propio stock y foto.</div>
            </div>
          </div>

          <div className="alert tip" style={{marginTop:16}}>
            <div className="alert-icon">🔍</div>
            <div><strong>Validación de IMEI.</strong> Antes de comprar o vender un equipo, puedes verificar su estado (robado, bloqueado, limpio) con la integración de CheckIMEI/Sickw directo desde el sistema.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            ASISTENCIA
        ══════════════════════════════════════ */}
        <div className="section" id="asistencia">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(48,209,88,0.12)'}}>✅</div>
            <div>
              <div className="section-title">Control de Asistencia</div>
              <div className="section-subtitle">Cómo marcan los trabajadores y cómo los admins controlan la asistencia</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📍 ¿Cómo marca un trabajador?</div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div><div className="step-title">Entra al panel de tu tienda</div><div className="step-desc">Desde <code>tutienda.pe/ingresar</code> con tu cuenta de trabajador.</div></div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div><div className="step-title">Ve a la pestaña "Marcar" ✅</div><div className="step-desc">Está en el menú lateral o en la barra inferior del celular.</div></div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div><div className="step-title">El sistema pide tu ubicación</div><div className="step-desc">Debes permitir el acceso al GPS cuando el navegador lo pida. Esto es para registrar desde dónde marcaste.</div></div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div><div className="step-title">Toca el botón grande</div><div className="step-desc">Si es tu primera marcación del día toca "Marcar Entrada 🟢". Cuando terminas tu turno toca "Marcar Salida 🔴".</div></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🗓️ ¿Qué ve el admin en el panel de asistencia?</div>
            <ul>
              <li><strong>Lista de todos los check-ins del día</strong> con hora exacta y nombre del trabajador.</li>
              <li><strong>Mapa con puntos de colores</strong> — verde para entradas, rojo para salidas. Ves desde dónde marcó cada persona.</li>
              <li><strong>Sesiones de trabajo</strong> — el sistema calcula automáticamente cuántas horas trabajó cada persona.</li>
              <li><strong>Filtros por fecha y tienda</strong> — el admin de Corp puede ver todas las tiendas, el admin de tienda solo ve la suya.</li>
            </ul>
          </div>

          <div className="alert warn">
            <div className="alert-icon">⚠️</div>
            <div>Para que la asistencia funcione, el administrador técnico debe haber creado la tabla en la base de datos (SQL de asistencia). Si no funciona, contacta al administrador.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            FINANZAS
        ══════════════════════════════════════ */}
        <div className="section" id="finanzas">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(255,159,10,0.12)'}}>💰</div>
            <div>
              <div className="section-title">Módulo Financiero</div>
              <div className="section-subtitle">Control de dinero, costos y liquidaciones</div>
            </div>
          </div>

          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">💵</div>
              <div className="feat-name">Flujo de caja</div>
              <div className="feat-desc">Ve cuánto dinero entró y salió cada día/mes. Separa por tienda o ve el total del holding.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📊</div>
              <div className="feat-name">Valorización de stock</div>
              <div className="feat-desc">Cuánto vale todo tu inventario al precio de costo y al precio de venta. Ves el margen potencial total.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">✈️</div>
              <div className="feat-name">Costo Landed (importaciones)</div>
              <div className="feat-desc">Calcula el costo real de productos importados: precio + flete + seguro + aranceles + manejo. El precio de costo es el costo landed, no el precio de compra.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">💳</div>
              <div className="feat-name">Liquidaciones</div>
              <div className="feat-desc">Corp Tech genera liquidaciones mensuales para cada tienda. La tienda las revisa, aprueba y registra el pago. Queda registro de todo.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">👔</div>
              <div className="feat-name">Sueldos del equipo</div>
              <div className="feat-desc">Registra los sueldos de cada trabajador por tienda. Descuéntalo del flujo de caja para ver la utilidad real.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📋</div>
              <div className="feat-name">Deudores y deudas</div>
              <div className="feat-desc">Clientes que compraron en cuenta corriente (fiado). Ve quién te debe, cuánto y desde cuándo.</div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            CONFIGURAR EMPRESA
        ══════════════════════════════════════ */}
        <div className="section" id="config">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(90,200,250,0.12)'}}>⚙️</div>
            <div>
              <div className="section-title">Configurar tu empresa</div>
              <div className="section-subtitle">Cómo personalizar cada tienda para que se vea como tuya</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Desde el panel de tu tienda → pestaña ⚙️ Configuración</div>
            <div className="setting-list" style={{marginTop:12}}>
              {[
                ['🏷️','Nombre de la empresa','El nombre que aparece en la tienda online, en el panel y en los documentos.'],
                ['🖼️','Logo','Sube el logo en formato imagen. Aparece en la barra de navegación de la tienda online y en el panel del equipo.'],
                ['🎨','Color principal','El color de los botones, banners y acentos de tu tienda online. Ingresa el código hexadecimal o elige uno.'],
                ['🕐','Horarios','Lunes a sábado de X a Y, domingo de Z a W. Los clientes lo ven en la tienda online.'],
                ['📍','Dirección','Dirección física de la tienda. Aparece en la tienda online con un mapa interactivo.'],
                ['📱','WhatsApp','El número de WhatsApp principal. Los clientes pueden contactarte directo con un solo toque.'],
                ['📸','Instagram','Tu cuenta de Instagram. Los clientes pueden ver tu perfil desde la tienda.'],
                ['⭐','Google Maps URL','El link de tu tienda en Google Maps. Los clientes pueden ver las reseñas y cómo llegar.'],
              ].map(([ico,nom,desc]) => (
                <div className="setting-item" key={nom}>
                  <div className="setting-ico">{ico}</div>
                  <div><div className="setting-name">{nom}</div><div className="setting-desc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="alert ok">
            <div className="alert-icon">✅</div>
            <div>Todos los cambios de configuración se guardan inmediatamente. <strong>No hay que hacer nada técnico.</strong> Rellena los campos y haz clic en Guardar. Los cambios aparecen en la tienda online al instante.</div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            CARNET QR
        ══════════════════════════════════════ */}
        <div className="section" id="carnet">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(255,69,58,0.12)'}}>📲</div>
            <div>
              <div className="section-title">Carnet Digital y QR</div>
              <div className="section-subtitle">Tu identificación digital para entrar al sistema rápido</div>
            </div>
          </div>

          <div className="card">
            <p>Cada trabajador tiene un <strong>carnet digital</strong> con su foto, nombre, cargo y un código QR único. Es como una credencial de empleado pero digital — vive en tu celular.</p>
          </div>

          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">📸</div>
              <div className="feat-name">QR para login</div>
              <div className="feat-desc">El QR del carnet permite ingresar al panel escaneando la pantalla desde el celular. Sin escribir nada.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🍎</div>
              <div className="feat-name">Apple Wallet</div>
              <div className="feat-desc">Puedes guardar el carnet en Apple Wallet como si fuera una tarjeta de embarque. Siempre disponible aunque no tengas internet.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🔑</div>
              <div className="feat-name">Activar Face ID</div>
              <div className="feat-desc">Desde el carnet puedes activar el login con Face ID o huella. Una vez activado, entras al sistema en 1 segundo.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">💾</div>
              <div className="feat-name">Guardar como imagen</div>
              <div className="feat-desc">Descarga tu carnet como imagen para guardarlo o compartirlo. Funciona incluso sin internet.</div>
            </div>
          </div>

          <div className="card" style={{marginTop:4}}>
            <div className="card-title">📲 ¿Cómo accedo a mi carnet?</div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div><div className="step-title">Entra al panel de tu tienda</div><div className="step-desc">Desde <code>tutienda.pe/ingresar</code></div></div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div><div className="step-title">Ve a "Mi Carnet QR" 🔐</div><div className="step-desc">Está al final del menú lateral o en la barra de navegación.</div></div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div><div className="step-title">Elige qué quieres hacer</div><div className="step-desc">Agrega a Apple Wallet, descarga como imagen, o activa Face ID para futuros accesos sin contraseña.</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            PREGUNTAS FRECUENTES
        ══════════════════════════════════════ */}
        <div className="section">
          <div className="section-header">
            <div className="section-ico" style={{background:'rgba(255,159,10,0.12)'}}>❓</div>
            <div>
              <div className="section-title">Preguntas frecuentes</div>
              <div className="section-subtitle">Las dudas más comunes resueltas en pocas palabras</div>
            </div>
          </div>

          {[
            ['¿Puedo usar el sistema desde el celular?','Sí, todo el sistema está optimizado para celular. El POS, el marcado de asistencia, el panel de tienda — todo funciona perfectamente en pantallas pequeñas.'],
            ['¿Los clientes de una tienda pueden comprar en otra?','No directamente. Cada tienda tiene su propio e-commerce y su propia base de clientes. Un cliente registrado en Futurteck no aparece en WeTech. Esto es por privacidad.'],
            ['¿Qué pasa si un trabajador se olvida de marcar salida?','La sesión queda abierta. El admin puede ver el registro incompleto en el panel de asistencia y editarlo manualmente si es necesario.'],
            ['¿Puedo ver las ventas de las 3 tiendas a la vez?','Solo desde Corp Tech. El panel de Corp tiene reportes combinados de todas las tiendas. Desde el panel de tienda solo ves tu tienda.'],
            ['¿Cómo cambio la contraseña de un trabajador?','Desde el panel de tienda, pestaña "Equipo", busca al trabajador y usa la opción de restablecer contraseña. Le llegará un correo para que la cambie.'],
            ['¿Puedo personalizar los colores de cada tienda por separado?','Sí. Cada tienda tiene su propia configuración de color. Futurteck puede ser azul, WeTech verde, InnovaTech morado — cada una con su identidad.'],
            ['¿Qué es el costo landed y por qué es importante?','Es el costo real de un producto importado: precio de compra + flete + seguro + aranceles + gastos de manejo. Es importante porque si solo miras el precio de compra sin incluir los costos de importación, calculas mal tu margen de ganancia.'],
            ['¿Puedo exportar reportes?','Sí. Los reportes de ventas y asistencia se pueden exportar. Los reportes financieros también. Está disponible en los paneles de Corp y Tienda.'],
          ].map(([q,a]) => (
            <div className="card" key={q} style={{marginBottom:10}}>
              <div className="card-title" style={{fontSize:14,marginBottom:6}}>🙋 {q}</div>
              <p>{a}</p>
            </div>
          ))}
        </div>

      </div>{/* /container */}

      <div className="page-footer">
        <div style={{marginBottom:8}}>Corp Tech ERP · Sistema de gestión multi-tienda</div>
        <div>Desarrollado por <a href="https://pmg-studio.com" target="_blank" rel="noopener noreferrer">pmg-studio.com</a></div>
      </div>
    </>
  );
}
