import type { BankAccount, Organization } from '@/db/schema';

export interface ResolvedBankDetails {
  showBankDetails: boolean;
  bankAccountId: string | null;
  label: string | null;
  bankName: string | null;
  accountHolderName: string | null;
  routingNumber: string | null;
  accountNumber: string | null;
  swiftBic: string | null;
  paymentNotes: string | null;
}

/**
 * Pure helper to resolve the effective bank details for an invoice
 * (explicit bank account -> default account -> legacy organization fields).
 */
export function resolveInvoiceBankDetails(
  organization: Organization,
  accounts: BankAccount[],
  bankAccountId?: string | null,
  showBankDetails?: number | boolean | null
): ResolvedBankDetails {
  const shouldShow = showBankDetails !== 0 && showBankDetails !== false;
  if (!shouldShow) {
    return {
      showBankDetails: false,
      bankAccountId: null,
      label: null,
      bankName: null,
      accountHolderName: null,
      routingNumber: null,
      accountNumber: null,
      swiftBic: null,
      paymentNotes: null,
    };
  }

  const matched =
    (bankAccountId ? accounts.find((a) => a.id === bankAccountId) : undefined) ||
    accounts.find((a) => a.isDefault === 1) ||
    accounts[0];

  if (matched) {
    return {
      showBankDetails: true,
      bankAccountId: matched.id,
      label: matched.label,
      bankName: matched.bankName,
      accountHolderName: matched.accountHolderName,
      routingNumber: matched.routingNumber,
      accountNumber: matched.accountNumber,
      swiftBic: matched.swiftBic,
      paymentNotes: matched.paymentNotes,
    };
  }

  return {
    showBankDetails: true,
    bankAccountId: null,
    label: null,
    bankName: organization.bankName ?? null,
    accountHolderName: organization.accountHolderName ?? null,
    routingNumber: organization.routingNumber ?? null,
    accountNumber: organization.accountNumber ?? null,
    swiftBic: organization.swiftBic ?? null,
    paymentNotes: organization.paymentNotes ?? null,
  };
}
