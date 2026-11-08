'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The one solid green block of a screen, same treatment as the landing's "Seu dinheiro é seu". */
export function LeadPanel({ icon: Icon, label, children, className }: { icon: LucideIcon; label: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.012 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn('glass-brand relative flex flex-col overflow-hidden rounded-[32px] p-6 text-white @2xl:p-8', className)}
      aria-label={label}
    >
      <Icon className="pointer-events-none absolute -bottom-10 -right-8 size-60 rotate-[-12deg] text-white/[0.07]" aria-hidden />
      <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{label}</p>
      <div className="relative mt-auto flex min-w-0 flex-1 flex-col">{children}</div>
    </motion.section>
  );
}
