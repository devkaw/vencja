'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium',
    'transition-[transform,background-color,box-shadow,color,border-color,filter] duration-300 ease-spring',
    'hover:scale-[1.05] active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25',
    '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-spring hover:[&_svg]:scale-125',
  ],
  {
    variants: {
      variant: {
        primary: 'glass-brand text-white hover:brightness-[1.06]',
        secondary: 'border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-surface-2',
        outline: 'border border-line-strong bg-transparent text-ink hover:bg-surface-2',
        ghost: 'text-ink-2 hover:bg-ink/[0.05] hover:text-ink',
        glass: 'glass text-ink hover:brightness-[1.03]',
        danger: 'bg-neg text-white shadow-xs hover:brightness-110 dark:text-[#2a0a08]',
        'danger-soft': 'bg-neg-soft text-neg hover:brightness-[0.97]',
        whatsapp: 'glass-brand text-white hover:brightness-[1.06]',
        link: 'h-auto rounded-md px-0 text-brand-ink underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-base [&_svg]:size-[18px]',
        xl: 'h-14 px-7 text-base [&_svg]:size-5',
        icon: 'size-10',
        'icon-sm': 'size-8 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot.Root ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot.Root>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
