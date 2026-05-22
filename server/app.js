const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Load from root if running locally

const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const clientsRoutes = require('./routes/clients.routes');
const devicesRoutes = require('./routes/devices.routes');
const ordersRoutes = require('./routes/orders.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const financeRoutes = require('./routes/finance.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' })); // Support for large Base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API працює' });
});

// Роути
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);

// Глобальний обробник помилок
app.use(errorHandler);

module.exports = app;
