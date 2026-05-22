const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Додати платіж
router.post('/payments', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { repair_order_id, amount, method, receipt_number, notes } = req.body;
  const id = uuidv4();
  
  try {
    const transaction = await db.transaction('write');
    try {
      // 1. Додаємо платіж
      await transaction.execute({
        sql: `
        INSERT INTO payments (id, repair_order_id, amount, method, receipt_number, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        args: [id, repair_order_id, amount, method, receipt_number || null, notes || null]
      });

      // 2. Створюємо транзакцію
      await transaction.execute({
        sql: `
        INSERT INTO transactions (id, repair_order_id, type, amount, reference)
        VALUES (?, ?, 'charge', ?, ?)
      `,
        args: [uuidv4(), repair_order_id, amount, `Оплата до замовлення ${repair_order_id}`]
      });

      // 3. Оновлюємо статус оплати замовлення
      const itemsResult = await transaction.execute({
        sql: 'SELECT SUM(total_price) as total FROM order_items WHERE repair_order_id = ?',
        args: [repair_order_id]
      });
      const paidResult = await transaction.execute({
        sql: 'SELECT SUM(amount) as paid FROM payments WHERE repair_order_id = ?',
        args: [repair_order_id]
      });
      
      const totalCost = itemsResult.rows[0]?.total || 0;
      const totalPaid = paidResult.rows[0]?.paid || 0;

      let paymentStatus = 'unpaid';
      if (totalPaid > 0 && totalPaid < totalCost) paymentStatus = 'partial';
      if (totalPaid >= totalCost && totalCost > 0) paymentStatus = 'paid';

      await transaction.execute({
        sql: 'UPDATE repair_orders SET payment_status = ? WHERE id = ?',
        args: [paymentStatus, repair_order_id]
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
    
    res.status(201).json({ id, message: 'Платіж проведено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка проведення платежу', error: error.message });
  }
});

// Отримати всі транзакції (Тільки Admin)
router.get('/transactions', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM transactions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Видалити платіж (Admin, Employee)
router.delete('/payments/:id', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const paymentResult = await db.execute({
      sql: 'SELECT repair_order_id FROM payments WHERE id = ?',
      args: [req.params.id]
    });
    if (paymentResult.rows.length === 0) return res.status(404).json({ message: 'Платіж не знайдено' });
    const payment = paymentResult.rows[0];

    const transaction = await db.transaction('write');
    try {
      // 1. Видаляємо платіж
      await transaction.execute({
        sql: 'DELETE FROM payments WHERE id = ?',
        args: [req.params.id]
      });

      // 2. Оновлюємо статус оплати замовлення
      const repair_order_id = payment.repair_order_id;
      const itemsResult = await transaction.execute({
        sql: 'SELECT SUM(total_price) as total FROM order_items WHERE repair_order_id = ?',
        args: [repair_order_id]
      });
      const paidResult = await transaction.execute({
        sql: 'SELECT SUM(amount) as paid FROM payments WHERE repair_order_id = ?',
        args: [repair_order_id]
      });
      
      const totalCost = itemsResult.rows[0]?.total || 0;
      const totalPaid = paidResult.rows[0]?.paid || 0;

      let paymentStatus = 'unpaid';
      if (totalPaid > 0 && totalPaid < totalCost) paymentStatus = 'partial';
      if (totalPaid >= totalCost && totalCost > 0) paymentStatus = 'paid';

      await transaction.execute({
        sql: 'UPDATE repair_orders SET payment_status = ? WHERE id = ?',
        args: [paymentStatus, repair_order_id]
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    res.json({ message: 'Платіж видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення платежу' });
  }
});

// Видалити транзакцію (Admin)
router.delete('/transactions/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM transactions WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Транзакцію не знайдено' });
    res.json({ message: 'Транзакцію видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення транзакції' });
  }
});

module.exports = router;
