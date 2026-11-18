import { apiClient, AppApiError } from '@/lib/api-client';
import type {
  FoodItem,
  FoodItemInput,
  FoodItemsListResponse,
  ListFoodItemsParams,
  NutritionGuideline,
  NutritionGuidelineInput,
  NutritionGuidelinesListResponse,
  ListNutritionGuidelinesParams,
  EvaluateRequest,
  EvaluateResponse,
} from '@/features/nutrition/types';

export async function listFoodItems(params: ListFoodItemsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);

  const qs = searchParams.toString();
  return apiClient<FoodItemsListResponse>(qs ? `/nutrition/food-items?${qs}` : '/nutrition/food-items');
}

export async function getFoodItemById(id: string) {
  return apiClient<FoodItem>(`/nutrition/food-items/${id}`);
}

export async function createFoodItem(payload: FoodItemInput) {
  return apiClient<FoodItem>('/nutrition/food-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFoodItem(id: string, payload: Partial<FoodItemInput>) {
  return apiClient<FoodItem>(`/nutrition/food-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFoodItem(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/nutrition/food-items/${id}`, {
    method: 'DELETE',
  });
}

export async function listNutritionGuidelines(params: ListNutritionGuidelinesParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.jurisdiction) searchParams.set('jurisdiction', params.jurisdiction);
  if (params.gradeGroup) searchParams.set('gradeGroup', params.gradeGroup);
  if (params.mealType) searchParams.set('mealType', params.mealType);

  const qs = searchParams.toString();
  return apiClient<NutritionGuidelinesListResponse>(
    qs ? `/nutrition/guidelines?${qs}` : '/nutrition/guidelines'
  );
}

export async function getNutritionGuidelineById(id: string) {
  return apiClient<NutritionGuideline>(`/nutrition/guidelines/${id}`);
}

export async function createNutritionGuideline(payload: NutritionGuidelineInput) {
  return apiClient<NutritionGuideline>('/nutrition/guidelines', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNutritionGuideline(id: string, payload: Partial<NutritionGuidelineInput>) {
  return apiClient<NutritionGuideline>(`/nutrition/guidelines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteNutritionGuideline(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/nutrition/guidelines/${id}`, {
    method: 'DELETE',
  });
}

export async function evaluateMeal(payload: EvaluateRequest) {
  return apiClient<EvaluateResponse>('/nutrition/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { AppApiError };