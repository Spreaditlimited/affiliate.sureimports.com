import 'server-only';
import { prisma } from '@/lib/prisma';
import { publicPayoutAccount } from '@/lib/payouts';

export const DASHBOARD_PAGE_SIZE = 20;

function safePage(page: number) {
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function getDashboardOverview(affiliateId: number) {
  const [referrals, conversions, available, pending, paid, recent, services, payoutAccounts] = await Promise.all([
    prisma.affiliate_referrals.count({ where: { affiliateId } }),
    prisma.affiliate_conversions.count({ where: { affiliateId, status: { not: 'VOIDED' } } }),
    prisma.affiliate_conversions.groupBy({ by: ['commissionCurrency'], where: { affiliateId, status: 'AVAILABLE', payoutItem: null }, _sum: { commissionAmount: true } }),
    prisma.affiliate_conversions.groupBy({ by: ['commissionCurrency'], where: { affiliateId, status: 'PENDING' }, _sum: { commissionAmount: true } }),
    prisma.affiliate_payouts.groupBy({ by: ['currency'], where: { affiliateId, status: 'PAID' }, _sum: { amount: true } }),
    prisma.affiliate_conversions.findMany({ where: { affiliateId }, include: { service: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.affiliate_program_services.findMany({ where: { active: true }, include: { currencyRates: { where: { active: true }, orderBy: { currency: 'asc' } } }, orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }] }),
    prisma.affiliate_payout_accounts.count({ where: { affiliateId, status: 'VERIFIED' } }),
  ]);

  const amountFor = (rows: Array<{ commissionCurrency?: string; currency?: string; _sum: { commissionAmount?: unknown; amount?: unknown } }>, currency: string) => {
    const row = rows.find((item) => (item.commissionCurrency ?? item.currency) === currency);
    return Number(row?._sum.commissionAmount ?? row?._sum.amount ?? 0);
  };

  return {
    totalClicks: referrals,
    conversions,
    conversionRate: referrals > 0 ? (conversions / referrals) * 100 : 0,
    payoutAccounts,
    balances: {
      NGN: { available: amountFor(available, 'NGN'), pending: amountFor(pending, 'NGN'), paid: amountFor(paid, 'NGN') },
      USD: { available: amountFor(available, 'USD'), pending: amountFor(pending, 'USD'), paid: amountFor(paid, 'USD') },
    },
    recent: recent.map((item) => ({ id: item.pidConversion, service: item.service.displayName, reference: item.externalOrderReference, currency: item.commissionCurrency, commission: Number(item.commissionAmount), status: item.status, date: item.createdAt })),
    services: services.map((service) => ({ key: service.serviceKey, name: service.displayName, type: service.commissionType, percentageRate: service.percentageRate ? Number(service.percentageRate) : null, basis: service.eligibleAmountBasis, recurring: service.recurring, rates: service.currencyRates.map((rate) => ({ currency: rate.currency, fixedAmount: rate.fixedAmount ? Number(rate.fixedAmount) : null })) })),
  };
}

export async function getReferralData(affiliateId: number, requestedPage = 1) {
  const [total, converted] = await Promise.all([
    prisma.affiliate_referrals.count({ where: { affiliateId } }),
    prisma.affiliate_referrals.count({ where: { affiliateId, convertedAt: { not: null } } }),
  ]);
  const page = Math.min(safePage(requestedPage), Math.max(1, Math.ceil(total / DASHBOARD_PAGE_SIZE)));
  const referrals = await prisma.affiliate_referrals.findMany({
    where: { affiliateId },
    select: { pidReferral: true, landingPath: true, source: true, firstTouchAt: true, lastTouchAt: true, convertedAt: true },
    orderBy: { firstTouchAt: 'desc' },
    skip: (page - 1) * DASHBOARD_PAGE_SIZE,
    take: DASHBOARD_PAGE_SIZE,
  });

  return { total, converted, referrals, page, pageSize: DASHBOARD_PAGE_SIZE };
}

export async function getEarningsData(affiliateId: number, requestedPage = 1) {
  const [totals, conversionCount] = await Promise.all([
    prisma.affiliate_conversions.groupBy({
      by: ['commissionCurrency', 'status'],
      where: { affiliateId, status: { not: 'VOIDED' } },
      _sum: { commissionAmount: true },
    }),
    prisma.affiliate_conversions.count({ where: { affiliateId } }),
  ]);
  const page = Math.min(safePage(requestedPage), Math.max(1, Math.ceil(conversionCount / DASHBOARD_PAGE_SIZE)));
  const conversions = await prisma.affiliate_conversions.findMany({
    where: { affiliateId },
    include: { service: { select: { displayName: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * DASHBOARD_PAGE_SIZE,
    take: DASHBOARD_PAGE_SIZE,
  });

  return {
    totals: totals.map((item) => ({ currency: item.commissionCurrency, status: item.status, amount: Number(item._sum.commissionAmount ?? 0) })),
    total: conversionCount,
    page,
    pageSize: DASHBOARD_PAGE_SIZE,
    conversions: conversions.map((item) => ({
      id: item.pidConversion,
      service: item.service.displayName,
      reference: item.externalOrderReference,
      paymentCurrency: item.paymentCurrency,
      paymentAmount: Number(item.grossAmount),
      commissionCurrency: item.commissionCurrency,
      commissionAmount: Number(item.commissionAmount),
      status: item.status,
      date: item.createdAt,
    })),
  };
}

export async function getPayoutData(affiliateId: number, requestedPage = 1) {
  const [accounts, payoutCount, available] = await Promise.all([
    prisma.affiliate_payout_accounts.findMany({
      where: { affiliateId },
      select: { pidPayoutAccount: true, provider: true, currency: true, detailsCiphertext: true, status: true, isDefault: true, verifiedAt: true },
      orderBy: [{ currency: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.affiliate_payouts.count({ where: { affiliateId } }),
    prisma.affiliate_conversions.groupBy({
      by: ['commissionCurrency'],
      where: { affiliateId, status: 'AVAILABLE', payoutItem: null },
      _sum: { commissionAmount: true },
    }),
  ]);
  const page = Math.min(safePage(requestedPage), Math.max(1, Math.ceil(payoutCount / DASHBOARD_PAGE_SIZE)));
  const payouts = await prisma.affiliate_payouts.findMany({
    where: { affiliateId },
    select: { pidPayout: true, provider: true, currency: true, amount: true, status: true, requestedAt: true, processedAt: true },
    orderBy: { requestedAt: 'desc' },
    skip: (page - 1) * DASHBOARD_PAGE_SIZE,
    take: DASHBOARD_PAGE_SIZE,
  });

  return {
    accounts: accounts.map(publicPayoutAccount),
    total: payoutCount,
    page,
    pageSize: DASHBOARD_PAGE_SIZE,
    payouts: payouts.map((item) => ({ ...item, amount: Number(item.amount) })),
    available: {
      NGN: Number(available.find((item) => item.commissionCurrency === 'NGN')?._sum.commissionAmount ?? 0),
      USD: Number(available.find((item) => item.commissionCurrency === 'USD')?._sum.commissionAmount ?? 0),
    },
  };
}

export async function getDashboardNotifications(affiliateId: number) {
  const [available, pending, payoutAccounts, payouts] = await Promise.all([
    prisma.affiliate_conversions.groupBy({
      by: ['commissionCurrency'],
      where: { affiliateId, status: 'AVAILABLE', payoutItem: null },
      _sum: { commissionAmount: true },
    }),
    prisma.affiliate_conversions.count({ where: { affiliateId, status: 'PENDING' } }),
    prisma.affiliate_payout_accounts.count({ where: { affiliateId, status: 'VERIFIED' } }),
    prisma.affiliate_payouts.findMany({
      where: { affiliateId, status: { in: ['REQUESTED', 'PROCESSING', 'FAILED'] } },
      select: { pidPayout: true, status: true, currency: true, amount: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
  ]);

  const items: Array<{ id: string; title: string; message: string; href: string; tone: 'info' | 'success' | 'warning'; date: string }> = payouts.map((payout) => ({
    id: `payout-${payout.pidPayout}-${payout.status}`,
    title: payout.status === 'FAILED' ? 'Payout needs attention' : 'Payout is being processed',
    message: payout.status === 'FAILED'
      ? `${payout.currency} payout ${payout.pidPayout} was not completed. Review its status on the payouts page.`
      : `${payout.currency} ${Number(payout.amount).toLocaleString()} payout is ${payout.status.toLowerCase()}.`,
    href: '/dashboard/payouts',
    tone: payout.status === 'FAILED' ? 'warning' : 'info',
    date: payout.updatedAt.toISOString(),
  }));

  for (const balance of available) {
    const amount = Number(balance._sum.commissionAmount ?? 0);
    if (amount > 0) items.push({
      id: `available-${balance.commissionCurrency}-${amount}`,
      title: 'Earnings available',
      message: `${balance.commissionCurrency} ${amount.toLocaleString()} is available to withdraw.`,
      href: '/dashboard/payouts',
      tone: 'success',
      date: new Date(0).toISOString(),
    });
  }
  if (pending > 0) items.push({ id: `pending-${pending}`, title: 'Commissions pending', message: `${pending.toLocaleString()} commission${pending === 1 ? '' : 's'} awaiting release.`, href: '/dashboard/earnings', tone: 'info', date: new Date(0).toISOString() });
  if (payoutAccounts === 0) items.push({ id: 'payout-setup-required', title: 'Complete your payout setup', message: 'Add a Nigerian bank account or PayPal email before requesting a payout.', href: '/dashboard/payouts', tone: 'warning', date: new Date(0).toISOString() });
  return items.slice(0, 6);
}
