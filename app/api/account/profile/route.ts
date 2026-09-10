import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentAffiliate } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { isTrustedRequest, noStoreJson, requestIp } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { isCountry } from '@/lib/data/countries';
import { prisma } from '@/lib/prisma';
import { encryptPrivateValue } from '@/lib/security/crypto';

const schema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(7).max(24).regex(/^[+()\d\s-]+$/),
  country: z.string().trim().min(2).max(100).refine(isCountry),
  currentPassword: z.string().min(1).max(128),
});

export async function PATCH(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Your session has expired. Sign in again.' }, 401);
  if (!await rateLimit(`${affiliate.id}:${requestIp(request)}`, 'profile-update', 5, 15)) {
    return noStoreJson({ message: 'Too many profile update attempts. Please try again later.' }, 429);
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ message: 'Check the profile information you entered.' }, 400);
  const account = await prisma.affiliate_accounts.findUnique({ where: { id: affiliate.id }, select: { passwordHash: true } });
  if (!account || !await verifyPassword(parsed.data.currentPassword, account.passwordHash)) {
    return noStoreJson({ message: 'Your current password is incorrect.' }, 403);
  }
  await prisma.affiliate_accounts.update({
    where: { id: affiliate.id },
    data: {
      firstNameCiphertext: encryptPrivateValue(parsed.data.firstName),
      lastNameCiphertext: encryptPrivateValue(parsed.data.lastName),
      phoneCiphertext: encryptPrivateValue(parsed.data.phone),
      country: parsed.data.country,
    },
  });
  return noStoreJson({ message: 'Profile updated successfully.' });
}
