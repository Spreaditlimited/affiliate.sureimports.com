import { currentAffiliate } from '@/lib/auth/session';
import { getPayoutData } from '@/lib/dashboard/overview';
import { PageHeader } from '../components/PageHeader';
import { PayoutSetup } from './PayoutSetup';
import { TableFooter } from '../components/TableFooter';

const money = (amount: number, currency: string) => new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
const date = (value: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(value);

export default async function PayoutsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const page = Number.parseInt((await searchParams).page ?? '1', 10);
  const data = await getPayoutData(affiliate.id, page);

  return <>
    <PageHeader eyebrow="Withdrawals" title="Payouts" description="Naira earnings are paid through Paystack. Dollar earnings are paid through PayPal." />
    <PayoutSetup accounts={data.accounts} available={data.available} />
    <aside className="dashboard-note" aria-label="Currency protection"><strong>Currency protection</strong><p>Commissions are never converted. Naira earnings are paid in NGN through Paystack, while foreign-payment commissions are paid in USD through PayPal.</p></aside>
    <section className="dashboard-panel dashboard-table-panel"><header><div><span>Payout history</span><small>Your most recent payout requests and transfers</small></div></header>
      {data.payouts.length ? <><div className="data-table"><div className="data-table-head payout-columns"><span>Requested</span><span>Reference</span><span>Method</span><span>Status</span><span>Amount</span></div>{data.payouts.map((item) => <article className="payout-columns" key={item.pidPayout}><span>{date(item.requestedAt)}</span><strong>{item.pidPayout}</strong><span>{item.provider}</span><b className={`status status-${item.status.toLowerCase()}`}>{item.status}</b><strong>{money(item.amount, item.currency)}</strong></article>)}</div><TableFooter basePath="/dashboard/payouts" exportHref="/api/exports/payouts" page={data.page} pageSize={data.pageSize} total={data.total} /></> : <div className="dashboard-empty"><span>00</span><h3>No payouts yet</h3><p>Your completed payout requests will appear here with their processing status.</p></div>}
    </section>
  </>;
}
