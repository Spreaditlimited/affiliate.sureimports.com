import { currentAffiliate } from '@/lib/auth/session';
import { noStoreJson } from '@/lib/auth/request';
import { listPayoutBanks } from '@/lib/payouts';

export const runtime = 'nodejs';

export async function GET() {
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Unauthorized.' }, 401);
  try {
    return noStoreJson({ banks: await listPayoutBanks() });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : 'Unable to load banks.' }, 502);
  }
}
