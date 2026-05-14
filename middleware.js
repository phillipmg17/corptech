import { NextResponse } from 'next/server';

// Mapa de dominios → ruta interna
const DOMAIN_MAP = {
  'wetechperu.pe':              '/tienda/wetech',
  'www.wetechperu.pe':          '/tienda/wetech',
  'innovatechstore.com.pe':     '/tienda/innovatech',
  'www.innovatechstore.com.pe': '/tienda/innovatech',
  'futurteck.pe':               '/tienda/futurteck',
  'www.futurteck.pe':           '/tienda/futurteck',
  'corptech.pe':                '/corp-landing',   // landing pública
  'www.corptech.pe':            '/corp-landing',
};

export function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  const targetPath = DOMAIN_MAP[hostname];
  if (!targetPath) return NextResponse.next();

  const slug = targetPath.split('/').pop();
  const isTienda = targetPath.startsWith('/tienda');
  const isCorp   = targetPath === '/ingresar/corp';

  // /acceso en dominio de tienda → login clientes
  if (pathname === '/acceso' && isTienda) {
    return NextResponse.rewrite(new URL(`/acceso/${slug}`, request.url));
  }

  // /ingresar en dominio de tienda → login staff/admin
  if (pathname === '/ingresar' && isTienda) {
    return NextResponse.rewrite(new URL(`/ingresar/${slug}`, request.url));
  }

  // /ingresar en corptech.pe → ya cubre el default, pero por si acaso
  if (pathname === '/ingresar' && isCorp) {
    return NextResponse.rewrite(new URL('/ingresar/corp', request.url));
  }

  // /cliente en dominio de tienda → portal de clientes
  if (pathname === '/cliente' && isTienda) {
    return NextResponse.rewrite(new URL(`/cliente/${slug}`, request.url));
  }

  // /asistencia en dominio de tienda
  if (pathname === '/asistencia' && isTienda) {
    return NextResponse.rewrite(new URL(`/asistencia/${slug}`, request.url));
  }

  // /asistencia-admin en dominio de tienda
  if (pathname === '/asistencia-admin' && isTienda) {
    return NextResponse.rewrite(new URL(`/asistencia-admin/${slug}`, request.url));
  }

  // /asistencia en corptech.pe
  if (pathname === '/asistencia' && isCorp) {
    return NextResponse.rewrite(new URL('/asistencia/corp', request.url));
  }

  // /asistencia-admin en corptech.pe
  if (pathname === '/asistencia-admin' && isCorp) {
    return NextResponse.rewrite(new URL('/asistencia-admin/corp', request.url));
  }

  // Rutas que pasan directo sin reescribir
  const PASS_THROUGH = [
    '/tienda', '/corp', '/store', '/dashboard', '/pos',
    '/api', '/_next', '/wallet', '/acceso', '/cliente',
    '/superadmin', '/ingresar', '/guia',
    '/asistencia', '/asistencia-admin',
  ];
  if (PASS_THROUGH.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Raíz del dominio → página correspondiente
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
