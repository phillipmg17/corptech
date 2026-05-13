import './globals.css';
import ChatBubble from './components/ChatBubble';

export const metadata = {
  title: 'Corp Tech ERP',
  description: 'Sistema ERP Multi-Empresa — Corp Tech Holding',
  manifest: '/manifest.json',
  icons: {
    icon:  [
      { url: '/favicon.ico',  sizes: 'any' },
      { url: '/logo.png',     type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'Corp Tech',
  },
};

export const viewport = {
  width:           'device-width',
  initialScale:    1,
  viewportFit:     'cover',
  themeColor:      '#0A84FF',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* PWA / Wallet home-screen icons */}
        <link rel="icon"             href="/favicon.ico" sizes="any" />
        <link rel="icon"             href="/logo.png"    type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable"        content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title"          content="Corp Tech" />
        <meta name="mobile-web-app-capable"              content="yes" />
        <meta name="theme-color"                         content="#0A84FF" />
      </head>
      <body>
        {children}
        <ChatBubble />
        {/* Footer global — baja opacidad en todas las páginas */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '5px 0 env(safe-area-inset-bottom,6px)',
          fontSize: 10,
          color: 'rgba(150,150,160,0.22)',
          fontFamily: "'Urbanist','Inter',sans-serif",
          pointerEvents: 'none',
          zIndex: 9999,
          letterSpacing: '0.04em',
          userSelect: 'none',
        }}>
          Desarrollado por pmg-studio.com
        </div>
      </body>
    </html>
  );
}
