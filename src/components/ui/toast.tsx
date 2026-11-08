'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const iconStyles = {
  success: 'bg-pos-soft text-pos',
  error: 'bg-neg-soft text-neg',
  info: 'bg-info-soft text-info',
  warning: 'bg-warn-soft text-warn',
};

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:p-6"
      role="region"
      aria-label="Notificações"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-2"
            >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl', iconStyles[toast.type])}>
                <Icon className="size-[18px]" />
              </span>
              <p className="flex-1 text-sm font-medium text-ink">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-4 transition-colors hover:bg-ink/5 hover:text-ink-2"
                aria-label="Fechar notificação"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
