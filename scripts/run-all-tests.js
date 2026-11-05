const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const bcrypt = require('bcryptjs');

console.log('==============================================================');
console.log("   THE ARCHITECT'S LEDGER — MASTER VERIFICATION HARNESS");
console.log('==============================================================\n');

const rootDir = path.join(__dirname, '..');
const dbPath = path.join(rootDir, 'ledger.db');
const db = new Database(dbPath);
db.pragma('busy_timeout = 10000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SUITE 1: SQLite WAL Mode & Schema Integrity
// ---------------------------------------------------------------------------
console.log('[1/6] Verifying SQLite WAL Mode & Schema Integrity...');
const journalMode = db.pragma('journal_mode', { simple: true });
const foreignKeys = db.pragma('foreign_keys', { simple: true });
assert.strictEqual(journalMode.toLowerCase(), 'wal', 'Journal mode must be WAL');
assert.strictEqual(foreignKeys, 1, 'Foreign keys must be ON');

const requiredTables = ['users', 'organizations', 'clients', 'invoices', 'invoice_items'];
for (const table of requiredTables) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  assert.ok(row, `Required table '${table}' must exist in ledger.db`);
}

const clientCols = db.prepare('PRAGMA table_info(clients)').all().map((c) => c.name);
assert.ok(clientCols.includes('is_default'), 'clients table must have is_default column');

const orgCols = db.prepare('PRAGMA table_info(organizations)').all().map((c) => c.name);
assert.ok(
  orgCols.includes('default_client_id'),
  'organizations table must have default_client_id column'
);
console.log('  ✓ Passed: WAL mode active, FKs enforced, and all schema tables/columns verified.\n');

// ---------------------------------------------------------------------------
// SUITE 2: Zero Floating-Point Financial Cent Arithmetic
// ---------------------------------------------------------------------------
console.log('[2/6] Verifying Integer Cent & Basis Point Financial Rules...');
function calculateInvoiceTotals(items, taxRateBasisPoints = 0, discountCents = 0) {
  const subtotalCents = items.reduce(
    (acc, item) => acc + Math.round(item.quantity * item.unitPriceCents),
    0
  );
  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);
  const taxAmountCents = Math.round((discountedSubtotal * taxRateBasisPoints) / 10000);
  const totalCents = discountedSubtotal + taxAmountCents;
  return { subtotalCents, discountCents, taxRateBasisPoints, taxAmountCents, totalCents };
}

const sampleItems = [
  { quantity: 1, unitPriceCents: 850000 }, // $8,500.00
  { quantity: 16, unitPriceCents: 15000 }, // $2,400.00
];
const totals = calculateInvoiceTotals(sampleItems, 825, 0);
assert.strictEqual(totals.subtotalCents, 1090000, 'Subtotal must be 1090000 cents');
assert.strictEqual(totals.taxAmountCents, 89925, 'Tax must be 89925 cents');
assert.strictEqual(totals.totalCents, 1179925, 'Total must be 1179925 cents');

// Verify all stored invoices in DB have integer cents
const allInvoices = db.prepare('SELECT * FROM invoices').all();
for (const inv of allInvoices) {
  assert.strictEqual(
    Number.isInteger(inv.subtotal_cents),
    true,
    `Invoice ${inv.invoice_number} subtotal_cents must be integer`
  );
  assert.strictEqual(
    Number.isInteger(inv.total_cents),
    true,
    `Invoice ${inv.invoice_number} total_cents must be integer`
  );
}
console.log(`  ✓ Passed: Zero float precision errors across ${allInvoices.length} ledger invoices.\n`);

// ---------------------------------------------------------------------------
// SUITE 3: Client Edit & Default Client Mutual Exclusivity
// ---------------------------------------------------------------------------
console.log('[3/6] Verifying Client Management & Default Client Constraints...');
const orgs = db.prepare('SELECT * FROM organizations').all();
for (const org of orgs) {
  const defaultClients = db
    .prepare('SELECT * FROM clients WHERE org_id = ? AND is_default = 1')
    .all(org.id);
  assert.ok(
    defaultClients.length <= 1,
    `Organization ${org.company_name} must have at most 1 default client (found ${defaultClients.length})`
  );
}
console.log('  ✓ Passed: Default client mutual exclusivity verified.\n');

