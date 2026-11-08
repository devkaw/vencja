import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      {icon && (
        <div className="relative mb-4 animate-float">
          <div className="absolute inset-0 scale-150 rounded-full bg-brand-500/10 blur-xl" aria-hidden />
          <div className="relative flex size-12 items-center justify-center rounded-2xl border border-line bg-surface text-ink-3 shadow-card [&_svg]:size-[22px]">
            {icon}
          </div>
        </div>
      )}
      <p className={cn('font-semibold text-ink', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
