'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/app/(home)/components/ThemeToggle';
import { SignOutButton } from '@/app/(auth)/components/AuthForms';

type Affiliate = { firstName: string; lastName: string; email: string; referralCode: string };
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
  const pathname = usePathname(); const [menuOpen, setMenuOpen] = useState(false); const [collapsed, setCollapsed] = useState(false); const [notificationsOpen, setNotificationsOpen] = useState(false); const [hasUnread, setHasUnread] = useState(false); const notificationRef = useRef<HTMLDivElement>(null);
  const notificationKey = notifications.map((item) => item.id).join('|');
  useEffect(() => {
    setCollapsed(window.localStorage.getItem('affiliate-sidebar-collapsed') === 'true');
    setHasUnread(Boolean(notificationKey) && window.localStorage.getItem('affiliate-notifications-seen') !== notificationKey);
  }, [notificationKey]);
  useEffect(() => {
    if (!notificationsOpen) return;
    const close = (event: PointerEvent) => { if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setNotificationsOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [notificationsOpen]);
  const initials = `${affiliate.firstName[0] ?? ''}${affiliate.lastName[0] ?? ''}`.toUpperCase();
  const title = navigation.find((item) => item.href === pathname)?.label ?? 'Dashboard';
  function toggleSidebar() {
    setCollapsed((current) => { const next = !current; window.localStorage.setItem('affiliate-sidebar-collapsed', String(next)); return next; });
  }
  return <div className={`affiliate-dashboard ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <button className={`dashboard-mobile-menu ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
    {menuOpen && <button className="dashboard-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`dashboard-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Affiliate account navigation">
      <div className="dashboard-brand-row"><Link href="/dashboard" className="dashboard-brand"><Image className="logo logo-dark" src="/images/logo.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority /><Image className="logo logo-light" src="/images/logo-white.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority /><span>Affiliate</span></Link><button className="dashboard-collapse-button" type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Icon name="menu" /></button></div>
      <nav aria-label="Affiliate dashboard"><p>Workspace</p>{navigation.slice(0, 5).map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} onClick={() => setMenuOpen(false)} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}<p>Account</p>{navigation.slice(5).map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} onClick={() => setMenuOpen(false)} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
      <div className="dashboard-user"><span>{initials}</span><div><strong>{affiliate.firstName} {affiliate.lastName}</strong><small>{affiliate.email}</small></div></div>
    </aside>
    <div className="dashboard-workspace"><header className="dashboard-topbar"><div><span>Affiliate workspace</span><strong>{title}</strong></div><div className="dashboard-top-actions"><div className="notification-shell" ref={notificationRef}><button className="dashboard-icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} aria-controls="affiliate-notifications" onClick={() => { const next = !notificationsOpen; setNotificationsOpen(next); if (next) { setHasUnread(false); window.localStorage.setItem('affiliate-notifications-seen', notificationKey); } }}><Icon name="bell" />{hasUnread ? <i /> : null}</button>{notificationsOpen ? <section className="notification-popover" id="affiliate-notifications"><header><div><strong>Notifications</strong><span>Live account updates</span></div><b>{notifications.length}</b></header>{notifications.length ? <div className="notification-list">{notifications.map((item) => <Link href={item.href} key={item.id} onClick={() => setNotificationsOpen(false)}><i className={`tone-${item.tone}`} /><span><strong>{item.title}</strong><small>{item.message}</small></span></Link>)}</div> : <div className="notification-empty"><strong>You are all caught up</strong><span>Important account and payout updates will appear here.</span></div>}</section> : null}</div><ThemeToggle /><SignOutButton /></div></header><main className="dashboard-content">{children}</main></div>
  </div>;
}
