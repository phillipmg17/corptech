import { NextResponse } from 'next/server';

// Mapa de dominios → ruta interna
const DOMAIN_MAP = {
  'wetechperu.pe':              '/tienda/wetech',
  'www.wetechperu.pe':          '/tienda/wetech',
  'innovatechstore.com.pe':     '/tienda/innovatech',
  'www.innovatechstore.com.pe': '/tienda/innovatech',
  'futurteck.pe':               '/tienda/futurteck',
  'www.futurteck.pe':           '/tienda/futurteck',
  'corptech.pe':                '/corp-landing',   // landing pública — sin login
  'www.corptech.pe':            '/corp-landing',
};

export function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  const targetPath = DOMAIN_MAP[hostname];
  if (!targetPath) return NextResponse.next();

  // /acceso en dominio de tienda → login con logo de esa tienda
  if (pathname === '/acceso' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/acceso/${slug}`, request.url));
  }

  // /staff en dominio de tienda → login de trabajadores con logo de esa tienda
  if (pathname === '/staff' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/staff/${slug}`, request.url));
  }

  // /ingresar en dominio de tienda → login multi-método branded por tienda
  if (pathname === '/ingresar' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/ingresar/${slug}`, request.url));
  }

  // /ingresar en corptech.pe → login multi-método Corp Tech
  if (pathname === '/ingresar' && targetPath === '/corp-landing') {
    return NextResponse.rewrite(new URL('/ingresar/corp', request.url));
  }

  // /cliente exacto en dominio de tienda → portal de clientes con slug correcto
  if (pathname === '/cliente' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/cliente/${slug}`, request.url));
  }

  // /asistencia en dominio de tienda → marcado con slug
  if (pathname === '/asistencia' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/asistencia/${slug}`, request.url));
  }

  // /asistencia-admin en dominio de tienda → panel admin con slug
  if (pathname === '/asistencia-admin' && targetPath.startsWith('/tienda')) {
    const slug = targetPath.split('/').pop();
    return NextResponse.rewrite(new URL(`/asistencia-admin/${slug}`, request.url));
  }

  // /asistencia en corptech.pe → asistencia corp
  if (pathname === '/asistencia' && targetPath === '/corp-landing') {
    return NextResponse.rewrite(new URL('/asistencia/corp', request.url));
  }

  // /asistencia-admin en corptech.pe → panel admin corp
  if (pathname === '/asistencia-admin' && targetPath === '/corp-landing') {
    return NextResponse.rewrite(new URL('/asistencia-admin/corp', request.url));
  }

  // Rutas que pasan directo sin reescribir (panel interno, APIs, etc.)
  const PASS_THROUGH = [
    '/tienda', '/corp', '/store', '/dashboard', '/pos',
    '/api', '/_next', '/wallet', '/acceso', '/cliente',
    '/login', '/superadmin', '/corp-landing', '/staff', '/ingresar', '/guia',
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
