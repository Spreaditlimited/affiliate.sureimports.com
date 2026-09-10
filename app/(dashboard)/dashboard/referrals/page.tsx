import { currentAffiliate } from '@/lib/auth/session';
import { getReferralData } from '@/lib/dashboard/overview';
import { PageHeader } from '../components/PageHeader';
import { ReferralLinkCard } from '../components/ReferralLinkCard';
import { TableFooter } from '../components/TableFooter';

const date = (value: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(value);

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const page = Number.parseInt((await searchParams).page ?? '1', 10);
  const data = await getReferralData(affiliate.id, page);
  const conversionRate = data.total ? (data.converted / data.total) * 100 : 0;

  return <>
    <PageHeader eyebrow="Audience" title="Your referrals" description="See every attributed visitor and the path that brought them to Sure Imports." />
    <ReferralLinkCard code={affiliate.referralCode} />
    <section className="dashboard-stat-grid dashboard-stat-grid-three"><article><span>Attributed visitors</span><strong>{data.total.toLocaleString()}</strong><small>Unique referrals recorded</small></article><article><span>Converted</span><strong>{data.converted.toLocaleString()}</strong><small>Visitors who made a purchase</small></article><article><span>Conversion rate</span><strong>{conversionRate.toFixed(1)}%</strong><small>Referral-to-purchase performance</small></article></section>
    <section className="dashboard-panel dashboard-table-panel"><header><div><span>Referral activity</span><small>Attributed visitors connected to your referral link</small></div></header>
      {data.referrals.length ? <><div className="data-table"><div className="data-table-head referral-columns"><span>First visit</span><span>Landing page</span><span>Source</span><span>Status</span></div>{data.referrals.map((item) => <article className="referral-columns" key={item.pidReferral}><span>{date(item.firstTouchAt)}</span><strong>{item.landingPath}</strong><span>{item.source || 'Direct'}</span><b className={`status ${item.convertedAt ? 'status-available' : ''}`}>{item.convertedAt ? 'Converted' : 'Visited'}</b></article>)}</div><TableFooter basePath="/dashboard/referrals" exportHref="/api/exports/referrals" page={data.page} pageSize={data.pageSize} total={data.total} /></> : <div className="dashboard-empty"><span>01</span><h3>No referrals yet</h3><p>Copy and share your unique link. New attributed visitors will appear here.</p></div>}
    </section>
  </>;
}
