'use client';

import { GlassPanel, Reveal } from '@/components/motion/primitives';
import { cn } from '@/lib/utils';

interface PanelProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Children go edge to edge, for lists and tables. */
  flush?: boolean;
  strong?: boolean;
  delay?: number;
}

export function Panel({ title, eyebrow, hint, icon, action, children, className, flush, strong, delay = 0 }: PanelProps) {
  return (
    <Reveal delay={delay} y={26} className={cn('min-w-0', className)}>
      <GlassPanel lift={false} strong={strong} className="flex h-full flex-col rounded-[28px]">
        <div className={cn('flex items-start justify-between gap-3 p-5 @2xl:p-6', flush ? 'pb-3 @2xl:pb-3' : 'pb-0 @2xl:pb-0')}>
          <div className="flex min-w-0 items-center gap-3">
            {icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white [&_svg]:size-[18px]">{icon}</span>}
            <div className="min-w-0">
              {eyebrow && <p className="eyebrow mb-0.5 text-[11px]">{eyebrow}</p>}
              <h2 className="truncate font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
              {hint && <p className="truncate text-sm text-ink-3">{hint}</p>}
            </div>
          </div>
          {action}
        </div>
        <div className={cn('min-w-0 flex-1', !flush && 'p-5 @2xl:p-6')}>{children}</div>
      </GlassPanel>
    </Reveal>
  );
}

export function PanelLink({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline @2xl:min-h-0">{children}</span>;
}
