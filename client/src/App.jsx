import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { useThemeStore } from './store/themeStore';
import ToastContainer from './components/ui/Toast';
import ConfirmDialog from './components/ui/ConfirmDialog';

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-grid-pattern">
      <RouterProvider router={router} />
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}

export default App;
