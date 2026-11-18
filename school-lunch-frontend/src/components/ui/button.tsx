'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-800 text-white shadow-xs hover:bg-emerald-900 focus-visible:ring-emerald-700 active:scale-[0.98]',
        primary:
          'bg-slate-900 text-white shadow-xs hover:bg-slate-800 focus-visible:ring-slate-800 active:scale-[0.98]',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200/80 focus-visible:ring-slate-400',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-emerald-600',
        destructive:
          'bg-rose-600 text-white shadow-xs hover:bg-rose-700 focus-visible:ring-rose-500 active:scale-[0.98]',
        warning:
          'bg-amber-600 text-white shadow-xs hover:bg-amber-700 focus-visible:ring-amber-500 active:scale-[0.98]',
        ghost:
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        link: 'text-emerald-800 underline-offset-4 hover:underline focus-visible:ring-emerald-700',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base font-medium',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
