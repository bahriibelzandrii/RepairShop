import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  MonitorSmartphone, 
  ClipboardList, 
  Package, 
  CreditCard,
  Settings,
  UserCircle,
  X,
  UsersRound
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuthStore();

  const links = [
    // Адмін та Майстер
    { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд', roles: ['admin', 'employee'] },
    { to: '/orders', icon: ClipboardList, label: 'Замовлення', roles: ['admin', 'employee'] },
    { to: '/clients', icon: Users, label: 'Клієнти', roles: ['admin', 'employee'] },
    { to: '/devices', icon: MonitorSmartphone, label: 'Пристрої', roles: ['admin', 'employee'] },
    { to: '/inventory', icon: Package, label: 'Склад', roles: ['admin', 'employee'] },
    // Тільки адмін
    { to: '/finance', icon: CreditCard, label: 'Фінанси', roles: ['admin'] },
    { to: '/team', icon: UsersRound, label: 'Персонал', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Налаштування', roles: ['admin'] },
    // Клієнт
    { to: '/my-orders', icon: ClipboardList, label: 'Мої замовлення', roles: ['client'] },
    // Усі ролі
    { to: '/profile', icon: UserCircle, label: 'Профіль', roles: ['admin', 'employee', 'client'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user?.role));

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <NavLink to="/" className="text-xl font-bold font-mono tracking-tight text-primary hover:opacity-80 transition-opacity">
            LabRepair
          </NavLink>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
