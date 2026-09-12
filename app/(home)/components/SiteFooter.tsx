import Image from 'next/image';
import Link from 'next/link';

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-container footer-top">
      <Link className="footer-brand" href="/" aria-label="Sure Imports Affiliate home">
        <Image src="/images/logo-white.png" width={664} height={106} alt="Sure Imports" />
        <span>Affiliate</span>
      </Link>
      <div className="footer-navigation">
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#ways-to-earn">Ways to earn</Link>
          <Link href="/#partner-api">Partner API</Link>
          <Link href="/#payouts">Payouts</Link>
          <Link href="/#questions">FAQs</Link>
          <a href="https://www.sureimports.com">Sure Imports</a>
        </nav>
        <nav className="footer-policies" aria-label="Legal policies">
          <Link href="/affiliate-terms">Affiliate terms</Link>
          <a href="https://www.sureimports.com/privacy-policy">Privacy policy</a>
          <a href="https://www.sureimports.com/terms-and-conditions">Terms of service</a>
        </nav>
      </div>
    </div>
    <div className="site-container footer-bottom">
      <span>© {new Date().getFullYear()} Sure Importers Limited</span>
      <span>Recommend responsibly. Earn transparently.</span>
    </div>
  </footer>;
}
