'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/app/components/SearchableSelect';

type Account = {
  currency: string;
  status: string;
  bankCode: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumberMasked: string | null;
  emailMasked: string | null;
};
type Bank = { name: string; code: string };
type Method = 'NGN' | 'USD';

function uniqueBanksByCode(input: Bank[]) {
  const seen = new Set<string>();
  return input.filter((bank) => {
    const code = String(bank.code || '').trim();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

const money = (amount: number, currency: Method) =>
  new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(amount);

async function send(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Request failed.');
  return result;
}

function BankIcon() {
  return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24"><path d="M3 9h18M5 9v8m4-8v8m6-8v8m4-8v8M3 20h18M12 3 3 7h18l-9-4Z" /></svg>;
}
function DollarMark() {
  return <b className="payout-currency-glyph" aria-hidden="true">$</b>;
}
function CheckIcon() {
  return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>;
}

export function PayoutSetup({ accounts, available }: { accounts: Account[]; available: { NGN: number; USD: number } }) {
  const router = useRouter();
  const ngnAccount = accounts.find((item) => item.currency === 'NGN');
  const usdAccount = accounts.find((item) => item.currency === 'USD');
  const [activeMethod, setActiveMethod] = useState<Method>('NGN');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');
  const [bankCode, setBankCode] = useState(ngnAccount?.bankCode || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [ngnOtp, setNgnOtp] = useState('');
  const [ngnOtpSent, setNgnOtpSent] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [usdOtp, setUsdOtp] = useState('');
  const [usdOtpSent, setUsdOtpSent] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const bankName = banks.find((bank) => bank.code === bankCode)?.name || ngnAccount?.bankName || '';

  useEffect(() => {
    fetch('/api/payout-accounts/banks', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'Unable to load Nigerian banks.');
        const list = Array.isArray(result.banks) ? result.banks : [];
        if (!list.length) throw new Error('No Nigerian banks were returned. Please refresh and try again.');
        setBanks(uniqueBanksByCode(list));
      })
      .catch((requestError) => {
        setBanks([]);
        setBanksError(requestError instanceof Error ? requestError.message : 'Unable to load Nigerian banks.');
      })
      .finally(() => setBanksLoading(false));
  }, []);

  async function run(key: string, action: () => Promise<string>) {
    setBusy(key); setError(''); setNotice('');
    try { setNotice(await action()); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Request failed.'); }
    finally { setBusy(''); }
  }

  const methods = [
    { currency: 'NGN' as const, provider: 'Paystack', account: ngnAccount },
    { currency: 'USD' as const, provider: 'PayPal', account: usdAccount },
  ];

  return <div className="payout-workspace">
    {(notice || error) && <div role="status" className={`payout-feedback ${error ? 'is-error' : ''}`}>{error || notice}</div>}

    <section className="payout-balance-grid" aria-label="Available payout balances">
      {methods.map(({ currency, provider, account }) => <article className="payout-balance-card" key={currency}>
        <div className="payout-balance-heading">
          <span className="payout-provider-icon">{currency === 'NGN' ? <BankIcon /> : <DollarMark />}</span>
          <div><small>{currency} balance</small><strong>{provider}</strong></div>
          <b className={`status ${account?.status === 'VERIFIED' ? 'status-available' : ''}`}>{account?.status === 'VERIFIED' ? 'Ready' : 'Setup required'}</b>
        </div>
        <p>Available to withdraw</p>
        <h2>{money(available[currency], currency)}</h2>
        <div className="payout-balance-footer">
          <span>{currency === 'NGN'
            ? account?.accountNumberMasked ? `${account.bankName || 'Bank'} · ${account.accountNumberMasked}` : 'Nigerian bank account'
            : account?.emailMasked || 'PayPal email address'}</span>
          <button className="button" type="button" disabled={Boolean(busy) || !account || available[currency] <= 0} onClick={() => run(`request-${currency.toLowerCase()}`, async () => { await send('/api/payouts/request', { currency }); return `Your ${currency} payout request has been submitted.`; })}>{busy === `request-${currency.toLowerCase()}` ? 'Requesting…' : available[currency] > 0 ? 'Request payout' : 'No balance yet'}</button>
        </div>
      </article>)}
    </section>

    <section className="dashboard-panel payout-account-panel">
      <header><div><span>Payout destinations</span><small>Add or update where your commissions should be sent</small></div><b>Verified by email</b></header>
      <div className="payout-provider-tabs" role="tablist" aria-label="Payout destination">
        <button type="button" role="tab" aria-selected={activeMethod === 'NGN'} className={activeMethod === 'NGN' ? 'active' : ''} onClick={() => { setActiveMethod('NGN'); setError(''); setNotice(''); }}><BankIcon /><span><strong>Nigerian bank</strong><small>NGN via Paystack</small></span>{ngnAccount?.status === 'VERIFIED' ? <i><CheckIcon /></i> : null}</button>
        <button type="button" role="tab" aria-selected={activeMethod === 'USD'} className={activeMethod === 'USD' ? 'active' : ''} onClick={() => { setActiveMethod('USD'); setError(''); setNotice(''); }}><DollarMark /><span><strong>PayPal</strong><small>USD payouts</small></span>{usdAccount?.status === 'VERIFIED' ? <i><CheckIcon /></i> : null}</button>
      </div>

      {activeMethod === 'NGN' ? <div className="payout-account-content" role="tabpanel">
        <div className="payout-account-intro"><div><span>PAYSTACK</span><h2>Nigerian bank account</h2><p>Paystack verifies the account name before your destination is saved.</p></div>{ngnAccount?.accountNumberMasked ? <div className="payout-current-destination"><small>Current destination</small><strong>{ngnAccount.bankName || 'Bank'} · {ngnAccount.accountNumberMasked}</strong><span>{ngnAccount.accountName}</span></div> : null}</div>
        <div className="payout-bank-fields">
          <label><span>Bank</span><SearchableSelect value={bankCode} disabled={banksLoading || Boolean(banksError)} placeholder={banksLoading ? 'Loading banks…' : banksError ? 'Banks unavailable' : 'Search and select your bank…'} emptyMessage="No bank matches your search." options={banks.map((bank) => ({ value: bank.code, label: bank.name, searchText: bank.code }))} onChange={(value) => { setBankCode(value); setAccountName(''); setNgnOtpSent(false); }} /></label>
          <label><span>Account number</span><input inputMode="numeric" value={accountNumber} onChange={(event) => { setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10)); setAccountName(''); setNgnOtpSent(false); }} placeholder="10-digit account number" /></label>
          <button className="button button-secondary payout-inline-action" type="button" disabled={Boolean(busy) || !bankCode || accountNumber.length !== 10} onClick={() => run('resolve', async () => { const result = await send('/api/payout-accounts/resolve', { bankCode, accountNumber }); setAccountName(result.account.accountName); return `Account resolved: ${result.account.accountName}`; })}>{busy === 'resolve' ? 'Checking…' : 'Resolve account'}</button>
          {banksError ? <p className="payout-field-error">{banksError} Restart the local development server after updating environment variables.</p> : null}
        </div>
        {accountName ? <div className="payout-verification-strip">
          <span className="payout-check"><CheckIcon /></span><div><small>Account confirmed</small><strong>{accountName}</strong></div>
          {!ngnOtpSent ? <button className="button button-secondary" type="button" disabled={Boolean(busy)} onClick={() => run('ngn-otp', async () => { await send('/api/payout-accounts/otp', { currency: 'NGN', bankCode, accountNumber }); setNgnOtpSent(true); return 'Verification code sent to your account email.'; })}>{busy === 'ngn-otp' ? 'Sending…' : 'Send verification code'}</button> : <div className="payout-otp-fields"><label><span>Verification code</span><input autoFocus inputMode="numeric" value={ngnOtp} onChange={(event) => setNgnOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></label><button className="button" type="button" disabled={Boolean(busy) || ngnOtp.length !== 6} onClick={() => run('save-ngn', async () => { await send('/api/payout-accounts/save', { currency: 'NGN', bankCode, bankName, accountNumber, otp: ngnOtp }); setAccountNumber(''); setAccountName(''); setNgnOtp(''); setNgnOtpSent(false); return 'Nigerian payout account saved securely.'; })}>{busy === 'save-ngn' ? 'Saving…' : 'Verify and save'}</button></div>}
        </div> : null}
      </div> : <div className="payout-account-content" role="tabpanel">
        <div className="payout-account-intro"><div><span>PAYPAL</span><h2>PayPal account</h2><p>Use the email address connected to the PayPal account that should receive USD payouts.</p></div>{usdAccount?.emailMasked ? <div className="payout-current-destination"><small>Current destination</small><strong>{usdAccount.emailMasked}</strong><span>Verified PayPal email</span></div> : null}</div>
        <div className="payout-paypal-fields">
          <label><span>PayPal email</span><input type="email" value={paypalEmail} onChange={(event) => { setPaypalEmail(event.target.value); setUsdOtpSent(false); }} placeholder={usdAccount?.emailMasked || 'paypal@example.com'} /></label>
          {!usdOtpSent ? <button className="button button-secondary payout-inline-action" type="button" disabled={Boolean(busy) || !paypalEmail} onClick={() => run('usd-otp', async () => { await send('/api/payout-accounts/otp', { currency: 'USD', paypalEmail }); setUsdOtpSent(true); return 'Verification code sent to your account email.'; })}>{busy === 'usd-otp' ? 'Sending…' : 'Send verification code'}</button> : <div className="payout-otp-fields"><label><span>Verification code</span><input autoFocus inputMode="numeric" value={usdOtp} onChange={(event) => setUsdOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></label><button className="button" type="button" disabled={Boolean(busy) || usdOtp.length !== 6} onClick={() => run('save-usd', async () => { await send('/api/payout-accounts/save', { currency: 'USD', paypalEmail, otp: usdOtp }); setPaypalEmail(''); setUsdOtp(''); setUsdOtpSent(false); return 'PayPal payout account saved securely.'; })}>{busy === 'save-usd' ? 'Saving…' : 'Verify and save'}</button></div>}
        </div>
      </div>}
    </section>
  </div>;
}
