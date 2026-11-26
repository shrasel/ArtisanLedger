import type { BankAccount, Client, Invoice, Organization } from '@/db/schema';

export interface InvoiceLedgerRow {
  invoice: Invoice;
  client: Client | null;
}

export interface CurrencyBucket {
  currency: string;
  outstandingCents: number;
  paidCents: number;
  draftCents: number;
  count: number;
}

export interface EntityCurrencyBucket {
  key: string;
  label: string;
  sublabel?: string | null;
  currency: string;
  outstandingCents: number;
  paidCents: number;
  count: number;
}

const OUTSTANDING_STATUSES = new Set(['SENT', 'VIEWED', 'DRAFT']);

export function aggregateLedgerByCurrency(
  rows: InvoiceLedgerRow[],
  defaultCurrency = 'USD'
): CurrencyBucket[] {
  const map = new Map<string, CurrencyBucket>();

  for (const { invoice } of rows) {
    const cur = (invoice.currency || defaultCurrency || 'USD').toUpperCase();
    const bucket = map.get(cur) || {
      currency: cur,
      outstandingCents: 0,
      paidCents: 0,
      draftCents: 0,
      count: 0,
    };

    const total = invoice.totalCents || 0;
    const status = invoice.status || 'DRAFT';

    if (OUTSTANDING_STATUSES.has(status)) {
      bucket.outstandingCents += total;
    }
    if (status === 'PAID') {
      bucket.paidCents += total;
    }
    if (status === 'DRAFT') {
      bucket.draftCents += total;
    }
    bucket.count += 1;
    map.set(cur, bucket);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.currency === defaultCurrency) return -1;
    if (b.currency === defaultCurrency) return 1;
    return b.count - a.count || a.currency.localeCompare(b.currency);
  });
}

export function aggregateLedgerByClient(rows: InvoiceLedgerRow[]): EntityCurrencyBucket[] {
  const map = new Map<string, EntityCurrencyBucket>();

  for (const { invoice, client } of rows) {
    const cur = (invoice.currency || 'USD').toUpperCase();
    const clientId = client?.id || 'unassigned';
    const key = `${clientId}::${cur}`;

    const bucket = map.get(key) || {
      key,
      label: client?.companyName || client?.name || 'Unassigned Client',
      sublabel: client?.companyName && client?.name ? `Attn: ${client.name}` : client?.email || null,
      currency: cur,
      outstandingCents: 0,
      paidCents: 0,
      count: 0,
    };

    const total = invoice.totalCents || 0;
    const status = invoice.status || 'DRAFT';
    if (OUTSTANDING_STATUSES.has(status)) bucket.outstandingCents += total;
    if (status === 'PAID') bucket.paidCents += total;
    bucket.count += 1;
    map.set(key, bucket);
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.outstandingCents + b.paidCents - (a.outstandingCents + a.paidCents) ||
      a.label.localeCompare(b.label)
  );
}

export function aggregateLedgerByBank(
  rows: InvoiceLedgerRow[],
  bankAccounts: BankAccount[],
  organization: Organization
): EntityCurrencyBucket[] {
  const map = new Map<string, EntityCurrencyBucket>();
  const defaultBank = bankAccounts.find((b) => b.isDefault === 1) || bankAccounts[0] || null;

  for (const { invoice } of rows) {
    const cur = (invoice.currency || 'USD').toUpperCase();
    let bankKey: string;
    let label: string;
    let sublabel: string | null = null;

    if (invoice.showBankDetails === 0) {
      bankKey = 'omitted';
      label = 'No Bank Info (Omitted)';
      sublabel = 'Remittance stub excluded';
    } else {
      const matched =
        (invoice.bankAccountId
          ? bankAccounts.find((b) => b.id === invoice.bankAccountId)
          : undefined) || defaultBank;

      if (matched) {
        bankKey = matched.id;
        label = matched.label;
        sublabel = matched.bankName || matched.accountNumber || null;
      } else {
        bankKey = 'org-legacy';
        label = organization.bankName || 'Organization Default Bank';
        sublabel = organization.accountNumber || null;
      }
    }

    const key = `${bankKey}::${cur}`;
    const bucket = map.get(key) || {
      key,
      label,
      sublabel,
      currency: cur,
      outstandingCents: 0,
      paidCents: 0,
      count: 0,
    };

    const total = invoice.totalCents || 0;
    const status = invoice.status || 'DRAFT';
    if (OUTSTANDING_STATUSES.has(status)) bucket.outstandingCents += total;
    if (status === 'PAID') bucket.paidCents += total;
    bucket.count += 1;
    map.set(key, bucket);
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.outstandingCents + b.paidCents - (a.outstandingCents + a.paidCents) ||
      a.label.localeCompare(b.label)
  );
}
