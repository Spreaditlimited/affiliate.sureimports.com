import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return <header className="site-header"><div className="site-container nav-shell">
    <Link className="brand" href="/" aria-label="Sure Imports Affiliate home">
      <Image className="logo logo-dark" src="/images/logo.png" width={664} height={106} style={{ width: 'auto' }} alt="Sure Imports" priority />
      <Image className="logo logo-light" src="/images/logo-white.png" width={664} height={106} style={{ width: 'auto' }} alt="" priority />
      <span className="brand-divider" /><span className="brand-product">Affiliate</span>
    </Link>
    <nav className="desktop-nav" aria-label="Main navigation"><Link href="/#how-it-works">How it works</Link><Link href="/#ways-to-earn">Ways to earn</Link><Link href="/#partner-api">Partner API</Link><Link href="/#payouts">Payouts</Link><Link href="/#questions">FAQs</Link></nav>
    <div className="nav-actions"><ThemeToggle /><Link className="button button-small" href="/sign-in">Sign in</Link></div>
  </div></header>;
}
