'use client';

import { DropdownMenu } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalContainer } from './portal-context';

export interface FilterMenuOption<T extends string> {
  value: T;
  label: string;
  /** Short text shown in the trigger when this option is chosen. Defaults to label. */
  short?: string;
  /** Second line in the menu, e.g. the score range. */
  hint?: string;
  /** Tailwind background class for a colored dot (score bands, statuses). */
  dot?: string;
}

interface FilterMenuProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterMenuOption<T>[];
  /** Accessible name, also the small caption at the top of the menu. */
  label: string;
  icon?: React.ReactNode;
  /** Value that means "no filter": the trigger stays neutral while it is chosen. */
  neutral?: T;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Filter / sort picker that matches the segmented controls next to it and opens a glass menu,
 * instead of the operating system's native select list.
 */
export function FilterMenu<T extends string>({ value, onChange, options, label, icon, neutral, align = 'start', className }: FilterMenuProps<T>) {
  const container = usePortalContainer();
  const atual = options.find((o) => o.value === value) ?? options[0];
  const ativo = neutral !== undefined && value !== neutral;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={`${label}: ${atual.label}`}
        className={cn(
          'group inline-flex h-11 min-w-0 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-medium outline-none transition-[background-color,color,transform,box-shadow] duration-300 ease-spring',
          'hover:scale-[1.03] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand-500/40',
          'data-[state=open]:scale-[1.02] data-[state=open]:shadow-[0_1px_2px_rgb(var(--shadow)/0.08),0_4px_14px_-4px_rgb(var(--shadow)/0.18)]',
          ativo ? 'bg-brand-soft text-brand-ink' : 'bg-ink/[0.05] text-ink-2 hover:text-ink data-[state=open]:bg-surface data-[state=open]:text-ink dark:data-[state=open]:bg-surface-3',
          '[&_svg]:size-4 [&_svg]:shrink-0',
          className
        )}
      >
        {icon && <span className={cn(ativo ? 'text-brand-ink' : 'text-ink-3')}>{icon}</span>}
        {atual.dot && ativo && <span className={cn('size-2 rounded-full', atual.dot)} aria-hidden />}
        <span className="truncate">{atual.short ?? atual.label}</span>
        <ChevronDown className="!size-3.5 opacity-60 transition-transform duration-300 ease-spring group-data-[state=open]:rotate-180" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className="glass-strong z-[70] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[min(20rem,calc(100vw-24px))] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-2xl p-1.5 animate-scale-in focus:outline-none"
        >
          <DropdownMenu.Label className="px-2.5 pb-1.5 pt-1 text-2xs font-semibold uppercase tracking-[0.12em] text-ink-4">{label}</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
            {options.map((opt) => (
              <DropdownMenu.RadioItem
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-xl py-2 pl-2.5 pr-9 text-sm text-ink-2 outline-none transition-colors',
                  'data-[highlighted]:bg-ink/[0.06] data-[highlighted]:text-ink data-[state=checked]:font-medium data-[state=checked]:text-ink'
                )}
              >
                {opt.dot !== undefined && <span className={cn('size-2.5 shrink-0 rounded-full ring-2 ring-surface/60', opt.dot)} aria-hidden />}
                <span className="min-w-0 flex-1 whitespace-normal">
                  <span className="block truncate">{opt.label}</span>
                  {opt.hint && <span className="block text-xs font-normal leading-snug text-ink-3 tnum">{opt.hint}</span>}
                </span>
                <DropdownMenu.ItemIndicator className="absolute right-2.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check className="size-3" strokeWidth={3} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
