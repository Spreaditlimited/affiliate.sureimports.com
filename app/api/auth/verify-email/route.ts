import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { secureFingerprint } from '@/lib/security/crypto';

const schema = z.object({ token: z.string().min(32).max(180) });

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'This verification link is invalid.' }, 400);
  const now = new Date();
  const authToken = await prisma.affiliate_auth_tokens.findFirst({ where: {
    tokenHash: secureFingerprint(parsed.data.token, 'affiliate-auth-token-v1'), purpose: 'VERIFY_EMAIL', consumedAt: null, expiresAt: { gt: now },
  }, include: { affiliate: true } });
  if (!authToken || authToken.affiliate.status !== 'PENDING_VERIFICATION') return noStoreJson({ message: 'This verification link is invalid or has expired.' }, 400);

  await prisma.$transaction([
    prisma.affiliate_auth_tokens.update({ where: { id: authToken.id }, data: { consumedAt: now } }),
    prisma.affiliate_accounts.update({ where: { id: authToken.affiliateId }, data: { emailVerifiedAt: now, status: 'ACTIVE' } }),
  ]);
  return noStoreJson({ message: 'Your email is verified. You can now sign in.' });
}
