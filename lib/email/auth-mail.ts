import mailTemplate from './template';
import 'server-only';
import nodemailer from 'nodemailer';
import { appUrl } from '@/lib/auth/config';

function transport() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) throw new Error('Affiliate email delivery is not configured');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    tls: { minVersion: 'TLSv1.2' },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!);
}

export function affiliateEmailTemplate(title: string, copy: string, label: string, href: string) {
  return mailTemplate({ zTitle: title, zBodyTitle: title, zBody1: copy, zButtonTitle: label, zButtonLink: href, zLabel: 'YOUR AFFILIATE ACCOUNT', zFooter: 'If you did not request this email, you can safely ignore it.' });
}

export async function sendBrandedAffiliateEmail(to: string, subject: string, html: string) {
  await transport().sendMail({ from: `Sure Imports <${process.env.SMTP_EMAIL}>`, to, subject, html });
}

export function sendVerificationEmail(to: string, firstName: string, token: string) {
  const href = `${appUrl()}/verify-email/${encodeURIComponent(token)}`;
  return sendBrandedAffiliateEmail(to, 'Verify your Sure Imports affiliate account', affiliateEmailTemplate('Verify your email', `<p style="margin:0 0 14px 0;">Hello ${escapeHtml(firstName)},</p><p style="margin:0;">Confirm this email address to activate your new affiliate account. This secure link expires in 24 hours.</p>`, 'Verify email address', href));
}

export function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  const href = `${appUrl()}/reset-password/${encodeURIComponent(token)}`;
  return sendBrandedAffiliateEmail(to, 'Reset your Sure Imports affiliate password', affiliateEmailTemplate('Reset your password', `<p style="margin:0 0 14px 0;">Hello ${escapeHtml(firstName)},</p><p style="margin:0;">Use the secure link below to choose a new password. It expires in 30 minutes.</p>`, 'Reset password', href));
}

export function sendPayoutAccountOtpEmail(
  to: string,
  firstName: string,
  code: string,
  destination: string,
) {
  const href = `${appUrl()}/dashboard/payouts`;
  return sendBrandedAffiliateEmail(
    to,
    'Verify your affiliate payout account',
    affiliateEmailTemplate(
      'Verify your payout account',
      `<p style="margin:0 0 14px 0;">Hello ${escapeHtml(firstName)},</p><p style="margin:0 0 14px 0;">Use this code to confirm your ${escapeHtml(destination)} payout account:</p><p style="margin:0;font-size:26px;font-weight:800;letter-spacing:4px;">${escapeHtml(code)}</p><p style="margin:14px 0 0 0;">The code expires in 10 minutes. Never share it with anyone.</p>`,
      'Return to payout settings',
      href,
    ),
  );
}
