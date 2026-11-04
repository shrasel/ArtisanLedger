const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'ledger.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

console.log('--- Seeding The Architect\'s Ledger (Direct SQLite) ---');

// Check existing user
let user = db.prepare('SELECT * FROM users WHERE email = ?').get('architect@ledger.com');
if (!user) {
  const userId = 'usr_' + Math.random().toString(36).substring(2, 12);
  const passwordHash = bcrypt.hashSync('architect123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name)
    VALUES (?, ?, ?, ?)
  `).run(userId, 'architect@ledger.com', passwordHash, 'Marcus Vance, AIA');
  user = { id: userId };
  console.log('Created user: architect@ledger.com (password: architect123)');
} else {
  console.log('Found existing user: architect@ledger.com');
}

// Check existing org
let org = db.prepare('SELECT * FROM organizations WHERE user_id = ?').get(user.id);
if (!org) {
  const orgId = 'org_' + Math.random().toString(36).substring(2, 12);
  db.prepare(`
    INSERT INTO organizations (
      id, user_id, company_name, tax_id, email, phone, address_line, city, state, postal_code, country,
      default_currency, default_terms, invoice_prefix, next_invoice_number, default_tax_rate_basis_points,
      bank_name, account_holder_name, routing_number, account_number, swift_bic, payment_notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    orgId,
    user.id,
    'Atelier Vance Architects',
    '12-9847291',
    'billing@ateliervance.com',
    '+1 (212) 555-0188',
    '740 Broadway, 12th Floor',
    'New York',
    'NY',
    '10003',
    'US',
    'USD',
    'NET_30',
    'INV-',
    1004,
    825, // 8.25%
    'J.P. Morgan Chase & Co.',
    'Atelier Vance Architecture LLC',
    '021000021',
    '8821094412',
    'CHASUS33',
    'Remit wire reference INV-xxxx on transfer memo'
  );
  org = { id: orgId };
  console.log('Created organization: Atelier Vance Architects');
} else {
  console.log('Found existing organization:', org.company_name);
}

// Check clients
let client1 = db.prepare('SELECT * FROM clients WHERE org_id = ? AND email = ?').get(org.id, 'sjenkins@metrostudio.com');
if (!client1) {
  const c1Id = 'cli_metro_' + Math.random().toString(36).substring(2, 8);
  db.prepare(`
    INSERT INTO clients (id, org_id, name, company_name, email, address, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    c1Id,
    org.id,
    'Sarah Jenkins',
    'Metro Studio Architecture',
    'sjenkins@metrostudio.com',
    '450 Broadway, Suite 800, New York, NY 10013',
    '+1 (212) 555-0144'
  );
  client1 = { id: c1Id };
  console.log('Created client: Metro Studio Architecture');
}

let client2 = db.prepare('SELECT * FROM clients WHERE org_id = ? AND email = ?').get(org.id, 'dsterling@sterlingcorp.com');
if (!client2) {
  const c2Id = 'cli_sterling_' + Math.random().toString(36).substring(2, 8);
  db.prepare(`
    INSERT INTO clients (id, org_id, name, company_name, email, address, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    c2Id,
    org.id,
    'David Sterling',
    'Sterling Engineering Associates',
    'dsterling@sterlingcorp.com',
    '100 Wall Street, 24th Fl, New York, NY 10005',
    '+1 (212) 555-0812'
  );
  client2 = { id: c2Id };
  console.log('Created client: Sterling Engineering Associates');
}

// Invoices
const existingInvs = db.prepare('SELECT count(*) as count FROM invoices WHERE org_id = ?').get(org.id);
if (existingInvs.count === 0) {
  const pin1 = '482910';
  const hashedPin1 = bcrypt.hashSync(pin1, 10);
  const inv1Id = 'inv_1001';

  db.prepare(`
    INSERT INTO invoices (
      id, org_id, client_id, invoice_number, status, issue_date, due_date, currency,
      subtotal_cents, discount_cents, tax_rate_basis_points, tax_amount_cents, total_cents,
      notes, terms_conditions, access_token, access_passcode, sent_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `).run(
    inv1Id,
    org.id,
    client1.id,
    'INV-1001',
    'SENT',
    '2026-11-01',
    '2026-12-01',
    'USD',
    1090000,
    0,
    825,
    89925,
    1179925,
    'Payment requested via Fedwire or ACH. Thank you for your continued partnership.',
    'Net 30 days. Late remittances accrue 1.5% monthly finance charge.',
    'token-arch-exemplar-metro-2026',
    hashedPin1,
    '2026-11-01T10:00:00Z'
  );

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'itm_1',
    inv1Id,
    'Schematic Architectural Design & Spatial Volume Study',
    1,
    850000,
    850000,
    0
  );

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'itm_2',
    inv1Id,
    'Structural BIM & CAD Drafting Support (16 hours @ $150/hr)',
    16,
    15000,
    240000,
    1
  );

  // Invoice 2: Certified Paid
  const inv2Id = 'inv_1002';
  const hashedPin2 = bcrypt.hashSync('193820', 10);

  db.prepare(`
    INSERT INTO invoices (
      id, org_id, client_id, invoice_number, status, issue_date, due_date, currency,
      subtotal_cents, discount_cents, tax_rate_basis_points, tax_amount_cents, total_cents,
      notes, terms_conditions, access_token, access_passcode, last_viewed_at, sent_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    inv2Id,
    org.id,
    client2.id,
    'INV-1002',
    'PAID',
    '2026-10-15',
    '2026-11-15',
    'USD',
    620000,
    20000,
    0,
    0,
    600000,
    'Certified payment cleared via direct Fedwire wire transfer.',
    'Net 30 payment terms apply.',
    'token-arch-exemplar-sterling-2026',
    hashedPin2,
    '2026-10-20T14:22:00Z',
    '2026-10-15T09:00:00Z'
  );

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'itm_3',
    inv2Id,
    'Feasibility Assessment & Zoning Analysis (Midtown Parcel)',
    1,
    620000,
    620000,
    0
  );

  // Invoice 3: Draft
  const inv3Id = 'inv_1003';
  db.prepare(`
    INSERT INTO invoices (
      id, org_id, client_id, invoice_number, status, issue_date, due_date, currency,
      subtotal_cents, discount_cents, tax_rate_basis_points, tax_amount_cents, total_cents,
      notes, terms_conditions, access_token, access_passcode
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    inv3Id,
    org.id,
    client1.id,
    'INV-1003',
    'DRAFT',
    '2026-11-03',
    '2026-12-03',
    'USD',
    350000,
    0,
    825,
    28875,
    378875,
    'Initial drafting stage for review.',
    'Net 30 days upon final dispatch.',
    'token-arch-draft-sample-2026',
    null
  );

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'itm_4',
    inv3Id,
    'Phase 2: Construction Documents & Detailed Elevation Specs',
    1,
    350000,
    350000,
    0
  );

  console.log('Seeded 3 sample invoices:');
  console.log('  1. INV-1001 (SENT, PIN 482910, Token token-arch-exemplar-metro-2026)');
  console.log('  2. INV-1002 (PAID, PIN 193820, Token token-arch-exemplar-sterling-2026)');
  console.log('  3. INV-1003 (DRAFT)');
}

console.log('--- Seed Completed Successfully ---');

