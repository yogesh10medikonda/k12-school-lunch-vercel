'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from './empty-state';
import { TableSkeleton } from './loading-skeleton';
import { cn } from '@/lib/utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pageSize?: number;
  initialSortKey?: string;
  initialSortDir?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching the current view or filters.',
  emptyActionLabel,
  onEmptyAction,
  pageSize = 10,
  initialSortKey,
  initialSortDir = 'asc',
  onRowClick,
  renderMobileCard,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>(initialSortDir);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <TableSkeleton rows={pageSize} columns={columns.length} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {renderMobileCard && (
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedData.map((row) => (
            <div
              key={keyExtractor(row)}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'p-4 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-slate-50'
              )}
            >
              {renderMobileCard(row)}
            </div>
          ))}
        </div>
      )}

      <div className={cn('overflow-x-auto', renderMobileCard && 'hidden md:block')}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600 select-none">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3.5',
                    col.sortable && 'cursor-pointer hover:bg-slate-100 transition-colors',
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-800" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-800" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {paginatedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'transition-colors hover:bg-slate-50/80',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5 text-sm align-middle', col.className)}
                  >
                    {col.accessor ? col.accessor(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{sortedData.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
