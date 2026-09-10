import 'server-only';

function isLocalDevelopment(request: Request) {
  if (process.env.NODE_ENV === 'production') return false;
  const host = request.headers.get('host')?.split(':')[0]?.replace(/^\[|\]$/g, '');
  return ['localhost', '127.0.0.1', '::1'].includes(host ?? '');
}

export async function verifyRecaptcha(token: string | null | undefined, request: Request, expectedAction: string) {
  if (isLocalDevelopment(request)) return true;
  const secret = process.env.GOOGLE_CAPTCHA_SECRET_KEY;
  if (!secret || !token) return false;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5_000),
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; score?: number; action?: string; hostname?: string };
    const threshold = Number(process.env.GOOGLE_CAPTCHA_MIN_SCORE ?? 0.5);
    const requestHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? request.headers.get('host')?.split(':')[0];
    return result.success === true && result.action === expectedAction && typeof result.score === 'number' && result.score >= threshold && (!result.hostname || !requestHost || result.hostname === requestHost);
  } catch {
    return false;
  }
}
