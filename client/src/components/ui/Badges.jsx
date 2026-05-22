import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = {
    received: { label: 'Отримано', variant: 'default' },
    diagnostics: { label: 'Діагностика', variant: 'warning' },
    in_progress: { label: 'В роботі', variant: 'primary' },
    waiting_parts: { label: 'Очікує деталі', variant: 'warning' },
    ready: { label: 'Готово', variant: 'success' },
    delivered: { label: 'Видано', variant: 'default' },
    cancelled: { label: 'Скасовано', variant: 'destructive' },
  };

  const current = config[status] || { label: status, variant: 'default' };

  return <Badge variant={current.variant}>{current.label}</Badge>;
}

export function PaymentBadge({ status }) {
  const config = {
    unpaid: { label: 'Не оплачено', variant: 'destructive' },
    partial: { label: 'Частково', variant: 'warning' },
    paid: { label: 'Оплачено', variant: 'success' },
  };

  const current = config[status] || { label: status, variant: 'default' };

  return <Badge variant={current.variant}>{current.label}</Badge>;
}
