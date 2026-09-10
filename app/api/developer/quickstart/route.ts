import { NextResponse } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { partnerApiQuickstartMarkdown } from '@/lib/developer/quickstart';

export async function GET() {
  const affiliate = await currentAffiliate();
  if (!affiliate) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  return new NextResponse(partnerApiQuickstartMarkdown, {
    headers: {
      'cache-control': 'private, no-store',
      'content-disposition': 'attachment; filename="sure-imports-partner-api-quickstart.md"',
      'content-type': 'text/markdown; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  });
}
