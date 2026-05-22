const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const salt = bcrypt.genSaltSync(12);

const masters = [
  { email: 'master2@repair.shop', name: 'Олексій Ремонтник', phone: '+380632345678' },
  { email: 'master3@repair.shop', name: 'Ігор Технік', phone: '+380633456789' },
];

for (const m of masters) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(m.email);
  if (!exists) {
    const hash = bcrypt.hashSync('master123', salt);
    db.prepare('INSERT INTO users (id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), m.email, hash, 'employee', m.name, m.phone
    );
    console.log('Створено:', m.name, '-', m.email);
  } else {
    console.log('Вже існує:', m.email);
  }
}

// Розподіляємо замовлення між усіма трьома майстрами
const allMasters = db.prepare("SELECT id, name FROM users WHERE role = 'employee'").all();
const orders = db.prepare('SELECT id FROM repair_orders').all();

orders.forEach((order, i) => {
  const master = allMasters[i % allMasters.length];
  db.prepare('UPDATE repair_orders SET assigned_to = ? WHERE id = ?').run(master.id, order.id);
});

console.log(`Розподілено ${orders.length} замовлень між ${allMasters.length} майстрами:`);
allMasters.forEach(m => {
  const count = db.prepare('SELECT COUNT(*) as c FROM repair_orders WHERE assigned_to = ?').get(m.id);
  console.log(`  ${m.name}: ${count.c} замовлень`);
});
