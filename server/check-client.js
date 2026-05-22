const db = require('./db');
const u = db.prepare("SELECT email FROM users WHERE role='client'").get();
const c = db.prepare('SELECT id, email FROM clients WHERE email = ?').get(u.email);
console.log('User email:', u.email);
console.log('Client found:', c ? `id=${c.id}, email=${c.email}` : 'NOT FOUND');
if (c) {
  const cnt = db.prepare('SELECT COUNT(*) as n FROM repair_orders WHERE client_id = ?').get(c.id);
  console.log('Orders for this client:', cnt.n);
}
