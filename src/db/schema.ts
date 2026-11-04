import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  logoUrl: text('logo_url'),
  taxId: text('tax_id'),
  email: text('email'),
  phone: text('phone'),
  addressLine: text('address_line'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country').default('US'),
  
  // Banking & Wire details
  bankName: text('bank_name'),
  accountHolderName: text('account_holder_name'),
  routingNumber: text('routing_number'),
  accountNumber: text('account_number'),
  swiftBic: text('swift_bic'),
  paymentNotes: text('payment_notes'),

  // Invoice Defaults
  defaultCurrency: text('default_currency').default('USD'),
  defaultTerms: text('default_terms').default('NET_30'), // DUE_ON_RECEIPT, NET_15, NET_30
  invoicePrefix: text('invoice_prefix').default('INV-'),
  nextInvoiceNumber: integer('next_invoice_number').default(1001),
  defaultTaxRateBasisPoints: integer('default_tax_rate_basis_points').default(0),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  companyName: text('company_name'),
  email: text('email').notNull(),
  address: text('address'),
  phone: text('phone'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id),
  invoiceNumber: text('invoice_number').notNull(),
  status: text('status', { enum: ['DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID'] }).default('DRAFT'),
  issueDate: text('issue_date').notNull(), // YYYY-MM-DD
  dueDate: text('due_date').notNull(),     // YYYY-MM-DD
  currency: text('currency').default('USD'),

  // Financial values in Cents
  subtotalCents: integer('subtotal_cents').notNull().default(0),
  discountCents: integer('discount_cents').default(0),
  taxRateBasisPoints: integer('tax_rate_basis_points').default(0),
  taxAmountCents: integer('tax_amount_cents').default(0),
  totalCents: integer('total_cents').notNull().default(0),

  notes: text('notes'),
  termsConditions: text('terms_conditions'),

  // Security & Portal Access
  accessToken: text('access_token').notNull().unique(), // Secure nanoid token
  accessPasscode: text('access_passcode'),             // Scrypt or bcrypt hashed 4-6 digit PIN
  lastViewedAt: text('last_viewed_at'),
  sentAt: text('sent_at'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPriceCents: integer('unit_price_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull().default(0),
  sortOrder: integer('sort_order').default(0),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

