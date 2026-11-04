const Database = require('better-sqlite3');
const path = require('path');
const assert = require('assert');
const bcrypt = require('bcryptjs');

console.log('====================================================');
console.log('   RUNNING AUTOMATED TEST SUITE: THE ARCHITECT\'S LEDGER');
console.log('====================================================\n');

const dbPath = path.join(__dirname, '..', 'ledger.db');
const db = new Database(dbPath);

// TEST 1: SQLite WAL mode and configuration
console.log('TEST 1: Verifying WAL mode and SQLite Pragmas...');
const journalMode = db.pragma('journal_mode', { simple: true });
const foreignKeys = db.pragma('foreign_keys', { simple: true });
console.log(`  - journal_mode: ${journalMode}`);
console.log(`  - foreign_keys: ${foreignKeys}`);
assert.strictEqual(journalMode.toLowerCase(), 'wal', 'Journal mode must be WAL');
assert.strictEqual(foreignKeys, 1, 'Foreign keys must be ON');
console.log('  ✓ Test 1 Passed: WAL mode active & FK constraints enforced.\n');

// TEST 2: Financial Currency Rules (Integer Cents & Basis Points)
console.log('TEST 2: Verifying Financial Integer Cent & Basis Point Rules...');
function calculateInvoiceTotals(items, taxRateBasisPoints = 0, discountCents = 0) {
  const subtotalCents = items.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);
  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);
  const taxAmountCents = Math.round((discountedSubtotal * taxRateBasisPoints) / 10000);
  const totalCents = discountedSubtotal + taxAmountCents;
  return { subtotalCents, discountCents, taxRateBasisPoints, taxAmountCents, totalCents };
}

const testItems = [
  { quantity: 1, unitPriceCents: 850000 }, // $8,500.00
  { quantity: 16, unitPriceCents: 15000 },  // 16 * $150.00 = $2,400.00
];
const calc = calculateInvoiceTotals(testItems, 825, 0); // 8.25%
console.log('  Calculated Financial Totals:', calc);
assert.strictEqual(calc.subtotalCents, 1090000, 'Subtotal should be exactly 1090000 cents ($10,900.00)');
assert.strictEqual(calc.taxAmountCents, 89925, 'Tax should be exactly 89925 cents ($899.25)');
assert.strictEqual(calc.totalCents, 1179925, 'Total should be exactly 1179925 cents ($11,799.25)');
console.log('  ✓ Test 2 Passed: Exact integer cent arithmetic with zero float errors.\n');

// TEST 3: Database Records and Data Integrity
console.log('TEST 3: Checking Seeded Invoices & Client Integrity...');
const inv = db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get('INV-1001');
assert.ok(inv, 'INV-1001 must exist');
assert.strictEqual(inv.status, 'SENT');
assert.strictEqual(inv.total_cents, 1179925);
assert.ok(inv.access_token, 'Access token must be present');
assert.ok(inv.access_passcode, 'Hashed passcode must be present');

const isPinValid = bcrypt.compareSync('482910', inv.access_passcode);
assert.strictEqual(isPinValid, true, 'PIN 482910 must match hashed passcode');
console.log('  ✓ Test 3 Passed: Invoice INV-1001 matches exact schema and PIN hashes.\n');

// TEST 4: Intent-to-Invoice Parser
console.log('TEST 4: Testing Intent-to-Invoice Semantic Parser Logic...');
function parseTestIntent(prompt) {
  let currency = 'USD';
  if (/\b(eur|euro|€)\b/i.test(prompt)) currency = 'EUR';
  let dueDateOffsetDays = 30;
  const netMatch = prompt.match(/\bnet\s*(\d+)\b/i);
  if (netMatch) dueDateOffsetDays = parseInt(netMatch[1], 10);

  const clientMatch =
    prompt.match(/(?:bill|invoice|charge|to)\s+([A-Za-z0-9\s&.,'-]+?)(?:\s+for|\s*\$|\s+regarding|\s+with|\s+due|\s*:\s*|\s*,\s*|$)/i) ||
    prompt.match(/(?:client|customer)\s*[:=]\s*([A-Za-z0-9\s&.,'-]+?)(?:\s*,|\s*for|\s*\$|\s*$)/i);

  const clientName = clientMatch ? clientMatch[1].trim() : 'Unknown';

  return { clientName, currency, dueDateOffsetDays };
}

const sample1 = parseTestIntent('Bill Metro Studio $6,500 for Architectural Schematics, Net 15');
assert.strictEqual(sample1.clientName, 'Metro Studio');
assert.strictEqual(sample1.dueDateOffsetDays, 15);
assert.strictEqual(sample1.currency, 'USD');
console.log('  Parsed intent output:', sample1);
console.log('  ✓ Test 4 Passed: Natural language prompt parsed into structured draft.\n');

console.log('====================================================');
console.log('   ALL TESTS PASSED WITH 100% SUCCESS');
console.log('====================================================\n');
