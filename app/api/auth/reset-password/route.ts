import { after, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { decryptPrivateValue, secureFingerprint } from '@/lib/security/crypto';
import { verifyRecaptcha } from '@/lib/security/recaptcha';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

const schema = z.object({ token: z.string().min(32).max(180), password: z.string().min(10).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/), recaptchaToken: z.string().min(20).max(4096).optional() });

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'Use at least 10 characters with uppercase, lowercase, and a number.' }, 400);
  if (!await verifyRecaptcha(parsed.data.recaptchaToken, request, 'affiliate_reset_password')) return noStoreJson({ message: 'Security verification failed. Please try again.' }, 400);
  const now = new Date();
  const authToken = await prisma.affiliate_auth_tokens.findFirst({
    where: { tokenHash: secureFingerprint(parsed.data.token, 'affiliate-auth-token-v1'), purpose: 'RESET_PASSWORD', consumedAt: null, expiresAt: { gt: now } },
    include: { affiliate: { select: { emailCiphertext: true, firstNameCiphertext: true } } },
  });
  if (!authToken) return noStoreJson({ message: 'This reset link is invalid or has expired.' }, 400);
  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.affiliate_auth_tokens.update({ where: { id: authToken.id }, data: { consumedAt: now } }),
    prisma.affiliate_accounts.update({ where: { id: authToken.affiliateId }, data: { passwordHash } }),
    prisma.affiliate_sessions.updateMany({ where: { affiliateId: authToken.affiliateId, revokedAt: null }, data: { revokedAt: now } }),
  ]);
  after(() => sendAffiliateNotification({
    eventKey: `security:password-reset:${authToken.pidToken}`,
    eventType: 'PASSWORD_CHANGED',
    to: decryptPrivateValue(authToken.affiliate.emailCiphertext),
    firstName: decryptPrivateValue(authToken.affiliate.firstNameCiphertext),
    subject: 'Your Sure Imports affiliate password was reset',
    title: 'Password reset complete',
    message: 'Your affiliate password was reset successfully and every signed-in device was signed out. Contact support immediately if you did not make this change.',
    actionLabel: 'Sign in securely',
    actionPath: '/sign-in',
  }));
  return noStoreJson({ message: 'Your password has been changed. Sign in with your new password.' });
}
