import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { revokeAffiliateApiCredential } from '@/lib/api-credentials';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

export async function DELETE(_request: Request, { params }: { params: Promise<{ pidCredential: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const { pidCredential } = await params;
    await revokeAffiliateApiCredential(affiliate.id, pidCredential);
    after(() => sendAffiliateNotification({ eventKey: `api-key:revoked:${pidCredential}`, eventType: 'API_KEY_REVOKED', to: affiliate.email, firstName: affiliate.firstName, subject: 'A Sure Imports API key was revoked', title: 'Developer API key revoked', message: 'An API key was revoked and can no longer access the partner shipping API.', facts: [{ label: 'Credential', value: pidCredential }], actionLabel: 'Review API keys', actionPath: '/dashboard/developers' }).then(() => undefined));
    return NextResponse.json({ message: 'API key revoked.' });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to revoke API key.' }, { status: 400 });
  }
}
