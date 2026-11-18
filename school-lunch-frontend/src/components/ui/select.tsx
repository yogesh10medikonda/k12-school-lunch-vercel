import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      error,
      label,
      helperText,
      options,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 select-none"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            className={cn(
              'flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 pr-9 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer',
              error &&
                'border-rose-400 focus-visible:ring-rose-500 bg-rose-50/20 text-rose-950',
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-desc` : undefined}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-desc`} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
