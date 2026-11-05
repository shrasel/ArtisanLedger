---
name: ledger-schema
description: >-
  Database schema, SQLite WAL configuration, Drizzle ORM models, idempotent migrations,
  and integer-cent financial arithmetic rules for The Architect's Ledger.
  Activate this skill whenever adding, modifying, or querying database tables, columns,
  clients, organizations, invoices, or financial calculations.
---

# Ledger Schema & Financial Arithmetic Skill

## 1. Key Files (Read Only What You Need)
- [`src/db/schema.ts`](../../../src/db/schema.ts): Drizzle table definitions (`users`, `organizations`, `clients`, `invoices`, `invoiceItems`).
- [`src/db/index.ts`](../../../src/db/index.ts): `better-sqlite3` connection, WAL pragma setup, and idempotent startup schema migrations.
- [`src/lib/utils.ts`](../../../src/lib/utils.ts): Currency/cent conversion helpers (`dollarsToCents`, `formatCentsToCurrency`, `calculateInvoiceTotals`).

---

## 2. Database Architecture & Tables

| Table | Primary Key | Key Relationships & Columns |
| :--- | :--- | :--- |
| `users` | `id` (UUID) | `email` (unique), `passwordHash`, `fullName` |
| `organizations` | `id` (UUID) | `userId` $\rightarrow$ `users.id` (cascade), `companyName`, `defaultClientId`, `defaultCurrency`, `defaultTerms`, `invoicePrefix`, `nextInvoiceNumber`, `defaultTaxRateBasisPoints`, banking fields |
| `clients` | `id` (UUID) | `orgId` $\rightarrow$ `organizations.id` (cascade), `name`, `companyName`, `email`, `address`, `phone`, `isDefault` (integer `0` or `1`) |
| `invoices` | `id` (UUID) | `orgId` $\rightarrow$ `organizations.id`, `clientId` $\rightarrow$ `clients.id`, `invoiceNumber`, `status` (`DRAFT`, `SENT`, `VIEWED`, `PAID`, `VOID`), `subtotalCents`, `discountCents`, `taxRateBasisPoints`, `taxAmountCents`, `totalCents`, `accessToken`, `accessPasscode` |
| `invoice_items` | `id` (UUID) | `invoiceId` $\rightarrow$ `invoices.id` (cascade), `description`, `quantity`, `unitPriceCents`, `totalCents`, `sortOrder` |

---

## 3. Safe Schema Evolution Protocol

When adding a new column or table:
1. **Update Drizzle Schema**: Add the field in [`src/db/schema.ts`](../../../src/db/schema.ts).
2. **Add Idempotent Startup Migration**: In [`src/db/index.ts`](../../../src/db/index.ts), inspect `PRAGMA table_info(table_name)` and run `ALTER TABLE ... ADD COLUMN` only if the column is missing.
   ```ts
   const cols = sqlite.prepare("PRAGMA table_info(clients)").all() as Array<{ name: string }>;
   if (!cols.some((c) => c.name === 'new_col')) {
     sqlite.exec("ALTER TABLE clients ADD COLUMN new_col TEXT;");
   }
   ```
3. **Concurrency Safety**: Never remove `sqlite.pragma('busy_timeout = 10000')` or `sqlite.pragma('journal_mode = WAL')` in `src/db/index.ts`—Next.js static build workers access SQLite in parallel.
4. **Data Preservation**: Never drop tables or delete `ledger.db` without explicit user confirmation.

---

## 4. Financial Calculation Rules

- **Line Item Total**: `totalCents = Math.round(quantity * unitPriceCents)`
- **Subtotal**: `subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0)`
- **Taxable Base**: `taxableCents = Math.max(0, subtotalCents - discountCents)`
- **Tax Amount**: `taxAmountCents = Math.round((taxableCents * taxRateBasisPoints) / 10000)`
- **Grand Total**: `totalCents = taxableCents + taxAmountCents`

## 5. Verification Step
After any schema or calculation update, run:
```bash
node scripts/run-all-tests.js
```

