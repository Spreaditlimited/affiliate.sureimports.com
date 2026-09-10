import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const prisma = new PrismaClient();

const expectedMigrations = [
  '20260909120000_add_affiliate_relaunch_waitlist',
  '20260909150000_add_affiliate_auth_foundation',
  '20260909170000_add_affiliate_program_ledger',
  '20260909193000_lock_affiliate_customer_attribution',
  '20260909213000_add_affiliate_conversion_inputs',
  '20260909230000_add_affiliate_payout_operations',
  '20260910103000_remove_legacy_affiliate_table',
  '20260910130000_add_affiliate_reversal_audit',
  '20260910153000_add_affiliate_email_events',
  '20260910180000_add_affiliate_release_policy',
  '20260910183000_snapshot_affiliate_release_policy',
];

const expectedTables = [
  'affiliate_waitlist_entries',
  'affiliate_accounts',
  'affiliate_sessions',
  'affiliate_auth_tokens',
  'affiliate_auth_limits',
  'affiliate_program_services',
  'affiliate_service_commission_rates',
  'affiliate_referrals',
  'affiliate_conversions',
  'affiliate_payout_accounts',
  'affiliate_payout_account_otps',
  'affiliate_payouts',
  'affiliate_payout_items',
  'affiliate_email_events',
];

const expectedServices = [
  'BUY_FROM_CHINESE_WEBSITES',
  'SUPPLIER_REPORTS',
  'PHONES_AND_LAPTOPS',
  'SUPPLIER_INTELLIGENCE',
  'SUPPLIER_VERIFICATION',
];

const requiredColumns = {
  affiliate_program_services: ['approvalMode', 'reviewPeriodDays'],
  affiliate_referrals: ['customerReference', 'claimedAt'],
  affiliate_payouts: [
    'providerStatus',
    'approvedAt',
    'approvedBy',
    'lastCheckedAt',
    'attemptCount',
  ],
  affiliate_conversions: [
    'reversedFromStatus',
    'reversalReason',
    'reversalReference',
    'releaseMode',
    'releaseAt',
  ],
  affiliate_email_events: [
    'eventKey',
    'eventType',
    'recipientHash',
    'status',
    'attempts',
    'lockedAt',
    'sentAt',
    'lastError',
  ],
};

function number(value) {
  return Number(value ?? 0);
}

async function scalar(query) {
  const rows = await prisma.$queryRawUnsafe(query);
  return number(rows[0]?.value);
}

