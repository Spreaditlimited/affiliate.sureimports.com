import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { decryptPrivateValue, randomToken, secureFingerprint } from '@/lib/security/crypto';
import { SESSION_COOKIE, SESSION_DAYS } from './config';

export async function createSession(affiliateId: number, ipHash?: string, userAgentHash?: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.affiliate_sessions.create({ data: {
    pidSession: `ases_${randomToken(18)}`, affiliateId,
    tokenHash: secureFingerprint(token, 'affiliate-session-v1'), expiresAt, ipHash, userAgentHash,
  } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
}

export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.affiliate_sessions.updateMany({ where: { tokenHash: secureFingerprint(token, 'affiliate-session-v1'), revokedAt: null }, data: { revokedAt: new Date() } });
  jar.delete(SESSION_COOKIE);
}

export const currentAffiliate = cache(async function currentAffiliate() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.affiliate_sessions.findFirst({
    where: { tokenHash: secureFingerprint(token, 'affiliate-session-v1'), revokedAt: null, expiresAt: { gt: new Date() } },
    include: { affiliate: true },
  });
  if (!session || session.affiliate.status !== 'ACTIVE') return null;
  if (session.lastSeenAt.getTime() < Date.now() - 5 * 60_000) {
    await prisma.affiliate_sessions.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return {
    id: session.affiliate.id,
    sessionId: session.pidSession,
    firstName: decryptPrivateValue(session.affiliate.firstNameCiphertext),
    lastName: decryptPrivateValue(session.affiliate.lastNameCiphertext),
    email: decryptPrivateValue(session.affiliate.emailCiphertext),
    phone: decryptPrivateValue(session.affiliate.phoneCiphertext),
    country: session.affiliate.country,
    referralCode: session.affiliate.referralCode,
  };
});

export async function listAffiliateSessions(affiliateId: number, currentSessionId: string) {
  const sessions = await prisma.affiliate_sessions.findMany({
    where: { affiliateId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { pidSession: true, createdAt: true, lastSeenAt: true, expiresAt: true },
    orderBy: { lastSeenAt: 'desc' },
  });
  return sessions.map((session) => ({ ...session, current: session.pidSession === currentSessionId }));
}
