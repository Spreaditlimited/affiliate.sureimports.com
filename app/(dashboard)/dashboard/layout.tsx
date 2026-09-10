import { redirect } from 'next/navigation';
import { currentAffiliate } from '@/lib/auth/session';
import { DashboardFrame } from './components/DashboardFrame';
import { getDashboardNotifications } from '@/lib/dashboard/overview';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const affiliate = await currentAffiliate(); if (!affiliate) redirect('/sign-in');
  const notifications = await getDashboardNotifications(affiliate.id);
  return <DashboardFrame affiliate={affiliate} notifications={notifications}>{children}</DashboardFrame>;
}
