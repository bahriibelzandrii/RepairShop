const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 1. Створюємо тестового клієнта-користувача
const testClient = db.prepare("SELECT id, email FROM clients WHERE email IS NOT NULL AND email != '' LIMIT 1").get();
if (testClient) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(testClient.email);
  if (!existing) {
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync('client123', salt);
    db.prepare('INSERT INTO users (id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), testClient.email, hash, 'client', 'Тестовий Клієнт', '+380991234567'
    );
    console.log('Клієнт-користувач створений:', testClient.email, '/ client123');
  } else {
    console.log('Клієнт-користувач вже існує:', testClient.email);
  }
} else {
  console.log('Клієнтів з email не знайдено');
}

// 2. Призначаємо більше замовлень майстру
const master = db.prepare("SELECT id FROM users WHERE role = 'employee' LIMIT 1").get();
if (master) {
  const unassigned = db.prepare('SELECT id FROM repair_orders WHERE assigned_to IS NULL LIMIT 15').all();
  for (const o of unassigned) {
    db.prepare('UPDATE repair_orders SET assigned_to = ? WHERE id = ?').run(master.id, o.id);
  }
  console.log('Призначено', unassigned.length, 'замовлень майстру');
} else {
  console.log('Майстра не знайдено');
}

console.log('Готово!');
