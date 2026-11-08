'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  label?: string;
}

const colors = {
  primary: 'bg-brand-500',
  success: 'bg-pos',
  warning: 'bg-warn',
  danger: 'bg-neg',
};

export function Progress({ value, max = 100, className, showLabel = false, color = 'primary', label }: ProgressProps) {
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className={cn('h-full rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {showLabel && <p className="mt-1 text-right text-xs text-ink-3 tnum">{Math.round(percentage)}%</p>}
    </div>
  );
}
