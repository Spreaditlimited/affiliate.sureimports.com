import { NextRequest } from 'next/server';
import { isTrustedRequest, noStoreJson } from '@/lib/auth/request';
import { revokeSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  await revokeSession();
  return noStoreJson({ message: 'Signed out.' });
}
