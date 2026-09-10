import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { RESET_MINUTES } from '@/lib/auth/config';
import { isTrustedRequest, noStoreJson, normaliseEmail, requestIp } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { decryptPrivateValue, randomToken, secureFingerprint } from '@/lib/security/crypto';
import { sendPasswordResetEmail } from '@/lib/email/auth-mail';
import { verifyRecaptcha } from '@/lib/security/recaptcha';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  if (!await rateLimit(requestIp(request), 'forgot-password', 4, 30)) return noStoreJson({ message: 'Too many requests. Please try again later.' }, 429);
  const parsed = z.object({ email: z.string().email().max(254), recaptchaToken: z.string().min(20).max(4096).optional() }).safeParse(await request.json().catch(() => null));
  const generic = { message: 'If an account exists for that email, a password reset link is on its way.' };
  if (!parsed.success) return noStoreJson(generic);
  if (!await verifyRecaptcha(parsed.data.recaptchaToken, request, 'affiliate_forgot_password')) return noStoreJson({ message: 'Security verification failed. Please try again.' }, 400);
  const affiliate = await prisma.affiliate_accounts.findUnique({ where: { emailHash: secureFingerprint(normaliseEmail(parsed.data.email), 'affiliate-email-v1') } });
  if (!affiliate || affiliate.status !== 'ACTIVE') return noStoreJson(generic);
  const token = randomToken();
  await prisma.$transaction([
    prisma.affiliate_auth_tokens.updateMany({ where: { affiliateId: affiliate.id, purpose: 'RESET_PASSWORD', consumedAt: null }, data: { consumedAt: new Date() } }),
    prisma.affiliate_auth_tokens.create({ data: { pidToken: `atok_${randomToken(18)}`, affiliateId: affiliate.id, purpose: 'RESET_PASSWORD', tokenHash: secureFingerprint(token, 'affiliate-auth-token-v1'), expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) } }),
  ]);
  await sendPasswordResetEmail(decryptPrivateValue(affiliate.emailCiphertext), decryptPrivateValue(affiliate.firstNameCiphertext), token);
  return noStoreJson(generic);
}
