'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fieldClasses } from './input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
}

// Native select on purpose: it gives the best picker on phones.
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, hint, options, id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id || autoId;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            className={cn(
              fieldClasses,
              'cursor-pointer appearance-none pr-10',
              error && 'border-neg/60 focus:border-neg focus:ring-neg/15',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
        </div>
        {error && <p className="mt-1.5 text-sm text-neg">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-ink-3">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
