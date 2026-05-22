const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Отримати всіх клієнтів (Employee, Admin)
router.get('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Додати клієнта
router.post('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { first_name, last_name, phone, email, address, notes } = req.body;
  const id = uuidv4();
  
  try {
    await db.execute({
      sql: `
      INSERT INTO clients (id, first_name, last_name, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      args: [id, first_name, last_name, phone, email, address, notes]
    });
    
    res.status(201).json({ id, message: 'Клієнта створено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка створення клієнта', error: error.message });
  }
});

// Редагувати клієнта (Admin)
router.put('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { first_name, last_name, phone, email, address, notes } = req.body;
  
  try {
    const result = await db.execute({
      sql: `
      UPDATE clients 
      SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ?, notes = ?
      WHERE id = ?
    `,
      args: [first_name, last_name, phone, email, address, notes, req.params.id]
    });
    
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Клієнта не знайдено' });
    res.json({ message: 'Клієнта оновлено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення клієнта' });
  }
});

// Видалити клієнта (Admin)
router.delete('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM clients WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Клієнта не знайдено' });
    res.json({ message: 'Клієнта видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення клієнта' });
  }
});

module.exports = router;
