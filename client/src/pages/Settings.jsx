import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { Button } from '../components/ui/Forms';
import { Moon, Sun, Database, Shield, Info } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();

  const exportDatabase = async () => {
    // Для лабораторної роботи: просто показуємо повідомлення
    // У реальному проекті тут був би запит на бекенд для експорту
    alert('Експорт бази даних — функція доступна лише на сервері (CLI: node server/export-db.js)');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Налаштування</h1>

      {/* Тема */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          {theme === 'dark' ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
          <h3 className="text-lg font-semibold">Тема інтерфейсу</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Поточна тема: <strong>{theme === 'dark' ? 'Темна' : 'Світла'}</strong>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { if (theme !== 'light') toggleTheme(); }}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors text-center ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
          >
            <Sun size={24} className="mx-auto mb-2" />
            <span className="text-sm font-medium">Світла</span>
          </button>
          <button
            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors text-center ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
          >
            <Moon size={24} className="mx-auto mb-2" />
            <span className="text-sm font-medium">Темна</span>
          </button>
        </div>
      </div>

      {/* Інформація про систему */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Про систему</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Версія</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frontend</span>
            <span className="font-mono">React 18 + Vite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Backend</span>
            <span className="font-mono">Node.js + Express</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">База даних</span>
            <span className="font-mono">SQLite (node:sqlite)</span>
          </div>
        </div>
      </div>

      {/* Резервне копіювання */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Резервне копіювання</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Файл бази даних знаходиться за адресою <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/data/db.sqlite</code>.
          Для резервного копіювання скопіюйте цей файл у безпечне місце.
        </p>
        <Button variant="outline" onClick={exportDatabase}>
          <Database size={16} className="mr-2" /> Експорт бази
        </Button>
      </div>
    </div>
  );
}
