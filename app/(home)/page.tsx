import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from './components/SiteHeader';

const commissionOptions = [
  { number: '01', title: 'Buy from Chinese websites', reward: '2%', unit: 'of product cost', description: 'Earn on the cost of eligible products purchased through your referral—not the total order value.' },
  { number: '02', title: 'Supplier reports', reward: '₦5,000', unit: 'per purchase', description: 'Receive a fixed naira commission when your referral purchases an eligible supplier report.' },
  { number: '03', title: 'Phones & laptops', reward: '₦20,000', unit: 'per purchase', description: 'Earn a fixed reward on every completed, eligible device purchase you refer.' },
  { number: '04', title: 'Supplier Intelligence', reward: '10%', unit: 'on every renewal', description: 'Build recurring earnings for as long as an eligible referral keeps their subscription active.' },
  { number: '05', title: 'Supplier verification', reward: '₦10,000', unit: 'per verification', description: 'Earn on the main verification service fee. Factory-visit transportation costs are excluded.' },
];

const steps = [
  ['Create your account', 'Apply once, complete your profile, and get a unique referral link built for you.'],
  ['Recommend Sure Imports', 'Share services you genuinely trust with your audience, customers, or business network.'],
  ['Track and get paid', 'Follow every eligible conversion and request payouts in the same currency your referral paid.'],
];

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>;
}

