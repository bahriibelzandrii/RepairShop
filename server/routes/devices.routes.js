const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Отримати пристрої (Employee, Admin)
router.get('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT d.*, c.first_name, c.last_name, c.phone 
      FROM devices d 
      LEFT JOIN clients c ON d.client_id = c.id
      ORDER BY d.created_at DESC
    `);
    
    // Парсимо photos якщо вони є (JSON array base64)
    const devices = result.rows.map(d => ({
      ...d,
      photos: d.photos ? JSON.parse(d.photos) : []
    }));
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
});

// Додати пристрій
router.post('/', verifyToken, authorizeRole(['admin', 'employee']), async (req, res) => {
  const { serial_or_model, brand, model, color, photos, client_id } = req.body;
  const id = uuidv4();
  
  try {
    const photosJson = photos && photos.length > 0 ? JSON.stringify(photos) : null;
    
    await db.execute({
      sql: `
      INSERT INTO devices (id, serial_or_model, brand, model, color, photos, client_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      args: [id, serial_or_model, brand, model, color, photosJson, client_id]
    });
    
    res.status(201).json({ id, message: 'Пристрій додано' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка додавання пристрою' });
  }
});

// Редагувати пристрій (Admin)
router.put('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  const { serial_or_model, brand, model, color, photos, client_id } = req.body;
  
  try {
    const photosJson = photos && photos.length > 0 ? JSON.stringify(photos) : null;
    
    const result = await db.execute({
      sql: `
      UPDATE devices 
      SET serial_or_model = ?, brand = ?, model = ?, color = ?, photos = ?, client_id = ?
      WHERE id = ?
    `,
      args: [serial_or_model, brand, model, color, photosJson, client_id, req.params.id]
    });
    
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Пристрій не знайдено' });
    res.json({ message: 'Пристрій оновлено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення пристрою' });
  }
});

// Видалити пристрій (Admin)
router.delete('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM devices WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Пристрій не знайдено' });
    res.json({ message: 'Пристрій видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка видалення пристрою' });
  }
});

module.exports = router;
