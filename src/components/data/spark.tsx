'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Trend line without axes, for small tiles. */
export function Spark({ values, color = 'rgb(var(--pos-fill))', className }: { values: number[]; color?: string; className?: string }) {
  const reduce = useReducedMotion();
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pontos = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 24}`);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn('h-8 w-full overflow-visible', className)} aria-hidden>
      <motion.polyline points={pontos.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
  );
}
