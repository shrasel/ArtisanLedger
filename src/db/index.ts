import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'ledger.db');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Global cached connection for Next.js hot-reloading in development
declare global {
  // eslint-disable-next-line no-var
  var _sqliteDb: Database.Database | undefined;
}

const sqlite = global._sqliteDb || new Database(dbPath, { timeout: 10000 });
if (process.env.NODE_ENV !== 'production') {
  global._sqliteDb = sqlite;
}

// Enable WAL mode, busy timeout, foreign keys as required by principles
sqlite.pragma('busy_timeout = 10000');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Initialize database tables if not already present
try {
  const tableCheck = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();

  if (!tableCheck) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
      );

      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name TEXT NOT NULL,
        logo_url TEXT,
        tax_id TEXT,
        email TEXT,
        phone TEXT,
        address_line TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'US',
        bank_name TEXT,
        account_holder_name TEXT,
        routing_number TEXT,
        account_number TEXT,
        swift_bic TEXT,
        payment_notes TEXT,
        default_currency TEXT DEFAULT 'USD',
        default_terms TEXT DEFAULT 'NET_30',
        default_custom_terms_days INTEGER DEFAULT 14,
        default_client_id TEXT,
        invoice_prefix TEXT DEFAULT 'INV-',
        next_invoice_number INTEGER DEFAULT 1001,
        default_tax_rate_basis_points INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        company_name TEXT,
        email TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL REFERENCES clients(id),
        invoice_number TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        currency TEXT DEFAULT 'USD',
        subtotal_cents INTEGER NOT NULL DEFAULT 0,
        discount_cents INTEGER DEFAULT 0,
        tax_rate_basis_points INTEGER DEFAULT 0,
        tax_amount_cents INTEGER DEFAULT 0,
        total_cents INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        terms_conditions TEXT,
        access_token TEXT NOT NULL UNIQUE,
        access_passcode TEXT,
        last_viewed_at TEXT,
        sent_at TEXT,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price_cents INTEGER NOT NULL DEFAULT 0,
        total_cents INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_token ON invoices(access_token);
      CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id);
      CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);
      CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);
    `);
  }
  // Safe idempotent column additions for existing installations
  try {
    sqlite.exec('ALTER TABLE clients ADD COLUMN is_default INTEGER DEFAULT 0;');
  } catch {}
  try {
    sqlite.exec('ALTER TABLE organizations ADD COLUMN default_client_id TEXT;');
  } catch {}
  try {
    sqlite.exec("ALTER TABLE organizations ADD COLUMN entity_type TEXT DEFAULT 'FIRM';");
  } catch {}
  try {
    sqlite.exec('ALTER TABLE organizations ADD COLUMN principal_name TEXT;');
  } catch {}
  try {
    sqlite.exec('ALTER TABLE organizations ADD COLUMN letterhead_title TEXT;');
  } catch {}
  try {
    sqlite.exec(
      "ALTER TABLE organizations ADD COLUMN letterhead_tagline TEXT DEFAULT 'ARCHIVAL FINANCIAL DOCUMENT • CERTIFIED LEDGER';"
    );
  } catch {}
  try {
    sqlite.exec('ALTER TABLE organizations ADD COLUMN resend_api_key TEXT;');
  } catch {}
  try {
    sqlite.exec(
      'ALTER TABLE organizations ADD COLUMN email_from TEXT DEFAULT "The Architect\'s Ledger <onboarding@resend.dev>";'
    );
  } catch {}
  try {
    sqlite.exec(
      "ALTER TABLE organizations ADD COLUMN test_recipient_email TEXT DEFAULT 'shahjahan.rasell@gmail.com';"
    );
  } catch {}
  try {
    sqlite.exec(
      'ALTER TABLE organizations ADD COLUMN default_custom_terms_days INTEGER DEFAULT 14;'
    );
  } catch {}
  try {
    sqlite.exec(
      "ALTER TABLE organizations ADD COLUMN email_delivery_provider TEXT DEFAULT 'RESEND';"
    );
  } catch {}
  try {
    sqlite.exec('ALTER TABLE organizations ADD COLUMN smtp_user TEXT;');
  } catch {}
  try {
    sqlite.exec('ALTER TABLE organizations ADD COLUMN smtp_pass TEXT;');
  } catch {}
} catch (err: any) {
  if (err?.code !== 'SQLITE_BUSY') {
    console.error('Database init warning:', err);
  }
}

export const db = drizzle(sqlite, { schema });
export { sqlite };
