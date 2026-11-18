import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  listIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  stockIn,
  stockOut,
  listMovements,
  getAlerts,
} from '@/features/inventory/api';
import type {
  ListIngredientsParams,
  Ingredient,
  IngredientInput,
  StockMovement,
  AlertsResponse,
} from '@/features/inventory/types';
import { useToast } from '@/components/ui/toast';
import { AppApiError } from '@/lib/api-client';

export const inventoryKeys = {
  all: ['inventory'] as const,
  ingredients: {
    list: (params: ListIngredientsParams) =>
      [...inventoryKeys.all, 'ingredients', 'list', params] as const,
    detail: (id: string) => [...inventoryKeys.all, 'ingredients', 'detail', id] as const,
    movements: (id: string, params: { page?: number; limit?: number }) =>
      [...inventoryKeys.all, 'ingredients', 'movements', id, params] as const,
  },
  alerts: (days?: number) => [...inventoryKeys.all, 'alerts', days ?? 7] as const,
};

/** List query with server-side pagination, search, and filters. */
export function useIngredients(params: ListIngredientsParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.ingredients.list(params),
    queryFn: () => listIngredients(params),
    placeholderData: (previousData) => previousData,
  });
}

/** Single ingredient detail query. */
export function useIngredient(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.ingredients.detail(id ?? ''),
    queryFn: () => getIngredientById(id!),
    enabled: Boolean(id),
  });
}

/** Stock movements query for an ingredient. */
export function useIngredientMovements(
  ingredientId?: string,
  params: { page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: inventoryKeys.ingredients.movements(ingredientId ?? '', params),
    queryFn: () => listMovements(ingredientId!, params),
    enabled: Boolean(ingredientId),
  });
}

/** Alerts query. */
export function useAlerts(days?: number) {
  return useQuery({
    queryKey: inventoryKeys.alerts(days),
    queryFn: () => getAlerts(days),
  });
}

/**
 * Create ingredient mutation.
 * On success: invalidate ingredient queries + toast.
 * On error: 400/409 field errors and 404/network toasts are handled by the
 * caller via mutateAsync rejection so they can be shown next to the right fields.
 */
export function useCreateIngredient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: IngredientInput) => {
      const res = await createIngredient(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Ingredient created');
    },
    onError: () => {
      // Intentional no-op: the caller handles 400/409 as field errors and
      // 404/network as toasts via mutateAsync rejection.
    },
  } as UseMutationOptions<Ingredient, unknown, IngredientInput>);
}

/**
 * Update ingredient mutation.
 * On success: invalidate ingredient queries + toast.
 * On error: handled by the caller via mutateAsync rejection.
 */
export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<IngredientInput>;
    }) => {
      const res = await updateIngredient(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Ingredient updated');
    },
    onError: () => {
      // Intentional no-op: the caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<Ingredient, unknown, { id: string; payload: Partial<IngredientInput> }>);
}

/**
 * Delete ingredient mutation.
 * On success: invalidate ingredient queries + toast.
 * On error: 404 and network failures are shown as toasts.
 */
export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteIngredient(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Ingredient deleted');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested ingredient could not be found.');
          return;
        }
        if (error.statusCode === 409) {
          // This case is handled by the caller via mutateAsync rejection
          // but we keep it here as a fallback
          toast.error('Cannot delete', error.message);
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
  } as UseMutationOptions<{ success: boolean; message: string }, unknown, string>);
}

/**
 * Stock-in mutation.
 * On success: invalidate ingredient queries, movements, and alerts + toast.
 * On error: 409 "Insufficient stock" handled by caller as field error.
 */
export function useStockIn() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { quantity: number; reason?: string; reference?: string | null };
    }) => {
      const res = await stockIn(id, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.ingredients.movements(variables.id, {}),
      });
      toast.success('Stock received');
    },
    onError: () => {
      // Intentional no-op: the caller handles 409 as field error and 404/network as toasts via mutateAsync rejection.
    },
  } as UseMutationOptions<
    { ingredient: Ingredient; movement: StockMovement },
    unknown,
    { id: string; payload: { quantity: number; reason?: string; reference?: string | null } }
  >);
}

/**
 * Stock-out mutation.
 * On success: invalidate ingredient queries, movements, and alerts + toast.
 * On error: 409 "Insufficient stock" handled by caller as field error on quantity.
 */
export function useStockOut() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { quantity: number; reason?: string; reference?: string | null };
    }) => {
      const res = await stockOut(id, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.ingredients.movements(variables.id, {}),
      });
      toast.success('Stock issued');
    },
    onError: () => {
      // Intentional no-op: the caller handles 409 as field error and 404/network as toasts via mutateAsync rejection.
    },
  } as UseMutationOptions<
    { ingredient: Ingredient; movement: StockMovement },
    unknown,
    { id: string; payload: { quantity: number; reason?: string; reference?: string | null } }
  >);
}