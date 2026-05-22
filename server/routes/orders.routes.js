const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// ─── Публічний пошук за номером квитанції або телефоном ───
router.get('/search/:query', async (req, res) => {
  const query = req.params.query.trim();
  try {
    const result = await db.execute({
      sql: `
      SELECT o.order_number, o.status, o.payment_status, o.created_at, o.expected_delivery_at,
             d.brand, d.model, u.name as assigned_master
      FROM repair_orders o
      JOIN devices d ON o.device_id = d.id
      JOIN clients c ON o.client_id = c.id
      LEFT JOIN users u ON o.assigned_to = u.id
      WHERE o.order_number LIKE ? OR c.phone LIKE ?
      ORDER BY o.created_at DESC
      LIMIT 10
    `,
      args: [`%${query}%`, `%${query}%`]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка пошуку' });
  }
});

// ─── Замовлення клієнта (Client) ───
router.get('/my-orders', verifyToken, authorizeRole(['client']), async (req, res) => {
  try {
    const userResult = await db.execute({
      sql: 'SELECT email FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = userResult.rows[0];
    if (!user) return res.json([]);

    const clientResult = await db.execute({
      sql: 'SELECT id FROM clients WHERE email = ?',
      args: [user.email]
    });
    const client = clientResult.rows[0];
    if (!client) return res.json([]);

    const ordersResult = await db.execute({
      sql: `
      SELECT o.*, d.brand, d.model, u.name as assigned_master
      FROM repair_orders o
      JOIN devices d ON o.device_id = d.id
      LEFT JOIN users u ON o.assigned_to = u.id
      WHERE o.client_id = ?
      ORDER BY o.created_at DESC
    `,
      args: [client.id]
    });
    res.json(ordersResult.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// ─── Деталі одного замовлення клієнта ───
router.get('/my-orders/:id', verifyToken, authorizeRole(['client']), async (req, res) => {
  try {
    const userResult = await db.execute({
      sql: 'SELECT email FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const clientResult = await db.execute({
      sql: 'SELECT id FROM clients WHERE email = ?',
      args: [user.email]
    });
    const client = clientResult.rows[0];
    if (!client) return res.status(404).json({ message: 'Клієнта не знайдено' });

    const orderResult = await db.execute({
      sql: `
      SELECT o.*, d.brand, d.model, c.first_name, c.last_name, u.name as assigned_master
      FROM repair_orders o
      JOIN devices d ON o.device_id = d.id
      JOIN clients c ON o.client_id = c.id
      LEFT JOIN users u ON o.assigned_to = u.id
      WHERE o.id = ? AND o.client_id = ?
    `,
      args: [req.params.id, client.id]
    });
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });

    const itemsResult = await db.execute({
      sql: 'SELECT * FROM order_items WHERE repair_order_id = ? ORDER BY created_at DESC',
      args: [req.params.id]
    });
    const paymentsResult = await db.execute({
      sql: 'SELECT * FROM payments WHERE repair_order_id = ? ORDER BY paid_at DESC',
      args: [req.params.id]
    });

    res.json({ ...order, items: itemsResult.rows, payments: paymentsResult.rows });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// ─── Отримати всі замовлення (Employee, Admin) ───
router.get('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT o.*, c.first_name, c.last_name, d.brand, d.model, u.name as assigned_master 
      FROM repair_orders o
      JOIN clients c ON o.client_id = c.id
      JOIN devices d ON o.device_id = d.id
      LEFT JOIN users u ON o.assigned_to = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// ─── Отримати одне замовлення з деталями (Employee, Admin) ───
router.get('/:id', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const orderResult = await db.execute({
      sql: `
      SELECT o.*, c.first_name, c.last_name, c.phone as client_phone, 
             d.brand, d.model, d.serial_or_model,
             u.name as assigned_master
      FROM repair_orders o
      JOIN clients c ON o.client_id = c.id
      JOIN devices d ON o.device_id = d.id
      LEFT JOIN users u ON o.assigned_to = u.id
      WHERE o.id = ?
    `,
      args: [req.params.id]
    });
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });

    const itemsResult = await db.execute({
      sql: 'SELECT * FROM order_items WHERE repair_order_id = ? ORDER BY created_at DESC',
      args: [req.params.id]
    });
    const paymentsResult = await db.execute({
      sql: 'SELECT * FROM payments WHERE repair_order_id = ? ORDER BY paid_at DESC',
      args: [req.params.id]
    });

    res.json({ ...order, items: itemsResult.rows, payments: paymentsResult.rows });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// ─── Призначити майстра ───
router.patch('/:id/assign', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { assigned_to } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE repair_orders SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [assigned_to, req.params.id]
    });
    res.json({ message: 'Майстра призначено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка призначення' });
  }
});

// ─── Створити замовлення ───
router.post('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { device_id, client_id, expected_delivery_at } = req.body;
  const id = uuidv4();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const order_number = `ORD-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await db.execute({
      sql: `
      INSERT INTO repair_orders (id, order_number, device_id, client_id, expected_delivery_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      args: [id, order_number, device_id, client_id, expected_delivery_at, req.user.id]
    });
    res.status(201).json({ id, order_number, message: 'Замовлення створено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка створення замовлення', error: error.message });
  }
});

// ─── Додати позицію до замовлення ───
router.post('/:id/items', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { type, name, quantity, unit_price, discount_percent, notes } = req.body;
  const repair_order_id = req.params.id;
  const id = uuidv4();
  const total_price = (unit_price * quantity) * (1 - (discount_percent || 0) / 100);

  try {
    await db.execute({
      sql: `
      INSERT INTO order_items (id, repair_order_id, type, name, quantity, unit_price, discount_percent, total_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      args: [id, repair_order_id, type, name, quantity, unit_price, discount_percent || 0, total_price, notes || null]
    });
    res.status(201).json({ id, total_price, message: 'Позицію додано' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка додавання позиції' });
  }
});

// ─── Оновити статус замовлення ───
router.patch('/:id/status', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { status } = req.body;
  try {
    const updateQuery = status === 'delivered'
      ? 'UPDATE repair_orders SET status = ?, delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      : 'UPDATE repair_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.execute({
      sql: updateQuery,
      args: [status, req.params.id]
    });
    res.json({ message: 'Статус оновлено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення статусу' });
  }
});

// ─── Видалити позицію з замовлення ───
router.delete('/:id/items/:itemId', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM order_items WHERE id = ? AND repair_order_id = ?',
      args: [req.params.itemId, req.params.id]
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Позицію не знайдено' });
    }
    res.json({ message: 'Позицію видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення позиції' });
  }
});

// ─── Редагувати замовлення (Admin) ───
router.put('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { device_id, client_id, expected_delivery_at } = req.body;
  try {
    const result = await db.execute({
      sql: `
      UPDATE repair_orders 
      SET device_id = ?, client_id = ?, expected_delivery_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      args: [device_id, client_id, expected_delivery_at, req.params.id]
    });
    
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Замовлення не знайдено' });
    res.json({ message: 'Замовлення оновлено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення замовлення' });
  }
});

// ─── Видалити замовлення (Admin) ───
router.delete('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM repair_orders WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Замовлення не знайдено' });
    res.json({ message: 'Замовлення видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення замовлення' });
  }
});

module.exports = router;
