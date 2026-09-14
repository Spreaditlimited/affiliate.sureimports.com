import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function refundCommissionDeductions(affiliateId: number) {
  const rows = await prisma.$queryRaw<{ currency: string; bucket: string; amount: string }[]>`SELECT a.currency,CASE WHEN c.status='PENDING' THEN 'PENDING' ELSE 'AVAILABLE' END bucket,SUM(a.amount) amount FROM affiliate_refund_adjustments a JOIN affiliate_conversions c ON c.id=a.conversionId WHERE c.affiliateId=${affiliateId} AND a.payoutId IS NULL AND (c.status IN ('PENDING','AVAILABLE','RESERVED','PAID') OR (c.status='VOIDED' AND EXISTS (SELECT 1 FROM affiliate_payout_items i JOIN affiliate_payouts p ON p.id=i.payoutId WHERE i.conversionId=c.id AND p.status='PAID'))) GROUP BY a.currency,bucket`;
  return (currency: string, bucket = 'AVAILABLE') => Number(rows.find(r => r.currency === currency && r.bucket === bucket)?.amount || 0);
}

export async function refundDeductionsByConversion(affiliateId: number, conversionIds: number[]) {
  if (!conversionIds.length) return new Map<number, number>();
  const rows = await prisma.$queryRaw<{ conversionId: number; amount: string }[]>(Prisma.sql`
    SELECT a.conversionId,SUM(a.amount) amount FROM affiliate_refund_adjustments a
    JOIN affiliate_conversions c ON c.id=a.conversionId
    WHERE c.affiliateId=${affiliateId} AND a.conversionId IN (${Prisma.join(conversionIds)})
    GROUP BY a.conversionId`);
  return new Map(rows.map(row => [row.conversionId, Number(row.amount)]));
}
