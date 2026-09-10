import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { VERIFY_HOURS } from '@/lib/auth/config';
import { isTrustedRequest, noStoreJson, normaliseEmail, requestIp } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { decryptPrivateValue, randomToken, secureFingerprint } from '@/lib/security/crypto';
import { sendVerificationEmail } from '@/lib/email/auth-mail';
import { verifyRecaptcha } from '@/lib/security/recaptcha';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  if (!await rateLimit(requestIp(request), 'resend-verification', 3, 30)) return noStoreJson({ message: 'Too many requests. Please try again later.' }, 429);
  const parsed = z.object({ email: z.string().email().max(254), recaptchaToken: z.string().min(20).max(4096).optional() }).safeParse(await request.json().catch(() => null));
  const generic = { message: 'If an unverified account exists, a new verification email is on its way.' };
  if (!parsed.success) return noStoreJson(generic);
  if (!await verifyRecaptcha(parsed.data.recaptchaToken, request, 'affiliate_resend_verification')) return noStoreJson({ message: 'Security verification failed. Please try again.' }, 400);
  const affiliate = await prisma.affiliate_accounts.findUnique({ where: { emailHash: secureFingerprint(normaliseEmail(parsed.data.email), 'affiliate-email-v1') } });
  if (!affiliate || affiliate.status !== 'PENDING_VERIFICATION') return noStoreJson(generic);
  const token = randomToken();
  await prisma.$transaction([
    prisma.affiliate_auth_tokens.updateMany({ where: { affiliateId: affiliate.id, purpose: 'VERIFY_EMAIL', consumedAt: null }, data: { consumedAt: new Date() } }),
    prisma.affiliate_auth_tokens.create({ data: { pidToken: `atok_${randomToken(18)}`, affiliateId: affiliate.id, purpose: 'VERIFY_EMAIL', tokenHash: secureFingerprint(token, 'affiliate-auth-token-v1'), expiresAt: new Date(Date.now() + VERIFY_HOURS * 3_600_000) } }),
  ]);
  try {
    await sendVerificationEmail(decryptPrivateValue(affiliate.emailCiphertext), decryptPrivateValue(affiliate.firstNameCiphertext), token);
  } catch (error) {
    console.error('[affiliate-auth] verification email resend failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return noStoreJson({ message: 'We could not send the verification email right now. Please try again shortly.' }, 503);
  }
  return noStoreJson(generic);
}
