'use client';

import * as React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FilterPanelProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  selectedFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onResetFilters?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function FilterPanel({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  selectedFilters = {},
  onFilterChange,
  onResetFilters,
  actions,
  children,
}: FilterPanelProps) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    Object.values(selectedFilters).some((v) => v !== '' && v !== 'all');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {onSearchChange && (
          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {filters.map((filter) => (
            <div key={filter.key} className="min-w-[130px]">
              <select
                value={selectedFilters[filter.key] || 'all'}
                onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 pr-8 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
              >
                <option value="all">All {filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {children}

          {hasActiveFilters && onResetFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Reset
            </Button>
          )}

          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
