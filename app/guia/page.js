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
  .hero { background:linear-gradient(160deg,rgba(10,132,255,0.14) 0%,rgba(191,90,242,0.06) 40%,#08080C 65%); padding:64px 24px 48px; text-align:center; border-bottom:1px solid var(--border); }
  .hero-badge { display:inline-flex; align-items:center; gap:7px; background:rgba(10,132,255,0.12); border:1px solid rgba(10,132,255,0.25); border-radius:999px; padding:5px 16px; font-size:12px; font-weight:700; color:var(--blue); margin-bottom:20px; letter-spacing:0.05em; text-transform:uppercase; }
  .hero h1 { font-size:clamp(28px,5vw,48px); font-weight:900; letter-spacing:-0.5px; margin-bottom:12px; line-height:1.1; }
  .hero h1 span { color:var(--blue); }
  .hero p { font-size:16px; color:var(--muted); max-width:560px; margin:0 auto 24px; }
  .hero-pills { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
  .hero-pill { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:999px; padding:5px 14px; font-size:12px; font-weight:600; color:rgba(255,255,255,0.6); }

  /* STICKY TOOLBAR */
  .toolbar { position:sticky; top:0; z-index:100; background:rgba(8,8,12,0.92); backdrop-filter:blur(16px); border-bottom:1px solid var(--border); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .toolbar-left { font-size:13px; color:var(--muted); font-weight:600; }
  .toolbar-right { display:flex; gap:8px; }
  .btn-toggle { padding:7px 16px; border-radius:10px; border:1px solid; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; font-family:'Urbanist',sans-serif; }
  .btn-open  { background:rgba(10,132,255,0.12); border-color:rgba(10,132,255,0.3); color:var(--blue); }
  .btn-close { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.15); color:rgba(255,255,255,0.6); }
  .btn-open:hover  { background:rgba(10,132,255,0.22); }
  .btn-close:hover { background:rgba(255,255,255,0.1); }

  /* CONTAINER */
  .container { max-width:860px; margin:0 auto; padding:32px 24px 80px; display:flex; flex-direction:column; gap:12px; }

  /* COLLAPSIBLE SECTION */
  details { background:var(--card); border:1px solid var(--border); border-radius:20px; overflow:hidden; transition:border-color .2s; }
  details[open] { border-color:rgba(255,255,255,0.14); }
  details summary { list-style:none; display:flex; align-items:center; gap:14px; padding:20px 24px; cursor:pointer; user-select:none; }
  details summary::-webkit-details-marker { display:none; }
  .sum-ico { width:42px; height:42px; border-radius:13px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:20px; }
  .sum-text { flex:1; }
  .sum-title { font-size:16px; font-weight:800; }
  .sum-sub { font-size:13px; color:var(--muted); margin-top:2px; font-weight:500; }
  .sum-chevron { font-size:18px; color:var(--muted); transition:transform .2s; flex-shrink:0; }
  details[open] .sum-chevron { transform:rotate(180deg); }
  .section-body { padding:0 24px 24px; border-top:1px solid var(--border); }
  .section-body > *:first-child { margin-top:20px; }

  /* CARDS */
  .card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:20px 22px; margin-bottom:12px; }
  .card-title { font-size:14px; font-weight:800; margin-bottom:8px; }
  .card p, .card li { font-size:14px; color:var(--muted); line-height:1.7; }
  .card ul { padding-left:18px; }
  .card ul li { margin-bottom:4px; }
  .card strong { color:#fff; }

  /* FEAT GRID */
  .feat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:10px; margin-bottom:12px; }
  .feat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:18px; }
  .feat-icon { font-size:24px; margin-bottom:8px; }
  .feat-name { font-size:13px; font-weight:800; margin-bottom:4px; }
  .feat-desc { font-size:12px; color:var(--muted); line-height:1.6; }

  /* STEPS */
  .steps { display:flex; flex-direction:column; }
  .step { display:flex; gap:14px; padding:15px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
  .step:last-child { border-bottom:none; }
  .step-num { width:30px; height:30px; border-radius:50%; background:rgba(10,132,255,0.15); color:var(--blue); flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; margin-top:2px; }
  .step-title { font-size:14px; font-weight:800; margin-bottom:3px; }
  .step-desc { font-size:13px; color:var(--muted); line-height:1.6; }

  /* ROLES TABLE */
  .role-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
  .role-table th { text-align:left; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--subtle); padding:10px 14px; border-bottom:1px solid var(--border); }
  .role-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:top; line-height:1.5; }
  .role-table tr:last-child td { border-bottom:none; }
  .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .badge-corp    { background:rgba(10,132,255,0.2);  color:var(--blue);   }
  .badge-sadmin  { background:rgba(255,159,10,0.2);  color:var(--orange); }
  .badge-admin   { background:rgba(191,90,242,0.15); color:var(--purple); }
  .badge-gerente { background:rgba(255,159,10,0.15); color:var(--orange); }
  .badge-vend    { background:rgba(48,209,88,0.15);  color:var(--green);  }

  /* ALERTS */
  .alert { border-radius:13px; padding:13px 16px; margin-bottom:12px; display:flex; gap:11px; align-items:flex-start; font-size:13px; line-height:1.65; }
  .alert-icon { font-size:17px; flex-shrink:0; margin-top:1px; }
  .alert.tip   { background:rgba(10,132,255,0.08);  border:1px solid rgba(10,132,255,0.22);  color:rgba(255,255,255,0.75); }
  .alert.warn  { background:rgba(255,159,10,0.08);  border:1px solid rgba(255,159,10,0.22);  color:rgba(255,255,255,0.75); }
  .alert.ok    { background:rgba(48,209,88,0.08);   border:1px solid rgba(48,209,88,0.22);   color:rgba(255,255,255,0.75); }

  /* URL PILL */
  .url-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:7px 13px; font-size:13px; font-weight:700; color:var(--blue); font-family:'SF Mono','Fira Code',monospace; margin:8px 0; word-break:break-all; }

  /* METHOD GRID */
  .method-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  @media(max-width:520px){ .method-grid{ grid-template-columns:1fr; } }
  .method-card { border-radius:14px; padding:16px; border:1.5px solid; display:flex; flex-direction:column; gap:7px; }
  .method-icon { font-size:26px; }
  .method-name { font-size:13px; font-weight:800; }
  .method-desc { font-size:12px; line-height:1.55; color:rgba(255,255,255,0.5); }

  /* TAB LIST */
  .tab-list { display:flex; flex-direction:column; margin-bottom:12px; }
  .tab-item { display:flex; align-items:flex-start; gap:13px; padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
  .tab-item:last-child { border-bottom:none; }
  .tab-ico { font-size:20px; flex-shrink:0; margin-top:2px; }
  .tab-name { font-size:14px; font-weight:800; margin-bottom:3px; }
  .tab-desc { font-size:13px; color:var(--muted); line-height:1.6; }

  /* SETTING LIST */
  .setting-list { display:flex; flex-direction:column; gap:9px; margin-bottom:12px; }
  .setting-item { display:flex; gap:11px; align-items:flex-start; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:11px; padding:12px 14px; }
  .setting-ico { font-size:18px; flex-shrink:0; }
  .setting-name { font-size:13px; font-weight:700; margin-bottom:2px; }
  .setting-desc { font-size:12px; color:var(--muted); line-height:1.6; }

  /* CLICK DOTS */
  .click-dots { display:flex; gap:6px; margin:8px 0; }
  .click-dot  { width:9px; height:9px; border-radius:50%; background:var(--blue); box-shadow:0 0 7px rgba(10,132,255,0.5); }

  code { background:rgba(255,255,255,0.07); padding:2px 7px; border-radius:6px; font-size:12px; font-family:'SF Mono','Fira Code',monospace; }

  /* FOOTER */
  .page-footer { text-align:center; padding:36px 24px; border-top:1px solid var(--border); font-size:12px; color:var(--subtle); }
  .page-footer a { color:var(--blue); text-decoration:none; }

  @media(max-width:600px) {
    .feat-grid { grid-template-columns:1fr; }
    details summary { padding:16px 18px; }
    .section-body { padding:0 18px 20px; }
  }
`;

const SCRIPT = `
  function toggleAll(open) {
    document.querySelectorAll('details').forEach(d => {
      if (open) d.setAttribute('open',''); else d.removeAttribute('open');
    });
  }
`;

export default function GuiaPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">📋 Guía Oficial del Sistema</div>
        <h1>Todo lo que necesitas<br /><span>para usar el ERP</span></h1>
        <p>Aquí está todo explicado en palabras simples: roles, ventas, tienda online, asistencia, finanzas y más.</p>
        <div className="hero-pills">
          <span className="hero-pill">👥 Roles</span>
          <span className="hero-pill">🏪 Panel tienda</span>
          <span className="hero-pill">🛒 POS</span>
          <span className="hero-pill">🌐 E-commerce</span>
          <span className="hero-pill">✅ Asistencia</span>
          <span className="hero-pill">📦 Stock</span>
          <span className="hero-pill">💰 Finanzas</span>
        </div>
      </div>

      {/* TOOLBAR STICKY */}
      <div className="toolbar">
        <div className="toolbar-left">📋 Guía del Sistema — Corp Tech ERP</div>
        <div className="toolbar-right">
          <button className="btn-toggle btn-open">▼ Abrir todo</button>
          <button className="btn-toggle btn-close">▲ Cerrar todo</button>
        </div>
      </div>
      {/* Los botones necesitan onclick en el HTML para funcionar sin React hydration */}
      <style dangerouslySetInnerHTML={{__html:`
        .btn-open[data-ready]  { display:inline-flex; }
        .btn-close[data-ready] { display:inline-flex; }
      `}} />
      <script dangerouslySetInnerHTML={{__html:`
        document.addEventListener('DOMContentLoaded', function() {
          var btns = document.querySelectorAll('.btn-toggle');
          btns[0].onclick = function(){ toggleAll(true); };
          btns[1].onclick = function(){ toggleAll(false); };
        });
      `}} />

      <div className="container">

        {/* ══ 1. QUÉ ES EL SISTEMA ══ */}
        <details open>
          <summary>
            <div className="sum-ico" style={{background:'rgba(10,132,255,0.12)'}}>🏗️</div>
            <div className="sum-text">
              <div className="sum-title">¿Qué es este sistema?</div>
              <div className="sum-sub">Un holding con 3 tiendas — cómo está organizado todo</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card">
              <div className="card-title">🏢 Una empresa matriz que controla 3 tiendas</div>
              <p>Este sistema maneja <strong>Corp Tech</strong> (la empresa dueña) más <strong>3 tiendas independientes</strong>: Futurteck, WeTech Perú e InnovaTech. Cada tienda tiene su propio dominio, tienda online y clientes — pero el stock y los reportes financieros se ven todos juntos desde Corp Tech.</p>
            </div>
            <div className="feat-grid">
              {[
                ['🏢','Corp Tech (Matriz)','Ve y controla todo: stock global, finanzas de las 3 tiendas, importaciones, traslados y reportes combinados.'],
                ['🔵','Futurteck','Tienda 1. Dominio propio, tienda online, POS, clientes y equipo independiente.'],
                ['🟢','WeTech Perú','Tienda 2. Su propia marca, precios, colores y catálogo.'],
                ['🟣','InnovaTech','Tienda 3. Los clientes de InnovaTech no mezclan datos con las otras tiendas.'],
              ].map(([ico,nom,desc]) => (
                <div className="feat-card" key={nom}>
                  <div className="feat-icon">{ico}</div>
                  <div className="feat-name">{nom}</div>
                  <div className="feat-desc">{desc}</div>
                </div>
              ))}
            </div>
            <div className="alert tip">
              <div className="alert-icon">💡</div>
              <div><strong>Datos separados por diseño.</strong> Cada tienda tiene su propia lista de clientes — un cliente de Futurteck no aparece en WeTech. El stock sí se puede ver y compartir desde Corp Tech.</div>
            </div>
          </div>
        </details>

        {/* ══ 2. CÓMO INGRESAN ══ */}
        <details open>
          <summary>
            <div className="sum-ico" style={{background:'rgba(48,209,88,0.12)'}}>🔐</div>
            <div className="sum-text">
              <div className="sum-title">¿Cómo ingresan al sistema?</div>
              <div className="sum-sub">Acceso para trabajadores, admins y corp</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card">
              <div className="card-title">🏪 Trabajadores de tienda</div>
              <p>Entran por la URL de su tienda más <code>/ingresar</code>:</p>
              <div className="url-pill">🔗 futurteck.pe/ingresar</div>
              <p style={{marginTop:8}}>También pueden ir al final de la tienda online y tocar el botón <strong>"Acceso equipo"</strong> en el pie de página.</p>
            </div>
            <p style={{fontSize:14,color:'var(--muted)',marginBottom:12}}>Al entrar verán <strong style={{color:'#fff'}}>4 métodos de login</strong>:</p>
            <div className="method-grid">
              {[
                ['🔑','Passkey (Face ID / Huella)','rgba(10,132,255,0.3)','rgba(10,132,255,0.06)','var(--blue)','El más rápido. Un vistazo o un toque y entras. Sin contraseña. Se activa una sola vez.'],
                ['✉️','Magic Link','rgba(48,209,88,0.3)','rgba(48,209,88,0.06)','var(--green)','Escribe tu correo, recibes un enlace, haces clic y entras. Sin recordar contraseña.'],
                ['📲','QR del Carnet','rgba(255,159,10,0.3)','rgba(255,159,10,0.06)','var(--orange)','Escanea el código QR de tu carnet digital. También funciona con Apple Wallet.'],
                ['🔐','Contraseña','rgba(191,90,242,0.3)','rgba(191,90,242,0.06)','var(--purple)','Email + contraseña. Para el primer ingreso y como respaldo.'],
              ].map(([ico,nom,bc,bg,col,desc]) => (
                <div className="method-card" key={nom} style={{borderColor:bc,background:bg}}>
                  <div className="method-icon">{ico}</div>
                  <div className="method-name" style={{color:col}}>{nom}</div>
                  <div className="method-desc">{desc}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title">🏢 Acceso a Corp Tech (secreto)</div>
              <p>En <code>corptech.pe</code> no hay botón de login visible — está diseñado para que los clientes no lo vean. El acceso es con <strong>5 clics rápidos en el logo</strong>.</p>
              <div className="click-dots" style={{margin:'12px 0 4px'}}>
                {[0,1,2,3,4].map(i => <div key={i} className="click-dot" />)}
              </div>
              <p style={{fontSize:13,color:'var(--muted)'}}>→ 5 clics rápidos en el logo → pantalla de login corp</p>
            </div>
            <div className="alert tip">
              <div className="alert-icon">💡</div>
              <div><strong>Primer ingreso siempre con contraseña.</strong> Después el trabajador puede activar Face ID desde su Carnet QR.</div>
            </div>
          </div>
        </details>

        {/* ══ 3. ROLES ══ */}
        <details open>
          <summary>
            <div className="sum-ico" style={{background:'rgba(191,90,242,0.12)'}}>👥</div>
            <div className="sum-text">
              <div className="sum-title">Roles y permisos</div>
              <div className="sum-sub">Quién puede hacer qué en el sistema</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <table className="role-table">
                <thead><tr><th>Rol</th><th>¿Quién es?</th><th>¿Qué puede hacer?</th></tr></thead>
                <tbody>
                  <tr>
                    <td><span className="badge badge-corp">corp / admin_corp</span></td>
                    <td style={{color:'rgba(255,255,255,0.85)',fontWeight:700}}>Dueño / Director</td>
                    <td style={{color:'rgba(255,255,255,0.6)'}}>Ve y controla todo el holding. Stock global, finanzas, asistencia, puede crear/editar cualquier cosa.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-sadmin">superadmin</span></td>
                    <td style={{color:'rgba(255,255,255,0.85)',fontWeight:700}}>Admin técnico</td>
                    <td style={{color:'rgba(255,255,255,0.6)'}}>Acceso técnico completo. Para configuraciones avanzadas.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-admin">store_admin</span></td>
                    <td style={{color:'rgba(255,255,255,0.85)',fontWeight:700}}>Admin de tienda</td>
                    <td style={{color:'rgba(255,255,255,0.6)'}}>Ve todo de su tienda: ventas, stock, clientes, finanzas, equipo. Configura la tienda online.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-gerente">gerente</span></td>
                    <td style={{color:'rgba(255,255,255,0.85)',fontWeight:700}}>Gerente de tienda</td>
                    <td style={{color:'rgba(255,255,255,0.6)'}}>Panel completo y reportes. No cambia la configuración.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-vend">vendedor</span></td>
                    <td style={{color:'rgba(255,255,255,0.85)',fontWeight:700}}>Vendedor / cajero</td>
                    <td style={{color:'rgba(255,255,255,0.6)'}}>Solo usa el POS para cobrar. No ve finanzas ni reportes.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-title">➕ ¿Cómo crear un usuario nuevo?</div>
              <div className="steps">
                {[
                  ['Entra al panel de tu tienda','Desde tutienda.pe/ingresar con tu cuenta de store_admin o gerente.'],
                  ['Ve a la pestaña "Equipo"','En el menú lateral verás el tab 👥 Equipo con todos los trabajadores activos.'],
                  ['Agrega un trabajador','Clic en "Agregar trabajador", ingresa nombre, correo y elige el rol. El sistema crea la cuenta automáticamente.'],
                  ['El trabajador recibe su acceso','Entrégale el correo y contraseña temporal. Puede activar Face ID en su primer ingreso.'],
                ].map(([t,d],i) => (
                  <div className="step" key={i}>
                    <div className="step-num">{i+1}</div>
                    <div><div className="step-title">{t}</div><div className="step-desc">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        {/* ══ 4. PANEL CORP ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(10,132,255,0.12)'}}>🏢</div>
            <div className="sum-text">
              <div className="sum-title">Panel de Corp Tech</div>
              <div className="sum-sub">El centro de control del holding — solo para admins corp</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card"><p>Se accede desde <code>corptech.pe</code> (5 clics en el logo). Desde aquí puedes ver y gestionar <strong>las 3 tiendas al mismo tiempo</strong>.</p></div>
            <div className="tab-list">
              {[
                ['📈','Dashboard','Resumen ejecutivo: ventas totales, ingresos, costos, productos más vendidos, rendimiento por tienda.'],
                ['🏪','Tiendas','Lista de las 3 tiendas con su estado y ventas del mes. Acceso rápido a cada panel.'],
                ['📦','Stock Global','Inventario completo de todas las tiendas en un lugar. Filtra por tienda, categoría o producto.'],
                ['💰','Finanzas','Flujo de caja combinado, valorización del inventario, costos de importación y margen total.'],
                ['💳','Liquidaciones','Corp crea las liquidaciones mensuales para cada tienda. La tienda revisa y paga.'],
                ['🏭','Almacenes','Gestión de almacenes físicos con pasillos y estantes. Sabes exactamente dónde está cada producto.'],
                ['🔄','Traslados','Mueve stock entre almacenes y tiendas. Queda registro del movimiento.'],
                ['📥','Importación','Registra compras de USA. Calcula el costo landed (precio + flete + impuestos).'],
                ['🔍','IMEI / Serial','Busca cualquier equipo por IMEI. Ve su historial completo y verifica estado con CheckIMEI.'],
                ['📊','Ventas','Reporte de ventas de todas las tiendas con filtros por fecha, tienda y vendedor.'],
                ['🗂️','Catálogo','Gestiona productos: fotos, variantes de color, precios, descripciones.'],
                ['👥','Equipo','Gestión de todos los trabajadores del holding. Crea, edita o desactiva cuentas.'],
                ['✅','Marcar','Marca tu propia entrada/salida como personal corp.'],
                ['🗓️','Asistencia','Panel con mapa de todos los check-ins. Filtra por tienda y fecha.'],
                ['🔐','Mi Carnet QR','Carnet digital con QR para login rápido y Apple Wallet.'],
              ].map(([ico,nom,desc]) => (
                <div className="tab-item" key={nom}>
                  <div className="tab-ico">{ico}</div>
                  <div><div className="tab-name">{nom}</div><div className="tab-desc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* ══ 5. PANEL TIENDA ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(48,209,88,0.12)'}}>🏪</div>
            <div className="sum-text">
              <div className="sum-title">Panel de Tienda</div>
              <div className="sum-sub">Lo que ve el store_admin y gerente de cada tienda</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card"><p>Cada tienda entra por <code>tutienda.pe/ingresar</code>. El store_admin y gerente tienen acceso completo a su tienda. Los vendedores solo acceden al POS.</p></div>
            <div className="tab-list">
              {[
                ['📈','Dashboard','Resumen del día: ventas, stock, clientes nuevos. Gráficos de ventas por semana y mes.'],
                ['📦','Stock','Inventario de tu tienda. Agrega productos, actualiza cantidades, ve alertas de stock bajo.'],
                ['👥','Clientes','Base de datos con nombre, teléfono, historial de compras y deuda. Solo tu tienda ve sus clientes.'],
                ['📊','Ventas','Historial completo de ventas con filtros por fecha, vendedor y producto.'],
                ['💰','Finanzas','Flujo de caja, liquidaciones con Corp, sueldos, deudas por cobrar y pagar.'],
                ['🛒','POS','Atajo directo al Punto de Venta.'],
                ['✅','Marcar','Marcar entrada/salida del trabajador.'],
                ['🗓️','Asistencia','Panel de asistencia de tu tienda: quién marcó, a qué hora y desde dónde.'],
                ['⚙️','Configuración','Personaliza tu tienda: nombre, logo, colores, horarios, redes sociales, dirección.'],
                ['🔐','Mi Carnet QR','Carnet personal del trabajador logueado.'],
              ].map(([ico,nom,desc]) => (
                <div className="tab-item" key={nom}>
                  <div className="tab-ico">{ico}</div>
                  <div><div className="tab-name">{nom}</div><div className="tab-desc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* ══ 6. POS ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(255,159,10,0.12)'}}>🛒</div>
            <div className="sum-text">
              <div className="sum-title">POS — Punto de Venta</div>
              <div className="sum-sub">Cómo hacer una venta paso a paso</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card"><p>El POS está hecho para usarse desde el celular. Es rápido, simple y funciona sin imprimir nada.</p></div>
            <div className="card">
              <div className="card-title">📱 ¿Cómo hacer una venta?</div>
              <div className="steps">
                {[
                  ['Busca el producto','Escribe el nombre o escanea el código. Aparece con precio y stock disponible.'],
                  ['Agrega al carrito','Toca "Agregar". Puedes poner varios productos. El total se actualiza al instante.'],
                  ['Elige el método de pago','Efectivo, tarjeta, transferencia, Yape o cuenta corriente (fiado). Si es efectivo, calcula el vuelto.'],
                  ['Aplica descuento si hay','Puedes poner un porcentaje de descuento. Si supera el límite, pide confirmación al admin.'],
                  ['Confirma la venta','Toca "Cobrar". Queda registrado, el stock baja automáticamente.'],
                ].map(([t,d],i) => (
                  <div className="step" key={i}>
                    <div className="step-num">{i+1}</div>
                    <div><div className="step-title">{t}</div><div className="step-desc">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="alert ok">
              <div className="alert-icon">✅</div>
              <div>El stock <strong>baja solo</strong> al confirmar cada venta. No tienes que actualizarlo a mano.</div>
            </div>
          </div>
        </details>

        {/* ══ 7. E-COMMERCE ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(191,90,242,0.12)'}}>🌐</div>
            <div className="sum-text">
              <div className="sum-title">Tienda Online (E-commerce)</div>
              <div className="sum-sub">Cómo configurar y usar la tienda que ven los clientes</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card">
              <p>Cada tienda tiene su sitio web público en su dominio (ej. <strong style={{color:'var(--blue)'}}>futurteck.pe</strong>). Los clientes ven los productos, hacen pedidos y te contactan desde ahí.</p>
            </div>
            <div className="card">
              <div className="card-title">⚙️ ¿Cómo configuro mi tienda online?</div>
              <p style={{marginBottom:12}}>Panel de tienda → pestaña <strong>⚙️ Configuración</strong>:</p>
              <div className="setting-list">
                {[
                  ['🏷️','Nombre y logo','El nombre y logo que aparece en la barra de tu tienda.'],
                  ['🎨','Color principal','El color de botones y banners. Cada tienda puede tener su propia identidad.'],
                  ['🕐','Horarios de atención','Los días y horas en que atiendes. Aparecen en la tienda online.'],
                  ['📱','WhatsApp y redes sociales','Tu número de WhatsApp, Instagram, Facebook. Aparecen como botones de contacto.'],
                  ['🏠','Dirección y mapa','Tu dirección física con mapa para que los clientes lleguen.'],
                  ['📝','Descripción','Texto corto que describe tu tienda. Aparece en la página de inicio y en Google.'],
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
                {[
                  ['Los productos vienen del catálogo de Corp','Corp Tech gestiona el catálogo general: nombres, fotos, variantes y descripción base.'],
                  ['Cada tienda pone sus precios','Desde el panel de tu tienda, en Stock, puedes editar el precio de venta para tu tienda.'],
                  ['Stock > 0 = aparece online','Si un producto tiene unidades disponibles, aparece automáticamente en tu tienda online.'],
                  ['Los clientes hacen pedidos','El cliente elige, agrega al carrito y envía. Tú recibes la notificación y lo atiendes por WhatsApp.'],
                ].map(([t,d],i) => (
                  <div className="step" key={i}>
                    <div className="step-num">{i+1}</div>
                    <div><div className="step-title">{t}</div><div className="step-desc">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="alert tip">
              <div className="alert-icon">💡</div>
              <div><strong>Portal de clientes:</strong> Los clientes se registran en <code>tutienda.pe/acceso</code> para ver su historial de pedidos. Sus datos son privados de tu tienda.</div>
            </div>
          </div>
        </details>

        {/* ══ 8. STOCK ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(255,159,10,0.12)'}}>📦</div>
            <div className="sum-text">
              <div className="sum-title">Stock y Productos</div>
              <div className="sum-sub">Cómo gestionar el inventario</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="feat-grid">
              {[
                ['📥','Entrada de stock','Cuando llega mercancía, se registra con cantidad, costo y proveedor. El stock sube automáticamente.'],
                ['📤','Salida de stock','Cada venta del POS descuenta automáticamente del inventario.'],
                ['🔄','Traslados','Corp Tech puede mover unidades entre almacenes y tiendas con registro.'],
                ['📱','Control por IMEI','Cada equipo se registra con su IMEI. Puedes rastrearlo: dónde está, si fue vendido, su historial.'],
                ['🚨','Alerta stock bajo','Cuando un producto baja de cierta cantidad, el sistema avisa para reordenar.'],
                ['🎨','Variantes de color','Un mismo producto puede tener versiones en distintos colores, cada uno con su stock y foto.'],
              ].map(([ico,nom,desc]) => (
                <div className="feat-card" key={nom}>
                  <div className="feat-icon">{ico}</div>
                  <div className="feat-name">{nom}</div>
                  <div className="feat-desc">{desc}</div>
                </div>
              ))}
            </div>
            <div className="alert tip">
              <div className="alert-icon">🔍</div>
              <div><strong>Validación de IMEI:</strong> Antes de comprar o vender un equipo, puedes verificar su estado (robado, bloqueado, limpio) con la integración de CheckIMEI directo desde el sistema.</div>
            </div>
          </div>
        </details>

        {/* ══ 9. ASISTENCIA ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(48,209,88,0.12)'}}>✅</div>
            <div className="sum-text">
              <div className="sum-title">Control de Asistencia</div>
              <div className="sum-sub">Cómo marcan los trabajadores y qué ven los admins</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card">
              <div className="card-title">📍 ¿Cómo marca un trabajador?</div>
              <div className="steps">
                {[
                  ['Entra al panel de tu tienda','Desde tutienda.pe/ingresar con tu cuenta de trabajador.'],
                  ['Ve a la pestaña "Marcar" ✅','Está en el menú lateral o en la barra inferior del celular.'],
                  ['El sistema pide tu ubicación','Debes permitir el GPS cuando el navegador lo pida — registra desde dónde marcaste.'],
                  ['Toca el botón grande','Primera marcación del día: "Marcar Entrada 🟢". Al terminar: "Marcar Salida 🔴".'],
                ].map(([t,d],i) => (
                  <div className="step" key={i}>
                    <div className="step-num">{i+1}</div>
                    <div><div className="step-title">{t}</div><div className="step-desc">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title">🗓️ ¿Qué ve el admin en el panel de asistencia?</div>
              <ul style={{paddingLeft:18,display:'flex',flexDirection:'column',gap:6}}>
                {[
                  'Lista de todos los check-ins del día con hora exacta y nombre.',
                  'Mapa con puntos — 🟢 entradas, 🔴 salidas. Ves desde dónde marcó cada persona.',
                  'Sesiones de trabajo — el sistema calcula automáticamente las horas trabajadas.',
                  'Filtros por fecha y tienda — el admin corp ve todas las tiendas, el admin de tienda solo la suya.',
                ].map((t,i) => <li key={i} style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>{t}</li>)}
              </ul>
            </div>
          </div>
        </details>

        {/* ══ 10. FINANZAS ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(255,159,10,0.12)'}}>💰</div>
            <div className="sum-text">
              <div className="sum-title">Módulo Financiero</div>
              <div className="sum-sub">Control de dinero, costos y liquidaciones</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="feat-grid">
              {[
                ['💵','Flujo de caja','Cuánto dinero entró y salió cada día/mes. Separa por tienda o ve el total del holding.'],
                ['📊','Valorización de stock','Cuánto vale todo el inventario al precio de costo y al de venta. Ves el margen potencial.'],
                ['✈️','Costo Landed','El costo real de productos importados: precio + flete + seguro + aranceles. El precio de costo verdadero.'],
                ['💳','Liquidaciones','Corp genera liquidaciones mensuales para cada tienda. La tienda aprueba y paga. Queda registro.'],
                ['👔','Sueldos del equipo','Registra los sueldos por tienda. Se descuenta del flujo para ver la utilidad real.'],
                ['📋','Deudores','Clientes que compraron en cuenta corriente (fiado). Ve quién te debe, cuánto y desde cuándo.'],
              ].map(([ico,nom,desc]) => (
                <div className="feat-card" key={nom}>
                  <div className="feat-icon">{ico}</div>
                  <div className="feat-name">{nom}</div>
                  <div className="feat-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* ══ 11. CONFIGURAR EMPRESA ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(90,200,250,0.12)'}}>⚙️</div>
            <div className="sum-text">
              <div className="sum-title">Configurar tu empresa</div>
              <div className="sum-sub">Cómo personalizar cada tienda para que se vea como tuya</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card"><p>Panel de tienda → pestaña <strong>⚙️ Configuración</strong>. Todos los cambios se guardan al instante. Sin nada técnico.</p></div>
            <div className="setting-list">
              {[
                ['🏷️','Nombre de la empresa','El nombre que aparece en la tienda online, en el panel y en los documentos.'],
                ['🖼️','Logo','Sube tu logo. Aparece en la barra de navegación y en el panel del equipo.'],
                ['🎨','Color principal','El color de los botones y banners. Ingresa el código hexadecimal (#FF0000) o elige uno.'],
                ['🕐','Horarios','Lunes a sábado de X a Y. Los clientes lo ven en la tienda online.'],
                ['📍','Dirección','Aparece en la tienda online con un mapa interactivo para que los clientes lleguen.'],
                ['📱','WhatsApp','Los clientes te contactan directo con un toque desde la tienda.'],
                ['📸','Instagram','Tu cuenta de Instagram para que los clientes vean tu perfil.'],
                ['⭐','Google Maps URL','El link de tu tienda en Google Maps. Los clientes ven reseñas y cómo llegar.'],
              ].map(([ico,nom,desc]) => (
                <div className="setting-item" key={nom}>
                  <div className="setting-ico">{ico}</div>
                  <div><div className="setting-name">{nom}</div><div className="setting-desc">{desc}</div></div>
                </div>
              ))}
            </div>
            <div className="alert ok">
              <div className="alert-icon">✅</div>
              <div>Rellena los campos y haz clic en Guardar. Los cambios aparecen en la tienda online al instante.</div>
            </div>
          </div>
        </details>

        {/* ══ 12. CARNET QR ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(255,69,58,0.12)'}}>📲</div>
            <div className="sum-text">
              <div className="sum-title">Carnet Digital y QR</div>
              <div className="sum-sub">Tu identificación digital para entrar al sistema rápido</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            <div className="card"><p>Cada trabajador tiene un <strong>carnet digital</strong> con foto, nombre, cargo y un código QR único. Es como una credencial de empleado pero en el celular.</p></div>
            <div className="feat-grid">
              {[
                ['📸','QR para login','El QR del carnet permite ingresar al panel escaneándolo. Sin escribir nada.'],
                ['🍎','Apple Wallet','Guarda el carnet en Apple Wallet como tarjeta de embarque. Funciona sin internet.'],
                ['🔑','Activar Face ID','Desde el carnet activas login con Face ID o huella. Entras en 1 segundo.'],
                ['💾','Guardar como imagen','Descarga tu carnet como imagen para guardarlo o compartirlo.'],
              ].map(([ico,nom,desc]) => (
                <div className="feat-card" key={nom}>
                  <div className="feat-icon">{ico}</div>
                  <div className="feat-name">{nom}</div>
                  <div className="feat-desc">{desc}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title">📲 ¿Cómo accedo a mi carnet?</div>
              <div className="steps">
                {[
                  ['Entra al panel de tu tienda','Desde tutienda.pe/ingresar'],
                  ['Ve a "Mi Carnet QR" 🔐','Al final del menú lateral.'],
                  ['Elige qué hacer','Agrega a Apple Wallet, descarga como imagen, o activa Face ID.'],
                ].map(([t,d],i) => (
                  <div className="step" key={i}>
                    <div className="step-num">{i+1}</div>
                    <div><div className="step-title">{t}</div><div className="step-desc">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        {/* ══ 13. FAQ ══ */}
        <details>
          <summary>
            <div className="sum-ico" style={{background:'rgba(255,159,10,0.12)'}}>❓</div>
            <div className="sum-text">
              <div className="sum-title">Preguntas frecuentes</div>
              <div className="sum-sub">Las dudas más comunes resueltas rápido</div>
            </div>
            <div className="sum-chevron">⌄</div>
          </summary>
          <div className="section-body">
            {[
              ['¿Puedo usar el sistema desde el celular?','Sí, todo está optimizado para celular: POS, asistencia, panel de tienda.'],
              ['¿Los clientes de una tienda pueden comprar en otra?','No. Cada tienda tiene su propio e-commerce y base de clientes. Es privado por diseño.'],
              ['¿Qué pasa si un trabajador olvida marcar salida?','La sesión queda abierta. El admin puede ver el registro incompleto en el panel de asistencia.'],
              ['¿Puedo ver las ventas de las 3 tiendas a la vez?','Solo desde Corp Tech. El panel de tienda solo muestra tu tienda.'],
              ['¿Cómo cambio la contraseña de un trabajador?','Panel de tienda → pestaña "Equipo" → busca al trabajador → "Restablecer contraseña". Le llega un correo.'],
              ['¿Puedo personalizar los colores de cada tienda?','Sí. Cada tienda tiene su propia configuración de color e identidad visual.'],
              ['¿Qué es el costo landed?','El costo real de importación: precio + flete + seguro + aranceles. Es el verdadero costo del producto.'],
              ['¿Puedo exportar reportes?','Sí. Ventas, asistencia y finanzas se pueden exportar desde los paneles de Corp y Tienda.'],
            ].map(([q,a]) => (
              <div className="card" key={q} style={{marginBottom:10}}>
                <div className="card-title" style={{fontSize:14,marginBottom:6}}>🙋 {q}</div>
                <p>{a}</p>
              </div>
            ))}
          </div>
        </details>

      </div>

      <div className="page-footer">
        <div style={{marginBottom:8}}>Corp Tech ERP · Sistema de gestión multi-tienda</div>
        <div>Desarrollado por <a href="https://pmg-studio.com" target="_blank" rel="noopener noreferrer">pmg-studio.com</a></div>
      </div>
    </>
  );
}
