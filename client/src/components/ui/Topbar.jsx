import React from 'react';
import { Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ setSidebarOpen }) {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="shrink-0 sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground uppercase">{user?.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0) || <User size={16} />}
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Вийти"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
