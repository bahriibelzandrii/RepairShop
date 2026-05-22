import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, CheckCircle, Search, ArrowRight, Monitor, Cpu, Smartphone, Clock } from 'lucide-react';
import { Input, Button } from '../components/ui/Forms';
import { StatusBadge, PaymentBadge } from '../components/ui/Badges';
import { format } from 'date-fns';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

export default function Landing() {
  const [ticket, setTicket] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticket.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/orders/search/${encodeURIComponent(ticket.trim())}`);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-primary font-bold text-xl font-mono">
          <Wrench size={24} />
          <span>LabRepair</span>
        </div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Link to={user?.role === 'client' ? '/my-orders' : '/dashboard'}>
              <Button>Перейти в кабінет <ArrowRight size={16} className="ml-2" /></Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Увійти</Button>
              </Link>
              <Link to="/register">
                <Button>Реєстрація</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-16 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Clock size={14} /> Працюємо без вихідних 9:00 — 20:00
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
          Професійний ремонт <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            вашої техніки
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
          Швидко, якісно та з гарантією. Відстежуйте статус ремонту онлайн,
          отримуйте електронні квитанції та зручно спілкуйтесь з майстром.
        </p>

        {/* Quick Search */}
        <div className="w-full max-w-lg bg-card p-6 rounded-2xl shadow-lg border border-border mb-16">
          <h3 className="font-semibold text-lg mb-4 text-left">Перевірити статус ремонту</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Номер квитанції або телефон"
                className="pl-10"
                value={ticket}
                onChange={(e) => { setTicket(e.target.value); setSearchResults(null); }}
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? '...' : 'Шукати'}
            </Button>
          </form>

          {/* Результати пошуку */}
          {searchResults !== null && (
            <div className="mt-4 text-left">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">Замовлень не знайдено. Перевірте номер квитанції.</p>
              ) : (
                <div className="divide-y divide-border">
                  {searchResults.map((order, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium font-mono text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.brand} {order.model}</p>
                        {order.assigned_master && (
                          <p className="text-xs text-muted-foreground mt-0.5">Майстер: {order.assigned_master}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 w-full mb-16">
          {[
            { icon: Monitor, title: 'Швидка діагностика', desc: 'Безкоштовна діагностика у разі згоди на ремонт. Результат — за 30 хвилин.' },
            { icon: Cpu, title: 'Оригінальні запчастини', desc: 'Використовуємо лише перевірені та якісні комплектуючі від надійних постачальників.' },
            { icon: Smartphone, title: 'Гарантія якості', desc: 'Надаємо гарантію на всі виконані роботи від 3 місяців до 1 року.' },
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-card rounded-xl border border-border text-left hover:border-primary/50 hover:shadow-md transition-all duration-300">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                <feature.icon size={24} />
              </div>
              <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-2xl text-center shadow-sm">
            <h3 className="text-2xl font-bold mb-3">Потрібен ремонт?</h3>
            <p className="text-muted-foreground mb-6">Зареєструйтесь, щоб відстежувати замовлення онлайн та отримувати сповіщення.</p>
            <div className="flex justify-center gap-4">
              <Link to="/register"><Button>Створити акаунт <ArrowRight size={16} className="ml-2" /></Button></Link>
              <Link to="/login"><Button variant="outline">Увійти</Button></Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 LabRepair — Система управління майстернею з ремонту</p>
      </footer>
    </div>
  );
}
