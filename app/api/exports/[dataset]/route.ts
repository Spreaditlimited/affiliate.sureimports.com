import { currentAffiliate } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_EXPORT_ROWS = 10_000;
const datasets = new Set(['referrals', 'earnings', 'payouts']);

function csvCell(value: unknown) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(rows: unknown[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) return Response.json({ message: 'Unauthorized.' }, { status: 401 });
  const { dataset } = await params;
  if (!datasets.has(dataset)) return Response.json({ message: 'Export not found.' }, { status: 404 });

  let rows: unknown[][];
  if (dataset === 'referrals') {
    const records = await prisma.affiliate_referrals.findMany({
      where: { affiliateId: affiliate.id },
      select: { pidReferral: true, landingPath: true, source: true, firstTouchAt: true, lastTouchAt: true, convertedAt: true },
      orderBy: { firstTouchAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });
    rows = [
      ['Referral ID', 'Landing page', 'Source', 'First visit', 'Last visit', 'Status', 'Converted at'],
      ...records.map((item) => [item.pidReferral, item.landingPath, item.source || 'Direct', item.firstTouchAt, item.lastTouchAt, item.convertedAt ? 'Converted' : 'Visited', item.convertedAt]),
    ];
  } else if (dataset === 'earnings') {
    const records = await prisma.affiliate_conversions.findMany({
      where: { affiliateId: affiliate.id },
      include: { service: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });
    rows = [
      ['Conversion ID', 'Date', 'Service', 'Order reference', 'Payment currency', 'Gross payment', 'Eligible amount', 'Commission currency', 'Commission', 'Status'],
      ...records.map((item) => [item.pidConversion, item.createdAt, item.service.displayName, item.externalOrderReference, item.paymentCurrency, item.grossAmount, item.eligibleAmount, item.commissionCurrency, item.commissionAmount, item.status]),
    ];
  } else {
    const records = await prisma.affiliate_payouts.findMany({
      where: { affiliateId: affiliate.id },
      select: { pidPayout: true, requestedAt: true, provider: true, currency: true, amount: true, status: true, processedAt: true, externalReference: true },
      orderBy: { requestedAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });
    rows = [
      ['Payout ID', 'Requested at', 'Provider', 'Currency', 'Amount', 'Status', 'Processed at', 'Provider reference'],
      ...records.map((item) => [item.pidPayout, item.requestedAt, item.provider, item.currency, item.amount, item.status, item.processedAt, item.externalReference]),
    ];
  }

  return new Response(csv(rows), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="sure-imports-affiliate-${dataset}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
