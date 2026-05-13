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
  // /acceso en dominio de tienda → mostrar login con logo de ESA tienda
  if (pathname === '/acceso' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/acceso/${slug}`, request.url));
  }

  // /cliente exacto en dominio de tienda → portal de clientes con slug correcto
  // (solo reescribir si NO tiene ya el slug para evitar /cliente/futurteck/futurteck)
  if (pathname === '/cliente' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/cliente/${slug}`, request.url));
  }

  const PASS_THROUGH = ['/tienda', '/corp', '/store', '/dashboard', '/pos', '/api', '/_next', '/wallet', '/acceso', '/cliente', '/login', '/superadmin'];
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
