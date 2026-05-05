'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-light text-slate-300 mb-1.5">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-light',
            'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
            'transition-all duration-200',
            error && 'border-danger focus:border-danger focus:ring-danger/50',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };