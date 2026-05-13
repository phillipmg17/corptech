import { NextResponse } from 'next/server';

// Mapa de dominios → ruta interna
const DOMAIN_MAP = {
  'wetechperu.pe':              '/tienda/wetech',
  'www.wetechperu.pe':          '/tienda/wetech',
  'innovatechstore.com.pe':     '/tienda/innovatech',
  'www.innovatechstore.com.pe': '/tienda/innovatech',
  'futurteck.pe':               '/tienda/futurteck',
  'www.futurteck.pe':           '/tienda/futurteck',
  'corptech.pe':                '/corp',
  'www.corptech.pe':            '/corp',
};

export function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  const targetPath = DOMAIN_MAP[hostname];
  if (!targetPath) return NextResponse.next();

  // Si ya está en la ruta correcta o en login/dashboard/pos → pasar sin cambiar
  const PASS_THROUGH = ['/tienda', '/corp', '/store', '/dashboard', '/pos', '/api', '/_next', '/wallet', '/acceso', '/login', '/superadmin'];
  if (PASS_THROUGH.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Si entra a /login en un dominio de tienda → mostrar login
  if (pathname === '/login') {
    return NextResponse.rewrite(new URL('/', request.url));
  }

  // Raíz del dominio → mostrar la página correspondiente sin cambiar la URL
  if (pathname === '/') {
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
