import { cn } from '@/lib/utils';

/** The small "PRO" mark next to features of the paid plan. Same green glass as the primary button. */
export function ProTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'glass-brand inline-flex h-[18px] shrink-0 items-center rounded-full px-1.5 text-[10px] font-bold leading-none tracking-[0.08em] text-white',
        className
      )}
    >
      PRO
    </span>
  );
}
