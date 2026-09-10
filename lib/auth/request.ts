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
  return origin === new URL(request.url).origin;
}

export function noStoreJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
