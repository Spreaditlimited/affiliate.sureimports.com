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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Calibri,Arial,sans-serif;color:#111827;">
  <!-- sureimports-standard-email-template -->
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f6fb;padding:24px 10px;">
    <tr>
      <td align="center">
        <table cellspacing="0" cellpadding="0" border="0" width="680" style="max-width:680px;background:#ffffff;border:1px solid #dbe2ea;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#ffffff;border-bottom:1px solid #dbe2ea;padding:18px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="vertical-align:top;">
                    <img src="https://sureimports.com/images/logo.png" height="36" alt="Sure Imports" style="display:block;" />
                    <div style="margin-top:10px;color:#0f172a;font-size:12px;line-height:1.55;font-weight:600;">
                      Lagos, Nigeria: 5 Olutosin Ajayi Street, Ajao Estate, Lagos<br/>
                      Guangzhou, China: 广州市白云区机场路111号建发广场3FB3-1.<br/>
                      Phone: +234 803 764 9956, +234 806 458 3664
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="display:inline-block;background:#0b3b88;color:#ffffff;padding:8px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em;">SURE IMPORTS</div>
                    <div style="margin-top:10px;font-size:12px;">
                      <a href="https://www.sureimports.com" style="color:#0b3b88;text-decoration:none;font-weight:700;">www.sureimports.com</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 22px 28px;">
              <h2 style="margin:0 0 14px 0;color:#0f172a;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h2>
              <div style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${copy}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <a href="${href}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:700;">${escapeHtml(label)}</a>
              <div style="margin-top:12px;color:#64748b;font-size:12px;line-height:1.6;">
                If the button does not work, copy and paste this link into your browser:<br/>
                <a href="${href}" style="color:#1558b0;text-decoration:none;word-break:break-all;">${href}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding:18px 28px 24px 28px;background:#fafbfd;">
              <div style="font-size:12px;line-height:1.7;color:#64748b;">
                This is an automated email from Sure Imports.<br/>
                If you did not request this email, you can safely ignore it.<br/>
                Website: <a href="https://www.sureimports.com" style="color:#1558b0;text-decoration:none;">www.sureimports.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
