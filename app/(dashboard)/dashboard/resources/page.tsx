import { currentAffiliate } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '../components/PageHeader';
import { ResourceToolkit } from './ResourceToolkit';

export const dynamic = 'force-dynamic';

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

export default async function ResourcesPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) return null;
  const services = await prisma.affiliate_program_services.findMany({
    where: { active: true },
    include: { currencyRates: { where: { active: true }, orderBy: { currency: 'asc' } }, unitRates: { where: { active: true }, orderBy: [{ currency: 'asc' }, { billingUnit: 'asc' }] }, eventRules: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
  });
  return <><PageHeader eyebrow="Affiliate toolkit" title="Resources" description="Approved tools and guidance for sharing Sure Imports clearly and earning with confidence." /><ResourceToolkit code={affiliate.referralCode} services={services.map((service) => ({
    key: service.serviceKey,
    name: service.displayName,
    reward: service.eventRules.length
      ? service.eventRules.map((rule) => `${rule.displayName} ${Number(rule.percentageRate)}%`).join(' · ')
      : service.commissionType === 'PERCENTAGE'
      ? `${Number(service.percentageRate)}%${service.recurring ? ' on purchases and renewals' : ''}`
      : service.commissionType === 'PER_UNIT'
        ? service.unitRates.map((rate) => `${money(Number(rate.unitRate), rate.currency)} per ${rate.billingUnit}`).join(' · ')
        : service.currencyRates.filter((rate) => rate.fixedAmount).map((rate) => money(Number(rate.fixedAmount), rate.currency)).join(' · ') || 'Configured by currency',
    basis: service.eligibleAmountBasis,
  }))} /></>;
}
