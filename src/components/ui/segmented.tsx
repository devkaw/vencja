'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  /** "glass" floats over imagery; "solid" sits on cards. */
  tone?: 'glass' | 'solid';
}

/** Radio-group style segmented control with a sliding glass thumb. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
  tone = 'solid',
  ...rest
}: SegmentedProps<T>) {
  const layoutId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      onKeyDown={(e) => {
        // WAI-ARIA radio group: arrows move and select, Tab leaves the group.
        const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!passo) return;
        e.preventDefault();
        const atual = options.findIndex((o) => o.value === value);
        const proximo = (atual + passo + options.length) % options.length;
        onChange(options[proximo].value);
        const botoes = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        botoes[proximo]?.focus();
      }}
      className={cn(
        'relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl p-1 hide-scrollbar',
        tone === 'glass' ? 'glass' : 'bg-ink/[0.05]',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              active ? 'text-ink' : 'text-ink-2 hover:text-ink',
              '[&_svg]:size-3.5'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-[9px] bg-surface shadow-[0_1px_2px_rgb(var(--shadow)/0.08),0_2px_8px_-2px_rgb(var(--shadow)/0.12)] dark:bg-surface-3"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {opt.icon}
            {opt.label}
            {typeof opt.count === 'number' && (
              <span
                className={cn(
                  'rounded-md px-1.5 text-2xs leading-4 tnum',
                  active ? 'bg-ink/[0.07] text-ink-2' : 'bg-ink/[0.05] text-ink-2'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
