const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

const generateTokens = (user) => {
  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key_example_change_me', { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_example_change_me', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Реєстрація (тільки для клієнтів, адміни створюють працівників окремо)
router.post('/register', [
  body('email').isEmail().withMessage('Некоректний email'),
  body('password').isLength({ min: 6 }).withMessage('Мінімальна довжина пароля - 6 символів'),
  body('name').notEmpty().withMessage('Ім`я є обов`язковим')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, name, phone } = req.body;

  try {
    const existingUser = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existingUser.rows.length > 0) return res.status(400).json({ message: 'Користувач з таким email вже існує' });

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    const userId = uuidv4();

    await db.execute({
      sql: `
      INSERT INTO users (id, email, password_hash, role, name, phone)
      VALUES (?, ?, ?, 'client', ?, ?)
    `, args: [userId, email, hash, name, phone || null]
    });

    res.status(201).json({ message: 'Реєстрація успішна' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
});

// Авторизація
router.post('/login', [
  body('email').isEmail().withMessage('Некоректний email'),
  body('password').notEmpty().withMessage('Пароль є обов`язковим')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const userResult = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    if (userResult.rows.length === 0) return res.status(400).json({ message: 'Невірний email або пароль' });
    const user = userResult.rows[0];

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Невірний email або пароль' });

    const { accessToken, refreshToken } = generateTokens(user);

    // Встановлюємо refresh token в HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
});

// Оновлення токенів
router.post('/refresh', (req, res) => {
  let refreshToken = req.headers['x-refresh-token'] || req.body.refreshToken;
  
  // Якщо токен не передано явно, намагаємось дістати його з cookies
  if (!refreshToken && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, val] = cookie.trim().split('=').map(decodeURIComponent);
      acc[key] = val;
      return acc;
    }, {});
    refreshToken = cookies.refreshToken;
  }

  if (!refreshToken) return res.status(401).json({ message: 'Refresh token відсутній' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_example_change_me');
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Недійсний refresh token' });
  }
});

// Вихід
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Успішний вихід' });
});

module.exports = router;
