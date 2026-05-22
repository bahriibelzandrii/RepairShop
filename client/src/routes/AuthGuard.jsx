import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthGuard({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Зберігаємо маршрут для редиректу після логіну
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Якщо роль не дозволена, відправляємо на головну
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
