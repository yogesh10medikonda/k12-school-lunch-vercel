import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 text-slate-800 border border-slate-200/80',
        primary:
          'bg-emerald-900/10 text-emerald-900 border border-emerald-900/20',
        success:
          'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
        warning:
          'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
        critical:
          'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
        outline:
          'border border-slate-300 text-slate-700 bg-white',
        navy:
          'bg-slate-900 text-slate-50',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.2 text-[11px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({
  className,
  variant,
  size,
  dot = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColor ||
              (variant === 'success'
                ? 'bg-emerald-500'
                : variant === 'warning'
                ? 'bg-amber-500'
                : variant === 'critical'
                ? 'bg-rose-500'
                : 'bg-slate-400')
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