async function main() {
  const failures = [];
  const warnings = [];

  const tables = await prisma.$queryRaw`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND (TABLE_NAME LIKE 'affiliate\_%' OR TABLE_NAME = 'affiliates')
    ORDER BY TABLE_NAME
  `;
  const tableNames = new Set(tables.map((row) => row.tableName));

  const missingTables = expectedTables.filter((table) => !tableNames.has(table));
  if (missingTables.length) failures.push(`Missing tables: ${missingTables.join(', ')}`);

  const migrationRows = await prisma.$queryRaw`
    SELECT migration_name AS migrationName, finished_at AS finishedAt,
           rolled_back_at AS rolledBackAt
    FROM _prisma_migrations
    WHERE migration_name LIKE '%affiliate%'
    ORDER BY migration_name
  `;
  const completedMigrations = new Set(
    migrationRows
      .filter((row) => row.finishedAt && !row.rolledBackAt)
      .map((row) => row.migrationName),
  );
  const missingMigrations = expectedMigrations.filter(
    (migration) => !completedMigrations.has(migration),
  );
  if (missingMigrations.length) {
    failures.push(`Migrations not recorded as complete: ${missingMigrations.join(', ')}`);
  }

  const columns = await prisma.$queryRaw`
    SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('affiliate_program_services', 'affiliate_referrals', 'affiliate_payouts', 'affiliate_conversions', 'affiliate_email_events')
  `;
  const columnSet = new Set(columns.map((row) => `${row.tableName}.${row.columnName}`));
  for (const [table, names] of Object.entries(requiredColumns)) {
    const missing = names.filter((name) => !columnSet.has(`${table}.${name}`));
    if (missing.length) failures.push(`${table} is missing: ${missing.join(', ')}`);
  }

  const rowCounts = {};
  for (const table of expectedTables) {
    if (tableNames.has(table)) {
      rowCounts[table] = await scalar(`SELECT COUNT(*) AS value FROM \`${table}\``);
    }
  }

  const legacyAffiliateRows = tableNames.has('affiliates')
    ? await scalar('SELECT COUNT(*) AS value FROM `affiliates`')
    : 0;
  if (tableNames.has('affiliates')) {
    failures.push(
      `The retired affiliates table still exists with ${legacyAffiliateRows} row(s)`,
    );
  }

  const services = tableNames.has('affiliate_program_services')
    ? await prisma.$queryRaw`
        SELECT serviceKey, active
        FROM affiliate_program_services
        ORDER BY serviceKey
      `
    : [];
  const configuredServices = new Set(services.map((row) => row.serviceKey));
  const missingServices = expectedServices.filter(
    (service) => !configuredServices.has(service),
  );
  if (missingServices.length) {
    failures.push(`Missing service configuration: ${missingServices.join(', ')}`);
  }

  const integrityChecks = tableNames.has('affiliate_payout_items')
    ? {
        orphanReferrals: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_referrals r
          LEFT JOIN affiliate_accounts a ON a.id = r.affiliateId
          WHERE a.id IS NULL
        `),
        orphanConversions: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_conversions c
          LEFT JOIN affiliate_accounts a ON a.id = c.affiliateId
          LEFT JOIN affiliate_program_services s ON s.id = c.serviceId
          WHERE a.id IS NULL OR s.id IS NULL
        `),
        orphanPayoutAccounts: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_payout_accounts p
          LEFT JOIN affiliate_accounts a ON a.id = p.affiliateId
          WHERE a.id IS NULL
        `),
        orphanPayouts: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_payouts p
          LEFT JOIN affiliate_accounts a ON a.id = p.affiliateId
          LEFT JOIN affiliate_payout_accounts pa ON pa.id = p.payoutAccountId
          WHERE a.id IS NULL OR (p.payoutAccountId IS NOT NULL AND pa.id IS NULL)
        `),
        orphanPayoutItems: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_payout_items i
          LEFT JOIN affiliate_payouts p ON p.id = i.payoutId
          LEFT JOIN affiliate_conversions c ON c.id = i.conversionId
          WHERE p.id IS NULL OR c.id IS NULL
        `),
        payoutAmountMismatches: await scalar(`
          SELECT COUNT(*) AS value
          FROM affiliate_payouts p
          INNER JOIN (
            SELECT payoutId, SUM(amount) AS itemTotal
            FROM affiliate_payout_items
            GROUP BY payoutId
          ) i ON i.payoutId = p.id
          WHERE p.amount <> i.itemTotal
        `),
        payoutCurrencyMismatches: await scalar(`
          SELECT COUNT(*) AS value
          FROM affiliate_payout_items i
          INNER JOIN affiliate_payouts p ON p.id = i.payoutId
          INNER JOIN affiliate_conversions c ON c.id = i.conversionId
          WHERE p.currency <> c.commissionCurrency
        `),
        payoutProviderMismatches: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_payouts
          WHERE (currency = 'NGN' AND provider <> 'PAYSTACK')
             OR (currency = 'USD' AND provider <> 'PAYPAL')
             OR currency NOT IN ('NGN', 'USD')
        `),
        invalidReleasePolicies: await scalar(`
          SELECT COUNT(*) AS value FROM affiliate_program_services
          WHERE approvalMode NOT IN ('MANUAL', 'AUTOMATIC')
             OR reviewPeriodDays < 0
             OR reviewPeriodDays > 365
        `),
      }
    : {};

  for (const [name, count] of Object.entries(integrityChecks)) {
    if (count) failures.push(`${name}: ${count}`);
  }

  const result = {
    ok: failures.length === 0,
    migrations: {
      expected: expectedMigrations.length,
      complete: expectedMigrations.length - missingMigrations.length,
    },
    tables: {
      expected: expectedTables.length,
      present: expectedTables.length - missingTables.length,
      rowCounts,
    },
    services: {
      expected: expectedServices.length,
      configured: expectedServices.length - missingServices.length,
    },
    legacy: {
      retiredTablePresent: tableNames.has('affiliates'),
      retiredTableRows: legacyAffiliateRows,
    },
    integrityChecks,
    warnings,
    failures,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`Affiliate database audit failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