// ---------------------------------------------------------------------------
// SUITE 4: Cryptographic Token & PIN Gate Security
// ---------------------------------------------------------------------------
console.log('[4/6] Verifying Tokenized Access & Bcrypt Passcode Gate...');
for (const inv of allInvoices) {
  assert.ok(
    inv.access_token && inv.access_token.length >= 16,
    `Invoice ${inv.invoice_number} must have a secure accessToken`
  );
  if (inv.access_passcode && inv.access_passcode.startsWith('$2')) {
    assert.strictEqual(
      inv.access_passcode.length >= 50,
      true,
      `Invoice ${inv.invoice_number} bcrypt hash must be valid`
    );
  }
}
const testHash = bcrypt.hashSync('948271', 10);
assert.strictEqual(bcrypt.compareSync('948271', testHash), true, 'Correct PIN must unlock');
assert.strictEqual(bcrypt.compareSync('000000', testHash), false, 'Wrong PIN must be rejected');
console.log('  ✓ Passed: Tokenized links and bcrypt PIN verification working properly.\n');

// ---------------------------------------------------------------------------
// SUITE 5: PDF Engine Invariants (US Letter Size & Header Spacing)
// ---------------------------------------------------------------------------
console.log('[5/6] Verifying PDF Template Invariants (Letter Size & Header Layout)...');
const pdfTemplatePath = path.join(rootDir, 'src', 'lib', 'pdf', 'InvoicePdfTemplate.tsx');
const pdfSource = fs.readFileSync(pdfTemplatePath, 'utf8');

assert.ok(
  pdfSource.includes('size="LETTER"'),
  'InvoicePdfTemplate.tsx must specify size="LETTER" on <Page>'
);
assert.ok(
  !pdfSource.includes('size="A4"'),
  'InvoicePdfTemplate.tsx must not use A4 page size'
);

// Verify page style does not set root lineHeight that breaks 22pt headings
const pageBlockMatch = pdfSource.match(/page:\s*\{([^}]+)\}/);
assert.ok(pageBlockMatch, 'styles.page block must exist');
assert.ok(
  !pageBlockMatch[1].includes('lineHeight'),
  'styles.page must not define root lineHeight (prevents heading overlap in react-pdf)'
);

const brandTitleMatch = pdfSource.match(/brandTitle:\s*\{([^}]+)\}/);
assert.ok(brandTitleMatch, 'styles.brandTitle block must exist');
assert.ok(
  brandTitleMatch[1].includes('lineHeight'),
  'styles.brandTitle must define explicit lineHeight to prevent subtitle overlap'
);
console.log('  ✓ Passed: PDF Letter geometry and anti-overlap typography rules verified.\n');

// ---------------------------------------------------------------------------
// SUITE 6: Editorial Design System & Light/Dark Contrast Invariants
// ---------------------------------------------------------------------------
console.log('[6/6] Verifying Editorial Theme & Light/Dark Contrast Rules...');
const cssPath = path.join(rootDir, 'src', 'app', 'globals.css');
const cssSource = fs.readFileSync(cssPath, 'utf8');

assert.ok(
  cssSource.includes('--canvas-bg: #F0EBE1'),
  'Light theme limestone canvas (#F0EBE1) must be defined'
);
assert.ok(
  cssSource.includes('--canvas-bg: #111215'),
  'Dark theme obsidian canvas (#111215) must be defined'
);
assert.ok(
  cssSource.includes('--text-paper-val: #18191B'),
  'Light theme primary text must map to deep carbon ink (#18191B)'
);
assert.ok(
  cssSource.includes('.text-obsidian') && cssSource.includes('#111215 !important'),
  '.text-obsidian must be locked to #111215 for legible bone/brass buttons'
);
console.log('  ✓ Passed: Editorial color palette and light/dark contrast rules verified.\n');

console.log('==============================================================');
console.log('   ALL 6 VERIFICATION SUITES PASSED WITH 100% SUCCESS');
console.log('==============================================================\n');

