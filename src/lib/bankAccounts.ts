import { db } from '@/db';
import { bankAccounts, organizations, type BankAccount } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export { resolveInvoiceBankDetails, type ResolvedBankDetails } from './bankDetails';

/**
 * Fetch all bank accounts for an organization, ordered with the default account first.
 */
export async function getOrgBankAccounts(orgId: string): Promise<BankAccount[]> {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.orgId, orgId))
    .orderBy(desc(bankAccounts.isDefault), asc(bankAccounts.createdAt));
}

/**
 * Sync the organization's legacy bank columns with the current default bank account
 * so any fallback reads stay consistent.
 */
export async function syncOrgDefaultBankFields(orgId: string): Promise<void> {
  const accounts = await getOrgBankAccounts(orgId);
  const defaultAccount = accounts.find((a) => a.isDefault === 1) || accounts[0] || null;

  await db
    .update(organizations)
    .set({
      bankName: defaultAccount?.bankName ?? null,
      accountHolderName: defaultAccount?.accountHolderName ?? null,
      routingNumber: defaultAccount?.routingNumber ?? null,
      accountNumber: defaultAccount?.accountNumber ?? null,
      swiftBic: defaultAccount?.swiftBic ?? null,
      paymentNotes: defaultAccount?.paymentNotes ?? null,
    })
    .where(eq(organizations.id, orgId));
}
