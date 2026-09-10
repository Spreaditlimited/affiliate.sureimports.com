import 'server-only';

import { timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  decryptPrivateValue,
  encryptPrivateValue,
  randomToken,
  secureFingerprint,
} from '@/lib/security/crypto';
import { sendPayoutAccountOtpEmail } from '@/lib/email/auth-mail';

export const PAYOUT_METHODS = {
  NGN: { provider: 'PAYSTACK', currency: 'NGN' },
  USD: { provider: 'PAYPAL', currency: 'USD' },
} as const;

type PayoutCurrency = keyof typeof PAYOUT_METHODS;
type Bank = { name: string; code: string; slug?: string };
type PayoutDetails = {
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  accountNumberMasked?: string;
  accountNumberHash?: string;
  email?: string;
  emailMasked?: string;
  emailHash?: string;
};

let bankCache: { expiresAt: number; banks: Bank[] } | null = null;

function clean(value: unknown, max = 255) {
  return String(value || '').trim().slice(0, max);
}

function paystackSecret() {
  return clean(
    process.env.NEXT_SECRET_PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY,
    1000,
  );
}

async function paystack(path: string, init?: RequestInit) {
  const secret = paystackSecret();
  if (!secret) throw new Error('Paystack payout setup is not configured.');
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status === false) {
    throw new Error(clean(body?.message, 300) || 'Paystack rejected the request.');
  }
  return body;
}

function payoutMethod(currencyInput: string) {
  const currency = clean(currencyInput, 3).toUpperCase() as PayoutCurrency;
  const method = PAYOUT_METHODS[currency];
  if (!method) throw new Error('Only NGN and USD payouts are supported.');
  return method;
}

function accountTarget(input: {
  currency: string;
  bankCode?: string;
  accountNumber?: string;
  paypalEmail?: string;
}) {
  const method = payoutMethod(input.currency);
  if (method.currency === 'NGN') {
    const bankCode = clean(input.bankCode, 40);
    const accountNumber = clean(input.accountNumber, 20).replace(/\D/g, '');
    if (!bankCode || accountNumber.length !== 10) {
      throw new Error('Select a bank and enter a valid 10-digit account number.');
    }
    return {
      method,
      bankCode,
      accountNumber,
      targetHash: secureFingerprint(
        `${bankCode}:${accountNumber}`,
        'affiliate-payout-target-v1',
      ),
      description: 'Nigerian bank',
    };
  }

  const paypalEmail = clean(input.paypalEmail, 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
    throw new Error('Enter a valid PayPal email address.');
  }
  return {
    method,
    paypalEmail,
    targetHash: secureFingerprint(
      paypalEmail,
      'affiliate-payout-target-v1',
    ),
    description: 'PayPal',
  };
}

function maskAccount(value: string) {
  return `${value.slice(0, 2)}••••••${value.slice(-2)}`;
}

function maskEmail(value: string) {
  const [local, domain] = value.split('@');
  return `${local.slice(0, 1)}•••@${domain}`;
}

function decodeDetails(ciphertext: string): PayoutDetails {
  try {
    return JSON.parse(decryptPrivateValue(ciphertext)) as PayoutDetails;
  } catch {
    return {};
  }
}

export function publicPayoutAccount(account: {
  pidPayoutAccount: string;
  provider: string;
  currency: string;
  detailsCiphertext: string;
  status: string;
  verifiedAt: Date | null;
}) {
  const details = decodeDetails(account.detailsCiphertext);
  return {
    pidPayoutAccount: account.pidPayoutAccount,
    provider: account.provider,
    currency: account.currency,
    status: account.status,
    verifiedAt: account.verifiedAt,
    bankCode: details.bankCode || null,
    bankName: details.bankName || null,
    accountName: details.accountName || null,
    accountNumberMasked: details.accountNumberMasked || null,
    emailMasked: details.emailMasked || null,
  };
}

export async function listPayoutBanks() {
  if (bankCache && bankCache.expiresAt > Date.now()) return bankCache.banks;
  const response = await paystack('/bank?country=nigeria&currency=NGN&perPage=200');
  const banks = (Array.isArray(response?.data) ? response.data : [])
    .map((bank: Record<string, unknown>) => ({
      name: clean(bank.name, 160),
      code: clean(bank.code, 40),
      slug: clean(bank.slug, 160),
    }))
    .filter((bank: Bank) => bank.name && bank.code)
    .sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));
  bankCache = { expiresAt: Date.now() + 6 * 60 * 60 * 1000, banks };
  return banks;
}