export default function AffiliateLandingPage() {
  return (
    <main>
      <SiteHeader />

      <section className="hero-section">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span /> The Sure Imports Affiliate Program</div>
            <h1>Recommend what works. <span>Earn when they buy.</span></h1>
            <p className="hero-lead">Turn trusted recommendations into transparent earnings. Refer people to eligible Sure Imports services and earn every time they complete a qualifying purchase.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/sign-up">Start earning</Link>
              <a className="button button-secondary" href="#how-it-works">See how it works</a>
            </div>
            <div className="hero-proof" role="list" aria-label="Program highlights">
              <span role="listitem"><CheckIcon /> Free to join</span>
              <span role="listitem"><CheckIcon /> Clear attribution</span>
              <span role="listitem"><CheckIcon /> NGN & USD payouts</span>
            </div>
          </div>

          <section className="earnings-preview" aria-label="Affiliate dashboard preview">
            <div className="preview-glow" aria-hidden="true" />
            <div className="preview-window">
              <div className="preview-topbar">
                <div><span className="preview-label">Available earnings</span><strong>₦165,000</strong></div>
                <span className="preview-badge">Dashboard preview</span>
              </div>
              <div className="preview-chart" aria-hidden="true">
                <div className="chart-copy"><span>Last 6 months</span><b>+18.4%</b></div>
                <div className="bars"><i /><i /><i /><i /><i /><i /></div>
              </div>
              <div className="preview-stats">
                <div><span>Clicks</span><strong>1,284</strong></div>
                <div><span>Conversions</span><strong>48</strong></div>
                <div><span>Conversion rate</span><strong>3.7%</strong></div>
              </div>
              <div className="preview-activity">
                <div className="activity-heading"><span>Recent commissions</span><b>View all</b></div>
                <div className="activity-row"><span className="activity-icon">SI</span><div><strong>Supplier Intelligence</strong><span>Subscription renewed</span></div><b>+$24.00</b></div>
                <div className="activity-row"><span className="activity-icon">PL</span><div><strong>Phones & laptops</strong><span>Purchase confirmed</span></div><b>+₦20,000</b></div>
              </div>
            </div>
            <div className="floating-payment floating-payment-one"><span>NGN</span><div><small>Payout processed</small><b>Paystack</b></div><CheckIcon /></div>
            <div className="floating-payment floating-payment-two"><span>USD</span><div><small>Recurring commission</small><b>PayPal</b></div><b>+$24</b></div>
          </section>
        </div>
      </section>

      <section className="confidence-strip">
        <div className="site-container confidence-inner">
          <p>Built on services people already trust</p>
          <div><span>40,000+ customers</span><i /><span>7 years in business</span><i /><span>4.7/5 Google rating</span><i /><span>China-to-Africa expertise</span></div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="site-container">
          <div className="section-heading heading-split">
            <div><p className="section-kicker">Simple by design</p><h2>One link.<br />Real earnings.</h2></div>
            <p>We handle tracking, qualification, and commission records. You focus on connecting the right people with services that solve real sourcing problems.</p>
          </div>
          <div className="steps-grid">
            {steps.map(([title, description], index) => (
              <article className="step-card" key={title}>
                <div className="step-number">0{index + 1}</div><div className="step-line"><span /></div><h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section commission-section" id="commissions">
        <div className="site-container">
          <div className="section-heading centered-heading">
            <p className="section-kicker">Ways to earn</p><h2>More value shared.<br />More opportunity earned.</h2><p>Each eligible service has a clear commission rule, so you always know what a successful referral is worth.</p>
          </div>
          <div className="commission-grid">
            {commissionOptions.map((item) => (
              <article className="commission-card" key={item.number}>
                <div className="commission-card-top"><span>{item.number}</span><ArrowIcon /></div><h3>{item.title}</h3><div className="commission-amount"><strong>{item.reward}</strong><span>{item.unit}</span></div><p>{item.description}</p>
              </article>
            ))}
          </div>
          <p className="eligibility-note">Commission eligibility is determined by the active program configuration at the time of the qualifying transaction.</p>
        </div>
      </section>

      <section className="section clarity-section">
        <div className="site-container clarity-grid">
          <div className="clarity-visual">
            <div className="link-card"><p>Your referral link</p><div><span>affiliate.sureimports.com/r/chioma</span><b>Copy</b></div><small>Every click and eligible conversion is connected to you.</small></div>
            <div className="journey-line" aria-hidden="true"><i /><span /><i /><span /><i /></div>
            <div className="journey-labels"><span>Shared</span><span>Purchased</span><span>Earned</span></div>
          </div>
          <div className="clarity-copy">
            <p className="section-kicker">Clarity at every step</p><h2>Never wonder what happened to a referral.</h2><p>Your dashboard will make the entire journey visible—from the first click to a confirmed purchase and an available commission.</p>
            <ul>
              <li><CheckIcon /><span><b>Purpose-built tracking</b> for every active affiliate link.</span></li>
              <li><CheckIcon /><span><b>Clear commission status</b> from pending to available and paid.</span></li>
              <li><CheckIcon /><span><b>Renewal visibility</b> for recurring Supplier Intelligence earnings.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section payout-section" id="payouts">
        <div className="site-container payout-grid">
          <div className="payout-copy"><p className="section-kicker section-kicker-light">Paid in the right currency</p><h2><span>Your referrals</span><span>go global. Your payouts</span><span>follow.</span></h2><p>Commission currency follows the original service payment. There is no hidden conversion between what the customer paid and what you earned.</p></div>
          <div className="payout-cards">
            <article><span className="currency-mark">₦</span><div><p>Payments made in naira</p><h3>Earn in NGN</h3><span>Paid securely through Paystack</span></div><b>Paystack</b></article>
            <article><span className="currency-mark">$</span><div><p>Payments made in foreign currency</p><h3>Earn in USD</h3><span>Paid internationally through PayPal</span></div><b>PayPal</b></article>
          </div>
        </div>
      </section>

      <section className="section faq-section" id="questions">
        <div className="site-container faq-grid">
          <div className="faq-heading"><p className="section-kicker">Questions, answered</p><h2>The details that matter.</h2><p>Everything is designed to be clear before you share your first link.</p></div>
          <div className="faq-list">
            <details><summary>How do I become an affiliate?<span>+</span></summary><p>Create an account, verify your email address, and use the unique referral link available in your affiliate dashboard.</p></details>
            <details><summary>Is the 2% based on the complete order total?<span>+</span></summary><p>No. For Buy from Chinese Websites, the commission is calculated on eligible product cost only—not shipping, handling, or other order charges.</p></details>
            <details><summary>Can I earn more than once from a subscription?<span>+</span></summary><p>Yes. Eligible Supplier Intelligence referrals earn 10% when the subscription starts and each time it successfully renews.</p></details>
            <details><summary>How will I receive my earnings?<span>+</span></summary><p>Naira commissions are paid through Paystack. Commissions from foreign-currency service payments are recorded in USD and paid through PayPal.</p></details>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="site-container final-cta-inner"><div><p className="section-kicker">Ready when you are</p><h2>Share trust.<br />Build an income stream.</h2></div><div><p>Join the Sure Imports Affiliate Program and earn from recommendations that create real value.</p><Link className="button button-primary" href="/sign-up">Become an affiliate</Link></div></div>
      </section>

      <footer className="site-footer">
        <div className="site-container footer-top">
          <Link className="footer-brand" href="/" aria-label="Sure Imports Affiliate home"><Image src="/images/logo-white.png" width={664} height={106} alt="Sure Imports" /><span>Affiliate</span></Link>
          <div className="footer-links"><a href="#how-it-works">How it works</a><a href="#commissions">Commissions</a><a href="#payouts">Payouts</a><Link href="/affiliate-terms">Affiliate terms</Link><a href="https://www.sureimports.com">Sure Imports</a></div>
        </div>
        <div className="site-container footer-bottom"><span>© {new Date().getFullYear()} Sure Importers Limited</span><span>Recommend responsibly. Earn transparently.</span></div>
      </footer>
    </main>
  );
}
