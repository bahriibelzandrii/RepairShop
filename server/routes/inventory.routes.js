const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Отримати інвентар
router.get('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM inventory ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Додати інвентар/послугу
router.post('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { name, sku, category, price, stock_quantity, min_stock } = req.body;
  const id = uuidv4();
  
  try {
    await db.execute({
      sql: `
      INSERT INTO inventory (id, name, sku, category, price, stock_quantity, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      args: [id, name, sku, category, price, stock_quantity || 0, min_stock || 0]
    });
    
    res.status(201).json({ id, message: 'Позицію додано в інвентар' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка додавання', error: error.message });
  }
});

// Редагувати позицію (Admin)
router.put('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { name, sku, category, price, stock_quantity, min_stock } = req.body;
  
  try {
    const result = await db.execute({
      sql: `
      UPDATE inventory 
      SET name = ?, sku = ?, category = ?, price = ?, stock_quantity = ?, min_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      args: [name, sku, category, price, stock_quantity || 0, min_stock || 0, req.params.id]
    });
    
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Позицію не знайдено' });
    res.json({ message: 'Позицію оновлено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення позиції' });
  }
});

// Видалити позицію (Admin)
router.delete('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM inventory WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Позицію не знайдено' });
    res.json({ message: 'Позицію видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення позиції' });
  }
});

module.exports = router;
