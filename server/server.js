const app = require('./app');

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
  });
}

// Export for Vercel serverless function
module.exports = app;
