import { currentAffiliate } from '@/lib/auth/session';
import { getEarningsData } from '@/lib/dashboard/overview';
import { PageHeader } from '../components/PageHeader';
import { TableFooter } from '../components/TableFooter';

const money = (amount: number, currency: string) => new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
const date = (value: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(value);

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const page = Number.parseInt((await searchParams).page ?? '1', 10);
  const data = await getEarningsData(affiliate.id, page);
  const total = (currency: string, status: string) => data.totals.find((item) => item.currency === currency && item.status === status)?.amount ?? 0;

  return <>
    <PageHeader eyebrow="Commission ledger" title="Earnings" description="Naira and dollar commissions remain separate from purchase to payout." />
    <section className="balance-grid">{['NGN', 'USD'].map((currency) => <article className="balance-card" key={currency}><div className="balance-card-top"><span>{currency === 'NGN' ? 'Naira commissions' : 'Dollar commissions'}</span><b>{currency}</b></div><p>Available</p><strong>{money(total(currency, 'AVAILABLE'), currency)}</strong><div><span><small>Pending</small>{money(total(currency, 'PENDING'), currency)}</span><span><small>Approved</small>{money(total(currency, 'APPROVED'), currency)}</span></div></article>)}</section>
    <section className="dashboard-panel dashboard-table-panel"><header><div><span>Commission history</span><small>Confirmed purchases, approvals and adjustments</small></div></header>
      {data.conversions.length ? <><div className="data-table"><div className="data-table-head earnings-columns"><span>Date</span><span>Service and reference</span><span>Customer payment</span><span>Status</span><span>Commission</span></div>{data.conversions.map((item) => <article className="earnings-columns" key={item.id}><span>{date(item.date)}</span><div><strong>{item.service}</strong><small>{item.reference}</small></div><span>{money(item.paymentAmount, item.paymentCurrency)}</span><b className={`status status-${item.status.toLowerCase()}`}>{item.status}</b><strong>{money(item.commissionAmount, item.commissionCurrency)}</strong></article>)}</div><TableFooter basePath="/dashboard/earnings" exportHref="/api/exports/earnings" page={data.page} pageSize={data.pageSize} total={data.total} /></> : <div className="dashboard-empty"><span>00</span><h3>No earnings recorded</h3><p>Eligible commissions will enter this ledger after a referred customer completes payment.</p></div>}
    </section>
  </>;
}
