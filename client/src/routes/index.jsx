import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import AuthGuard from './AuthGuard';

import Landing from '../pages/Landing';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import Clients from '../pages/Clients';
import Devices from '../pages/Devices';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';
import Inventory from '../pages/Inventory';
import Finance from '../pages/Finance';
import MyOrders from '../pages/MyOrders';
import Team from '../pages/Team';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

const router = createBrowserRouter([
  // Публічні маршрути
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Auth isRegister={false} /> },
  { path: '/register', element: <Auth isRegister={true} /> },

  // Захищені маршрути (Admin та Employee/Майстер)
  {
    element: <AuthGuard allowedRoles={['admin', 'employee']} />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'clients', element: <Clients /> },
          { path: 'devices', element: <Devices /> },
          { path: 'orders', element: <Orders /> },
          { path: 'orders/:id', element: <OrderDetails /> },
          { path: 'inventory', element: <Inventory /> },
        ]
      }
    ]
  },

  // Захищені маршрути (тільки Admin)
  {
    element: <AuthGuard allowedRoles={['admin']} />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'finance', element: <Finance /> },
          { path: 'team', element: <Team /> },
          { path: 'settings', element: <Settings /> },
        ]
      }
    ]
  },

  // Захищені маршрути (Клієнт)
  {
    element: <AuthGuard allowedRoles={['client']} />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'my-orders', element: <MyOrders /> },
        ]
      }
    ]
  },

  // Спільні маршрути для всіх авторизованих
  {
    element: <AuthGuard allowedRoles={['admin', 'employee', 'client']} />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'profile', element: <Profile /> },
        ]
      }
    ]
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> }
]);

export default router;
