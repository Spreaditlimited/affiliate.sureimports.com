export const SESSION_COOKIE = 'sure_affiliate_session';
export const SESSION_DAYS = 30;
export const VERIFY_HOURS = 24;
export const RESET_MINUTES = 30;
export const AUTH_CONSENT_VERSION = 'affiliate-terms-2026-09-09';

export function appUrl() {
  return (process.env.AFFILIATE_APP_URL ?? (process.env.NODE_ENV === 'production' ? 'https://affiliate.sureimports.com' : 'http://localhost:3000')).replace(/\/$/, '');
}
