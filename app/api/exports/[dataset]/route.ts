import { refundDeductionsByConversion } from '@/lib/refunds/affiliate-balances';
import { currentAffiliate } from '@/lib/auth/session';
import { getShippingOpportunityExport } from '@/lib/dashboard/shipping-opportunities';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_EXPORT_ROWS = 10_000;
const datasets = new Set(['referrals', 'earnings', 'payouts', 'shipping-opportunities']);

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
      where: { affiliateId: affiliate.id, customerReference: { not: null } },
      select: { pidReferral: true, landingPath: true, source: true, firstTouchAt: true, lastTouchAt: true, claimedAt: true, convertedAt: true, _count: { select: { conversions: { where: { status: { not: 'VOIDED' } } } } } },
      orderBy: { firstTouchAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });
    rows = [
      ['Referral ID', 'Landing page', 'Source', 'First visit', 'Last visit', 'Status', 'Converted at', 'Linked on'],
      ...records.map((item) => [item.pidReferral, item.landingPath, item.source || 'Direct', item.firstTouchAt, item.lastTouchAt, item._count.conversions > 0 ? 'Purchased' : 'Registered', item.convertedAt, item.claimedAt]),
    ];
  } else if (dataset === 'earnings') {
    const records = await prisma.affiliate_conversions.findMany({
      where: { affiliateId: affiliate.id },
      include: { service: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });
    const deductions = await refundDeductionsByConversion(affiliate.id, records.map(item => item.id));
    rows = [
      ['Conversion ID', 'Date', 'Service', 'Order reference', 'Payment currency', 'Gross payment', 'Eligible amount', 'Commission currency', 'Net commission', 'Status', 'Original commission', 'Refund deduction'],
      ...records.map((item) => [item.pidConversion, item.createdAt, item.service.displayName, item.externalOrderReference, item.paymentCurrency, item.grossAmount, item.eligibleAmount, item.commissionCurrency, item.status === 'VOIDED' ? 0 : Math.max(0, Number(item.commissionAmount) - (deductions.get(item.id) || 0)), item.status, item.commissionAmount, deductions.get(item.id) || 0]),
    ];
  } else if (dataset === 'payouts') {
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
  } else {
    const records = await getShippingOpportunityExport(affiliate.id, MAX_EXPORT_ROWS);
    rows = [
      ['Submitted', 'Partner reference', 'Sure Imports request', 'Masked customer', 'Masked email', 'Destination', 'Mode', 'Billing unit', 'Request status', 'Invoice reference', 'Invoice status', 'Eligible quantity', 'Commission currency', 'Locked unit rate', 'Expected or earned commission', 'Commission stage', 'Review status', 'Payout status'],
      ...records.map((item) => [item.submittedAt, item.externalReference, item.requestReference, item.customerName, item.customerEmail, item.destination, item.shippingMode, item.billingUnit, item.requestStatus, item.invoiceReference, item.invoiceStatus, item.eligibleQuantity, item.commissionCurrency, item.unitRate, item.commissionAmount, item.commissionKind, item.reviewStatus, item.payoutStatus]),
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
