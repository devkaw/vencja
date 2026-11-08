'use client';

import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5',
        'bg-ink/[0.12] transition-colors duration-200 data-[state=checked]:bg-brand-500',
        'shadow-[inset_0_1px_2px_rgb(var(--shadow)/0.15)] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'block size-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18),0_0_0_0.5px_rgb(0_0_0/0.04)]',
          'transition-transform duration-300 ease-spring data-[state=checked]:translate-x-5'
        )}
      />
    </SwitchPrimitive.Root>
  );
}
