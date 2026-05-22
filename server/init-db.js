const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const initDatabase = () => {
  console.log('Початок ініціалізації бази даних...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'employee', 'client')) NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      serial_or_model TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      color TEXT,
      photos TEXT, -- JSON array of Base64 strings
      client_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS repair_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      device_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_delivery_at DATETIME,
      status TEXT CHECK(status IN ('received', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'delivered', 'cancelled')) DEFAULT 'received',
      payment_status TEXT CHECK(payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
      delivered_at DATETIME,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      repair_order_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('labor', 'part', 'service', 'warranty')) NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      total_price REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      repair_order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT CHECK(method IN ('cash', 'card', 'transfer', 'crypto', 'invoice')) NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      receipt_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category TEXT CHECK(category IN ('part', 'service', 'accessory')) NOT NULL,
      price REAL NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      repair_order_id TEXT,
      type TEXT CHECK(type IN ('charge', 'refund', 'adjustment')) NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'UAH',
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE CASCADE
    );

    -- Індекси для оптимізації
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(status);
    CREATE INDEX IF NOT EXISTS idx_payments_repair_order_id ON payments(repair_order_id);
    CREATE INDEX IF NOT EXISTS idx_devices_client_id ON devices(client_id);
  `);

  console.log('Таблиці створені. Перевірка наявності адміністратора...');

  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');

  if (!adminExists) {
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync('admin123', salt);
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(uuidv4(), 'admin@repair.shop', hash, 'admin', 'Головний Адміністратор', '+380501234567');
    console.log('Адміністратор створений: admin@repair.shop / admin123');
  } else {
    console.log('Адміністратор вже існує.');
  }

  // Додавання тестового клієнта та інвентаря, якщо немає
  const clientExists = db.prepare("SELECT id FROM clients LIMIT 1").get();
  if (!clientExists) {
    const clientId = uuidv4();
    db.prepare(`
      INSERT INTO clients (id, first_name, last_name, phone, email, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clientId, 'Іван', 'Клієнтов', '+380671234567', 'client@test.com', 'Тестовий клієнт');

    const deviceId = uuidv4();
    db.prepare(`
      INSERT INTO devices (id, serial_or_model, brand, model, client_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(deviceId, 'SN-XYZ123', 'Apple', 'MacBook Pro M1', clientId);

    db.prepare(`
      INSERT INTO inventory (id, name, sku, category, price, stock_quantity)
      VALUES 
      (?, 'Термопаста MX-4', 'PART-001', 'part', 250.00, 50),
      (?, 'Діагностика', 'SRV-001', 'service', 300.00, 999)
    `).run(uuidv4(), uuidv4());
    
    console.log('Тестові дані створено.');
  }

  console.log('Ініціалізація БД завершена успішно.');
};

initDatabase();
