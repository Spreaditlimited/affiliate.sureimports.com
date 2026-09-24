import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
  }
  try {
    const response = await fetch('https://www.sureimports.com/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'affiliate_footer_newsletter', page_type: 'site', pathname: typeof body.pathname === 'string' ? body.pathname.slice(0, 2048) : null }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Subscription failed');
    return NextResponse.json({ success: true, message: data.message });
  } catch {
    return NextResponse.json({ success: false, error: 'We could not complete your subscription. Please try again.' }, { status: 502 });
  }
}
