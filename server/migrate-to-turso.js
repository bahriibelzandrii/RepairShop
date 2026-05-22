require('dotenv').config({ path: '../.env' });
const { DatabaseSync } = require('node:sqlite');
const { createClient } = require('@libsql/client');
const path = require('path');

const migrate = async () => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('Помилка: Не вказано TURSO_DATABASE_URL або TURSO_AUTH_TOKEN у файлі .env');
    process.exit(1);
  }

  console.log('Підключення до Turso...');
  const turso = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  console.log('Підключення до локальної SQLite...');
  const dbPath = path.join(__dirname, '..', 'data', 'db.sqlite');
  const localDb = new DatabaseSync(dbPath);

  // Таблиці у правильному порядку (щоб не порушити Foreign Keys)
  const tables = [
    'users',
    'clients',
    'inventory',
    'devices',
    'repair_orders',
    'order_items',
    'payments',
    'transactions'
  ];

  try {
    // 1. Створюємо таблиці в Turso
    console.log('Створення таблиць у Turso...');
    for (const table of tables) {
      const schemaRow = localDb.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(table);
      if (schemaRow && schemaRow.sql) {
        await turso.execute(schemaRow.sql);
        console.log(`Таблиця ${table} створена.`);
      }
    }

    // Створюємо індекси
    const indexes = localDb.prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL`).all();
    for (const idx of indexes) {
      await turso.execute(idx.sql);
    }
    console.log('Індекси створені.');

    // 2. Переносимо дані
    console.log('Починаємо перенесення даних...');
    for (const table of tables) {
      const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`Таблиця ${table} порожня, пропускаємо.`);
        continue;
      }

      console.log(`Перенесення ${rows.length} записів у таблицю ${table}...`);
      
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      // Робимо пакетну вставку
      const batchArgs = rows.map(row => ({
        sql,
        args: columns.map(col => row[col])
      }));

      // Turso підтримує пакетне виконання запитів (batch)
      await turso.batch(batchArgs, 'write');
      console.log(`Таблиця ${table} успішно перенесена!`);
    }

    console.log('✅ Міграція бази даних в Turso успішно завершена!');
  } catch (error) {
    console.error('❌ Помилка під час міграції:', error);
  }
};

migrate();
