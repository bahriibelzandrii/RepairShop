import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../store/toastStore';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const icons = {
  success: <CheckCircle className="text-success" size={20} />,
  error: <XCircle className="text-destructive" size={20} />,
  warning: <AlertCircle className="text-warning" size={20} />,
  info: <Info className="text-primary" size={20} />
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg shadow-lg border bg-card text-card-foreground"
            )}
          >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
