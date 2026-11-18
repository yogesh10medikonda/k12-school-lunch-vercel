'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { FilterPanel } from '@/components/shared/filter-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/ui/toast';
import { useRole } from '@/lib/auth/roles';
import {
  useVendors,
  useVendor,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '@/features/vendors/hooks';
import type {
  Vendor,
  VendorInput,
  VendorStatus,
  VendorMeta,
} from '@/features/vendors/types';
import {
  vendorSchema,
  type VendorFormValues,
} from '@/features/vendors/schemas';
import { AppApiError } from '@/features/vendors/api';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const RATING_OPTIONS = [
  { label: 'No rating', value: '' },
  { label: '5 - Excellent', value: '5' },
  { label: '4 - Very Good', value: '4' },
  { label: '3 - Good', value: '3' },
  { label: '2 - Fair', value: '2' },
  { label: '1 - Poor', value: '1' },
];

const DEFAULT_VALUES: VendorFormValues = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  status: 'Active',
  rating: '',
  notes: '',
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

export default function VendorsPage() {
  const { hasPermission } = useRole();
  const toast = useToast();

  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
  });
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'create' | 'edit'>('create');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = useVendors({
    page,
    limit,
    search: filters.search || undefined,
    status: filters.status === 'all' ? undefined : (filters.status as VendorStatus),
  });

  const vendorQuery = useVendor(editId || undefined);
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();

  const rawVendors = listData?.data;
  const vendors: Vendor[] = Array.isArray(rawVendors)
    ? (rawVendors as unknown as Vendor[])
    : (listData?.data?.data ?? []);
  const meta: VendorMeta | undefined =
    (listData as unknown as { meta?: VendorMeta })?.meta ?? listData?.data?.meta;

  const isEmpty = vendors.length === 0 && !listLoading;

  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  React.useEffect(() => {
    if (listError) {
      toastRef.current.error(
        'Failed to load vendors',
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
      status: 'all',
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
    if (editId && mode === 'edit' && vendorQuery.data?.data) {
      const v = vendorQuery.data.data;
      reset({
        name: v.name,
        contactPerson: v.contactPerson ?? '',
        email: v.email ?? '',
        phone: v.phone ?? '',
        address: v.address ?? '',
        status: v.status,
        rating: v.rating != null ? String(v.rating) : '',
        notes: v.notes ?? '',
      });
    }
  }, [editId, mode, vendorQuery.data?.data, reset]);

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
            setError(field as keyof VendorFormValues, {
              type: 'server',
              message: fields[field],
            })
          );
          return;
        }
        if (error.statusCode === 409) {
          setError('name', {
            type: 'server',
            message: error.message || 'A vendor with this name already exists.',
          });
          return;
        }
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested vendor could not be found.');
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

  const onSubmit = async (data: VendorFormValues) => {
    const payload: VendorInput = {
      name: data.name.trim(),
      contactPerson: data.contactPerson?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      status: data.status,
      rating:
        data.rating !== undefined && data.rating !== '' && data.rating !== null
          ? Number(data.rating)
          : undefined,
      notes: data.notes?.trim() || undefined,
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
    if (!window.confirm(`Delete vendor "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // useDeleteVendor already shows the toast (404 / network).
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Vendor Directory & Price Comparisons
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain suppliers, contracts, price-per-unit comparisons, and catalogs.
          </p>
        </div>

        {hasPermission('manage_vendors') && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Add Supplier
          </Button>
        )}
      </div>

      <FilterPanel
        searchQuery={filters.search}
        onSearchChange={(val) => setFiltersAndResetPage({ search: val })}
        searchPlaceholder="Search by vendor name or contact person..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: STATUS_OPTIONS.map((opt) => ({
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
              <TableSkeleton rows={6} columns={6} />
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={Building2}
              title="No vendors found"
              description="No vendors match the current filters. Try resetting filters or add a new vendor."
              actionLabel="Add Supplier"
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Vendor Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Contact Person
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Contact Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {vendors.map((vendor) => (
                    <tr
                      key={vendor._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {vendor.name}
                      </td>
                      <td className="px-4 py-3">{vendor.contactPerson || '—'}</td>
                      <td className="px-4 py-3">
                        <div>{vendor.email || '—'}</div>
                        {vendor.phone && (
                          <div className="text-xs text-slate-400">{vendor.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{vendor.address || '—'}</td>
                      <td className="px-4 py-3">
                        {vendor.rating ? (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {vendor.rating} / 5
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('manage_vendors') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(vendor._id)}
                              aria-label={`Edit ${vendor.name}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {hasPermission('manage_vendors') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(vendor._id, vendor.name)}
                              aria-label={`Delete ${vendor.name}`}
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
                    of <span className="font-semibold text-slate-900">{meta.total}</span> vendors
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

      <Modal
        isOpen={open}
        onClose={closeModal}
        title={mode === 'create' ? 'Add Supplier' : 'Edit Supplier'}
        description={
          mode === 'create'
            ? 'Add a new vendor record. Contact and rating information is stored securely.'
            : 'Update the vendor record. Changes are saved to the backend.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Vendor name <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g. Sysco Food Services"
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
                Contact person
              </label>
              <Input
                {...register('contactPerson')}
                placeholder="e.g. John Doe"
                error={errors.contactPerson?.message}
              />
              {errors.contactPerson && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="e.g. orders@sysco.com"
                error={errors.email?.message}
              />
              {errors.email && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Phone
              </label>
              <Input
                {...register('phone')}
                placeholder="e.g. (555) 123-4567"
                error={errors.phone?.message}
              />
              {errors.phone && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Rating
              </label>
              <Select {...register('rating')} error={errors.rating?.message}>
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {errors.rating && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.rating.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Address
              </label>
              <Input
                {...register('address')}
                placeholder="e.g. 123 Industrial Parkway, Suite 100"
                error={errors.address?.message}
              />
              {errors.address && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
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

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Notes
              </label>
              <Input
                {...register('notes')}
                placeholder="e.g. Delivery on Tuesday and Thursday mornings only."
                error={errors.notes?.message}
              />
              {errors.notes && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.notes.message}
                </p>
              )}
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
              {mode === 'create' ? 'Add Supplier' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
