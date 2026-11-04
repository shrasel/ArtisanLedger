const { SignJWT } = require('jose');

async function testAuthenticatedDraft() {
  const SESSION_SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || 'the-architects-ledger-super-secret-key-archival-2026'
  );

  // Get user ID from database
  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.join(__dirname, '..', 'ledger.db'));
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get('architect@ledger.com');

  const jwt = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET);

  const res = await fetch('http://localhost:3005/api/agent/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `arch_session=${jwt}`,
    },
    body: JSON.stringify({
      prompt: 'Bill Sarah Jenkins at Metro Studio $8,500 for Masterplan Schematics and 14 hrs CAD drafting at $150/hr, Net 15',
    }),
  });

  console.log('Status with auth cookie (expected 200):', res.status);
  const data = await res.json();
  console.log('Parsed Copilot Output:');
  console.log(JSON.stringify(data, null, 2));
}

testAuthenticatedDraft();
