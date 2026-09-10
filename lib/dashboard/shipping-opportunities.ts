import 'server-only';
import { prisma } from '@/lib/prisma';
import { DASHBOARD_PAGE_SIZE } from '@/lib/dashboard/overview';

type DatabaseRow = {
  pidAttribution: string;
  pidShippingOnly: string;
  sourceType: string;
  sourceReference: string | null;
  submittedAt: Date;
  requestStatus: string | null;
  destination: string | null;
  planName: string | null;
  planSlug: string | null;
  planUnit: string | null;
  customerName: string | null;
  customerEmail: string | null;
  pidInvoice: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  billingUnit: string | null;
  eligibleQuantity: unknown;
  commissionCurrency: string | null;
  unitRate: unknown;
  commissionAmount: unknown;
  snapshotStatus: string | null;
  conversionStatus: string | null;
  payoutStatus: string | null;
};

type CountRow = { total: bigint | number; invoiced: unknown; earned: unknown };

const number = (value: unknown) => value === null || value === undefined ? null : Number(value);

function maskName(value: string | null) {
  const clean = value?.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Customer identity protected';
  return clean.split(' ').map((part) => part.length < 2 ? '•' : `${part[0]}${'•'.repeat(Math.min(5, part.length - 1))}`).join(' ');
}

function maskEmail(value: string | null) {
  const clean = value?.trim().toLowerCase();
  if (!clean?.includes('@')) return null;
  const [local, domain] = clean.split('@');
  return `${local.slice(0, Math.min(2, local.length))}${'•'.repeat(Math.max(3, Math.min(7, local.length - 2)))}@${domain}`;
}

function shippingMode(row: DatabaseRow) {
  const plan = `${row.planSlug ?? ''} ${row.planName ?? ''}`.toUpperCase();
  if (plan.includes('SEA')) return 'Sea';
  if (plan.includes('AIR')) return 'Air';
  return 'Shipping';
}

function billingUnit(row: DatabaseRow) {
  if (row.billingUnit) return row.billingUnit.toUpperCase();
  if (shippingMode(row) === 'Sea' && (row.destination ?? '').toLowerCase().includes('nigeria')) return 'CBM';
  return (row.planUnit || 'KG').toUpperCase();
}

function publicRow(row: DatabaseRow) {
  const externalReference = row.sourceType === 'PARTNER_API' ? row.sourceReference : null;
  return {
    attributionId: row.pidAttribution,
    externalReference: externalReference || 'Website referral',
    requestReference: row.pidShippingOnly,
    submittedAt: row.submittedAt,
    customerName: maskName(row.customerName),
    customerEmail: maskEmail(row.customerEmail),
    destination: row.destination || 'To be confirmed',
    shippingMode: shippingMode(row),
    billingUnit: billingUnit(row),
    requestStatus: row.requestStatus || 'SUBMITTED',
    invoiceReference: row.invoiceNumber || row.pidInvoice,
    invoiceStatus: row.invoiceStatus || (row.pidInvoice ? 'ISSUED' : 'NOT_INVOICED'),
    eligibleQuantity: number(row.eligibleQuantity),
    commissionCurrency: row.commissionCurrency,
    unitRate: number(row.unitRate),
    commissionAmount: number(row.commissionAmount),
    commissionKind: row.conversionStatus === 'VOIDED' ? 'Reversed' : row.conversionStatus ? 'Earned' : row.pidInvoice ? 'Expected' : 'Awaiting invoice',
    reviewStatus: row.conversionStatus || row.snapshotStatus || 'AWAITING_INVOICE',
    payoutStatus: row.payoutStatus || (row.conversionStatus === 'PAID' ? 'PAID' : 'NOT_REQUESTED'),
  };
}

async function records(affiliateId: number, take: number, offset: number) {
  return prisma.$queryRaw<DatabaseRow[]>`
    SELECT
      attribution.pidAttribution,
      attribution.pidShippingOnly,
      attribution.sourceType,
      attribution.sourceReference,
      attribution.createdAt AS submittedAt,
      shippingRequest.status AS requestStatus,
      shippingRequest.shippingTo AS destination,
      plan.shippingPlanName AS planName,
      plan.shippingPlanSlug AS planSlug,
      plan.shippingPlanUnit AS planUnit,
      COALESCE(invoice.customerName, invoice.customerContactName, CONCAT_WS(' ', customer.userFirstname, customer.userLastname), shippingRequest.shippingName) AS customerName,
      COALESCE(invoice.customerEmail, customer.userEmail) AS customerEmail,
      snapshot.pidInvoice,
      invoice.invoiceNumber,
      invoice.status AS invoiceStatus,
      snapshot.billingUnit,
      snapshot.eligibleQuantity,
      snapshot.commissionCurrency,
      snapshot.unitRate,
      snapshot.commissionAmount,
      snapshot.status AS snapshotStatus,
      conversion.status AS conversionStatus,
      payout.status AS payoutStatus
    FROM shipping_request_attributions attribution
    INNER JOIN shipping_only shippingRequest ON shippingRequest.pidShippingOnly = attribution.pidShippingOnly
    LEFT JOIN shippingplan plan ON plan.pidShippingPlan = shippingRequest.shippingPlan
    LEFT JOIN users customer ON customer.pidUser = shippingRequest.pidUser
    LEFT JOIN invoice_affiliate_commission_snapshots snapshot ON snapshot.shippingAttributionId = attribution.id
    LEFT JOIN invoices invoice ON invoice.pidInvoice = snapshot.pidInvoice
    LEFT JOIN affiliate_conversions conversion ON conversion.id = snapshot.conversionId
    LEFT JOIN affiliate_payout_items payoutItem ON payoutItem.conversionId = conversion.id
    LEFT JOIN affiliate_payouts payout ON payout.id = payoutItem.payoutId
    WHERE attribution.affiliateId = ${affiliateId}
    ORDER BY attribution.createdAt DESC
    LIMIT ${take} OFFSET ${offset}
  `;
}

export async function getShippingOpportunityData(affiliateId: number, requestedPage = 1) {
  const [counts] = await prisma.$queryRaw<CountRow[]>`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN snapshot.id IS NOT NULL THEN 1 ELSE 0 END) AS invoiced,
      SUM(CASE WHEN snapshot.conversionId IS NOT NULL AND conversion.status <> 'VOIDED' THEN 1 ELSE 0 END) AS earned
    FROM shipping_request_attributions attribution
    LEFT JOIN invoice_affiliate_commission_snapshots snapshot ON snapshot.shippingAttributionId = attribution.id
    LEFT JOIN affiliate_conversions conversion ON conversion.id = snapshot.conversionId
    WHERE attribution.affiliateId = ${affiliateId}
  `;
  const total = Number(counts?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / DASHBOARD_PAGE_SIZE));
  const page = Math.min(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, pageCount);
  const rows = await records(affiliateId, DASHBOARD_PAGE_SIZE, (page - 1) * DASHBOARD_PAGE_SIZE);

  return {
    total,
    invoiced: Number(counts?.invoiced ?? 0),
    earned: Number(counts?.earned ?? 0),
    page,
    pageSize: DASHBOARD_PAGE_SIZE,
    opportunities: rows.map(publicRow),
  };
}

export async function getShippingOpportunityExport(affiliateId: number, limit: number) {
  const rows = await records(affiliateId, limit, 0);
  return rows.map(publicRow);
}
