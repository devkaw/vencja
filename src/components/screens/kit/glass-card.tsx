'use client';

import { GlassPanel } from '@/components/motion/primitives';
import { cn } from '@/lib/utils';

export function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <GlassPanel lift={false} className={cn('rounded-[28px]', className)}>
      {children}
    </GlassPanel>
  );
}
