const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Отримати власний профіль
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, email, role, name, phone, created_at FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Редагувати власний профіль
router.put('/me', verifyToken, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await db.execute({
      sql: `
      UPDATE users 
      SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      args: [name, phone || null, req.user.id]
    });
    
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Користувача не знайдено' });
    
    // Отримуємо оновлені дані щоб повернути
    const userResult = await db.execute({
      sql: 'SELECT id, email, role, name, phone, created_at FROM users WHERE id = ?',
      args: [req.user.id]
    });
    res.json({ message: 'Профіль оновлено', user: userResult.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення профілю' });
  }
});

// Отримати всіх користувачів (тільки для Admin)
router.get('/', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute('SELECT id, email, role, name, phone, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Створити співробітника (тільки Admin)
router.post('/', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { email, password, name, phone, role } = req.body;
  const bcrypt = require('bcryptjs');
  
  try {
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });
    if (existingUser.rows.length > 0) return res.status(400).json({ message: 'Користувач з таким email вже існує' });

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    const userId = uuidv4();

    await db.execute({
      sql: `
      INSERT INTO users (id, email, password_hash, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      args: [userId, email, hash, role || 'employee', name, phone || null]
    });

    res.status(201).json({ message: 'Співробітника створено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
});

// Редагувати співробітника (тільки Admin)
router.put('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { name, phone, role, email } = req.body;
  
  try {
    const result = await db.execute({
      sql: `
      UPDATE users 
      SET name = ?, phone = ?, role = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      args: [name, phone || null, role, email, req.params.id]
    });
    
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Співробітника не знайдено' });
    res.json({ message: 'Співробітника оновлено' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }
    res.status(500).json({ message: 'Помилка оновлення співробітника' });
  }
});

// Видалити співробітника (тільки Admin)
router.delete('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Забороняємо видаляти самого себе
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Не можна видалити власний акаунт' });
    }
    const result = await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Співробітника не знайдено' });
    res.json({ message: 'Співробітника видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення співробітника' });
  }
});

module.exports = router;
