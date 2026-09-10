import { currentAffiliate, listAffiliateSessions } from '@/lib/auth/session';
import { PageHeader } from '../components/PageHeader';
import { AccountSettings } from './AccountSettings';

const sessionDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export default async function SettingsPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const sessions = await listAffiliateSessions(affiliate.id, affiliate.sessionId);
  const profile = {
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email,
    phone: affiliate.phone,
    country: affiliate.country,
    referralCode: affiliate.referralCode,
  };
  return <><PageHeader eyebrow="Account" title="Settings" description="Manage your affiliate identity, password, and signed-in devices." /><AccountSettings profile={profile} sessions={sessions.map((session) => ({
    pidSession: session.pidSession,
    current: session.current,
    createdLabel: `${sessionDate.format(session.createdAt)} UTC`,
    lastSeenLabel: `${sessionDate.format(session.lastSeenAt)} UTC`,
    expiresLabel: `${sessionDate.format(session.expiresAt)} UTC`,
  }))} /></>;
}
