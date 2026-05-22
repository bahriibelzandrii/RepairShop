const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('Початок міграції БД...');

try {
  // Додаємо колонку assigned_to, якщо вона ще не існує
  const columns = db.prepare("PRAGMA table_info(repair_orders)").all();
  const hasAssignedTo = columns.some(c => c.name === 'assigned_to');
  
  if (!hasAssignedTo) {
    db.exec(`ALTER TABLE repair_orders ADD COLUMN assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL`);
    console.log('Колонка assigned_to додана до repair_orders.');
  }

  // Створюємо тестового майстра, якщо його немає
  const employeeExists = db.prepare("SELECT id FROM users WHERE role = 'employee' LIMIT 1").get();
  
  if (!employeeExists) {
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync('master123', salt);
    const empId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(empId, 'master@repair.shop', hash, 'employee', 'Василь Майстренко', '+380631234567');
    console.log('Тестовий майстер створений: master@repair.shop / master123');

    // Призначаємо йому кілька рандомних замовлень
    db.prepare(`
      UPDATE repair_orders 
      SET assigned_to = ? 
      WHERE id IN (SELECT id FROM repair_orders LIMIT 5)
    `).run(empId);
    console.log('Кілька замовлень призначено новому майстру.');
  }

  console.log('Міграція завершена.');
} catch (error) {
  console.error('Помилка міграції:', error);
}
