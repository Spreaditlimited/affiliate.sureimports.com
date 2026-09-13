'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/app/(home)/components/ThemeToggle';
import { SignOutButton } from '@/app/(auth)/components/AuthForms';

import WorkspaceSearch from '@/components/dashboard/WorkspaceSearch';
import AccountTray from '@/components/dashboard/AccountTray';
import { useNavigationTray } from '@/components/dashboard/useNavigationTray';

type Affiliate = { profileImageUrl?: string | null; firstName: string; lastName: string; email: string; referralCode: string };
type Notification = { id: string; title: string; message: string; href: string; tone: 'info' | 'success' | 'warning'; date: string };
type IconName = 'home' | 'referrals' | 'earnings' | 'payouts' | 'resources' | 'developers' | 'settings' | 'menu' | 'close' | 'bell';
const navigation: Array<{ label: string; href: string; icon: IconName }> = [
  { label: 'Overview', href: '/dashboard', icon: 'home' }, { label: 'Referrals', href: '/dashboard/referrals', icon: 'referrals' }, { label: 'Earnings', href: '/dashboard/earnings', icon: 'earnings' }, { label: 'Payouts', href: '/dashboard/payouts', icon: 'payouts' }, { label: 'Resources', href: '/dashboard/resources', icon: 'resources' }, { label: 'Developers', href: '/dashboard/developers', icon: 'developers' }, { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    developers: <><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></>,
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" /></>, referrals: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 7h5M18.5 4.5v5" /></>, earnings: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>, payouts: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M17 15h1" /></>, resources: <><path d="M4 4.5h12a2 2 0 0 1 2 2V21H6a2 2 0 0 1-2-2Z" /><path d="M18 17H6a2 2 0 0 0 0 4M8 9h6M8 12h5" /></>, settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.93V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.07 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.07V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.93 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>, menu: <path d="M4 7h16M4 12h16M4 17h16" />, close: <path d="m6 6 12 12M18 6 6 18" />, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function DashboardFrame({ affiliate, notifications, children }: { affiliate: Affiliate; notifications: Notification[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useNavigationTray(menuOpen, setMenuOpen, 'affiliate-navigation');
  useEffect(() => { setCollapsed(window.localStorage.getItem('affiliate-sidebar-collapsed') === 'true'); }, []);
  const initials = `${affiliate.firstName[0] ?? ''}${affiliate.lastName[0] ?? ''}`.toUpperCase();
  function toggleSidebar() {
    setCollapsed((current) => { const next = !current; window.localStorage.setItem('affiliate-sidebar-collapsed', String(next)); return next; });
  }
  return <div className={`affiliate-dashboard ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <button className={`dashboard-mobile-menu ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="affiliate-navigation"><Icon name="menu" /></button>
    {menuOpen && <button className="dashboard-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside id="affiliate-navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen || undefined} className={`dashboard-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Affiliate account navigation">
      <div className="dashboard-brand-row"><Link href="/dashboard" className="dashboard-brand"><Image className="logo logo-dark" src="/images/logo.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority /><Image className="logo logo-light" src="/images/logo-white.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority /><span>Affiliate</span></Link><button type="button" className="dashboard-navigation-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><Icon name="close" /></button><button className="dashboard-collapse-button" type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><svg viewBox="0 0 24 24" aria-hidden="true" style={{transform:collapsed ? 'rotate(180deg)' : undefined}}><path d="m15 6-6 6 6 6" /></svg></button></div>
      <nav aria-label="Affiliate dashboard"><p>Workspace</p>{navigation.slice(0, 5).map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} onClick={() => setMenuOpen(false)} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}<p>Account</p>{navigation.slice(5).map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} onClick={() => setMenuOpen(false)} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
      <details className="dashboard-sidebar-notifications"><summary><Icon name="bell" /><span>Notifications ({notifications.length})</span></summary><div>{notifications.length ? notifications.map(item => <Link href={item.href} key={item.id} onClick={() => setMenuOpen(false)}><strong>{item.title}</strong><small>{item.message}</small></Link>) : <p>You are all caught up.</p>}</div></details>
      <div className="dashboard-sidebar-signout"><SignOutButton /></div>
      <div className="dashboard-user"><span>{initials}</span><div><strong>{affiliate.firstName} {affiliate.lastName}</strong><small>{affiliate.email}</small></div></div>
    </aside>
    <div className="dashboard-workspace">
      <header className="dashboard-topbar">
        <WorkspaceSearch items={navigation} onNavigate={(href) => router.push(href)} />
        <div className="dashboard-top-actions">
          <ThemeToggle />
          <Link className="dashboard-settings-shortcut" href="/dashboard/settings" aria-label="Profile and settings"><Icon name="settings" /></Link>
          <AccountTray name={affiliate.firstName + ' ' + affiliate.lastName} email={affiliate.email} image={affiliate.profileImageUrl}>
            <Link href="/dashboard/settings"><Icon name="settings" />Profile and settings</Link>
            <details className="dashboard-account-notifications"><summary>Notifications ({notifications.length})</summary>
              {notifications.length ? notifications.map((item) => <Link key={item.id} href={item.href}><strong>{item.title}</strong><small>{item.message}</small></Link>) : <p>You are all caught up.</p>}
            </details>
            <SignOutButton />
          </AccountTray>
        </div>
      </header>
      <main className="dashboard-content">{children}</main>
    </div>
  </div>;
}