export async function resolveBankAccount(bankCodeInput: string, accountNumberInput: string) {
  const target = accountTarget({
    currency: 'NGN',
    bankCode: bankCodeInput,
    accountNumber: accountNumberInput,
  });
  const bankCode = 'bankCode' in target ? target.bankCode : undefined;
  const accountNumber = 'accountNumber' in target ? target.accountNumber : undefined;
  if (!bankCode || !accountNumber) {
    throw new Error('Invalid bank account.');
  }
  const response = await paystack(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
  const accountName = clean(response?.data?.account_name, 180);
  if (!accountName) throw new Error('Paystack could not resolve this account.');
  return { accountName, bankCode };
}

export async function sendPayoutOtp(input: {
  affiliateId: number;
  affiliateEmail: string;
  firstName: string;
  currency: string;
  bankCode?: string;
  accountNumber?: string;
  paypalEmail?: string;
}) {
  const target = accountTarget(input);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date();
  await prisma.$transaction([
    prisma.affiliate_payout_account_otps.updateMany({
      where: {
        affiliateId: input.affiliateId,
        provider: target.method.provider,
        currency: target.method.currency,
        status: { in: ['PENDING', 'VERIFIED'] },
      },
      data: { status: 'CANCELLED' },
    }),
    prisma.affiliate_payout_account_otps.create({
      data: {
        pidOtp: `aotp_${randomToken(18)}`,
        affiliateId: input.affiliateId,
        provider: target.method.provider,
        currency: target.method.currency,
        targetHash: target.targetHash,
        otpHash: secureFingerprint(code, 'affiliate-payout-otp-v1'),
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      },
    }),
  ]);
  await sendPayoutAccountOtpEmail(
    input.affiliateEmail,
    input.firstName,
    code,
    target.description,
  );
  return { emailMasked: maskEmail(input.affiliateEmail), expiresInSeconds: 600 };
}

async function consumePayoutOtp(
  tx: Prisma.TransactionClient,
  input: {
    affiliateId: number;
    provider: string;
    currency: string;
    targetHash: string;
    otp: string;
  },
) {
  const row = await tx.affiliate_payout_account_otps.findFirst({
    where: {
      affiliateId: input.affiliateId,
      provider: input.provider,
      currency: input.currency,
      targetHash: input.targetHash,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error('Request a new verification code.');
  const supplied = Buffer.from(
    secureFingerprint(input.otp, 'affiliate-payout-otp-v1'),
  );
  const expected = Buffer.from(row.otpHash);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    const attempts = row.attempts + 1;
    await tx.affiliate_payout_account_otps.update({
      where: { id: row.id },
      data: {
        attempts,
        status: attempts >= row.maxAttempts ? 'EXPIRED' : 'PENDING',
      },
    });
    throw new Error(
      attempts >= row.maxAttempts
        ? 'Too many incorrect attempts. Request a new code.'
        : 'The verification code is incorrect.',
    );
  }
  await tx.affiliate_payout_account_otps.update({
    where: { id: row.id },
    data: { status: 'USED', verifiedAt: new Date(), consumedAt: new Date() },
  });
}

async function validatePayoutOtpBeforeProvider(input: {
  affiliateId: number;
  provider: string;
  currency: string;
  targetHash: string;
  otp: string;
}) {
  const row = await prisma.affiliate_payout_account_otps.findFirst({
    where: {
      affiliateId: input.affiliateId,
      provider: input.provider,
      currency: input.currency,
      targetHash: input.targetHash,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error('Request a new verification code.');
  const supplied = Buffer.from(
    secureFingerprint(input.otp, 'affiliate-payout-otp-v1'),
  );
  const expected = Buffer.from(row.otpHash);
  if (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  ) return;
  const attempts = row.attempts + 1;
  await prisma.affiliate_payout_account_otps.update({
    where: { id: row.id },
    data: {
      attempts,
      status: attempts >= row.maxAttempts ? 'EXPIRED' : 'PENDING',
    },
  });
  throw new Error(
    attempts >= row.maxAttempts
      ? 'Too many incorrect attempts. Request a new code.'
      : 'The verification code is incorrect.',
  );
}

export async function savePayoutAccount(input: {
  affiliateId: number;
  currency: string;
  otp: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  paypalEmail?: string;
}) {
  const target = accountTarget(input);
  const openPayout = await prisma.affiliate_payouts.findFirst({
    where: {
      affiliateId: input.affiliateId,
      currency: target.method.currency,
      status: { in: ['REQUESTED', 'PROCESSING', 'OTP_REQUIRED'] },
    },
    select: { id: true },
  });
  if (openPayout) {
    throw new Error('This payout account cannot change while a payout is processing.');
  }

  const normalizedOtp = clean(input.otp, 12).replace(/\D/g, '');
  await validatePayoutOtpBeforeProvider({
    affiliateId: input.affiliateId,
    provider: target.method.provider,
    currency: target.method.currency,
    targetHash: target.targetHash,
    otp: normalizedOtp,
  });

  let details: PayoutDetails;
  let recipientReference: string | null = null;
  if (target.method.currency === 'NGN') {
    const bankCode = 'bankCode' in target ? target.bankCode : undefined;
    const accountNumber = 'accountNumber' in target ? target.accountNumber : undefined;
    if (!bankCode || !accountNumber) {
      throw new Error('Invalid bank account.');
    }
    const resolved = await resolveBankAccount(bankCode, accountNumber);
    const recipient = await paystack('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({
        type: 'nuban',
        name: resolved.accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });
    recipientReference = clean(recipient?.data?.recipient_code, 180);
    if (!recipientReference) throw new Error('Paystack did not create a transfer recipient.');
    details = {
      bankCode,
      bankName: clean(input.bankName, 160),
      accountName: resolved.accountName,
      accountNumberMasked: maskAccount(accountNumber),
      accountNumberHash: secureFingerprint(
        accountNumber,
        'affiliate-payout-account-v1',
      ),
    };
  } else {
    const paypalEmail = 'paypalEmail' in target ? target.paypalEmail : undefined;
    if (!paypalEmail) throw new Error('Invalid PayPal account.');
    details = {
      email: paypalEmail,
      emailMasked: maskEmail(paypalEmail),
      emailHash: secureFingerprint(
        paypalEmail,
        'affiliate-payout-paypal-v1',
      ),
    };
  }

  const account = await prisma.$transaction(async (tx) => {
    await consumePayoutOtp(tx, {
      affiliateId: input.affiliateId,
      provider: target.method.provider,
      currency: target.method.currency,
      targetHash: target.targetHash,
      otp: normalizedOtp,
    });
    return tx.affiliate_payout_accounts.upsert({
      where: {
        affiliateId_provider_currency: {
          affiliateId: input.affiliateId,
          provider: target.method.provider,
          currency: target.method.currency,
        },
      },
      create: {
        pidPayoutAccount: `apacct_${randomToken(18)}`,
        affiliateId: input.affiliateId,
        provider: target.method.provider,
        currency: target.method.currency,
        detailsCiphertext: encryptPrivateValue(JSON.stringify(details)),
        recipientReference,
        status: 'VERIFIED',
        isDefault: true,
        verifiedAt: new Date(),
      },
      update: {
        detailsCiphertext: encryptPrivateValue(JSON.stringify(details)),
        recipientReference,
        status: 'VERIFIED',
        isDefault: true,
        verifiedAt: new Date(),
      },
    });
  });
  return publicPayoutAccount(account);
}

export async function requestPayout(affiliateId: number, currencyInput: string) {
  const method = payoutMethod(currencyInput);
  return prisma.$transaction(
    async (tx) => {
      const account = await tx.affiliate_payout_accounts.findUnique({
        where: {
          affiliateId_provider_currency: {
            affiliateId,
            provider: method.provider,
            currency: method.currency,
          },
        },
      });
      if (!account || account.status !== 'VERIFIED') {
        throw new Error(`Set up a verified ${method.provider} payout account first.`);
      }
      const existing = await tx.affiliate_payouts.findFirst({
        where: {
          affiliateId,
          currency: method.currency,
          status: { in: ['REQUESTED', 'PROCESSING', 'OTP_REQUIRED'] },
        },
      });
      if (existing) throw new Error('A payout in this currency is already processing.');

      const conversions = await tx.affiliate_conversions.findMany({
        where: {
          affiliateId,
          commissionCurrency: method.currency,
          status: 'AVAILABLE',
          payoutItem: null,
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!conversions.length) throw new Error('There is no available balance to withdraw.');
      const amount = conversions.reduce(
        (total, conversion) => total.add(conversion.commissionAmount),
        new Prisma.Decimal(0),
      );
      if (amount.lte(0)) throw new Error('There is no available balance to withdraw.');

      const payout = await tx.affiliate_payouts.create({
        data: {
          pidPayout: `apout_${randomToken(18)}`,
          affiliateId,
          payoutAccountId: account.id,
          provider: method.provider,
          currency: method.currency,
          amount,
          status: 'REQUESTED',
          items: {
            create: conversions.map((conversion) => ({
              conversionId: conversion.id,
              amount: conversion.commissionAmount,
            })),
          },
        },
      });
      const reserved = await tx.affiliate_conversions.updateMany({
        where: {
          id: { in: conversions.map((conversion) => conversion.id) },
          status: 'AVAILABLE',
        },
        data: { status: 'RESERVED' },
      });
      if (reserved.count !== conversions.length) {
        throw new Error('Balance changed while the payout was being requested. Try again.');
      }
      return { pidPayout: payout.pidPayout, currency: payout.currency, amount: Number(payout.amount) };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}

export function payoutDestinationDetails(ciphertext: string) {
  return decodeDetails(ciphertext);
}
