# Affiliate email notifications

Affiliate transactional emails use the standard Sure Imports email design and
the configured SMTP account. `SMTP_EMAIL` and `SMTP_PASSWORD` are required;
`SMTP_HOST` and `SMTP_PORT` default to Hostinger on port 465.

## Event coverage

| Event | Authoritative producer | Deduplication key |
| --- | --- | --- |
| Waitlist confirmation | Affiliate waitlist route | Email fingerprint |
| New-device sign-in | Affiliate sign-in route | Affiliate and device fingerprint |
| Password changed or reset | Affiliate account/auth routes | Password change or reset token |
| Payout destination saved | Affiliate payout-account route | Account and verification time |
| Payout requested | Affiliate payout request route | Payout reference |
| Commission recorded | Sure Imports payment integrations | Conversion reference |
| Commission approved/available | Admin commission review | Conversion reference and status |
| Commission voided/reversed | Sure Imports/admin reversal handlers | Conversion reference and status |
| Payout approved/processing | Admin execution and provider callbacks | Payout reference and status |
| Payout paid | Admin reconciliation or provider callbacks | Payout reference and status |
| Payout failed/reversed/cancelled | Admin actions and provider callbacks | Payout reference and outcome |

## Delivery safety

Every notification first claims a row in `affiliate_email_events`. `eventKey`
is unique across all three applications, so an admin reconciliation and a
provider webhook cannot send the same state notification twice. Failed sends
are recorded with the error and can be retried; sent events remain immutable.
Recipient addresses are never stored in this ledger, only a keyed fingerprint.
