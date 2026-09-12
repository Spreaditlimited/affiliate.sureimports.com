import 'server-only';
import type { Prisma } from '@prisma/client';

export class CommercialMembershipConflict extends Error {}

// Same transaction as account creation. A conflict rolls back the whole signup.
export async function reserveAffiliateMembership(tx: Prisma.TransactionClient, emailHash: string, affiliateId: number) {
  const subjectId = `affiliate:${affiliateId}`;
  await tx.$executeRaw`INSERT INTO commercial_program_memberships (emailHash, program, subjectId) VALUES (${emailHash}, 'AFFILIATE', ${subjectId}) ON DUPLICATE KEY UPDATE emailHash = VALUES(emailHash)`;
  const rows = await tx.$queryRaw<Array<{ program: string; subjectId: string }>>`SELECT program, subjectId FROM commercial_program_memberships WHERE emailHash = ${emailHash} FOR UPDATE`;
  if (rows[0]?.program !== 'AFFILIATE' || rows[0]?.subjectId !== subjectId) throw new CommercialMembershipConflict('This account is reserved for another commercial programme. Contact support before switching programmes.');
}
