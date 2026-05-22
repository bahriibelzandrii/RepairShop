import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { StatusBadge, PaymentBadge } from '../components/ui/Badges';
import { useAuthStore } from '../store/authStore';
import { Skeleton } from '../components/ui/Skeleton';
import { format } from 'date-fns';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const fetchDetail = async (id) => {
    try {
      const res = await api.get(`/orders/my-orders/${id}`);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Мої замовлення</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completed = orders.filter(o => o.status === 'delivered');

  const STATUS_LABELS = {
    received: 'Прийнято в майстерню',
    diagnostics: 'Виконується діагностика',
    in_progress: 'Майстер працює над ремонтом',
    waiting_parts: 'Очікуємо деталі від постачальника',
    ready: 'Ремонт завершено — можна забирати!',
    delivered: 'Видано клієнту',
    cancelled: 'Замовлення скасовано',
  };

  const STATUS_TIMELINE = ['received', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'delivered'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Вітаємо, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">Відстежуйте статус ремонту вашої техніки в реальному часі.</p>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary"><ClipboardList size={22} /></div>
          <div>
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Всього замовлень</p>
          </div>
        </div>
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-warning/10 rounded-full text-warning"><Clock size={22} /></div>
          <div>
            <p className="text-2xl font-bold">{active.length}</p>
            <p className="text-sm text-muted-foreground">В процесі</p>
          </div>
        </div>
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-full text-success"><CheckCircle size={22} /></div>
          <div>
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-sm text-muted-foreground">Завершено</p>
          </div>
        </div>
      </div>

      {/* Активні замовлення */}
      {active.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Активні замовлення</h2>
          <div className="grid gap-4">
            {active.map(order => (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border shadow-sm p-5 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fetchDetail(order.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono font-bold text-sm">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.brand} {order.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.payment_status} />
                  </div>
                </div>

                {/* Прогрес */}
                <div className="mt-4">
                  <p className="text-sm text-foreground mb-2 font-medium">
                    <AlertCircle size={14} className="inline mr-1 text-primary" />
                    {STATUS_LABELS[order.status]}
                  </p>
                  <div className="flex gap-1">
                    {STATUS_TIMELINE.map((step, i) => {
                      const currentIdx = STATUS_TIMELINE.indexOf(order.status);
                      const isCompleted = i <= currentIdx;
                      return (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${isCompleted ? 'bg-primary' : 'bg-muted'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {order.assigned_master && (
                  <p className="text-xs text-muted-foreground mt-3">Майстер: {order.assigned_master}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Деталі обраного замовлення */}
      {selectedOrder && (
        <div className="bg-card rounded-xl border border-primary/30 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Деталі: {selectedOrder.order_number}</h3>
            <button onClick={() => setSelectedOrder(null)} className="text-sm text-muted-foreground hover:text-foreground">✕ Закрити</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
            <div><span className="text-muted-foreground">Пристрій:</span> <strong>{selectedOrder.brand} {selectedOrder.model}</strong></div>
            <div><span className="text-muted-foreground">Дата прийому:</span> <strong>{format(new Date(selectedOrder.created_at), 'dd.MM.yyyy')}</strong></div>
            <div><span className="text-muted-foreground">Майстер:</span> <strong>{selectedOrder.assigned_master || 'Не призначено'}</strong></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground">Оплата:</span> <PaymentBadge status={selectedOrder.payment_status} /></div>
          </div>

          {selectedOrder.items && selectedOrder.items.length > 0 && (
            <>
              <h4 className="font-medium mb-2 text-sm">Виконані роботи та деталі:</h4>
              <Table
                searchable={false}
                columns={[
                  { key: 'name', label: 'Назва' },
                  { key: 'quantity', label: 'Кіл-ть' },
                  { key: 'total_price', label: 'Сума', render: v => `${Number(v).toFixed(0)} ₴` },
                ]}
                data={selectedOrder.items}
              />
              <div className="mt-4 flex flex-col items-end gap-1">
                <div>
                  <span className="text-muted-foreground mr-3 text-sm">Загалом:</span>
                  <span className="text-lg font-bold">{selectedOrder.items.reduce((s, i) => s + i.total_price, 0).toFixed(0)} ₴</span>
                </div>
                {(() => {
                  const total = selectedOrder.items.reduce((s, i) => s + i.total_price, 0);
                  const paid = (selectedOrder.payments || []).reduce((s, p) => s + p.amount, 0);
                  if (total > paid) {
                    return (
                      <div>
                        <span className="text-destructive mr-3 text-sm font-medium">Залишилось сплатити:</span>
                        <span className="text-lg font-bold text-destructive">{(total - paid).toFixed(0)} ₴</span>
                      </div>
                    );
                  }
                  if (total > 0 && total <= paid) {
                    return (
                      <div>
                        <span className="text-success mr-3 text-sm font-medium">Оплачено повністю:</span>
                        <span className="text-lg font-bold text-success">{paid.toFixed(0)} ₴</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </>
          )}
        </div>
      )}

      {/* Завершені замовлення */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Завершені</h2>
          <Table
            searchable={false}
            columns={[
              { key: 'order_number', label: 'Номер' },
              { key: 'device', label: 'Пристрій', render: (_, row) => `${row.brand} ${row.model}` },
              { key: 'payment_status', label: 'Оплата', render: (val) => <PaymentBadge status={val} /> },
              { key: 'created_at', label: 'Дата', render: (val) => format(new Date(val), 'dd.MM.yyyy') },
            ]}
            data={completed}
          />
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="text-center py-12">
          <ClipboardList size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Поки немає замовлень</h3>
          <p className="text-muted-foreground">Коли ви здасте техніку в ремонт, статус замовлення з'явиться тут.</p>
        </div>
      )}
    </div>
  );
}
