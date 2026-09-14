import 'server-only';
import type { NextRequest } from 'next/server';
import { secureFingerprint } from '@/lib/security/crypto';

export function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

export function requestIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function requestFingerprint(request: NextRequest) {
  return secureFingerprint(requestIp(request), 'affiliate-request-v1');
}

export function isTrustedRequest(request: NextRequest) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  if (process.env.NODE_ENV !== 'production') {
    // Next dev can construct request.url using its bind address (0.0.0.0).
    // Check the browser's exact Host and port, never forwarded host headers.
    const host = request.headers.get('host');
    if (host) {
      try {
        const browserUrl = new URL(requestUrl.protocol + '//' + host);
        if (['localhost', '127.0.0.1', '[::1]', '192.168.1.173'].includes(browserUrl.hostname)) {
          return origin === browserUrl.origin;
        }
      } catch {
        return false;
      }
    }
  }
  return origin === requestUrl.origin;
}

export function noStoreJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
