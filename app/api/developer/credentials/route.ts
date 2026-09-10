import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { createAffiliateApiCredential, listAffiliateApiCredentials } from '@/lib/api-credentials';
import { sendAffiliateNotification } from '@/lib/email/affiliate-notifications';

export async function GET() {
  const affiliate = await currentAffiliate();
  if (!affiliate) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ data: await listAffiliateApiCredentials(affiliate.id) });
}

export async function POST(request: Request) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const credential = await createAffiliateApiCredential(affiliate.id, String(body?.name || ''));
    after(() => sendAffiliateNotification({ eventKey: `api-key:created:${credential.pidCredential}`, eventType: 'API_KEY_CREATED', to: affiliate.email, firstName: affiliate.firstName, subject: 'A Sure Imports API key was created', title: 'New developer API key', message: 'A new partner API key was created for your affiliate account. Revoke it immediately if you did not perform this action.', facts: [{ label: 'Name', value: credential.name }, { label: 'Prefix', value: credential.keyPrefix }], actionLabel: 'Review API keys', actionPath: '/dashboard/developers' }).then(() => undefined));
    return NextResponse.json({
      message: 'API key created. Copy it now; it will not be displayed again.',
      data: credential,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to create API key.' }, { status: 400 });
  }
}
