# Affiliate payouts

Affiliate commissions and payouts never cross currencies:

- NGN commissions use a verified Nigerian bank account and are paid through
  Paystack.
- USD commissions use a verified PayPal email address and are paid through
  PayPal Payouts.

## Affiliate flow

1. The affiliate enters a Nigerian bank account or PayPal email.
2. A six-digit code is sent to the affiliate's account email. Every new or
   changed payout destination must pass this check.
3. Nigerian accounts are resolved and registered as Paystack transfer
   recipients. Only the masked account number, a keyed fingerprint, and the
   Paystack recipient reference are retained. PayPal email addresses are
   encrypted at rest and only shown masked.
4. A payout request reserves every currently available commission in that
   currency. A commission can belong to only one payout.

## Admin flow

Admins with the `payout_requests` permission can review commissions, approve
or void them, execute requested payouts, enter a Paystack transfer OTP when
required, reconcile provider state, and cancel a requested or failed payout.
Cancellation releases its reserved commissions back to the affiliate.

Each eligible service has an independent commission-release policy in the
Admin programme configuration. The active mode and due date are copied onto
the conversion when payment is recorded, so later policy changes affect only
future commissions. `MANUAL` keeps every new commission pending until an
administrator reviews it. `AUTOMATIC` releases a pending commission after the
configured 0–365 day review period. The hourly processor claims only
still-pending commissions that are not attached to a payout, so repeated or
overlapping runs cannot release the same commission twice. Refund and reversal
handlers can still void the commission afterward under the normal policy.

Paystack transfers use each payout ID as the transfer reference. PayPal uses
the same payout ID as both `sender_batch_id` and `sender_item_id`. A provider
reference is never submitted again; it must be reconciled or cancelled first.

## Required server environment

Affiliate application:

- `DATABASE_URL`
- `AFFILIATE_SECURITY_KEY` (base64-encoded 32 bytes)
- `NEXT_SECRET_PAYSTACK_SECRET_KEY`
- SMTP variables used by the existing transactional email service

Admin application:

- `DATABASE_URL`
- `AFFILIATE_SECURITY_KEY` (exactly the same value as the affiliate app)
- `NEXT_SECRET_PAYSTACK_SECRET_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENVIRONMENT=live` in production; omit or use `sandbox` locally
- `CRON_SECRET` used to authorize the scheduled commission-release endpoint
- optional `PAYPAL_BASE_URL` override

Sure Imports application:

- its existing Paystack and PayPal webhook credentials
- the PayPal webhook registration must include `PAYMENT.PAYOUTSBATCH.*` and
  `PAYMENT.PAYOUTS-ITEM.*` events

All listed variables are server-only. Do not prefix credentials with
`NEXT_PUBLIC_` and do not commit populated environment files.

The affiliate and admin applications must use the same Paystack integration
key. Paystack transfer-recipient references created during affiliate account
setup belong to that integration and are later consumed by the admin payout
operation.

The admin payout credentials and the Sure Imports PayPal webhook must also
belong to the same PayPal REST application. Otherwise PayPal payout events will
not be delivered to, or verifiable by, the existing webhook endpoint.

## Production webhook configuration

Configure the live provider dashboards with these exact HTTPS endpoints:

- Paystack account webhook (the single URL configured in Paystack): `https://linescout.sureimports.com/api/webhooks/paystack`
- LineScout forwards the original signed Paystack payload to Sure Imports at `https://www.sureimports.com/api/webhooks/paystack`

LineScout must preserve the raw request body and `x-paystack-signature` header when forwarding. Both applications validate the event with the same live Paystack secret before processing it.

- PayPal: `https://www.sureimports.com/api/intelligence/paypal-webhook`

The PayPal webhook must subscribe to:

- `CHECKOUT.ORDER.APPROVED`
- `CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.UPDATED`, and
  `CUSTOMER.DISPUTE.RESOLVED`
- `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DECLINED`,
  `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, and
  `PAYMENT.CAPTURE.REVERSED`
- all supported `PAYMENT.PAYOUTSBATCH.*` events
- all supported `PAYMENT.PAYOUTS-ITEM.*` events

The Paystack webhook must remain on the same live integration used to create
affiliate transfer recipients and execute admin transfers. Its signed transfer,
refund, and dispute events are handled by the endpoint above.

The affiliate Vercel build runs a production-only configuration preflight before
compilation. It rejects a missing credential, an invalid encryption key, a
non-live Paystack key, an invalid CAPTCHA threshold, or an incorrect canonical
affiliate URL. Run `npm run check:production-config` only with a complete
production environment when checking it manually.

## State transitions

- Commission: `PENDING` -> `AVAILABLE` -> `RESERVED` -> `PAID`
- Commission refund/dispute: eligible states -> `VOIDED`
- Payout: `REQUESTED` -> `PROCESSING` -> `PAID`
- Paystack OTP: `PROCESSING` -> `OTP_REQUIRED` -> `PROCESSING` or `PAID`
- Provider failure: payout -> `FAILED`; commissions remain `RESERVED` until
  the payout is reconciled, retried before a provider reference exists, or
  cancelled.

Provider webhooks and manual reconciliation are both idempotent. For PayPal,
only an individual payout item with `SUCCESS`/`SUCCEEDED` is treated as paid;
batch completion by itself is not sufficient.
