'use client';

import { useAppStore } from '@/lib/store';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: 'bg-white dark:bg-black border-primary/20',
    error: 'bg-white dark:bg-black border-danger/20',
    info: 'bg-white dark:bg-black border-gray-200 dark:border-gray-800',
    warning: 'bg-white dark:bg-black border-warning-500/20',
  };

  const iconStyles = {
    success: 'text-primary',
    error: 'text-danger',
    info: 'text-gray-500',
    warning: 'text-warning-500',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in min-w-[300px] max-w-md bg-white dark:bg-black',
              styles[toast.type]
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0', iconStyles[toast.type])} />
            <p className="flex-1 text-sm">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
