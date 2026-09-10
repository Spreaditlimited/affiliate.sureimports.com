import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/app/(home)/components/ThemeToggle';

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-story-media"><Image src="/images/hero-background-1.png" alt="A Chinese city connecting heritage with global commerce" fill sizes="50vw" priority /></div>
      <div className="auth-story-shade" />
      <Link href="/" className="auth-brand" aria-label="Sure Imports Affiliate home">
        <Image className="logo logo-dark" src="/images/logo.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority />
        <Image className="logo logo-light" src="/images/logo-white.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority />
        <span>Affiliate</span>
      </Link>
      <div className="auth-story-copy">
        <p className="section-kicker">Sure Imports Affiliate</p>
        <h2>Turn trust into<br /><span>lasting income.</span></h2>
        <p>Recommend services people already need. Track every eligible referral and earn in the currency your customer paid.</p>
      </div>
      <div className="auth-story-proof"><span>Transparent tracking</span><i /><span>Paystack in Nigeria</span><i /><span>PayPal globally</span></div>
    </section>
    <section className="auth-workspace">
      <div className="auth-toolbar">
        <Link href="/" className="auth-mobile-brand" aria-label="Sure Imports Affiliate home">
          <Image className="logo logo-dark" src="/images/logo.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority />
          <Image className="logo logo-light" src="/images/logo-white.png" width={200} height={32} style={{ width: 'auto' }} alt="Sure Imports" priority />
        </Link>
        <div className="auth-toolbar-actions"><Link href="/">Back to home</Link><ThemeToggle /></div>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-heading"><p className="section-kicker">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
        {children}
      </div>
      <p className="auth-legal">Protected by encrypted data storage, secure sessions, and reCAPTCHA. Google <Link href="https://policies.google.com/privacy">Privacy</Link> and <Link href="https://policies.google.com/terms">Terms</Link> apply.</p>
    </section>
  </main>;
}
