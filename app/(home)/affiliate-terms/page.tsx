import type { Metadata } from 'next';
import { SiteFooter } from '../components/SiteFooter';
import Link from 'next/link';
import { SiteHeader } from '../components/SiteHeader';
import './affiliate-terms.css';

export const metadata: Metadata = {
  title: 'Affiliate Program Terms | Sure Imports',
  description: 'The rules governing participation, attribution, commissions and payouts in the Sure Imports Affiliate Program.',
};

const sections = [
  ['1. Joining the programme', 'You must be at least 18 years old, provide accurate account and payout information, verify your email address, and keep your login details secure. Registration gives you access to the affiliate workspace but does not prevent Sure Imports from reviewing, restricting, or closing an account that breaches these terms. You may maintain only one affiliate account unless we approve otherwise in writing.'],
  ['2. Referral attribution', 'A customer is attributed using the programme’s referral tracking. Once a customer identity is validly claimed by an affiliate, that relationship is permanent and cannot be reassigned by a later referral link. Self-referrals, fabricated identities, cookie stuffing, or interference with tracking are prohibited. Sure Imports records are the authoritative source when resolving attribution disputes.'],
  ['3. Eligible services and rates', 'Only services shown as active in the programme configuration qualify. Rates, eligible amount bases, recurrence, and exclusions are set by Sure Imports and displayed in the affiliate workspace. Buy from Chinese Websites earns on eligible product cost rather than the total order. Supplier Verification excludes factory-visit transportation costs. LineScout Sourcing uses its configured commitment-fee and project-payment events. LineScout shipping is not paid as a percentage: it uses the same Ship with Us rate based on the final verified billable KG or CBM. Duties, storage, verification, penalties and unrelated charges are excluded. A rate change applies to qualifying transactions completed after the change unless an invoice has already locked its commission snapshot.'],
  ['4. When commission is earned', 'A tracked referral must complete an eligible, successfully paid transaction. Commission may first appear as pending while payment and service eligibility are checked. It becomes available only after the applicable review or refund period. Supplier Intelligence commission can recur on each successfully paid eligible renewal while the original customer attribution remains valid.'],
  ['5. Reversals and adjustments', 'Commission may be voided or reversed when a payment is refunded, reversed, charged back, duplicated, fraudulent, cancelled, or otherwise ineligible. Where an affected commission has already been paid, the amount may be deducted from future earnings or recovered where permitted by law. Any correction will remain visible in the commission ledger.'],
  ['6. Currency and payouts', 'Commission follows the currency of the qualifying service payment. Naira commissions remain in NGN and are paid to a verified Nigerian bank account through Paystack. Foreign-payment commissions are recorded in USD and paid to a verified PayPal account. We do not convert balances between currencies. Provider availability, verification, minimum operational thresholds, and compliance checks may affect payout timing.'],
  ['7. Responsible promotion', 'Recommendations must be truthful, lawful, and clearly identify the affiliate relationship where disclosure is required. You must not send spam, make false income or service claims, impersonate Sure Imports, misuse our trademarks, bid on protected brand terms in paid search without permission, or publish misleading prices and guarantees. You are responsible for the channels and content you use.'],
  ['8. Suspension and termination', 'Sure Imports may investigate activity, hold affected balances, suspend tracking, or terminate participation where fraud, abuse, security risk, legal exposure, or a material breach is suspected. Valid available earnings that are not connected to a breach remain payable after necessary checks. You may stop participating at any time by contacting support.'],
  ['9. Tax, privacy and records', 'You are responsible for taxes, declarations, and records associated with your affiliate income. We process identity, contact, security, referral, and payout information to operate and protect the programme. Personal information is encrypted where appropriate and handled under the Sure Imports Privacy Policy. Payment providers process payout details under their own terms and privacy notices.'],
  ['10. Changes and support', 'We may update these terms or the programme configuration to reflect operational, legal, or service changes. Material updates will be communicated through the website, affiliate workspace, or your registered email. Continued participation after an effective update constitutes acceptance. Questions or disputes should be sent through the official Sure Imports support channels.'],
  ['11. No earnings guarantee', 'Participation does not guarantee referrals, commissions, business results, or any minimum level of income. Earnings depend on valid attribution and completed eligible transactions.'],
  ['12. General terms', 'The Sure Imports website Terms and Conditions and Privacy Policy also apply. Where this agreement specifically addresses affiliate participation, this agreement governs that activity.'],
];

type LegalIconName = 'scale' | 'calendar' | 'clock' | 'shield' | 'document' | 'mail';

function LegalIcon({ name }: { name: LegalIconName }) {
  const paths: Record<LegalIconName, React.ReactNode> = {
    scale: <><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7ZM8 21h8" /><path d="M3 13c0 2 1.8 3 4 3s4-1 4-3M13 13c0 2 1.8 3 4 3s4-1 4-3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 20 6v5c0 5.2-3.3 8.4-8 10-4.7-1.6-8-4.8-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    document: <><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function AffiliateTermsPage() {
  return <main className="affiliate-legal-page">
    <SiteHeader />
    <section className="affiliate-legal-hero"><div className="affiliate-legal-grid" aria-hidden="true" /><div className="affiliate-legal-glow" aria-hidden="true" /><div className="affiliate-legal-container"><div className="affiliate-legal-hero-copy"><p><LegalIcon name="scale" /> Legal policies</p><h1>Affiliate Program Terms</h1><span>These terms govern participation in the Sure Imports Affiliate Program, including referrals, commission eligibility, responsible promotion, and payouts.</span></div></div></section>
    <section className="affiliate-legal-body"><div className="affiliate-legal-container affiliate-legal-layout">
      <aside className="affiliate-legal-sidebar"><section className="affiliate-legal-card affiliate-document-details"><p>Document details</p><ul><li><LegalIcon name="calendar" /><span>Last updated: 10 September 2026</span></li><li><LegalIcon name="clock" /><span>Version: 1.0</span></li><li><LegalIcon name="shield" /><span>Legally binding</span></li></ul></section><section className="affiliate-legal-card affiliate-legal-support"><i><LegalIcon name="document" /></i><h2>Agreement questions?</h2><p>Contact our support team if you need clarification about referrals, commission eligibility, or payouts.</p><a className="affiliate-support-button" href="mailto:hello@sureimports.com"><LegalIcon name="mail" /> Email support</a><Link href="/">Affiliate programme <span>›</span></Link><a href="https://www.sureimports.com/privacy-policy">Read privacy policy <span>›</span></a></section></aside>
      <article className="affiliate-legal-card affiliate-legal-content"><p className="affiliate-legal-intro">By registering for, activating, or using an affiliate account, you agree to this Affiliate Program Agreement. Please read every section carefully before sharing a referral link.</p><div>{sections.map(([title, body]) => { const [number, ...titleParts] = title.split('. '); return <section key={title}><span>Section {number}</span><h2>{titleParts.join('. ')}</h2><p>{body}</p></section>; })}</div><footer><Link className="button button-primary" href="/sign-up">Create affiliate account</Link><a className="button button-secondary" href="https://www.sureimports.com/terms-and-conditions">Website terms</a></footer></article>
    </div></section>
    <SiteFooter />
  </main>;
}
