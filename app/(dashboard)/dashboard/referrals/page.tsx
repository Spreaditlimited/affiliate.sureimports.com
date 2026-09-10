import Link from 'next/link';
import { currentAffiliate } from '@/lib/auth/session';
import { getReferralData } from '@/lib/dashboard/overview';
import { getShippingOpportunityData } from '@/lib/dashboard/shipping-opportunities';
import { PageHeader } from '../components/PageHeader';
import { ReferralLinkCard } from '../components/ReferralLinkCard';
import { TableFooter } from '../components/TableFooter';

const date = (value: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(value);
const money = (value: number, currency: string) => new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
const label = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusClass = (value: string) => `status status-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? '1', 10);
  const view = params.view === 'shipping' ? 'shipping' : 'links';
  const [data, shipping] = await Promise.all([
    view === 'links' ? getReferralData(affiliate.id, page) : Promise.resolve(null),
    view === 'shipping' ? getShippingOpportunityData(affiliate.id, page) : Promise.resolve(null),
  ]);
  if (view === 'shipping' && shipping) {
    return <>
      <PageHeader eyebrow="Owned opportunities" title="Your referrals" description="Follow shipping requests you own from submission through invoice, commission review, and payout." />
      <ReferralLinkCard code={affiliate.referralCode} />
      <nav className="referral-view-tabs" aria-label="Referral views"><Link href="/dashboard/referrals">Link referrals</Link><Link className="active" aria-current="page" href="/dashboard/referrals?view=shipping">Shipping opportunities</Link></nav>
      <section className="dashboard-stat-grid dashboard-stat-grid-three"><article><span>Owned requests</span><strong>{shipping.total.toLocaleString()}</strong><small>Permanently attributed to you</small></article><article><span>Invoiced</span><strong>{shipping.invoiced.toLocaleString()}</strong><small>Commission terms locked</small></article><article><span>Earned</span><strong>{shipping.earned.toLocaleString()}</strong><small>Customer payment recorded</small></article></section>
      <section className="dashboard-panel dashboard-table-panel shipping-opportunity-panel"><header><div><span>Shipping opportunity ledger</span><small>Air and sea requests created through your API key or referral link</small></div></header>
        {shipping.opportunities.length ? <><div className="data-table shipping-opportunity-table"><div className="data-table-head shipping-opportunity-columns"><span>Submitted</span><span>Partner reference</span><span>Customer</span><span>Route</span><span>Request</span><span>Invoice</span><span>Commission</span><span>Review & payout</span></div>{shipping.opportunities.map((item) => <article className="shipping-opportunity-columns" key={item.attributionId}>
          <span>{date(item.submittedAt)}</span>
          <div><strong>{item.externalReference}</strong><small>{item.externalReference === 'Website referral' ? 'Affiliate link' : 'Partner reference'}</small></div>
          <div><strong>{item.customerName}</strong><small>{item.customerEmail || 'Contact protected'}</small></div>
          <div><strong>{item.destination}</strong><small>{item.shippingMode} · {item.billingUnit}</small></div>
          <div><strong>{item.requestReference}</strong><small>{label(item.requestStatus)}</small></div>
          <div><strong>{item.invoiceReference || 'Not issued'}</strong><small>{label(item.invoiceStatus)}{item.eligibleQuantity !== null ? ` · ${item.eligibleQuantity.toLocaleString()} ${item.billingUnit}` : ''}</small></div>
          <div><strong>{item.commissionAmount !== null && item.commissionCurrency ? money(item.commissionAmount, item.commissionCurrency) : 'Pending invoice'}</strong><small>{item.unitRate !== null && item.commissionCurrency ? `${money(item.unitRate, item.commissionCurrency)} per ${item.billingUnit} · ${item.commissionKind}` : item.commissionKind}</small></div>
          <div className="shipping-status-stack"><b className={statusClass(item.reviewStatus)}>{label(item.reviewStatus)}</b><small>Payout: {label(item.payoutStatus)}</small></div>
        </article>)}</div><TableFooter basePath="/dashboard/referrals" query={{ view: 'shipping' }} exportHref="/api/exports/shipping-opportunities" page={shipping.page} pageSize={shipping.pageSize} total={shipping.total} /><p className="shipping-privacy-note">Customer details are masked by design. Addresses, shipment contents, documents, payment evidence, and invoice line items are never exposed here.</p></> : <div className="dashboard-empty"><span>00</span><h3>No shipping opportunities yet</h3><p>Requests created with your partner API key or by a customer attributed to your referral link will appear here.</p></div>}
      </section>
    </>;
  }
  if (!data) return null;
  const conversionRate = data.total ? (data.converted / data.total) * 100 : 0;

  return <>
    <PageHeader eyebrow="Audience" title="Your referrals" description="See every attributed visitor and the path that brought them to Sure Imports." />
    <ReferralLinkCard code={affiliate.referralCode} />
    <nav className="referral-view-tabs" aria-label="Referral views"><Link className="active" aria-current="page" href="/dashboard/referrals">Link referrals</Link><Link href="/dashboard/referrals?view=shipping">Shipping opportunities</Link></nav>
    <section className="dashboard-stat-grid dashboard-stat-grid-three"><article><span>Attributed visitors</span><strong>{data.total.toLocaleString()}</strong><small>Unique referrals recorded</small></article><article><span>Converted</span><strong>{data.converted.toLocaleString()}</strong><small>Visitors who made a purchase</small></article><article><span>Conversion rate</span><strong>{conversionRate.toFixed(1)}%</strong><small>Referral-to-purchase performance</small></article></section>
    <section className="dashboard-panel dashboard-table-panel"><header><div><span>Referral activity</span><small>Attributed visitors connected to your referral link</small></div></header>
      {data.referrals.length ? <><div className="data-table"><div className="data-table-head referral-columns"><span>First visit</span><span>Landing page</span><span>Source</span><span>Status</span></div>{data.referrals.map((item) => <article className="referral-columns" key={item.pidReferral}><span>{date(item.firstTouchAt)}</span><strong>{item.landingPath}</strong><span>{item.source || 'Direct'}</span><b className={`status ${item.convertedAt ? 'status-available' : ''}`}>{item.convertedAt ? 'Converted' : 'Visited'}</b></article>)}</div><TableFooter basePath="/dashboard/referrals" exportHref="/api/exports/referrals" page={data.page} pageSize={data.pageSize} total={data.total} /></> : <div className="dashboard-empty"><span>01</span><h3>No referrals yet</h3><p>Copy and share your unique link. New attributed visitors will appear here.</p></div>}
    </section>
  </>;
}
