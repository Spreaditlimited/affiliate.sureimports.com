import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AUTH_CONSENT_VERSION, VERIFY_HOURS } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';
import { isTrustedRequest, noStoreJson, normaliseEmail, requestIp } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { encryptPrivateValue, randomToken, secureFingerprint } from '@/lib/security/crypto';
import { sendVerificationEmail } from '@/lib/email/auth-mail';
import { verifyRecaptcha } from '@/lib/security/recaptcha';
import { isCountry } from '@/lib/data/countries';

const schema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(24).regex(/^[+()\d\s-]+$/),
  country: z.string().trim().min(2).max(100).refine(isCountry, 'Select a valid country.'),
  password: z.string().min(10).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
  acceptedTerms: z.literal(true),
  recaptchaToken: z.string().min(20).max(4096).optional(),
});

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  if (!await rateLimit(requestIp(request), 'sign-up', 4, 30)) return noStoreJson({ message: 'Too many attempts. Please try again later.' }, 429);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'Please check the information you entered.' }, 400);
  if (!await verifyRecaptcha(parsed.data.recaptchaToken, request, 'affiliate_signup')) return noStoreJson({ message: 'Security verification failed. Please try again.' }, 400);

  const { firstName, lastName, phone, country, password } = parsed.data;
  const email = normaliseEmail(parsed.data.email);
  const verificationToken = randomToken();
  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const affiliate = await tx.affiliate_accounts.create({ data: {
        pidAffiliate: `aff_${randomToken(18)}`,
        emailHash: secureFingerprint(email, 'affiliate-email-v1'),
        emailCiphertext: encryptPrivateValue(email),
        firstNameCiphertext: encryptPrivateValue(firstName),
        lastNameCiphertext: encryptPrivateValue(lastName),
        phoneCiphertext: encryptPrivateValue(phone),
        country,
        passwordHash,
        referralCode: randomToken(9).replace(/[-_]/g, '').slice(0, 10).toUpperCase(),
        termsAcceptedAt: new Date(),
        consentVersion: AUTH_CONSENT_VERSION,
      } });
      await tx.affiliate_auth_tokens.create({ data: {
        pidToken: `atok_${randomToken(18)}`, affiliateId: affiliate.id, purpose: 'VERIFY_EMAIL',
        tokenHash: secureFingerprint(verificationToken, 'affiliate-auth-token-v1'),
        expiresAt: new Date(Date.now() + VERIFY_HOURS * 3_600_000),
      } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return noStoreJson({ message: 'An account with this email already exists. Try signing in instead.' }, 409);
    }
    return noStoreJson({ message: 'We could not create your account right now. Please try again.' }, 500);
  }

  try {
    await sendVerificationEmail(email, firstName, verificationToken);
  } catch (error) {
    console.error('[affiliate-auth] verification email delivery failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return noStoreJson({ message: 'Your account was created, but the verification email could not be sent. Use resend verification shortly.', accountCreated: true }, 503);
  }
  return noStoreJson({ message: 'Account created. Check your email to verify your address.' }, 201);
}
