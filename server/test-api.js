const BASE = 'http://localhost:5000/api';

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${name}`);
    return result;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    return null;
  }
}

async function post(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function get(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function patch(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

(async () => {
  console.log('\n═══ 1. HEALTH CHECK ═══');
  await test('API health', () => get('/health'));

  console.log('\n═══ 2. AUTH (Логін усіх ролей) ═══');
  const admin = await test('Admin login', () => post('/auth/login', { email: 'admin@repair.shop', password: 'admin123' }));
  const master = await test('Master login', () => post('/auth/login', { email: 'master@repair.shop', password: 'master123' }));
  const client = await test('Client login', () => post('/auth/login', { email: 'client@test.com', password: 'client123' }));

  if (!admin || !master || !client) { console.log('\n⛔ Аутентифікація провалена, тести зупинено.'); return; }

  const aToken = admin.accessToken;
  const mToken = master.accessToken;
  const cToken = client.accessToken;

  console.log(`  Admin role: ${admin.user.role}, Master role: ${master.user.role}, Client role: ${client.user.role}`);

  console.log('\n═══ 3. PUBLIC: Пошук замовлень ═══');
  const searchResults = await test('Search orders by "ORD"', () => get('/orders/search/ORD'));
  if (searchResults) console.log(`  Знайдено: ${searchResults.length} замовлень`);

  console.log('\n═══ 4. ADMIN: Основні ресурси ═══');
  const clients_list = await test('GET /clients', () => get('/clients', aToken));
  if (clients_list) console.log(`  Клієнтів: ${clients_list.length}`);

  const devices_list = await test('GET /devices', () => get('/devices', aToken));
  if (devices_list) console.log(`  Пристроїв: ${devices_list.length}`);

  const orders_list = await test('GET /orders', () => get('/orders', aToken));
  if (orders_list) console.log(`  Замовлень: ${orders_list.length}`);

  const inventory_list = await test('GET /inventory', () => get('/inventory', aToken));
  if (inventory_list) console.log(`  Позицій на складі: ${inventory_list.length}`);

  const users_list = await test('GET /users', () => get('/users', aToken));
  if (users_list) console.log(`  Користувачів: ${users_list.length}`);

  const transactions = await test('GET /finance/transactions', () => get('/finance/transactions', aToken));
  if (transactions) console.log(`  Транзакцій: ${transactions.length}`);

  console.log('\n═══ 5. ADMIN: Деталі замовлення ═══');
  if (orders_list && orders_list.length > 0) {
    const orderId = orders_list[0].id;
    const detail = await test(`GET /orders/${orderId.slice(0,8)}...`, () => get(`/orders/${orderId}`, aToken));
    if (detail) {
      console.log(`  Номер: ${detail.order_number}`);
      console.log(`  Статус: ${detail.status}, Оплата: ${detail.payment_status}`);
      console.log(`  Позицій: ${detail.items?.length || 0}, Платежів: ${detail.payments?.length || 0}`);
      console.log(`  Майстер: ${detail.assigned_master || 'не призначено'}`);
    }
  }

  console.log('\n═══ 6. ADMIN: Призначення майстра ═══');
  if (orders_list && orders_list.length > 0) {
    await test('Assign master to order', () => patch(`/orders/${orders_list[0].id}/assign`, { assigned_to: master.user.id }, aToken));
  }

  console.log('\n═══ 7. MASTER: Його замовлення ═══');
  const masterOrders = await test('Master GET /orders', () => get('/orders', mToken));
  if (masterOrders) {
    const myOrders = masterOrders.filter(o => o.assigned_to === master.user.id);
    console.log(`  Всього замовлень видно: ${masterOrders.length}`);
    console.log(`  Призначено цьому майстру: ${myOrders.length}`);
  }

  console.log('\n═══ 8. MASTER: Профіль ═══');
  await test('Master GET /users/me', () => get('/users/me', mToken));

  console.log('\n═══ 9. CLIENT: Мої замовлення ═══');
  const clientOrders = await test('Client GET /my-orders', () => get('/orders/my-orders', cToken));
  if (clientOrders) console.log(`  Замовлень клієнта: ${clientOrders.length}`);

  if (clientOrders && clientOrders.length > 0) {
    const clientDetail = await test('Client GET /my-orders/:id', () => get(`/orders/my-orders/${clientOrders[0].id}`, cToken));
    if (clientDetail) console.log(`  Деталь: ${clientDetail.order_number}, items: ${clientDetail.items?.length || 0}`);
  }

  console.log('\n═══ 10. ДОСТУП: Перевірка обмежень ═══');
  // Клієнт НЕ повинен мати доступ до /orders
  try {
    await get('/orders', cToken);
    console.log('❌ Client accessed /orders (should be forbidden!)');
  } catch {
    console.log('✅ Client correctly blocked from /orders');
  }

  // Майстер НЕ повинен мати доступ до /finance/transactions
  try {
    await get('/finance/transactions', mToken);
    console.log('❌ Master accessed /finance (should be forbidden!)');
  } catch {
    console.log('✅ Master correctly blocked from /finance');
  }

  // Майстер НЕ повинен мати доступ до /users
  try {
    await get('/users', mToken);
    console.log('❌ Master accessed /users (should be forbidden!)');
  } catch {
    console.log('✅ Master correctly blocked from /users');
  }

  console.log('\n═══ ПІДСУМОК ═══');
  console.log('Тестування завершено.');
})();
