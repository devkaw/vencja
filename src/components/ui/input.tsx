'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  /** Text shown inside the field before the value, e.g. "R$". */
  prefix?: string;
  showPasswordToggle?: boolean;
  containerClassName?: string;
}

export const fieldClasses = cn(
  'h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-ink shadow-xs',
  'placeholder:text-ink-4 transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.012]',
  'hover:border-line-strong focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3'
);

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, containerClassName, label, error, hint, icon, prefix, showPasswordToggle, type, id, ...props },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-4 [&_svg]:size-[18px]">
              {icon}
            </div>
          )}
          {prefix && !icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[15px] font-medium text-ink-3">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              fieldClasses,
              (icon || prefix) && 'pl-11',
              isPassword && showPasswordToggle && 'pr-12',
              error && 'border-neg/60 focus:border-neg focus:ring-neg/15',
              className
            )}
            {...props}
          />
          {showPasswordToggle && isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-ink-4 transition-colors hover:text-ink-2"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-neg">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-ink-3">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
