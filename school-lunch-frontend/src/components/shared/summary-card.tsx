'use client';

import * as React from 'react';
import Link from 'next/link';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'navy';
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  variant = 'default',
  className,
}: SummaryCardProps) {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-rose-100 text-rose-800',
    navy: 'bg-slate-900 text-white',
  };

  const borderVariants = {
    default: 'hover:border-slate-300',
    success: 'hover:border-emerald-300',
    warning: 'hover:border-amber-300',
    critical: 'hover:border-rose-300',
    navy: 'hover:border-slate-800',
  };

  const content = (
    <div
      className={cn(
        'group relative rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer select-none',
        borderVariants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
          </div>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
            iconVariants[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend || href) && (
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  trend.direction === 'up'
                    ? 'text-emerald-700'
                    : trend.direction === 'down'
                    ? 'text-rose-700'
                    : 'text-slate-600'
                )}
              >
                {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
                {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
                {trend.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>

          {href && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
              View <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
