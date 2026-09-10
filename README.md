# Sure Imports Affiliate

Clean-slate affiliate platform for Sure Imports.

The relaunch includes the public affiliate website, authentication, permanent
first-touch attribution, the affiliate dashboard, configurable commission
rules, NGN bank payouts through Paystack, and USD payouts through PayPal.
Personal and payout data is encrypted with AES-256-GCM before storage and
deduplicated or located with purpose-specific keyed fingerprints.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` and a base64-encoded 32-byte `AFFILIATE_SECURITY_KEY`.
   The exact same `AFFILIATE_SECURITY_KEY` must be set in the admin app so it
   can decrypt verified payout destinations.
3. Set `NEXT_SECRET_PAYSTACK_SECRET_KEY` for Nigerian bank resolution and
   recipient setup. Keep this server-only.
4. Run `npm install` and `npm run dev`.

See `docs/AFFILIATE_PAYOUTS.md` for the payout lifecycle and production
configuration, `docs/AFFILIATE_EMAIL_NOTIFICATIONS.md` for branded event-email
coverage, and `docs/AFFILIATE_LAUNCH_READINESS.md` for the final release gate.

Run `npm run audit:database` to verify the affiliate migrations, required
tables and services, legacy-system removal, and payout-ledger integrity. The
audit is read-only and reports aggregate counts without exposing personal data.

No deployment is performed by the repository verification commands. Production
deployments must be initiated from a reviewed GitHub commit.
