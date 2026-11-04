const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

async function testPin() {
  const dbPath = path.join(__dirname, '..', 'ledger.db');
  const db = new Database(dbPath);

  const inv = db.prepare('SELECT * FROM invoices WHERE access_token = ?').get('token-arch-exemplar-metro-2026');
  console.log('Invoice found:', inv.invoice_number);
  console.log('Status before:', inv.status);

  // Check correct PIN
  const isMatch = bcrypt.compareSync('482910', inv.access_passcode);
  console.log('PIN 482910 matches hashed passcode:', isMatch);

  // Check wrong PIN
  const isWrongMatch = bcrypt.compareSync('111111', inv.access_passcode);
  console.log('PIN 111111 matches (should be false):', isWrongMatch);
}

testPin();
