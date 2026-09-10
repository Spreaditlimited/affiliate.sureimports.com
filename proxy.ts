import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;
const AUTH_PAGES = ['/sign-in', '/sign-up', '/forgot-password', '/verify-email', '/reset-password'];
const AFFILIATE_API_PREFIXES = ['/api/account', '/api/exports', '/api/payout-accounts', '/api/payouts'];

const matchesRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAffiliateSession = request.cookies.has('sure_affiliate_session');
  const isLocalDevelopment = process.env.NODE_ENV === 'development';

  if (
    pathname === '/' ||
    pathname === '/api/waitlist' ||
    pathname.startsWith('/api/auth/') ||
    AUTH_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith('/_next/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (AFFILIATE_API_PREFIXES.some((route) => matchesRoute(pathname, route))) {
    if (!hasAffiliateSession) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') && !hasAffiliateSession) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('next', pathname);
    return NextResponse.redirect(signIn);
  }

  if (pathname.startsWith('/dashboard')) return NextResponse.next();

  if (isLocalDevelopment) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { message: 'The Sure Imports Affiliate Program is currently relaunching.' },
      { status: 503, headers: { 'Retry-After': '86400' } },
    );
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
