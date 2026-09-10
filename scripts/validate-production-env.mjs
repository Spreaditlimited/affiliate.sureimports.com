const strict = process.argv.includes('--force') || process.env.VERCEL_ENV === 'production';

if (!strict) {
  console.log('Production configuration validation skipped outside production.');
  process.exit(0);
}

const failures = [];
const required = [
  'DATABASE_URL',
  'AFFILIATE_SECURITY_KEY',
  'AFFILIATE_APP_URL',
  'NEXT_SECRET_PAYSTACK_SECRET_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_EMAIL',
  'SMTP_PASSWORD',
  'NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY',
  'GOOGLE_CAPTCHA_SECRET_KEY',
];

for (const name of required) {
  if (!process.env[name]?.trim()) failures.push(`${name} is missing`);
}

const appUrl = process.env.AFFILIATE_APP_URL?.trim();
try {
  const url = new URL(appUrl || '');
  if (url.protocol !== 'https:' || url.hostname !== 'affiliate.sureimports.com') {
    failures.push('AFFILIATE_APP_URL must be https://affiliate.sureimports.com');
  }
} catch {
  failures.push('AFFILIATE_APP_URL is not a valid URL');
}

const securityKey = process.env.AFFILIATE_SECURITY_KEY?.trim();
if (securityKey) {
  const decoded = Buffer.from(securityKey, 'base64');
  if (decoded.length !== 32 || decoded.toString('base64') !== securityKey) {
    failures.push('AFFILIATE_SECURITY_KEY must be a canonical base64-encoded 32-byte key');
  }
}

const paystackKey = process.env.NEXT_SECRET_PAYSTACK_SECRET_KEY?.trim();
if (paystackKey && !paystackKey.startsWith('sk_live_')) {
  failures.push('NEXT_SECRET_PAYSTACK_SECRET_KEY must be a live Paystack key in production');
}

const smtpPort = Number(process.env.SMTP_PORT);
if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
  failures.push('SMTP_PORT must be a valid port number');
}

const captchaThreshold = Number(process.env.GOOGLE_CAPTCHA_MIN_SCORE ?? 0.5);
if (!Number.isFinite(captchaThreshold) || captchaThreshold < 0 || captchaThreshold > 1) {
  failures.push('GOOGLE_CAPTCHA_MIN_SCORE must be between 0 and 1');
}

if (failures.length) {
  console.error(`Affiliate production configuration is invalid:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Affiliate production configuration is valid.');
