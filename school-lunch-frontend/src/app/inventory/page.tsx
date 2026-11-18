'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PackageOpen,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { FilterPanel } from '@/components/shared/filter-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/ui/toast';
import { useRole } from '@/lib/auth/roles';
import { Badge } from '@/components/ui/badge';
import {
  useIngredients,
  useIngredient,
  useIngredientMovements,
  useAlerts,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useStockIn,
  useStockOut,
} from '@/features/inventory/hooks';
import type {
  Ingredient,
  IngredientInput,
  IngredientStatus,
  AvailabilityFilter,
  ExpiryFilter,
  StockMovement,
} from '@/features/inventory/types';
import {
  ingredientSchema,
  stockInOutSchema,
  type IngredientFormValues,
  type StockInOutFormValues,
} from '@/features/inventory/schemas';
import { AppApiError } from '@/features/inventory/api';

const UNIT_OPTIONS = [
  { label: 'Grams (g)', value: 'g' },
  { label: 'Milliliters (ml)', value: 'ml' },
  { label: 'Piece', value: 'piece' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

const EXPIRY_OPTIONS = [
  { label: 'Expired', value: 'expired' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
  { label: 'Valid', value: 'valid' },
];

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Stock In',
  OUT: 'Stock Out',
  ADJUSTMENT: 'Adjustment',
};

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-rose-100 text-rose-700',
  ADJUSTMENT: 'bg-amber-100 text-amber-700',
};

const DEFAULT_VALUES: IngredientFormValues = {
  name: '',
  category: '',
  unit: 'g',
  quantity: 0,
  minStockLevel: 0,
  expiryDate: '',
  vendor: '',
  status: 'Active',
};

const DEFAULT_STOCK_VALUES: StockInOutFormValues = {
  quantity: 0,
  reason: '',
  reference: '',
};

function extractFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const d of details as { path?: string; field?: string; message: string }[]) {
      const key = (d.path ?? d.field ?? '').split('.').pop();
      if (key && !out[key]) out[key] = d.message;
    }
  } else if (details && typeof details === 'object') {
    for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
      out[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return out;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

export default function InventoryPage() {
  const { hasPermission } = useRole();
  const toast = useToast();

  const [filters, setFilters] = React.useState({
    search: '',
    category: '',
    status: 'all',
    availability: 'all',
    expiry: 'all',
  });
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'create' | 'edit'>('create');

  const [stockDialogOpen, setStockDialogOpen] = React.useState(false);
  const [stockDialogIngredient, setStockDialogIngredient] = React.useState<Ingredient | null>(null);
  const [stockDialogMode, setStockDialogMode] = React.useState<'in' | 'out'>('in');

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailIngredient, setDetailIngredient] = React.useState<Ingredient | null>(null);
  const [movementsPage, setMovementsPage] = React.useState(1);
  const [movementsLimit] = React.useState(10);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register: stockRegister,
    handleSubmit: stockHandleSubmit,
    reset: stockReset,
    setError: stockSetError,
    formState: { errors: stockErrors, isSubmitting: stockSubmitting },
  } = useForm<StockInOutFormValues>({
    resolver: zodResolver(stockInOutSchema),
    defaultValues: DEFAULT_STOCK_VALUES,
  });

  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = useIngredients({
    page,
    limit,
    search: filters.search || undefined,
    category: filters.category || undefined,
    status: filters.status === 'all' ? undefined : (filters.status as IngredientStatus),
    availability: filters.availability === 'all' ? undefined : (filters.availability as AvailabilityFilter),
    expiry: filters.expiry === 'all' ? undefined : (filters.expiry as ExpiryFilter),
  });

  const ingredientQuery = useIngredient(editId || undefined);
  const movementsQuery = useIngredientMovements(detailIngredient?._id, { page: movementsPage, limit: movementsLimit });
  const alertsQuery = useAlerts(7);

  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const stockInMutation = useStockIn();
  const stockOutMutation = useStockOut();

  const ingredients: Ingredient[] = listData?.data?.data ?? [];
  const meta = listData?.data?.meta;

  const isEmpty = ingredients.length === 0 && !listLoading;

  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  React.useEffect(() => {
    if (listError) {
      toastRef.current.error(
        'Failed to load ingredients',
        listError instanceof AppApiError
          ? listError.message
          : 'Unable to communicate with the lunch management server.'
      );
    }
  }, [listError]);

  const setFiltersAndResetPage = React.useCallback(
    (next: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...next }));
      setPage(1);
    },
    []
  );

  const handleFilterChange = (key: string, value: string) => {
    setFiltersAndResetPage({ [key]: value });
  };

  const handleResetFilters = () => {
    setFiltersAndResetPage({
      search: '',
      category: '',
      status: 'all',
      availability: 'all',
      expiry: 'all',
    });
  };

  const openCreate = () => {
    setMode('create');
    setEditId(null);
    reset(DEFAULT_VALUES);
    setOpen(true);
  };

  const openEdit = (id: string) => {
    setMode('edit');
    setEditId(id);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setMode('create');
    reset(DEFAULT_VALUES);
  };

  React.useEffect(() => {
    if (editId && mode === 'edit' && ingredientQuery.data?.data) {
      const i = ingredientQuery.data.data;
      reset({
        name: i.name,
        category: i.category ?? '',
        unit: i.unit,
        quantity: i.quantity,
        minStockLevel: i.minStockLevel,
        expiryDate: i.expiryDate ? i.expiryDate.slice(0, 10) : '',
        vendor: i.vendor ?? '',
        status: i.status,
      });
    }
  }, [editId, mode, ingredientQuery.data?.data, reset]);

  const handleSubmitError = React.useCallback(
    (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 400) {
          const fields = extractFieldErrors(error.details);
          const keys = Object.keys(fields);
          if (keys.length === 0) {
            toast.error('Invalid data', error.message);
            return;
          }
          keys.forEach((field) =>
            setError(field as keyof IngredientFormValues, {
              type: 'server',
              message: fields[field],
            })
          );
          return;
        }
        if (error.statusCode === 409) {
          setError('name', {
            type: 'server',
            message: error.message || 'An ingredient with this name already exists.',
          });
          return;
        }
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested ingredient could not be found.');
          return;
        }
        toast.error('Server error', error.message || 'Something went wrong.');
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    },
    [setError, toast]
  );

  const onSubmit = async (data: IngredientFormValues) => {
    const payload: IngredientInput = {
      name: data.name.trim(),
      category: data.category?.trim() || undefined,
      unit: data.unit,
      quantity: data.quantity,
      minStockLevel: data.minStockLevel,
      expiryDate: data.expiryDate || undefined,
      vendor: data.vendor || undefined,
      status: data.status,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (editId) {
        await updateMutation.mutateAsync({ id: editId, payload });
      }
      closeModal();
    } catch (error) {
      handleSubmitError(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ingredient "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      if (error instanceof AppApiError && error.statusCode === 409) {
        // The hook already shows a toast for 409, but we can also show a confirmation
        // The backend message already suggests setting to Inactive
        return;
      }
      // useDeleteIngredient already shows the toast (404 / network).
    }
  };

  const openStockDialog = (ingredient: Ingredient, type: 'in' | 'out') => {
    setStockDialogIngredient(ingredient);
    setStockDialogMode(type);
    stockReset(DEFAULT_STOCK_VALUES);
    setStockDialogOpen(true);
  };

  const closeStockDialog = () => {
    setStockDialogOpen(false);
    setStockDialogIngredient(null);
    stockReset(DEFAULT_STOCK_VALUES);
  };

  const handleStockSubmit = async (data: StockInOutFormValues) => {
    if (!stockDialogIngredient) return;

    const payload = {
      quantity: data.quantity,
      reason: data.reason || undefined,
      reference: data.reference || undefined,
    };

    try {
      if (stockDialogMode === 'in') {
        await stockInMutation.mutateAsync({ id: stockDialogIngredient._id, payload });
      } else {
        await stockOutMutation.mutateAsync({ id: stockDialogIngredient._id, payload });
      }
      closeStockDialog();
    } catch (error) {
      if (error instanceof AppApiError) {
        if (error.statusCode === 409) {
          stockSetError('quantity', {
            type: 'server',
            message: error.message || 'Insufficient stock',
          });
          return;
        }
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested ingredient could not be found.');
          return;
        }
        if (error.statusCode === 400) {
          const fields = extractFieldErrors(error.details);
          const keys = Object.keys(fields);
          keys.forEach((field) =>
            stockSetError(field as keyof StockInOutFormValues, {
              type: 'server',
              message: fields[field],
            })
          );
          return;
        }
        toast.error('Server error', error.message || 'Something went wrong.');
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    }
  };

  const openDetail = (ingredient: Ingredient) => {
    setDetailIngredient(ingredient);
    setMovementsPage(1);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailIngredient(null);
  };

  const lowStockAlerts = alertsQuery.data?.data?.lowStock ?? [];
  const expiredAlerts = alertsQuery.data?.data?.expired ?? [];
  const expiringSoonAlerts = alertsQuery.data?.data?.expiringSoon ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventory & Ingredient Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time stock ledger, non-negative stock movements, and expiry alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasPermission('record_stock_movement') && (
            <Button variant="outline" leftIcon={<ArrowDownUp className="w-4 h-4" />}>
              Record Movement
            </Button>
          )}
          {hasPermission('manage_inventory') && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Add Ingredient
            </Button>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStockAlerts.length > 0 || expiredAlerts.length > 0 || expiringSoonAlerts.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockAlerts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Low Stock ({lowStockAlerts.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {lowStockAlerts.slice(0, 5).map((ing) => (
                    <Badge key={ing._id} variant="warning" className="text-xs">
                      {ing.name} ({ing.quantity}{ing.unit}, min: {ing.minStockLevel}{ing.unit})
                    </Badge>
                  ))}
                  {lowStockAlerts.length > 5 && (
                    <Badge variant="default" className="text-xs">
                      +{lowStockAlerts.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {expiredAlerts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Expired ({expiredAlerts.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expiredAlerts.slice(0, 5).map((ing) => (
                    <Badge key={ing._id} variant="critical" className="text-xs">
                      {ing.name} (expired {formatDate(ing.expiryDate)})
                    </Badge>
                  ))}
                  {expiredAlerts.length > 5 && (
                    <Badge variant="default" className="text-xs">
                      +{expiredAlerts.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {expiringSoonAlerts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Expiring Soon ({expiringSoonAlerts.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expiringSoonAlerts.slice(0, 5).map((ing) => (
                    <Badge key={ing._id} variant="primary" className="text-xs">
                      {ing.name} (expires {formatDate(ing.expiryDate)})
                    </Badge>
                  ))}
                  {expiringSoonAlerts.length > 5 && (
                    <Badge variant="default" className="text-xs">
                      +{expiringSoonAlerts.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <FilterPanel
        searchQuery={filters.search}
        onSearchChange={(val) => setFiltersAndResetPage({ search: val })}
        searchPlaceholder="Search by ingredient name..."
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: [
              { label: 'Produce', value: 'Produce' },
              { label: 'Dairy', value: 'Dairy' },
              { label: 'Meat', value: 'Meat' },
              { label: 'Grains', value: 'Grains' },
              { label: 'Spices', value: 'Spices' },
              { label: 'Beverages', value: 'Beverages' },
              { label: 'Other', value: 'Other' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: STATUS_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
          },
          {
            key: 'availability',
            label: 'Availability',
            options: AVAILABILITY_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
          },
          {
            key: 'expiry',
            label: 'Expiry',
            options: EXPIRY_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
          },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      <Card>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} columns={7} />
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={PackageOpen}
              title="No ingredients found"
              description="No ingredients match the current filters. Try resetting filters or add a new ingredient."
              actionLabel="Add Ingredient"
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Qty / Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Min Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Stock Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {ingredients.map((ingredient) => (
                    <tr
                      key={ingredient._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {ingredient.name}
                      </td>
                      <td className="px-4 py-3">{ingredient.category || '—'}</td>
                      <td className="px-4 py-3 font-mono">
                        {ingredient.quantity} {ingredient.unit}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {ingredient.minStockLevel} {ingredient.unit}
                      </td>
                      <td className="px-4 py-3">
                        {ingredient.expiryDate ? (
                          <>
                            {formatDate(ingredient.expiryDate)}
                            {ingredient.expiryStatus && (
                              <span className="ml-2">
                                <StatusBadge status={ingredient.expiryStatus} />
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ingredient.stockStatus || 'Out of Stock'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('record_stock_movement') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openStockDialog(ingredient, 'in')}
                              aria-label={`Stock in ${ingredient.name}`}
                              leftIcon={<ArrowDownUp className="w-3.5 h-3.5" />}
                            >
                              In
                            </Button>
                          )}
                          {hasPermission('record_stock_movement') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openStockDialog(ingredient, 'out')}
                              aria-label={`Stock out ${ingredient.name}`}
                              leftIcon={<ArrowDownUp className="w-3.5 h-3.5" />}
                            >
                              Out
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetail(ingredient)}
                            aria-label={`View details ${ingredient.name}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          {hasPermission('manage_inventory') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(ingredient._id)}
                              aria-label={`Edit ${ingredient.name}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {hasPermission('manage_inventory') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(ingredient._id, ingredient.name)}
                              aria-label={`Delete ${ingredient.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {meta && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-slate-900">
                      {Math.min((page - 1) * limit + 1, meta.total)}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-slate-900">
                      {Math.min(page * limit, meta.total)}
                    </span>{' '}
                    of <span className="font-semibold text-slate-900">{meta.total}</span> ingredients
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="px-2 font-medium">
                      Page {page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, meta.totalPages))
                      }
                      disabled={page >= meta.totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Ingredient Modal */}
      <Modal
        isOpen={open}
        onClose={closeModal}
        title={mode === 'create' ? 'Add Ingredient' : 'Edit Ingredient'}
        description={
          mode === 'create'
            ? 'Create a new ingredient record. Stock levels and expiry are tracked automatically.'
            : 'Update the ingredient record. Changes are saved to the backend.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Ingredient name <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g. Chicken Breast"
                error={errors.name?.message}
              />
              {errors.name && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Category
              </label>
              <Select {...register('category')} error={errors.category?.message}>
                <option value="" disabled>
                  Select category
                </option>
                {['Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Beverages', 'Other'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {errors.category && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Unit <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Select {...register('unit')} error={errors.unit?.message}>
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {errors.unit && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.unit.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Current Quantity <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                error={errors.quantity?.message}
              />
              {errors.quantity && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Minimum Stock Level <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...register('minStockLevel', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                error={errors.minStockLevel?.message}
              />
              {errors.minStockLevel && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.minStockLevel.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Expiry Date
              </label>
              <Input
                {...register('expiryDate')}
                type="date"
                error={errors.expiryDate?.message}
              />
              {errors.expiryDate && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.expiryDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Vendor ID
              </label>
              <Input
                {...register('vendor')}
                placeholder="Optional vendor ObjectId"
                error={errors.vendor?.message}
              />
              {errors.vendor && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.vendor.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Status
              </label>
              <Select {...register('status')} error={errors.status?.message}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText={
                mode === 'create' ? 'Adding…' : 'Saving…'
              }
              disabled={isSubmitting}
            >
              {mode === 'create' ? 'Add Ingredient' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock In/Out Dialog */}
      <Modal
        isOpen={stockDialogOpen}
        onClose={closeStockDialog}
        title={stockDialogMode === 'in' ? 'Receive Stock' : 'Issue Stock'}
        description={
          stockDialogMode === 'in'
            ? `Record incoming stock for ${stockDialogIngredient?.name}.`
            : `Record outgoing stock for ${stockDialogIngredient?.name}. Stock cannot go negative.`
        }
        maxWidth="md"
      >
        <form onSubmit={stockHandleSubmit(handleStockSubmit)} className="space-y-4">
          {stockDialogIngredient && (
            <div className="p-3 bg-slate-50 rounded-lg text-xs">
              <p className="font-medium text-slate-900">{stockDialogIngredient.name}</p>
              <p className="text-slate-500">
                Current: {stockDialogIngredient.quantity} {stockDialogIngredient.unit}
                | Min: {stockDialogIngredient.minStockLevel} {stockDialogIngredient.unit}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Quantity <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <Input
              {...stockRegister('quantity', { valueAsNumber: true })}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter quantity"
              error={stockErrors.quantity?.message}
            />
            {stockErrors.quantity && (
              <p className="text-xs font-medium text-rose-600">
                {stockErrors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason
            </label>
            <Input
              {...stockRegister('reason')}
              placeholder="e.g. Delivery received, Kitchen usage"
              error={stockErrors.reason?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reference (optional)
            </label>
            <Input
              {...stockRegister('reference')}
              placeholder="e.g. PO-12345, Recipe-001"
              error={stockErrors.reference?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeStockDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={stockSubmitting}
              loadingText={
                stockDialogMode === 'in' ? 'Receiving…' : 'Issuing…'
              }
              disabled={stockSubmitting}
            >
              {stockDialogMode === 'in' ? 'Receive Stock' : 'Issue Stock'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ingredient Detail Modal with Movement History */}
      <Modal
        isOpen={detailOpen}
        onClose={closeDetail}
        title="Ingredient Details"
        description="Stock movement history and current status."
        maxWidth="lg"
      >
        {detailIngredient && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{detailIngredient.name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Category</p>
                <p className="font-medium text-slate-900">{detailIngredient.category || '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Current Stock</p>
                <p className="font-mono font-medium text-slate-900">
                  {detailIngredient.quantity} {detailIngredient.unit}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Min Stock Level</p>
                <p className="font-mono font-medium text-slate-900">
                  {detailIngredient.minStockLevel} {detailIngredient.unit}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2">
                <p className="text-xs text-slate-500">Expiry Date</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  {detailIngredient.expiryDate ? formatDate(detailIngredient.expiryDate) : '—'}
                  {detailIngredient.expiryStatus && (
                    <StatusBadge status={detailIngredient.expiryStatus} />
                  )}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Stock Status</p>
                <p className="font-medium text-slate-900">
                  <StatusBadge status={detailIngredient.stockStatus || 'Out of Stock'} />
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-medium text-slate-900">
                  <StatusBadge status={detailIngredient.status} />
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2">
                <p className="text-xs text-slate-500">Vendor ID</p>
                <p className="font-mono text-slate-900 text-xs">{detailIngredient.vendor || '—'}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Stock Movement History</h4>
              {movementsQuery.isLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={6} />
                </div>
              ) : movementsQuery.data?.data?.data?.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No stock movements recorded yet.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                            Before
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                            After
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Reason
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                            Reference
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {movementsQuery.data?.data?.data?.map((movement: StockMovement) => (
                          <tr key={movement._id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-2 text-slate-600">
                              {formatDate(movement.createdAt)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MOVEMENT_TYPE_COLORS[movement.type] || 'bg-slate-100 text-slate-700'}`}
                              >
                                {MOVEMENT_TYPE_LABELS[movement.type] || movement.type}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {movement.type === 'OUT' ? '-' : '+'}{movement.quantity} {detailIngredient.unit}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-500">
                              {movement.quantityBefore} {detailIngredient.unit}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-medium">
                              {movement.quantityAfter} {detailIngredient.unit}
                            </td>
                            <td className="px-4 py-2 text-slate-600">{movement.reason || '—'}</td>
                            <td className="px-4 py-2 text-slate-600">{movement.reference || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {movementsQuery.data?.data?.meta && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 mt-4">
                      <div>
                        Showing{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min((movementsPage - 1) * movementsLimit + 1, movementsQuery.data.data.meta.total)}
                        </span>{' '}
                        to{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(movementsPage * movementsLimit, movementsQuery.data.data.meta.total)}
                        </span>{' '}
                        of <span className="font-semibold text-slate-900">{movementsQuery.data.data.meta.total}</span> movements
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setMovementsPage((p) => Math.max(p - 1, 1))}
                          disabled={movementsPage === 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="px-2 font-medium">
                          Page {movementsPage} of {movementsQuery.data.data.meta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            setMovementsPage((p) => Math.min(p + 1, movementsQuery.data!.data!.meta.totalPages))
                          }
                          disabled={movementsPage >= movementsQuery.data.data.meta.totalPages}
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}