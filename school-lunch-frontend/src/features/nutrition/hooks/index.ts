import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  listFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  listNutritionGuidelines,
  getNutritionGuidelineById,
  createNutritionGuideline,
  updateNutritionGuideline,
  deleteNutritionGuideline,
  evaluateMeal,
} from '@/features/nutrition/api';
import type {
  ListFoodItemsParams,
  FoodItem,
  FoodItemInput,
  ListNutritionGuidelinesParams,
  NutritionGuideline,
  NutritionGuidelineInput,
  EvaluateRequest,
  EvaluateResponse,
} from '@/features/nutrition/types';
import { useToast } from '@/components/ui/toast';
import { AppApiError } from '@/lib/api-client';

export const nutritionKeys = {
  all: ['nutrition'] as const,
  foodItems: {
    list: (params: ListFoodItemsParams) =>
      [...nutritionKeys.all, 'foodItems', 'list', params] as const,
    detail: (id: string) => [...nutritionKeys.all, 'foodItems', 'detail', id] as const,
  },
  guidelines: {
    list: (params: ListNutritionGuidelinesParams) =>
      [...nutritionKeys.all, 'guidelines', 'list', params] as const,
    detail: (id: string) => [...nutritionKeys.all, 'guidelines', 'detail', id] as const,
  },
  evaluation: (request: EvaluateRequest) =>
    [...nutritionKeys.all, 'evaluate', request] as const,
};

/** List query with server-side pagination, search, and sort. */
export function useFoodItems(params: ListFoodItemsParams = {}) {
  return useQuery({
    queryKey: nutritionKeys.foodItems.list(params),
    queryFn: () => listFoodItems(params),
    placeholderData: (previousData) => previousData,
  });
}

/** Single food item detail query. */
export function useFoodItem(id?: string) {
  return useQuery({
    queryKey: nutritionKeys.foodItems.detail(id ?? ''),
    queryFn: () => getFoodItemById(id!),
    enabled: Boolean(id),
  });
}

/** List nutrition guidelines with filters. */
export function useNutritionGuidelines(params: ListNutritionGuidelinesParams = {}) {
  return useQuery({
    queryKey: nutritionKeys.guidelines.list(params),
    queryFn: () => listNutritionGuidelines(params),
    placeholderData: (previousData) => previousData,
  });
}

/** Single guideline detail query. */
export function useNutritionGuideline(id?: string) {
  return useQuery({
    queryKey: nutritionKeys.guidelines.detail(id ?? ''),
    queryFn: () => getNutritionGuidelineById(id!),
    enabled: Boolean(id),
  });
}

/**
 * Create food item mutation.
 * On success: invalidate food item queries + toast.
 * On error: 400/409 field errors and 404/network toasts handled by caller via mutateAsync rejection.
 */
export function useCreateFoodItem() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: FoodItemInput) => {
      const res = await createFoodItem(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.all });
      toast.success('Food item created');
    },
    onError: () => {
      // Intentional no-op: caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<FoodItem, unknown, FoodItemInput>);
}

/**
 * Update food item mutation.
 * On success: invalidate food item queries + toast.
 * On error: handled by caller via mutateAsync rejection.
 */
export function useUpdateFoodItem() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<FoodItemInput>;
    }) => {
      const res = await updateFoodItem(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.all });
      toast.success('Food item updated');
    },
    onError: () => {
      // Intentional no-op: caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<FoodItem, unknown, { id: string; payload: Partial<FoodItemInput> }>);
}

/**
 * Delete food item mutation.
 * On success: invalidate food item queries + toast.
 * On error: 404 and network failures shown as toasts.
 */
export function useDeleteFoodItem() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteFoodItem(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.all });
      toast.success('Food item deleted');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested food item could not be found.');
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
 * Create nutrition guideline mutation.
 * On success: invalidate guideline queries + toast.
 * On error: 400/409 field errors handled by caller.
 */
export function useCreateNutritionGuideline() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: NutritionGuidelineInput) => {
      const res = await createNutritionGuideline(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.all });
      toast.success('Guideline created');
    },
    onError: () => {
      // Intentional no-op: caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<NutritionGuideline, unknown, NutritionGuidelineInput>);
}

/**
 * Update nutrition guideline mutation.
 * On success: invalidate guideline queries + toast.
 * On error: handled by caller.
 */
export function useUpdateNutritionGuideline() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<NutritionGuidelineInput>;
    }) => {
      const res = await updateNutritionGuideline(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.all });
      toast.success('Guideline updated');
    },
    onError: () => {
      // Intentional no-op: caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<NutritionGuideline, unknown, { id: string; payload: Partial<NutritionGuidelineInput> }>);
}

/**
 * Delete nutrition guideline mutation.
 * On success: invalidate guideline queries + toast.
 * On error: 404 and network failures shown as toasts.
 */
export function useDeleteNutritionGuideline() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteNutritionGuideline(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.all });
      toast.success('Guideline deleted');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested guideline could not be found.');
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
 * Evaluate meal mutation.
 * Returns per-serving, totals, and compliance data.
 */
export function useEvaluateMeal() {
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: EvaluateRequest) => {
      const res = await evaluateMeal(payload);
      return res.data;
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 404) {
          toast.error('Not found', 'One or more food items or the guideline could not be found.');
          return;
        }
        if (error.statusCode === 400) {
          toast.error('Invalid request', error.message);
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
  } as UseMutationOptions<EvaluateResponse, unknown, EvaluateRequest>);
}