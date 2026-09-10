import { currentAffiliate } from '@/lib/auth/session';
import { listAffiliateApiCredentials } from '@/lib/api-credentials';
import { PageHeader } from '../components/PageHeader';
import { DeveloperWorkspace } from './DeveloperWorkspace';

export const dynamic = 'force-dynamic';
export default async function DevelopersPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const credentials = await listAffiliateApiCredentials(affiliate.id);
  return <><PageHeader eyebrow="Partner API" title="Developers" description="Connect your application to Sure Imports and retain auditable ownership of every shipping opportunity you send." /><DeveloperWorkspace initialCredentials={credentials.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), lastUsedAt: item.lastUsedAt?.toISOString() || null, expiresAt: item.expiresAt?.toISOString() || null, revokedAt: item.revokedAt?.toISOString() || null }))} /></>;
}
