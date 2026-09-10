# Affiliate launch readiness

This is the release gate for the clean-slate Sure Imports affiliate system. It
covers the three repositories that share the affiliate lifecycle:

- `affiliate.sureimports.com`: public site, authentication, dashboard, payout destinations, and payout requests
- `sureimports.com`: first-touch attribution, commission creation, reversals, and provider webhook intake
- `admin.sureimports.com`: service rules, commission approval/release, payout execution, and reconciliation

## Required invariants

- A valid first-touch referral is retained for 30 days and cannot be replaced by a later code.
- A customer is permanently attached to the first affiliate claimed on their account.
- Self-referrals are rejected.
- Commission rules are read from active admin-managed service records and snapshotted on each conversion.
- NGN payments create NGN commissions; foreign-currency payments create USD commissions. No conversion occurs in the affiliate ledger.
- Repeated payment, refund, dispute, release, payout, and webhook events are idempotent.
- Paystack pays only verified Nigerian bank destinations; PayPal pays only verified PayPal destinations.
- Payouts reserve specific available conversions transactionally before provider submission.
- Personal data and payout destinations are encrypted at rest. Public and authenticated endpoints retain their rate-limit, same-origin, CAPTCHA, and session checks.
- Important affiliate events use the branded Sure Imports email template and the shared deduplication ledger.

## Repository checks

Run these from a clean working copy before release:

```text
affiliate.sureimports.com
  npm run typecheck
  npm run audit:database
  npm run build

sureimports.com
  npm run test:affiliate-reversals
  npm run build

admin.sureimports.com
  CRON_SECRET=<same local secret used by the running admin server> node scripts/test-affiliate-commission-release.mjs
  npm run build
```

Then perform an authenticated browser pass at desktop and mobile sizes across:

- `/`, `/affiliate-terms`, `/sign-up`, `/sign-in`, and password recovery
- `/dashboard`, `/dashboard/referrals`, `/dashboard/earnings`
- `/dashboard/payouts`, `/dashboard/resources`, `/dashboard/settings`

The browser pass must have no application console errors, hydration failures,
horizontal overflow, inaccessible controls, or unresolved WCAG violations.

## Production environment gate

The affiliate Vercel build automatically runs `scripts/validate-production-env.mjs`.
It must reject production when the database, encryption, canonical URL, live
Paystack, SMTP, or CAPTCHA configuration is absent or invalid.

Confirm the following separately because they live in the other applications:

- All three applications use the intended shared `DATABASE_URL`.
- All three applications use the exact same `AFFILIATE_SECURITY_KEY`.
- The affiliate application uses `https://affiliate.sureimports.com` as `AFFILIATE_APP_URL`.
- The affiliate and admin applications use the same live Paystack secret.
- Admin has live PayPal credentials and a strong `CRON_SECRET`.
- Sure Imports has its existing live Paystack and PayPal webhook-verification credentials.
- SMTP and CAPTCHA production credentials are present in the affiliate application.

Never copy populated environment files into Git. Never expose a server secret
through a `NEXT_PUBLIC_` variable.

## Provider routing

Paystack permits one account webhook. Keep the account webhook on LineScout:

```text
https://linescout.sureimports.com/api/webhooks/paystack
```

LineScout forwards the untouched raw body and `x-paystack-signature` to:

```text
https://www.sureimports.com/api/webhooks/paystack
```

PayPal events remain on:

```text
https://www.sureimports.com/api/intelligence/paypal-webhook
```

The detailed event subscription list and payout state machine are documented in
`AFFILIATE_PAYOUTS.md`.

## Release procedure

1. Run the checks above against the intended database and remove all test fixtures.
2. Confirm production environment names and provider webhook registrations.
3. Review and commit the changes to GitHub.
4. Deploy only from that GitHub revision after explicit owner approval.
5. Run smoke tests without creating real provider transfers.
6. Monitor webhook verification, commission creation, email failures, and payout transitions during the initial launch window.

No local verification command deploys the applications or submits a live payout.
