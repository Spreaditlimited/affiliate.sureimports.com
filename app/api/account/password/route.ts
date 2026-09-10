import { after, NextRequest } from 'next/server';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { isTrustedRequest, noStoreJson, requestIp } from '@/lib/auth/request';
import { currentAffiliate } from '@/lib/auth/session';
import { rateLimit } from '@/lib/auth/rate-limit';
import { prisma } from '@/lib/prisma';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';
import { secureFingerprint } from '@/lib/security/crypto';

const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(10).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
});

export async function PATCH(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Your session has expired. Sign in again.' }, 401);
  if (!await rateLimit(`${affiliate.id}:${requestIp(request)}`, 'password-change', 5, 30)) {
    return noStoreJson({ message: 'Too many password attempts. Please try again later.' }, 429);
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'Use at least 10 characters with uppercase, lowercase, and a number.' }, 400);
  const account = await prisma.affiliate_accounts.findUnique({ where: { id: affiliate.id }, select: { passwordHash: true } });
  if (!account || !await verifyPassword(parsed.data.currentPassword, account.passwordHash)) {
    return noStoreJson({ message: 'Your current password is incorrect.' }, 403);
  }
  if (await verifyPassword(parsed.data.newPassword, account.passwordHash)) {
    return noStoreJson({ message: 'Your new password must be different from the current password.' }, 400);
  }
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.affiliate_accounts.update({ where: { id: affiliate.id }, data: { passwordHash } }),
    prisma.affiliate_sessions.updateMany({
      where: { affiliateId: affiliate.id, pidSession: { not: affiliate.sessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  after(() => sendAffiliateNotification({
    eventKey: `security:password-changed:${affiliate.id}:${secureFingerprint(passwordHash, 'affiliate-password-notification-v1').slice(0, 32)}`,
    eventType: 'PASSWORD_CHANGED',
    to: affiliate.email,
    firstName: affiliate.firstName,
    subject: 'Your Sure Imports affiliate password was changed',
    title: 'Password changed',
    message: 'Your affiliate account password was changed successfully. Other signed-in devices were signed out. Contact support immediately if you did not make this change.',
    actionLabel: 'Review account settings',
    actionPath: '/dashboard/settings',
  }));
  return noStoreJson({ message: 'Password changed. Other signed-in devices have been signed out.' });
}
