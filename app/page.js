'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const EMPRESAS = [
    {
      name:  'Futurteck',
      color: '#0A84FF',
      glow:  'rgba(10,132,255,0.18)',
      ico:   '📱',
      desc:  'Smartphones, tablets y accesorios de las mejores marcas internacionales.',
      href:  '/tienda/futurteck',
      tag:   'Tecnología móvil',
    },
    {
      name:  'Innovatech Store',
      color: '#BF5AF2',
      glow:  'rgba(191,90,242,0.18)',
      ico:   '💻',
      desc:  'Laptops, PCs y periféricos para trabajo y gaming. Garantía oficial.',
      href:  '/tienda/innovatech',
      tag:   'Cómputo y gaming',
    },
    {
      name:  'WeTech Peru',
      color: '#30D158',
      glow:  'rgba(48,209,88,0.18)',
      ico:   '⌚',
      desc:  'Wearables, smartwatches y gadgets para tu estilo de vida digital.',
      href:  '/tienda/wetech',
      tag:   'Wearables & gadgets',
    },
  ];

  const VALORES = [
    { ico: '🛡️', title: 'Garantía real',         desc: 'Todos nuestros productos cuentan con garantía oficial y soporte post-venta.' },
    { ico: '🚀', title: 'Entrega rápida',         desc: 'Despacho el mismo día para Lima Metropolitana. Coordinamos a nivel nacional.' },
    { ico: '🤝', title: 'Asesoría personalizada', desc: 'Nuestros expertos te ayudan a elegir el equipo ideal para tus necesidades.' },
    { ico: '💳', title: 'Facilidades de pago',   desc: 'Efectivo, tarjeta, transferencia, Yape, crédito. Adaptamos el pago a ti.' },
  ];

  const NAV_LINKS = [
    { href: '#nosotros', lbl: 'Nosotros'  },
    { href: '#empresas', lbl: 'Empresas'  },
    { href: '#valores',  lbl: 'Servicios' },
    { href: '#contacto', lbl: 'Contacto'  },
  ];

  const S = {
    page: {
      margin: 0, padding: 0,
      fontFamily: "'Urbanist', 'Inter', sans-serif",
      background: '#050508',
      color: '#e8e8f0',
      overflowX: 'hidden',
    },
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 5%',
      height: 64,
      background: scrolled ? 'rgba(5,5,8,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
      transition: 'all 0.3s ease',
    },
    navLogo: {
      display: 'flex', alignItems: 'center', gap: 10,
      textDecoration: 'none',
    },
    navLogoMark: {
      width: 34, height: 34, borderRadius: 10,
      background: 'linear-gradient(135deg,#0A84FF,#BF5AF2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 800, color: '#fff',
    },
    navLogoText: {
      fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px',
    },
    navLinks: {
      display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0,
    },
    navLink: {
      color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
      fontSize: 14, fontWeight: 500,
      transition: 'color 0.2s',
    },
    navCta: {
      padding: '8px 20px', borderRadius: 10,
      background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
      color: '#fff', fontSize: 13, fontWeight: 600,
      textDecoration: 'none', border: 'none',
      cursor: 'pointer',
    },
    hamburger: {
      display: 'none', background: 'transparent', border: 'none',
      color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4,
    },
    mobileMenu: {
      position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
      background: 'rgba(10,10,16,0.97)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '16px 5% 24px',
      display: menuOpen ? 'flex' : 'none',
      flexDirection: 'column', gap: 4,
    },
    mobileNavLink: {
      color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
      fontSize: 16, fontWeight: 500, padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    },

    /* HERO */
    hero: {
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
      padding: '120px 5% 80px',
      position: 'relative', overflow: 'hidden',
    },
    heroGlow1: {
      position: 'absolute', top: '10%', left: '15%',
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(10,132,255,0.12) 0%,transparent 70%)',
      pointerEvents: 'none',
    },
    heroGlow2: {
      position: 'absolute', top: '20%', right: '10%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(191,90,242,0.10) 0%,transparent 70%)',
      pointerEvents: 'none',
    },
    heroGlow3: {
      position: 'absolute', bottom: '15%', left: '30%',
      width: 350, height: 350, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(48,209,88,0.08) 0%,transparent 70%)',
      pointerEvents: 'none',
    },
    heroBadge: {
      display: 'inline-block',
      padding: '6px 16px', borderRadius: 20,
      background: 'rgba(10,132,255,0.12)',
      border: '1px solid rgba(10,132,255,0.25)',
      color: '#4DA8FF', fontSize: 12, fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: 24, position: 'relative',
    },
    heroH1: {
      fontSize: 'clamp(36px, 6vw, 72px)',
      fontWeight: 800, lineHeight: 1.1,
      letterSpacing: '-1.5px',
      color: '#fff', margin: '0 0 12px',
      position: 'relative',
    },
    heroGradientWord: {
      background: 'linear-gradient(90deg,#0A84FF,#BF5AF2,#30D158)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    heroSub: {
      fontSize: 'clamp(15px, 2vw, 19px)',
      color: 'rgba(255,255,255,0.55)',
      maxWidth: 560, margin: '0 auto 40px',
      lineHeight: 1.6, position: 'relative',
    },
    heroBtns: {
      display: 'flex', gap: 14, justifyContent: 'center',
      flexWrap: 'wrap', position: 'relative',
    },
    heroBtn: {
      padding: '14px 32px', borderRadius: 12,
      background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
      color: '#fff', fontSize: 15, fontWeight: 600,
      textDecoration: 'none', border: 'none', cursor: 'pointer',
      transition: 'transform 0.15s, box-shadow 0.15s',
      boxShadow: '0 4px 24px rgba(10,132,255,0.30)',
    },
    heroBtnGhost: {
      padding: '14px 32px', borderRadius: 12,
      background: 'transparent',
      color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: 600,
      textDecoration: 'none',
      border: '1px solid rgba(255,255,255,0.15)',
      cursor: 'pointer',
    },
    heroStats: {
      display: 'flex', gap: 40, justifyContent: 'center',
      marginTop: 64, flexWrap: 'wrap', position: 'relative',
    },
    heroStat: { textAlign: 'center' },
    heroStatVal: {
      fontSize: 32, fontWeight: 800, color: '#fff',
      letterSpacing: '-1px',
    },
    heroStatLbl: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },

    /* SECTIONS */
    section: { padding: '96px 5%', maxWidth: 1120, margin: '0 auto' },
    sectionTag: {
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#0A84FF', marginBottom: 12,
    },
    sectionH2: {
      fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800,
      color: '#fff', margin: '0 0 16px', letterSpacing: '-0.8px', lineHeight: 1.15,
    },
    sectionP: {
      fontSize: 16, color: 'rgba(255,255,255,0.55)',
      maxWidth: 560, lineHeight: 1.7, margin: '0 0 48px',
    },

    /* NOSOTROS */
    nosGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 16, marginTop: 48,
    },
    nosCard: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '28px 24px',
    },
    nosCardNum: {
      fontSize: 36, fontWeight: 800,
      background: 'linear-gradient(135deg,#0A84FF,#BF5AF2)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    nosCardLbl: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

    /* EMPRESAS */
    empresasGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 20, marginTop: 48,
    },
    empresaCard: (color, glow) => ({
      background: `linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
      border: `1px solid ${color}33`,
      borderRadius: 20, padding: 28,
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer', textDecoration: 'none', display: 'block',
      boxShadow: `0 0 0 0 ${glow}`,
    }),
    empresaGlow: (glow) => ({
      position: 'absolute', top: -40, right: -40,
      width: 160, height: 160, borderRadius: '50%',
      background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }),
    empresaTag: (color) => ({
      display: 'inline-block',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color, marginBottom: 14,
    }),
    empresaIco: { fontSize: 38, marginBottom: 12, display: 'block' },
    empresaName: {
      fontSize: 22, fontWeight: 800, color: '#fff',
      margin: '0 0 10px', letterSpacing: '-0.4px',
    },
    empresaDesc: {
      fontSize: 14, color: 'rgba(255,255,255,0.55)',
      lineHeight: 1.6, margin: '0 0 20px',
    },
    empresaBtn: (color) => ({
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 13, fontWeight: 600, color,
    }),

    /* VALORES */
    valoresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16, marginTop: 48,
    },
    valorCard: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '28px 22px',
    },
    valorIco: { fontSize: 32, marginBottom: 14 },
    valorTitle: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 },
    valorDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 },

    /* CONTACTO */
    contactoWrap: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24, padding: '52px 40px',
      textAlign: 'center', marginTop: 0,
    },
    contactoLinks: {
      display: 'flex', gap: 16, justifyContent: 'center',
      flexWrap: 'wrap', marginTop: 32,
    },
    contactoBtn: (bg, color) => ({
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '12px 26px', borderRadius: 12,
      background: bg, color, fontSize: 14, fontWeight: 600,
      textDecoration: 'none', border: 'none',
    }),

    /* DIVIDER */
    divider: {
      height: 1,
      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
      margin: '0 5%',
    },

    /* FOOTER */
    footer: {
      padding: '32px 5%', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    },
    footerLeft: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
    footerRight: {
      fontSize: 12, color: 'rgba(255,255,255,0.2)',
      textDecoration: 'none',
    },
  };

  return (
    <div style={S.page}>
      {/* FONT */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; padding: 0; }
        @media (max-width: 640px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger      { display: block !important; }
          .hero-stats         { gap: 20px !important; }
          .section-inner      { padding: 64px 5% !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={S.nav}>
        <a href="#" style={S.navLogo}>
          <div style={S.navLogoMark}>CT</div>
          <span style={S.navLogoText}>Corp Tech</span>
        </a>
        <ul className="nav-links-desktop" style={S.navLinks}>
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <a href={l.href} style={S.navLink}
                onMouseEnter={e => e.target.style.color='#fff'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.7)'}>
                {l.lbl}
              </a>
            </li>
          ))}
        </ul>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <a href="#empresas" style={S.navCta} className="nav-links-desktop">
            Ver tiendas
          </a>
          <button className="nav-hamburger" style={S.hamburger}
            onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div style={S.mobileMenu}>
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href} style={S.mobileNavLink}
            onClick={() => setMenuOpen(false)}>{l.lbl}</a>
        ))}
        <a href="#empresas" style={{ ...S.navCta, textAlign:'center', marginTop:12 }}
          onClick={() => setMenuOpen(false)}>Ver tiendas</a>
      </div>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.heroGlow1} />
        <div style={S.heroGlow2} />
        <div style={S.heroGlow3} />
        <span style={S.heroBadge}>Holding tecnológico • Lima, Perú</span>
        <h1 style={S.heroH1}>
          Tecnología que{' '}
          <span style={S.heroGradientWord}>conecta</span>
          {' '}tu mundo
        </h1>
        <p style={S.heroSub}>
          Somos un grupo empresarial especializado en tecnología de consumo.
          Importamos, distribuimos y vendemos los mejores equipos del mercado.
        </p>
        <div style={S.heroBtns}>
          <a href="#empresas" style={S.heroBtn}>Conocer nuestras tiendas</a>
          <a href="#contacto" style={S.heroBtnGhost}>Contáctanos</a>
        </div>
        <div style={S.heroStats} className="hero-stats">
          {[
            { val: '3',    lbl: 'Marcas propias'  },
            { val: '500+', lbl: 'Clientes activos' },
            { val: '5★',   lbl: 'Calificación'    },
            { val: '100%', lbl: 'Garantía real'    },
          ].map(s => (
            <div style={S.heroStat} key={s.lbl}>
              <div style={S.heroStatVal}>{s.val}</div>
              <div style={S.heroStatLbl}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={S.divider} />

      {/* NOSOTROS */}
      <section id="nosotros">
        <div style={{ ...S.section }} className="section-inner">
          <span style={S.sectionTag}>Quiénes somos</span>
          <h2 style={S.sectionH2}>Un holding construido<br />sobre confianza</h2>
          <p style={S.sectionP}>
            Corp Tech es la empresa matriz de tres tiendas especializadas en tecnología.
            Desde Lima, gestionamos importación directa de USA, garantizando la mejor calidad
            y los precios más competitivos del mercado peruano.
          </p>
          <div style={S.nosGrid}>
            {[
              { val: '2+',   lbl: 'Años en el mercado'    },
              { val: '3',    lbl: 'Empresas del holding'   },
              { val: 'USA',  lbl: 'Importación directa'   },
              { val: '24h',  lbl: 'Soporte post-venta'    },
            ].map(c => (
              <div style={S.nosCard} key={c.lbl}>
                <div style={S.nosCardNum}>{c.val}</div>
                <div style={S.nosCardLbl}>{c.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={S.divider} />

      {/* EMPRESAS */}
      <section id="empresas">
        <div style={{ ...S.section }} className="section-inner">
          <span style={S.sectionTag}>Nuestras empresas</span>
          <h2 style={S.sectionH2}>Tres tiendas,<br />un mismo estándar</h2>
          <p style={S.sectionP}>
            Cada empresa del grupo está especializada en un segmento de tecnología,
            con catálogo propio, atención personalizada y garantía Corp Tech.
          </p>
          <div style={S.empresasGrid}>
            {EMPRESAS.map(e => (
              <Link key={e.name} href={e.href}
                style={S.empresaCard(e.color, e.glow)}
                onMouseEnter={ev => { ev.currentTarget.style.transform='translateY(-4px)'; ev.currentTarget.style.boxShadow=`0 12px 40px ${e.glow}`; }}
                onMouseLeave={ev => { ev.currentTarget.style.transform='translateY(0)'; ev.currentTarget.style.boxShadow='none'; }}>
                <div style={S.empresaGlow(e.glow)} />
                <span style={S.empresaTag(e.color)}>{e.tag}</span>
                <span style={S.empresaIco}>{e.ico}</span>
                <div style={S.empresaName}>{e.name}</div>
                <p style={S.empresaDesc}>{e.desc}</p>
                <span style={S.empresaBtn(e.color)}>Ver catálogo →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div style={S.divider} />

      {/* VALORES */}
      <section id="valores">
        <div style={{ ...S.section }} className="section-inner">
          <span style={S.sectionTag}>Por qué elegirnos</span>
          <h2 style={S.sectionH2}>Nuestro compromiso<br />contigo</h2>
          <p style={S.sectionP}>
            Más que vender tecnología, nos aseguramos de que tu experiencia de compra
            sea transparente, ágil y respaldada en cada paso.
          </p>
          <div style={S.valoresGrid}>
            {VALORES.map(v => (
              <div style={S.valorCard} key={v.title}>
                <div style={S.valorIco}>{v.ico}</div>
                <div style={S.valorTitle}>{v.title}</div>
                <div style={S.valorDesc}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={S.divider} />

      {/* CONTACTO */}
      <section id="contacto">
        <div style={{ ...S.section }} className="section-inner">
          <div style={S.contactoWrap}>
            <span style={S.sectionTag}>Contáctanos</span>
            <h2 style={{ ...S.sectionH2, margin: '8px 0 12px' }}>¿Tienes alguna consulta?</h2>
            <p style={{ ...S.sectionP, margin: '0 auto' }}>
              Escríbenos por WhatsApp o email. Respondemos en menos de 2 horas en horario de atención.
            </p>
            <div style={S.contactoLinks}>
              <a href="https://wa.me/51999999999?text=Hola%20Corp%20Tech%2C%20quiero%20más%20información"
                target="_blank" rel="noopener noreferrer"
                style={S.contactoBtn('rgba(37,211,102,0.15)', '#25D366')}>
                💬 WhatsApp
              </a>
              <a href="mailto:contacto@corptech.pe"
                style={S.contactoBtn('rgba(10,132,255,0.12)', '#4DA8FF')}>
                ✉️ contacto@corptech.pe
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div style={S.divider} />
      <footer style={S.footer}>
        <span style={S.footerLeft}>© 2026 Corp Tech SAC · Lima, Perú · Todos los derechos reservados</span>
        <Link href="/login" style={S.footerRight}>Acceso colaboradores</Link>
      </footer>
    </div>
  );
}
