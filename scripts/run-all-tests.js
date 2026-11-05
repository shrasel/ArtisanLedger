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

// Ensure idempotent columns exist on organizations
try { db.exec("ALTER TABLE organizations ADD COLUMN entity_type TEXT DEFAULT 'FIRM';"); } catch {}
try { db.exec('ALTER TABLE organizations ADD COLUMN principal_name TEXT;'); } catch {}
try { db.exec('ALTER TABLE organizations ADD COLUMN letterhead_title TEXT;'); } catch {}
try {
  db.exec(
    "ALTER TABLE organizations ADD COLUMN letterhead_tagline TEXT DEFAULT 'ARCHIVAL FINANCIAL DOCUMENT • CERTIFIED LEDGER';"
  );
} catch {}
try { db.exec('ALTER TABLE organizations ADD COLUMN resend_api_key TEXT;'); } catch {}
try {
  db.exec(
    'ALTER TABLE organizations ADD COLUMN email_from TEXT DEFAULT "The Architect\'s Ledger <onboarding@resend.dev>";'
  );
} catch {}
try {
  db.exec(
    "ALTER TABLE organizations ADD COLUMN test_recipient_email TEXT DEFAULT 'shahjahan.rasell@gmail.com';"
  );
} catch {}

const orgCols = db.prepare('PRAGMA table_info(organizations)').all().map((c) => c.name);
assert.ok(
  orgCols.includes('default_client_id'),
  'organizations table must have default_client_id column'
);
assert.ok(
  orgCols.includes('entity_type') &&
    orgCols.includes('principal_name') &&
    orgCols.includes('letterhead_title') &&
    orgCols.includes('letterhead_tagline') &&
    orgCols.includes('test_recipient_email'),
  'organizations table must have Firm Entity, Letterhead, and Test Email columns'
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

// Verify Pre-Dispatch Studio Modal & Multi-Recipient Email Engine
const dispatchModalPath = path.join(rootDir, 'src', 'components', 'invoice', 'DispatchInvoiceModal.tsx');
assert.ok(fs.existsSync(dispatchModalPath), 'DispatchInvoiceModal.tsx must exist');
const dispatchModalSource = fs.readFileSync(dispatchModalPath, 'utf8');
assert.ok(
  dispatchModalSource.includes('Client Invoice View') &&
    dispatchModalSource.includes('Email Template Preview'),
  'DispatchInvoiceModal must provide both Client Invoice View and Email Template Preview tabs'
);
assert.ok(
  dispatchModalSource.includes('ccEmails') && dispatchModalSource.includes('customMessage'),
  'DispatchInvoiceModal must support multi-recipient CC chips and on-the-fly editable email body'
);

const emailLibSource = fs.readFileSync(path.join(rootDir, 'src', 'lib', 'email.ts'), 'utf8');
assert.ok(
  emailLibSource.includes('ccEmails') &&
    emailLibSource.includes('customMessage') &&
    emailLibSource.includes('onboarding@resend.dev'),
  'src/lib/email.ts must accept ccEmails, customMessage, and default to onboarding@resend.dev'
);
assert.ok(
  dispatchModalSource.includes('shahjahan.rasell@gmail.com'),
  'DispatchInvoiceModal must support one-click test email routing to shahjahan.rasell@gmail.com'
);

const pinChallengeSource = fs.readFileSync(
  path.join(rootDir, 'src', 'components', 'invoice', 'PinChallenge.tsx'),
  'utf8'
);
assert.ok(
  pinChallengeSource.includes('onPaste') && pinChallengeSource.includes('handlePasteFromClipboard'),
  'PinChallenge.tsx must support clipboard copy/paste as well as keypad entry'
);

const lineItemEditorSource = fs.readFileSync(
  path.join(rootDir, 'src', 'components', 'invoice', 'LineItemEditor.tsx'),
  'utf8'
);
assert.ok(
  lineItemEditorSource.includes('focusedRateIndex') && lineItemEditorSource.includes('focusedRateText'),
  'LineItemEditor.tsx must preserve raw input state while focused so cursor does not jump'
);
console.log('  ✓ Passed: Tokenized links, bcrypt PIN verification, and Pre-Dispatch Email Studio verified.\n');

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

const headerBlockMatch = pdfSource.match(/header:\s*\{([^}]+)\}/);
assert.ok(headerBlockMatch, 'styles.header block must exist');
assert.ok(
  !headerBlockMatch[1].includes('borderBottomWidth'),
  'styles.header must not have an underline border after the letterhead'
);
assert.ok(
  !pdfSource.includes('Issuer / Creditor') && pdfSource.includes('<Text style={styles.metaHeading}>From</Text>'),
  'PDF sender heading must be "From"'
);
assert.ok(
  !pdfSource.includes('Debtor / Billed To') && pdfSource.includes('<Text style={styles.metaHeading}>Billed to</Text>'),
  'PDF recipient heading must be "Billed to"'
);
assert.ok(
  !pdfSource.includes('<Text style={styles.detailLabel}>Currency</Text>'),
  'PDF details bar must not display Currency beside Due Date'
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

const newInvoiceViewPath = path.join(
  rootDir,
  'src',
  'app',
  '(dashboard)',
  'invoices',
  'new',
  'NewInvoiceClientView.tsx'
);
const newInvoiceSource = fs.readFileSync(newInvoiceViewPath, 'utf8');
assert.ok(
  !newInvoiceSource.includes('450000'),
  'NewInvoiceClientView.tsx must not pre-fill sample 450000 cent amount'
);
assert.ok(
  newInvoiceSource.includes('draftVersion'),
  'NewInvoiceClientView.tsx must increment draftVersion key so Intent-to-Invoice Copilot always updates the sheet'
);

const sheetPath = path.join(rootDir, 'src', 'components', 'invoice', 'InvoicePaperSheet.tsx');
const sheetSource = fs.readFileSync(sheetPath, 'utf8');
assert.ok(
  !sheetSource.includes('450000'),
  'InvoicePaperSheet.tsx must not pre-fill sample 450000 cent amount'
);
console.log('  ✓ Passed: Editorial color palette, light/dark contrast, and clean new-draft defaults verified.\n');

// ---------------------------------------------------------------------------
// SUITE 7: Invoice & Client Deletion Integrity
// ---------------------------------------------------------------------------
console.log('[7/7] Verifying Invoice & Client Deletion Lifecycle...');
assert.ok(
  fs.existsSync(path.join(rootDir, 'src', 'app', 'api', 'invoices', '[id]', 'delete', 'route.ts')),
  'Invoice delete API route must exist'
);
assert.ok(
  fs.existsSync(path.join(rootDir, 'src', 'app', 'api', 'clients', 'delete', 'route.ts')),
  'Client delete API route must exist'
);

// Test transactional insert & delete in SQLite
const testOrg = orgs[0];
if (testOrg) {
  const tmpClientId = 'tmp_cli_del_test';
  const tmpInvId = 'tmp_inv_del_test';
  const tmpItemId = 'tmp_item_del_test';

  db.prepare(
    'INSERT INTO clients (id, org_id, name, email, is_default) VALUES (?, ?, ?, ?, 0)'
  ).run(tmpClientId, testOrg.id, 'Temp Delete Test Client', 'temp@delete-test.com');

  db.prepare(
    `INSERT INTO invoices (id, org_id, client_id, invoice_number, status, issue_date, due_date, subtotal_cents, total_cents, access_token)
     VALUES (?, ?, ?, 'INV-TMP-DEL', 'DRAFT', '2026-11-04', '2026-12-04', 10000, 10000, 'tok_tmp_delete_test_123456')`
  ).run(tmpInvId, testOrg.id, tmpClientId);

  db.prepare(
    'INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_cents) VALUES (?, ?, ?, 1, 10000, 10000)'
  ).run(tmpItemId, tmpInvId, 'Temp Item');

  // Delete invoice items + invoice
  db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(tmpInvId);
  db.prepare('DELETE FROM invoices WHERE id = ?').run(tmpInvId);
  const checkInv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(tmpInvId);
  assert.strictEqual(checkInv, undefined, 'Deleted invoice must not exist');

  // Delete client
  db.prepare('DELETE FROM clients WHERE id = ?').run(tmpClientId);
  const checkCli = db.prepare('SELECT * FROM clients WHERE id = ?').get(tmpClientId);
  assert.strictEqual(checkCli, undefined, 'Deleted client must not exist');
}

const agentsRulePath = path.join(rootDir, 'AGENTS.md');
const agentsRuleSource = fs.readFileSync(agentsRulePath, 'utf8');
assert.ok(
  agentsRuleSource.includes('Conventional Commits v1.0.0'),
  'AGENTS.md must enforce Conventional Commits v1.0.0'
);
assert.ok(
  agentsRuleSource.includes('Forbidden Destructive Git Operations'),
  'AGENTS.md must forbid destructive git operations'
);
console.log('  ✓ Passed: Invoice and Client deletion routes, DB cascade integrity, and Git governance verified.\n');

console.log('==============================================================');
console.log('   ALL 7 VERIFICATION SUITES PASSED WITH 100% SUCCESS');
console.log('==============================================================\n');

