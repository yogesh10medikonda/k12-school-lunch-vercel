'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 select-none"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            id={inputId}
            className={cn(
              'flex h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer',
              error && 'border-rose-400 focus-visible:ring-rose-500 bg-rose-50/20 text-rose-950',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
