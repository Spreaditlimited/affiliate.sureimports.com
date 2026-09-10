import { NextRequest } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { resolveBankAccount } from '@/lib/payouts';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request not allowed.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Unauthorized.' }, 401);
  if (!(await rateLimit(String(affiliate.id), 'payout-resolve', 10, 15))) {
    return noStoreJson({ message: 'Too many account checks. Try again later.' }, 429);
  }
  const body = await request.json().catch(() => ({}));
  try {
    return noStoreJson({ account: await resolveBankAccount(String(body.bankCode || ''), String(body.accountNumber || '')) });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : 'Unable to resolve account.' }, 400);
  }
}
