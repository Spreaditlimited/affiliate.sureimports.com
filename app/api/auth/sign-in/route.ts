import { after, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { isTrustedRequest, noStoreJson, normaliseEmail, requestIp } from '@/lib/auth/request';
import { clearRateLimit, isRateLimited, rateLimit } from '@/lib/auth/rate-limit';
import { decryptPrivateValue, secureFingerprint } from '@/lib/security/crypto';
import { verifyRecaptcha } from '@/lib/security/recaptcha';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128), recaptchaToken: z.string().min(20).max(4096).optional() });

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'Enter a valid email address and password.' }, 400);

  const ip = requestIp(request);
  const userAgent = request.headers.get('user-agent');
  const ipHash = secureFingerprint(ip, 'affiliate-request-v1');
  const userAgentHash = userAgent ? secureFingerprint(userAgent, 'affiliate-agent-v1') : undefined;
  const emailHash = secureFingerprint(normaliseEmail(parsed.data.email), 'affiliate-email-v1');
  const [blocked, captchaValid, affiliate] = await Promise.all([
    isRateLimited(ip, 'sign-in', 15),
    verifyRecaptcha(parsed.data.recaptchaToken, request, 'affiliate_signin'),
    prisma.affiliate_accounts.findUnique({
      where: { emailHash },
      select: {
        id: true,
        passwordHash: true,
        status: true,
        emailCiphertext: true,
        firstNameCiphertext: true,
        sessions: {
          where: userAgentHash ? { userAgentHash } : { ipHash },
          select: { id: true },
          take: 1,
        },
      },
    }),
  ]);

  if (blocked) return noStoreJson({ message: 'Too many sign-in attempts. Please try again later.' }, 429);
  if (!captchaValid) return noStoreJson({ message: 'Security verification failed. Please try again.' }, 400);
  if (!affiliate || !await verifyPassword(parsed.data.password, affiliate.passwordHash)) {
    const allowed = await rateLimit(ip, 'sign-in', 8, 15);
    if (!allowed) return noStoreJson({ message: 'Too many sign-in attempts. Please try again later.' }, 429);
    return noStoreJson({ message: 'The email address or password is incorrect.' }, 401);
  }
  if (affiliate.status === 'PENDING_VERIFICATION') return noStoreJson({ message: 'Verify your email address before signing in.', needsVerification: true }, 403);
  if (affiliate.status !== 'ACTIVE') return noStoreJson({ message: 'This account is not currently available. Please contact support.' }, 403);

  const knownDevice = affiliate.sessions.length > 0;
  await createSession(affiliate.id, ipHash, userAgentHash);
  after(async () => {
    await Promise.all([
      clearRateLimit(ip, 'sign-in'),
      prisma.affiliate_accounts.update({ where: { id: affiliate.id }, data: { lastLoginAt: new Date() } }),
      ...(!knownDevice ? [sendAffiliateNotification({
        eventKey: `security:new-device:${affiliate.id}:${userAgentHash || ipHash}`,
        eventType: 'NEW_DEVICE_SIGN_IN',
        to: decryptPrivateValue(affiliate.emailCiphertext),
        firstName: decryptPrivateValue(affiliate.firstNameCiphertext),
        subject: 'New sign-in to your Sure Imports affiliate account',
        title: 'New device sign-in',
        message: 'Your affiliate account was signed into from a device we have not seen before. If this was not you, change your password immediately.',
        facts: [{ label: 'Time', value: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date()) + ' UTC' }],
        actionLabel: 'Review account security',
        actionPath: '/dashboard/settings',
      })] : []),
    ]);
  });
  return noStoreJson({ message: 'Welcome back.' });
}
