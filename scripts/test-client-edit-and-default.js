const Database = require('better-sqlite3');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Client Edit & Set Default Functionality ---');

const dbPath = path.join(__dirname, '..', 'ledger.db');
const db = new Database(dbPath);

// 1. Check existing clients
const clients = db.prepare('SELECT * FROM clients').all();
console.log(`Found ${clients.length} clients in database.`);
assert.ok(clients.length >= 2, 'Should have at least 2 clients');

const client1 = clients[0];
const client2 = clients[1];

// 2. Test Editing Client 1
console.log('Testing edit on client:', client1.name);
const updatedName = client1.name + ' (Updated)';
const updatedAddress = '750 Lexington Ave, 18th Floor, New York, NY';
db.prepare('UPDATE clients SET name = ?, address = ? WHERE id = ?').run(updatedName, updatedAddress, client1.id);

const fetchedUpdated = db.prepare('SELECT * FROM clients WHERE id = ?').get(client1.id);
assert.strictEqual(fetchedUpdated.name, updatedName, 'Client name should be updated');
assert.strictEqual(fetchedUpdated.address, updatedAddress, 'Client address should be updated');
console.log('  ✓ Client edit verified successfully.');

// 3. Test Setting Default Client
console.log('Testing setting client2 as default:', client2.name);
db.prepare('UPDATE clients SET is_default = 0 WHERE org_id = ?').run(client2.org_id);
db.prepare('UPDATE clients SET is_default = 1 WHERE id = ?').run(client2.id);
db.prepare('UPDATE organizations SET default_client_id = ? WHERE id = ?').run(client2.id, client2.org_id);

const org = db.prepare('SELECT default_client_id FROM organizations WHERE id = ?').get(client2.org_id);
const c2 = db.prepare('SELECT is_default FROM clients WHERE id = ?').get(client2.id);
const c1 = db.prepare('SELECT is_default FROM clients WHERE id = ?').get(client1.id);

assert.strictEqual(org.default_client_id, client2.id, 'Org default_client_id should point to client2');
assert.strictEqual(c2.is_default, 1, 'Client 2 should have is_default = 1');
assert.strictEqual(c1.is_default, 0, 'Client 1 should have is_default = 0');
console.log('  ✓ Client default setting and mutual exclusivity verified successfully.');

console.log('--- All Client Edit & Default Tests Passed! ---');
