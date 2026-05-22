import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button, Select, Input, Label } from '../components/ui/Forms';
import { Modal } from '../components/ui/Modal';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useConfirmStore } from '../store/confirmStore';
import { StatusBadge, PaymentBadge } from '../components/ui/Badges';
import { format } from 'date-fns';
import { generateReceiptPDF } from '../lib/pdf';
import { ArrowLeft, Printer, Plus, CreditCard, User, Trash2 } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const STATUS_LABELS = {
  received: 'Отримано',
  diagnostics: 'Діагностика',
  in_progress: 'В роботі',
  waiting_parts: 'Очікує деталі',
  ready: 'Готово',
  delivered: 'Видано',
  cancelled: 'Скасовано',
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [masters, setMasters] = useState([]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [itemForm, setItemForm] = useState({ type: 'service', name: '', quantity: 1, unit_price: '', discount_percent: 0 });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'card' });

  const fetchOrderData = async () => {
    try {
      const [orderRes, invRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/inventory'),
      ]);

      setOrder(orderRes.data);
      setItems(orderRes.data.items || []);
      setPayments(orderRes.data.payments || []);
      setInventory(invRes.data);

      // Завантажуємо майстрів якщо адмін
      if (user?.role === 'admin') {
        const mastersRes = await api.get('/users').catch(() => ({ data: [] }));
        setMasters(mastersRes.data.filter(u => u.role === 'employee' || u.role === 'admin'));
      }
    } catch (error) {
      addToast('Замовлення не знайдено', 'error');
      navigate('/orders');
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const updateStatus = async (status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      addToast('Статус оновлено', 'success');
      fetchOrderData();
    } catch (error) {
      console.error(error);
    }
  };

  const assignMaster = async (assigned_to) => {
    try {
      await api.patch(`/orders/${id}/assign`, { assigned_to: assigned_to || null });
      addToast('Майстра призначено', 'success');
      fetchOrderData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/orders/${id}/items`, itemForm);
      addToast('Позицію додано', 'success');
      setIsItemModalOpen(false);
      setItemForm({ type: 'service', name: '', quantity: 1, unit_price: '', discount_percent: 0 });
      fetchOrderData(); // перезавантажуємо щоб бачити нові items з БД
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    showConfirm('Ви впевнені, що хочете видалити цю позицію?', async () => {
      try {
        await api.delete(`/orders/${id}/items/${itemId}`);
        addToast('Позицію видалено', 'success');
        fetchOrderData();
      } catch (error) {
        console.error(error);
      }
    });
  };
  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/payments', { repair_order_id: id, ...paymentForm });
      addToast('Оплату прийнято', 'success');
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'card' });
      fetchOrderData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    showConfirm('Ви впевнені, що хочете видалити цей платіж?', async () => {
      try {
        await api.delete(`/finance/payments/${paymentId}`);
        addToast('Платіж видалено', 'success');
        fetchOrderData();
      } catch (error) {
        console.error(error);
      }
    });
  };

  if (!order) return <Skeleton className="h-[400px] w-full" />;

  const statuses = Object.keys(STATUS_LABELS);
  const totalCost = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Замовлення {order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {order.first_name} {order.last_name} • {order.brand} {order.model}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {totalCost > totalPaid && (
            <Button onClick={() => setIsPaymentModalOpen(true)} className="bg-success hover:bg-success/90">
              <CreditCard size={16} className="mr-2" /> Оплата
            </Button>
          )}
          <Button variant="outline" onClick={() => generateReceiptPDF(order, items, payments)}>
            <Printer size={16} className="mr-2" /> Друк квитанції
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ліва колонка — позиції та платежі */}
        <div className="lg:col-span-2 space-y-6">
          {/* Позиції */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Послуги та Деталі</h3>
              <Button size="sm" onClick={() => setIsItemModalOpen(true)}>
                <Plus size={16} className="mr-2" /> Додати
              </Button>
            </div>
            <Table
              searchable={false}
              columns={[
                { key: 'name', label: 'Назва' },
                { key: 'type', label: 'Тип', render: (v) => ({ service: 'Послуга', part: 'Деталь', labor: 'Робота', warranty: 'Гарантія' }[v] || v) },
                { key: 'quantity', label: 'Кіл-ть' },
                { key: 'unit_price', label: 'Ціна', render: v => `${Number(v).toFixed(0)} ₴` },
                { key: 'total_price', label: 'Сума', render: v => `${Number(v).toFixed(0)} ₴` },
                {
                  key: 'actions',
                  label: '',
                  render: (_, row) => (
                    <button onClick={() => handleDeleteItem(row.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Видалити">
                      <Trash2 size={16} />
                    </button>
                  )
                }
              ]}
              data={items}
            />
            <div className="mt-4 flex justify-end items-center gap-6 text-sm">
              <span className="text-muted-foreground">Загальна сума:</span>
              <span className="text-xl font-bold">{totalCost.toFixed(0)} ₴</span>
            </div>
          </div>

          {/* Історія платежів */}
          {payments.length > 0 && (
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Історія оплат</h3>
              <Table
                searchable={false}
                columns={[
                  { key: 'amount', label: 'Сума', render: v => `${Number(v).toFixed(0)} ₴` },
                  { key: 'method', label: 'Метод', render: v => ({ cash: 'Готівка', card: 'Картка', transfer: 'Переказ' }[v] || v) },
                  { key: 'paid_at', label: 'Дата', render: v => format(new Date(v), 'dd.MM.yyyy HH:mm') },
                  ...(user?.role === 'admin' || user?.role === 'employee' ? [{
                    key: 'actions',
                    label: '',
                    render: (_, row) => (
                      <button onClick={() => handleDeletePayment(row.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Видалити">
                        <Trash2 size={16} />
                      </button>
                    )
                  }] : [])
                ]}
                data={payments}
              />
              <div className="mt-4 flex justify-end items-center gap-6 text-sm">
                <span className="text-muted-foreground">Оплачено:</span>
                <span className="text-lg font-bold text-success">{totalPaid.toFixed(0)} ₴</span>
                {totalCost > 0 && totalPaid < totalCost && (
                  <>
                    <span className="text-muted-foreground">Залишок:</span>
                    <span className="text-lg font-bold text-destructive">{(totalCost - totalPaid).toFixed(0)} ₴</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Права колонка — інформація */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Інформація</h3>
            <div className="space-y-4">
              {/* Статус */}
              <div>
                <Label className="text-muted-foreground mb-1">Статус</Label>
                <Select
                  value={order.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  options={statuses.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                />
              </div>

              {/* Майстер */}
              <div>
                <Label className="text-muted-foreground mb-1">Майстер</Label>
                {user?.role === 'admin' ? (
                  <Select
                    value={order.assigned_to || ''}
                    onChange={(e) => assignMaster(e.target.value)}
                    options={[
                      { value: '', label: 'Не призначено' },
                      ...masters.map(m => ({ value: m.id, label: m.name }))
                    ]}
                  />
                ) : (
                  <p className="font-medium flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    {order.assigned_master || 'Не призначено'}
                  </p>
                )}
              </div>

              {/* Оплата */}
              <div>
                <Label className="text-muted-foreground mb-1">Оплата</Label>
                <div className="flex justify-between items-center">
                  <PaymentBadge status={order.payment_status} />
                </div>
              </div>

              <hr className="border-border" />

              {/* Клієнт */}
              <div>
                <Label className="text-muted-foreground mb-1">Клієнт</Label>
                <p className="font-medium">{order.first_name} {order.last_name}</p>
                {order.client_phone && <p className="text-sm text-muted-foreground">{order.client_phone}</p>}
              </div>

              {/* Пристрій */}
              <div>
                <Label className="text-muted-foreground mb-1">Пристрій</Label>
                <p className="font-medium">{order.brand} {order.model}</p>
                {order.serial_or_model && <p className="text-xs text-muted-foreground font-mono">S/N: {order.serial_or_model}</p>}
              </div>

              {/* Дата */}
              <div>
                <Label className="text-muted-foreground mb-1">Дата створення</Label>
                <p className="font-medium">{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка: Додати позицію */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Додати послугу/деталь">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <Label>Зі складу (опціонально)</Label>
            <Select
              options={[{ value: '', label: '— Обрати зі складу —' }, ...inventory.map(i => ({ value: i.id, label: `${i.name} (${i.price} ₴)` }))]}
              onChange={(e) => {
                const inv = inventory.find(i => i.id === e.target.value);
                if (inv) setItemForm({ ...itemForm, name: inv.name, unit_price: inv.price, type: inv.category === 'accessory' ? 'part' : inv.category });
              }}
            />
          </div>
          <div>
            <Label>Назва</Label>
            <Input required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Кількість</Label>
              <Input type="number" required min="1" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Ціна (₴)</Label>
              <Input type="number" required step="0.01" value={itemForm.unit_price} onChange={e => setItemForm({ ...itemForm, unit_price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsItemModalOpen(false)}>Скасувати</Button>
            <Button type="submit">Додати</Button>
          </div>
        </form>
      </Modal>

      {/* Модалка: Оплата */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Прийняти оплату">
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <Label>Сума (₴)</Label>
            <Input type="number" required step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
            {totalCost > totalPaid && (
              <button
                type="button"
                className="text-xs text-primary mt-1 hover:underline"
                onClick={() => setPaymentForm({ ...paymentForm, amount: totalCost - totalPaid })}
              >
                Залишок: {(totalCost - totalPaid).toFixed(0)} ₴ — оплатити повністю
              </button>
            )}
          </div>
          <div>
            <Label>Метод</Label>
            <Select
              value={paymentForm.method}
              onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
              options={[
                { value: 'cash', label: 'Готівка' },
                { value: 'card', label: 'Картка / Термінал' },
                { value: 'transfer', label: 'Переказ' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Скасувати</Button>
            <Button type="submit">Оплатити</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
