import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  createVendor,
  deleteVendor,
  getVendorById,
  listVendors,
  updateVendor,
  listVendorIngredients,
  upsertVendorIngredient,
  deleteVendorIngredient,
} from '@/features/vendors/api';
import type {
  ListVendorsParams,
  Vendor,
  VendorInput,
  VendorIngredient,
  VendorIngredientInput,
} from '@/features/vendors/types';
import { useToast } from '@/components/ui/toast';
import { AppApiError } from '@/lib/api-client';

export const vendorsKeys = {
  all: ['vendors'] as const,
  list: (params: ListVendorsParams) =>
    [...vendorsKeys.all, 'list', params] as const,
  detail: (id: string) => [...vendorsKeys.all, 'detail', id] as const,
  ingredients: (vendorId: string) =>
    [...vendorsKeys.all, 'ingredients', vendorId] as const,
};

/** List query with server-side pagination, search, and filters. */
export function useVendors(params: ListVendorsParams = {}) {
  return useQuery({
    queryKey: vendorsKeys.list(params),
    queryFn: () => listVendors(params),
    placeholderData: (previousData) => previousData,
  });
}

/** Single vendor detail query. */
export function useVendor(id?: string) {
  return useQuery({
    queryKey: vendorsKeys.detail(id ?? ''),
    queryFn: () => getVendorById(id!),
    enabled: Boolean(id),
  });
}

/**
 * Create vendor mutation.
 * On success: invalidate vendor queries + toast.
 * On error: 400/409 field errors and 404/network toasts are handled by the
 * caller via mutateAsync rejection so they can be shown next to the right fields.
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: VendorInput) => {
      const res = await createVendor(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsKeys.all });
      toast.success('Vendor added');
    },
    onError: () => {
      // Intentional no-op: caller handles 400/409 field errors and toasts via mutateAsync rejection.
    },
  } as UseMutationOptions<Vendor, unknown, VendorInput>);
}

/**
 * Update vendor mutation.
 * On success: invalidate vendor queries + toast.
 * On error: handled by the caller via mutateAsync rejection.
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<VendorInput>;
    }) => {
      const res = await updateVendor(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsKeys.all });
      toast.success('Vendor updated');
    },
    onError: () => {
      // Intentional no-op: caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<
    Vendor,
    unknown,
    { id: string; payload: Partial<VendorInput> }
  >);
}

/**
 * Delete vendor mutation.
 * On success: invalidate vendor queries + toast.
 * On error: 404 and network failures are shown as toasts.
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteVendor(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsKeys.all });
      toast.success('Vendor deleted');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested vendor could not be found.');
          return;
        }
        toast.error('Request failed', error.message);
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    },
  } as UseMutationOptions<
    { success: boolean; message: string },
    unknown,
    string
  >);
}

/** Vendor ingredients price catalog query. */
export function useVendorIngredients(vendorId?: string) {
  return useQuery({
    queryKey: vendorsKeys.ingredients(vendorId ?? ''),
    queryFn: () => listVendorIngredients(vendorId!),
    enabled: Boolean(vendorId),
  });
}

/** Upsert vendor ingredient price mutation. */
export function useUpsertVendorIngredient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: VendorIngredientInput) => {
      const res = await upsertVendorIngredient(payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: vendorsKeys.ingredients(variables.vendor),
      });
      toast.success('Ingredient price saved');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        toast.error('Request failed', error.message);
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    },
  } as UseMutationOptions<VendorIngredient, unknown, VendorIngredientInput>);
}

/** Delete vendor ingredient price mutation. */
export function useDeleteVendorIngredient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      vendorId,
      ingredientId,
    }: {
      vendorId: string;
      ingredientId: string;
    }) => {
      const res = await deleteVendorIngredient(ingredientId);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: vendorsKeys.ingredients(variables.vendorId),
      });
      toast.success('Ingredient price removed');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        toast.error('Request failed', error.message);
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    },
  } as UseMutationOptions<
    { success: boolean; message: string },
    unknown,
    { vendorId: string; ingredientId: string }
  >);
}
