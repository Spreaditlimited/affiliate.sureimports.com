import { after, NextRequest } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { requestPayout } from '@/lib/payouts';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request not allowed.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Unauthorized.' }, 401);
  if (!(await rateLimit(String(affiliate.id), 'payout-request', 4, 30))) {
    return noStoreJson({ message: 'Too many payout attempts. Try again later.' }, 429);
  }
  const body = await request.json().catch(() => ({}));
  try {
    const payout = await requestPayout(affiliate.id, String(body.currency || ''));
    after(() => sendAffiliateNotification({
      eventKey: `payout:requested:${payout.pidPayout}`,
      eventType: 'PAYOUT_REQUESTED',
      to: affiliate.email,
      firstName: affiliate.firstName,
      subject: 'Your affiliate payout request was received',
      title: 'Payout request received',
      message: 'Your payout request has been recorded and the selected commissions are now reserved while our team processes it.',
      facts: [
        { label: 'Reference', value: payout.pidPayout },
        { label: 'Amount', value: new Intl.NumberFormat(payout.currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency: payout.currency }).format(payout.amount) },
      ],
      actionLabel: 'Track payout',
      actionPath: '/dashboard/payouts',
    }));
    return noStoreJson({ payout });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : 'Unable to request payout.' }, 400);
  }
}
