import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { currentAffiliate } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const schema = z.object({ pidSession: z.string().min(8).max(80).optional(), allOthers: z.boolean().optional() })
  .refine((value) => Boolean(value.pidSession) !== Boolean(value.allOthers));

export async function DELETE(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Your session has expired. Sign in again.' }, 401);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'Choose a valid session to sign out.' }, 400);
  const result = parsed.data.allOthers
    ? await prisma.affiliate_sessions.updateMany({ where: { affiliateId: affiliate.id, pidSession: { not: affiliate.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } })
    : parsed.data.pidSession === affiliate.sessionId
      ? null
      : await prisma.affiliate_sessions.updateMany({ where: { affiliateId: affiliate.id, pidSession: parsed.data.pidSession, revokedAt: null }, data: { revokedAt: new Date() } });
  if (!result) return noStoreJson({ message: 'The current session cannot be removed here. Use Sign out instead.' }, 400);
  return noStoreJson({ message: result.count ? 'Session signed out.' : 'That session is no longer active.' });
}
