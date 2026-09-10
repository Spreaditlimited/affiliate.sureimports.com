import { randomUUID } from 'crypto';
import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { encryptWaitlistValue, waitlistFingerprint } from '@/lib/waitlist/crypto';
import { isCountry } from '@/lib/data/countries';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

export const runtime = 'nodejs';

const waitlistSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(254)
    .transform((value) => value.toLowerCase()),
  country: z.string().trim().min(2, 'Select your country.').max(100)
    .refine(isCountry, 'Select a valid country.'),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(24)
    .refine((value) => /^\+?[0-9 ()-]+$/.test(value), 'Enter a valid phone number.'),
  website: z.string().max(0).optional().or(z.literal('')),
});

function secureResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function POST(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return secureResponse({ message: 'This request is not allowed.' }, 403);
  }

  if (Number(request.headers.get('content-length') || 0) > 4096) {
    return secureResponse({ message: 'The submitted form is too large.' }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureResponse({ message: 'The submitted form is invalid.' }, 400);
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return secureResponse(
      { message: parsed.error.issues[0]?.message || 'Check your details and try again.' },
      400,
    );
  }

  if (parsed.data.website) {
    return secureResponse({ message: 'You are on the waitlist.' }, 201);
  }

  try {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ipHash = forwardedFor ? waitlistFingerprint(`ip:${forwardedFor}`) : null;

    if (ipHash) {
      const recentSubmissions = await prisma.affiliate_waitlist_entries.count({
        where: { ipHash, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      });
      if (recentSubmissions >= 5) {
        return secureResponse({ message: 'Too many attempts. Please try again later.' }, 429);
      }
    }

    const emailHash = waitlistFingerprint(`email:${parsed.data.email}`);
    const encrypted = {
      nameCiphertext: encryptWaitlistValue(parsed.data.fullName),
      emailCiphertext: encryptWaitlistValue(parsed.data.email),
      phoneCiphertext: encryptWaitlistValue(parsed.data.phone),
      country: parsed.data.country,
      ipHash,
      consentVersion: 'affiliate-relaunch-waitlist-v1',
      status: 'WAITING',
    };

    await prisma.affiliate_waitlist_entries.upsert({
      where: { emailHash },
      create: { pidWaitlist: `AWL_${randomUUID()}`, emailHash, ...encrypted },
      update: encrypted,
    });

    after(() => sendAffiliateNotification({
      eventKey: `waitlist:confirmed:${emailHash}`,
      eventType: 'WAITLIST_CONFIRMED',
      to: parsed.data.email,
      firstName: parsed.data.fullName.split(/\s+/)[0] || parsed.data.fullName,
      subject: 'You are on the Sure Imports Affiliate waitlist',
      title: 'You are on the waitlist',
      message: 'We have securely received your details. This does not create an affiliate account; we will contact you when applications open.',
      facts: [{ label: 'Country', value: parsed.data.country }],
      actionLabel: 'Visit Sure Imports Affiliate',
      actionPath: '/',
    }));

    return secureResponse(
      { message: 'We will contact you when applications open.' },
      201,
    );
  } catch (error) {
    console.error('Waitlist submission failed', error instanceof Error ? error.message : 'unknown');
    return secureResponse(
      { message: 'We could not save your details. Please try again.' },
      500,
    );
  }
}
