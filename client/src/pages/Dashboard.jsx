import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  ClipboardList, 
  Package, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench
} from 'lucide-react';
import { StatusBadge, PaymentBadge } from '../components/ui/Badges';
import { Skeleton } from '../components/ui/Skeleton';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, clientsRes, invRes] = await Promise.all([
          api.get('/orders'),
          api.get('/clients'),
          api.get('/inventory')
        ]);
        
        const orders = ordersRes.data;
        const inventory = invRes.data;
        const myOrders = orders.filter(o => o.assigned_to === user?.id);

        setStats({
          totalOrders: orders.length,
          activeOrders: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
          totalClients: clientsRes.data.length,
          lowStock: inventory.filter(i => i.category !== 'service' && i.stock_quantity <= i.min_stock).length,
          recentOrders: orders.slice(0, 6),
          myOrders: myOrders,
          myActive: myOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)),
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  // ═══ Картки для Адміна ═══
  const adminCards = [
    { title: 'Активні замовлення', value: stats.activeOrders, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Всього клієнтів', value: stats.totalClients, icon: Users, color: 'text-success', bg: 'bg-success/10' },
    { title: 'Низький запас', value: stats.lowStock, icon: AlertCircle, color: stats.lowStock > 0 ? 'text-destructive' : 'text-muted-foreground', bg: stats.lowStock > 0 ? 'bg-destructive/10' : 'bg-muted' },
    { title: 'Всього замовлень', value: stats.totalOrders, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  // ═══ Картки для Майстра ═══
  const employeeCards = [
    { title: 'Мої активні', value: stats.myActive.length, icon: Wrench, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Всього призначено', value: stats.myOrders.length, icon: ClipboardList, color: 'text-warning', bg: 'bg-warning/10' },
    { title: 'Активні в системі', value: stats.activeOrders, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
    { title: 'Низький запас', value: stats.lowStock, icon: AlertCircle, color: stats.lowStock > 0 ? 'text-destructive' : 'text-muted-foreground', bg: stats.lowStock > 0 ? 'bg-destructive/10' : 'bg-muted' },
  ];

  const statCards = user?.role === 'admin' ? adminCards : employeeCards;
  const displayOrders = user?.role === 'employee' ? stats.myActive : stats.recentOrders;
  const ordersTitle = user?.role === 'employee' ? 'Мої активні замовлення' : 'Останні замовлення';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {user?.role === 'employee' ? `Вітаємо, ${user.name}!` : 'Огляд системи'}
        </h1>
        {user?.role === 'employee' && (
          <p className="text-muted-foreground mt-1">Ось ваші поточні завдання та статистика.</p>
        )}
      </div>

      {/* Статистичні картки */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div key={i} className="p-6 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-full ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Список замовлень */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-lg">{ordersTitle}</h3>
          </div>
          <div className="divide-y divide-border">
            {displayOrders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {user?.role === 'employee' ? 'Немає призначених замовлень' : 'Немає замовлень'}
              </div>
            ) : (
              displayOrders.map(order => (
                <div 
                  key={order.id} 
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.first_name} {order.last_name} — {order.brand} {order.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Швидкі дії */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-lg">Швидкі дії</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="p-4 border border-border rounded-lg text-center hover:border-primary hover:text-primary transition-colors"
            >
              <ClipboardList className="mx-auto mb-2" />
              <span className="text-sm">Замовлення</span>
            </button>
            <button
              onClick={() => navigate('/clients')}
              className="p-4 border border-border rounded-lg text-center hover:border-primary hover:text-primary transition-colors"
            >
              <Users className="mx-auto mb-2" />
              <span className="text-sm">Клієнти</span>
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="p-4 border border-border rounded-lg text-center hover:border-primary hover:text-primary transition-colors"
            >
              <Package className="mx-auto mb-2" />
              <span className="text-sm">Склад</span>
            </button>
            <button
              onClick={() => navigate('/devices')}
              className="p-4 border border-border rounded-lg text-center hover:border-primary hover:text-primary transition-colors"
            >
              <CheckCircle className="mx-auto mb-2" />
              <span className="text-sm">Пристрої</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
