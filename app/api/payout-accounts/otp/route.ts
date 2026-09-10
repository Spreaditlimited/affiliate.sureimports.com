import { NextRequest } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { sendPayoutOtp } from '@/lib/payouts';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request not allowed.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Unauthorized.' }, 401);
  if (!(await rateLimit(String(affiliate.id), 'payout-otp', 4, 30))) {
    return noStoreJson({ message: 'Too many codes requested. Try again later.' }, 429);
  }
  const body = await request.json().catch(() => ({}));
  try {
    const result = await sendPayoutOtp({
      affiliateId: affiliate.id,
      affiliateEmail: affiliate.email,
      firstName: affiliate.firstName,
      currency: String(body.currency || ''),
      bankCode: String(body.bankCode || ''),
      accountNumber: String(body.accountNumber || ''),
      paypalEmail: String(body.paypalEmail || ''),
    });
    return noStoreJson({ result });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : 'Unable to send verification code.' }, 400);
  }
}
