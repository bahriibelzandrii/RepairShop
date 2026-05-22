const db = require('./db');
const { v4: uuidv4 } = require('uuid');

console.log('Початок генерації тестових даних...');

// Функція для отримання випадкового елемента масиву
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Отримуємо ID адміна
let admin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!admin) {
  console.log('Адміна не знайдено, переривання.');
  process.exit(1);
}

const adminId = admin.id;

// 1. Інвентар (Послуги, Деталі, Аксесуари)
const inventoryItems = [
  { name: 'Діагностика ноутбука', sku: 'SRV-001', category: 'service', price: 300 },
  { name: 'Діагностика телефона', sku: 'SRV-002', category: 'service', price: 200 },
  { name: 'Заміна екрану (робота)', sku: 'SRV-003', category: 'service', price: 800 },
  { name: 'Чистка від пилу', sku: 'SRV-004', category: 'service', price: 500 },
  { name: 'Встановлення Windows', sku: 'SRV-005', category: 'service', price: 400 },
  { name: 'Екран iPhone 13 Pro', sku: 'PART-001', category: 'part', price: 4500, stock_quantity: 5, min_stock: 2 },
  { name: 'Акумулятор MacBook Air M1', sku: 'PART-002', category: 'part', price: 3200, stock_quantity: 3, min_stock: 2 },
  { name: 'SSD Samsung 980 1TB', sku: 'PART-003', category: 'part', price: 2800, stock_quantity: 10, min_stock: 3 },
  { name: 'Термопаста Arctic MX-4', sku: 'PART-004', category: 'part', price: 250, stock_quantity: 40, min_stock: 10 },
  { name: 'Клавіатура Lenovo ThinkPad', sku: 'PART-005', category: 'part', price: 1500, stock_quantity: 2, min_stock: 1 },
  { name: 'Кабель Type-C', sku: 'ACC-001', category: 'accessory', price: 300, stock_quantity: 50, min_stock: 10 },
  { name: 'Захисне скло iPhone', sku: 'ACC-002', category: 'accessory', price: 400, stock_quantity: 30, min_stock: 5 }
];

const dbInventory = [];
db.transaction(() => {
  for (const item of inventoryItems) {
    const id = uuidv4();
    db.prepare(`
      INSERT OR IGNORE INTO inventory (id, name, sku, category, price, stock_quantity, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, item.name, item.sku, item.category, item.price, item.stock_quantity || 0, item.min_stock || 0);
    dbInventory.push({ id, ...item });
  }
})();
console.log('Інвентар згенеровано.');

// 2. Клієнти
const firstNames = ['Олександр', 'Марія', 'Андрій', 'Ірина', 'Дмитро', 'Олена', 'Сергій', 'Наталія', 'Максим', 'Юлія'];
const lastNames = ['Петренко', 'Іванова', 'Коваленко', 'Мельник', 'Шевченко', 'Бойко', 'Ткаченко', 'Кравченко', 'Олійник', 'Поліщук'];
const clients = [];

db.transaction(() => {
  for (let i = 0; i < 20; i++) {
    const id = uuidv4();
    const fn = random(firstNames);
    const ln = random(lastNames);
    db.prepare(`
      INSERT INTO clients (id, first_name, last_name, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, fn, ln, `+380${randomInt(500000000, 999999999)}`, `client${i}@test.com`, `м. Київ, вул. ${fn} ${randomInt(1, 100)}`, 'Тестовий клієнт');
    clients.push(id);
  }
})();
console.log('Клієнти згенеровані.');

// 3. Пристрої
const brands = [
  { b: 'Apple', m: ['iPhone 13', 'MacBook Pro M1', 'iPad Air', 'iPhone 11', 'MacBook Air M2'] },
  { b: 'Samsung', m: ['Galaxy S22', 'Galaxy A54', 'Galaxy Tab S8', 'Galaxy S23 Ultra'] },
  { b: 'Lenovo', m: ['ThinkPad T14', 'IdeaPad 5', 'Legion 5'] },
  { b: 'Asus', m: ['ROG Strix', 'ZenBook 14', 'TUF Gaming'] }
];
const devices = [];

db.transaction(() => {
  for (let i = 0; i < 35; i++) {
    const id = uuidv4();
    const brandObj = random(brands);
    const brand = brandObj.b;
    const model = random(brandObj.m);
    const clientId = random(clients);
    
    db.prepare(`
      INSERT INTO devices (id, serial_or_model, brand, model, color, client_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, `SN-${randomInt(1000, 9999)}-${randomInt(100, 999)}`, brand, model, random(['Чорний', 'Білий', 'Сірий', 'Синій']), clientId);
    devices.push({ id, client_id: clientId });
  }
})();
console.log('Пристрої згенеровані.');

// 4. Замовлення, Елементи та Платежі
const statuses = ['received', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'delivered', 'cancelled'];
const methods = ['cash', 'card', 'transfer'];

db.transaction(() => {
  for (let i = 0; i < 40; i++) {
    const orderId = uuidv4();
    const dev = random(devices);
    const status = random(statuses);
    
    const date = new Date();
    date.setDate(date.getDate() - randomInt(1, 30));
    const created_at = date.toISOString();

    const orderNumber = `ORD-${created_at.slice(0,10).replace(/-/g, '')}-${randomInt(1000, 9999)}`;

    db.prepare(`
      INSERT INTO repair_orders (id, order_number, device_id, client_id, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, orderNumber, dev.id, dev.client_id, status, adminId, created_at, created_at);

    // Додаємо послуги та деталі до замовлення
    let totalCost = 0;
    const itemsCount = randomInt(1, 3);
    for (let j = 0; j < itemsCount; j++) {
      const inv = random(dbInventory);
      const itemId = uuidv4();
      const qty = 1;
      
      const itemType = inv.category === 'accessory' ? 'part' : inv.category;
      
      db.prepare(`
        INSERT INTO order_items (id, repair_order_id, type, name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(itemId, orderId, itemType, inv.name, qty, inv.price, inv.price);
      
      totalCost += inv.price;
    }

    // Платежі
    let paymentStatus = 'unpaid';
    if (status === 'delivered' || status === 'ready' || Math.random() > 0.5) {
      if (Math.random() > 0.3) {
        // Повна оплата
        const payId = uuidv4();
        db.prepare(`
          INSERT INTO payments (id, repair_order_id, amount, method, paid_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(payId, orderId, totalCost, random(methods), created_at);
        
        db.prepare(`
          INSERT INTO transactions (id, repair_order_id, type, amount, reference, created_at)
          VALUES (?, ?, 'charge', ?, ?, ?)
        `).run(uuidv4(), orderId, totalCost, `Оплата замовлення ${orderNumber}`, created_at);

        paymentStatus = 'paid';
      } else {
        // Передоплата (частково)
        const payId = uuidv4();
        const partial = Math.floor(totalCost * 0.3);
        if (partial > 0) {
          db.prepare(`
            INSERT INTO payments (id, repair_order_id, amount, method, paid_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(payId, orderId, partial, random(methods), created_at);
          
          db.prepare(`
            INSERT INTO transactions (id, repair_order_id, type, amount, reference, created_at)
            VALUES (?, ?, 'charge', ?, ?, ?)
          `).run(uuidv4(), orderId, partial, `Передоплата замовлення ${orderNumber}`, created_at);
          
          paymentStatus = 'partial';
        }
      }
    }

    db.prepare('UPDATE repair_orders SET payment_status = ? WHERE id = ?').run(paymentStatus, orderId);
  }
})();
console.log('Замовлення, фінанси та історія згенеровані.');

console.log('✅ Всі тестові дані успішно імпортовані!');
