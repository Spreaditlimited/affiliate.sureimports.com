import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export function apiKeyHash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function createAffiliateApiCredential(affiliateId: number, name: string) {
  const normalizedName = name.trim().slice(0, 120);
  if (normalizedName.length < 2) throw new Error('Give this API key a recognizable name.');

  const environmentPrefix = process.env.NODE_ENV === 'production' ? 'si_live_' : 'si_test_';
  const secret = `${environmentPrefix}${randomBytes(32).toString('base64url')}`;
  const created = await prisma.affiliate_api_credentials.create({
    data: {
      pidCredential: `apic_${randomBytes(18).toString('base64url')}`,
      affiliateId,
      name: normalizedName,
      keyPrefix: secret.slice(0, 16),
      keyHash: apiKeyHash(secret),
      scopes: 'shipping:write shipping:read',
    },
    select: { pidCredential: true, name: true, keyPrefix: true, scopes: true, createdAt: true },
  });
  return { ...created, secret };
}

export function listAffiliateApiCredentials(affiliateId: number) {
  return prisma.affiliate_api_credentials.findMany({
    where: { affiliateId },
    select: {
      pidCredential: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      active: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeAffiliateApiCredential(affiliateId: number, pidCredential: string) {
  const result = await prisma.affiliate_api_credentials.updateMany({
    where: { affiliateId, pidCredential, active: true },
    data: { active: false, revokedAt: new Date() },
  });
  if (!result.count) throw new Error('API key was not found or is already revoked.');
}
