import 'server-only';

import { Prisma } from '@prisma/client';
import { appUrl } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { randomToken, secureFingerprint } from '@/lib/security/crypto';
import {
  affiliateEmailTemplate,
  sendBrandedAffiliateEmail,
} from '@/lib/email/auth-mail';

type Fact = { label: string; value: string };

export type AffiliateNotification = {
  eventKey: string;
  eventType: string;
  to: string;
  firstName: string;
  subject: string;
  title: string;
  message: string;
  facts?: Fact[];
  actionLabel?: string;
  actionPath?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!);
}

function clean(value: string, max: number) {
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function emailBody(input: AffiliateNotification) {
  const facts = (input.facts || []).map((fact) => `<tr><td style="padding:7px 12px;color:#64748b;font-size:13px;">${escapeHtml(fact.label)}</td><td align="right" style="padding:7px 12px;color:#0f172a;font-size:13px;font-weight:700;">${escapeHtml(fact.value)}</td></tr>`).join('');
  return `<p style="margin:0 0 14px 0;">Hello ${escapeHtml(input.firstName || 'there')},</p><p style="margin:0;">${escapeHtml(input.message)}</p>${facts ? `<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">${facts}</table>` : ''}`;
}

async function claimEvent(input: AffiliateNotification) {
  const now = new Date();
  const eventKey = clean(input.eventKey, 191);
  const eventType = clean(input.eventType, 80);
  const recipientHash = secureFingerprint(input.to.trim().toLowerCase(), 'affiliate-notification-recipient-v1');
  try {
    return await prisma.affiliate_email_events.create({
      data: {
        pidEvent: `aemail_${randomToken(18)}`,
        eventKey,
        eventType,
        recipientHash,
        status: 'PENDING',
        attempts: 1,
        lockedAt: now,
      },
      select: { id: true },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
  }

  const staleAt = new Date(now.getTime() - 5 * 60_000);
  const existing = await prisma.affiliate_email_events.findUnique({ where: { eventKey } });
  if (!existing || existing.status === 'SENT') return null;
  const claimed = await prisma.affiliate_email_events.updateMany({
    where: {
      id: existing.id,
      status: { not: 'SENT' },
      OR: [{ status: 'FAILED' }, { lockedAt: null }, { lockedAt: { lte: staleAt } }],
    },
    data: {
      status: 'PENDING',
      attempts: { increment: 1 },
      lockedAt: now,
      lastError: null,
    },
  });
  return claimed.count === 1 ? { id: existing.id } : null;
}

export async function sendAffiliateNotification(input: AffiliateNotification) {
  const claimed = await claimEvent(input);
  if (!claimed) return { sent: false, duplicate: true };
  const href = `${appUrl()}${input.actionPath || '/dashboard'}`;
  try {
    await sendBrandedAffiliateEmail(
      input.to,
      clean(input.subject, 180),
      affiliateEmailTemplate(
        input.title,
        emailBody(input),
        input.actionLabel || 'Open affiliate dashboard',
        href,
      ),
    );
    await prisma.affiliate_email_events.update({
      where: { id: claimed.id },
      data: { status: 'SENT', sentAt: new Date(), lockedAt: null, lastError: null },
    });
    return { sent: true, duplicate: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed.';
    await prisma.affiliate_email_events.update({
      where: { id: claimed.id },
      data: { status: 'FAILED', lockedAt: null, lastError: clean(message, 500) },
    }).catch(() => undefined);
    console.error(`Affiliate email ${clean(input.eventType, 80)} failed:`, message);
    return { sent: false, duplicate: false };
  }
}
