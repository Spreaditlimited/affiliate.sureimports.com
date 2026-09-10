import { after, NextRequest } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { savePayoutAccount } from '@/lib/payouts';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request not allowed.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Unauthorized.' }, 401);
  if (!(await rateLimit(String(affiliate.id), 'payout-save', 6, 30))) {
    return noStoreJson({ message: 'Too many attempts. Try again later.' }, 429);
  }
  const body = await request.json().catch(() => ({}));
  try {
    const account = await savePayoutAccount({
      affiliateId: affiliate.id,
      currency: String(body.currency || ''),
      otp: String(body.otp || ''),
      bankCode: String(body.bankCode || ''),
      bankName: String(body.bankName || ''),
      accountNumber: String(body.accountNumber || ''),
      paypalEmail: String(body.paypalEmail || ''),
    });
    after(() => sendAffiliateNotification({
      eventKey: `payout-account:saved:${account.pidPayoutAccount}:${account.verifiedAt?.toISOString() || 'verified'}`,
      eventType: 'PAYOUT_ACCOUNT_SAVED',
      to: affiliate.email,
      firstName: affiliate.firstName,
      subject: 'Your affiliate payout destination was updated',
      title: 'Payout destination verified',
      message: 'Your payout destination has been securely saved and is ready for future affiliate payouts.',
      facts: [
        { label: 'Provider', value: account.provider },
        { label: 'Currency', value: account.currency },
        { label: 'Destination', value: account.accountNumberMasked || account.emailMasked || 'Verified' },
      ],
      actionLabel: 'Review payout settings',
      actionPath: '/dashboard/payouts',
    }));
    return noStoreJson({ account });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : 'Unable to save payout account.' }, 400);
  }
}
