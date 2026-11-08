'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'info' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-surface-3 text-ink-2',
  secondary: 'bg-surface-3 text-ink-3',
  primary: 'bg-brand-soft text-brand-ink',
  success: 'bg-pos-soft text-pos',
  danger: 'bg-neg-soft text-neg',
  warning: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  outline: 'border border-line text-ink-2',
};

const dots = {
  default: 'bg-ink-3',
  secondary: 'bg-ink-4',
  primary: 'bg-brand-500',
  success: 'bg-pos',
  danger: 'bg-neg',
  warning: 'bg-warn',
  info: 'bg-info',
  outline: 'bg-ink-3',
};

const sizes = {
  sm: 'h-6 px-2 text-xs',
  md: 'h-7 px-2.5 text-[13px]',
};

export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 20 }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium tnum',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dots[variant])} aria-hidden />}
      {children}
    </motion.span>
  );
}
