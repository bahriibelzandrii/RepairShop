const db = require('./db');

// Переносимо замовлення від Дмитра до Івана (оригінального клієнта)
const ivan = db.prepare("SELECT id FROM clients WHERE first_name = 'Іван' AND email = 'client@test.com'").get();
const dmytro = db.prepare("SELECT id FROM clients WHERE first_name = 'Дмитро' AND email = 'client@test.com'").get();

if (ivan && dmytro) {
  // Переносимо замовлення Дмитра на Івана
  const result = db.prepare('UPDATE repair_orders SET client_id = ? WHERE client_id = ?').run(ivan.id, dmytro.id);
  console.log(`Перенесено ${result.changes} замовлень з Дмитра на Івана`);
  
  // Переносимо пристрої Дмитра на Івана
  const devResult = db.prepare('UPDATE devices SET client_id = ? WHERE client_id = ?').run(ivan.id, dmytro.id);
  console.log(`Перенесено ${devResult.changes} пристроїв`);
  
  // Видаляємо дубля Дмитра
  db.prepare('DELETE FROM clients WHERE id = ?').run(dmytro.id);
  console.log('Дубля видалено');
}

// Перевірка
const cnt = db.prepare("SELECT COUNT(*) as n FROM repair_orders WHERE client_id = ?").get(ivan.id);
console.log(`Іван тепер має ${cnt.n} замовлень`);
