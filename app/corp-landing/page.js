'use client';
import { useState, useEffect } from 'react';

const BRANDS = [
  {
    name: 'Futurteck',
    url: 'https://futurteck.pe',
    emoji: '🔵',
    color: '#007AFF',
    desc: 'Tecnología de vanguardia para transformar tu vida digital.',
  },
  {
    name: 'Innovatech Store',
    url: 'https://innovatechstore.com.pe',
    emoji: '🟣',
    color: '#BF5AF2',
    desc: 'Innovación en cada dispositivo. Donde la tecnología evoluciona.',
  },
  {
    name: 'WeTech Peru',
    url: 'https://wetechperu.pe',
    emoji: '🟢',
    color: '#30D158',
    desc: 'Tu tienda tech de confianza. Calidad y garantía en cada compra.',
  },
];

export default function CorpLandingPage() {
  const [year, setYear] = useState('');
  const [hover, setHover] = useState(null);

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080C',
      fontFamily: "'Urbanist','SF Pro Display',system-ui,sans-serif",
      color: '#fff',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .brand-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 32px 28px;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all .25s;
          cursor: pointer;
        }
        .brand-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-4px);
        }
        @media(max-width:768px) {
          .brands-grid { grid-template-columns: 1fr!important; }
          .hero-title  { font-size: clamp(32px,9vw,64px)!important; }
          .hide-mobile { display:none!important; }
          .section-pad { padding: 60px 20px!important; }
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,8,12,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #007AFF, #BF5AF2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900,
          }}>CT</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Corp Tech</span>
        </div>
        {/* Sin botón de login — el nav es solo marca */}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Holding Tecnológico
        </span>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        minHeight: '88vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 32px', textAlign: 'center',
        position: 'relative',
      }}>
        {/* Glow de fondo */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: '70vw', maxWidth: 700, height: 400,
          background: 'radial-gradient(ellipse, rgba(10,132,255,0.10) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, animation: 'fadeUp 0.6s ease' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)',
            marginBottom: 32,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0A84FF', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0A84FF', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Holding Tecnológico · Perú
            </span>
          </div>

          <h1 className="hero-title" style={{
            fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24,
            background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.4))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Tecnología que<br />mueve el futuro
          </h1>

          <p style={{
            fontSize: 'clamp(16px,2.5vw,20px)', color: 'rgba(255,255,255,0.45)',
            maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 500,
          }}>
            Grupo de empresas especializadas en distribución y comercialización de tecnología premium en el Perú.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { val: '3', lbl: 'Marcas' },
              { val: '100%', lbl: 'Original' },
              { val: '🇵🇪', lbl: 'Peruano' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#fff' }}>{s.val}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', animation: 'float 2s ease-in-out infinite', opacity: 0.3 }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)', margin: '0 auto' }} />
        </div>
      </section>

      {/* ══ NUESTRAS MARCAS ══ */}
      <section className="section-pad" style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeUp 0.5s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
            Nuestro portafolio
          </p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 14 }}>
            Nuestras marcas
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Tres tiendas, una misma pasión por la tecnología de calidad.
          </p>
        </div>

        <div className="brands-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {BRANDS.map((b, i) => (
            <a key={i} href={b.url} className="brand-card"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{
                borderColor: hover === i ? `${b.color}40` : 'rgba(255,255,255,0.08)',
                background: hover === i ? `${b.color}08` : 'rgba(255,255,255,0.04)',
              }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `${b.color}18`,
                border: `1.5px solid ${b.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
              }}>
                {b.emoji}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: hover === i ? '#fff' : 'rgba(255,255,255,0.9)' }}>
                  {b.name}
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  {b.desc}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: b.color, fontSize: 13, fontWeight: 700,
                marginTop: 'auto',
              }}>
                Visitar tienda
                <span style={{ fontSize: 16, transition: 'transform .2s', transform: hover === i ? 'translateX(4px)' : 'none' }}>→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ SOBRE NOSOTROS ══ */}
      <section className="section-pad" style={{ padding: '80px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
              Sobre Corp Tech
            </p>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 20, lineHeight: 1.1 }}>
              Impulsando la<br />tecnología en Perú
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 16 }}>
              Somos un grupo empresarial enfocado en llevar tecnología premium a cada rincón del Perú. A través de nuestras marcas ofrecemos productos 100% originales con garantía oficial.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
              Nuestra misión es democratizar el acceso a la tecnología con precios justos, atención de calidad y la confianza que mereces.
            </p>
          </div>

          {/* Valores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '🛡️', title: 'Confianza', desc: 'Productos 100% originales con garantía oficial de fábrica.' },
              { icon: '🚀', title: 'Innovación', desc: 'Siempre con los últimos modelos y tecnologías disponibles.' },
              { icon: '🤝', title: 'Compromiso', desc: 'Atención personalizada antes, durante y después de la compra.' },
            ].map((v, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, padding: '18px 20px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{v.icon}</span>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{v.title}</h4>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="section-pad" style={{ padding: '80px 32px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(191,90,242,0.08))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 32, padding: '52px 40px',
        }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 16 }}>
            ¿Listo para encontrar tu próximo dispositivo?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
            Visita cualquiera de nuestras tiendas y encuentra el producto perfecto para ti.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {BRANDS.map((b, i) => (
              <a key={i} href={b.url}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 14, textDecoration: 'none',
                  background: `${b.color}18`, border: `1.5px solid ${b.color}35`,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  transition: 'all .2s',
                }}>
                {b.emoji} {b.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #007AFF, #BF5AF2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color:'#fff',
          }}>CT</div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            Corp Tech © {year} · Lima, Perú
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {BRANDS.map((b, i) => (
            <a key={i} href={b.url}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontWeight: 600, transition: 'color .2s' }}
              onMouseEnter={e => e.target.style.color = b.color}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>
              {b.name}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
