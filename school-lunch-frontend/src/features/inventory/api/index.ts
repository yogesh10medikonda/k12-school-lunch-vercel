import { apiClient, AppApiError } from '@/lib/api-client';
import type {
  Ingredient,
  IngredientInput,
  IngredientsListResponse,
  ListIngredientsParams,
  StockMovement,
  StockMovementsResponse,
  StockInOutPayload,
  StockInOutResponse,
  AlertsResponse,
} from '@/features/inventory/types';

export async function listIngredients(params: ListIngredientsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.category) searchParams.set('category', params.category);
  if (params.status) searchParams.set('status', params.status);
  if (params.availability) searchParams.set('availability', params.availability);
  if (params.expiry) searchParams.set('expiry', params.expiry);

  const qs = searchParams.toString();
  return apiClient<IngredientsListResponse>(qs ? `/inventory/ingredients?${qs}` : '/inventory/ingredients');
}

export async function getIngredientById(id: string) {
  return apiClient<Ingredient>(`/inventory/ingredients/${id}`);
}

export async function createIngredient(payload: IngredientInput) {
  return apiClient<Ingredient>('/inventory/ingredients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIngredient(id: string, payload: Partial<IngredientInput>) {
  return apiClient<Ingredient>(`/inventory/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteIngredient(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/inventory/ingredients/${id}`, {
    method: 'DELETE',
  });
}

export async function stockIn(id: string, payload: StockInOutPayload) {
  return apiClient<StockInOutResponse>(`/inventory/ingredients/${id}/stock-in`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function stockOut(id: string, payload: StockInOutPayload) {
  return apiClient<StockInOutResponse>(`/inventory/ingredients/${id}/stock-out`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMovements(id: string, params: { page?: number; limit?: number } = {}) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  return apiClient<StockMovementsResponse>(
    qs ? `/inventory/ingredients/${id}/movements?${qs}` : `/inventory/ingredients/${id}/movements`
  );
}

export async function getAlerts(days?: number) {
  const searchParams = new URLSearchParams();
  if (days !== undefined) searchParams.set('days', String(days));

  const qs = searchParams.toString();
  return apiClient<AlertsResponse>(qs ? `/inventory/alerts?${qs}` : '/inventory/alerts');
}

export { AppApiError };