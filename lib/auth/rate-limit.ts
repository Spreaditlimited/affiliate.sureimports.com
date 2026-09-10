import 'server-only';
import { prisma } from '@/lib/prisma';
import { secureFingerprint } from '@/lib/security/crypto';

function rateLimitKey(key: string, action: string) {
  return secureFingerprint(key, `affiliate-limit-${action}-v1`);
}

export async function isRateLimited(key: string, action: string, windowMinutes = 15) {
  const keyHash = rateLimitKey(key, action);
  const existing = await prisma.affiliate_auth_limits.findUnique({
    where: { keyHash_action: { keyHash, action } },
    select: { blockedUntil: true, windowStarted: true },
  });
  if (!existing || existing.windowStarted < new Date(Date.now() - windowMinutes * 60_000)) return false;
  return Boolean(existing.blockedUntil && existing.blockedUntil > new Date());
}

export async function clearRateLimit(key: string, action: string) {
  const keyHash = rateLimitKey(key, action);
  await prisma.affiliate_auth_limits.deleteMany({ where: { keyHash, action } });
}

export async function rateLimit(key: string, action: string, maximum = 5, windowMinutes = 15) {
  const keyHash = rateLimitKey(key, action);
  const now = new Date();
  const resetBefore = new Date(now.getTime() - windowMinutes * 60_000);
  const existing = await prisma.affiliate_auth_limits.findUnique({ where: { keyHash_action: { keyHash, action } } });

  if (!existing || existing.windowStarted < resetBefore) {
    await prisma.affiliate_auth_limits.upsert({
      where: { keyHash_action: { keyHash, action } },
      create: { keyHash, action },
      update: { count: 1, windowStarted: now, blockedUntil: null },
    });
    return true;
  }

  if (existing.blockedUntil && existing.blockedUntil > now) return false;
  const nextCount = existing.count + 1;
  await prisma.affiliate_auth_limits.update({
    where: { id: existing.id },
    data: { count: nextCount, blockedUntil: nextCount > maximum ? new Date(now.getTime() + windowMinutes * 60_000) : null },
  });
  return nextCount <= maximum;
}
