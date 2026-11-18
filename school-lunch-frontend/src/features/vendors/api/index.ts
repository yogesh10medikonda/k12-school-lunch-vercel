import { apiClient, AppApiError } from '@/lib/api-client';
import type {
  Vendor,
  VendorInput,
  VendorsListResponse,
  ListVendorsParams,
  VendorIngredient,
  VendorIngredientInput,
} from '@/features/vendors/types';

export async function listVendors(params: ListVendorsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  return apiClient<VendorsListResponse>(qs ? `/vendors?${qs}` : '/vendors');
}

export async function getVendorById(id: string) {
  return apiClient<Vendor>(`/vendors/${id}`);
}

export async function createVendor(payload: VendorInput) {
  return apiClient<Vendor>('/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVendor(id: string, payload: Partial<VendorInput>) {
  return apiClient<Vendor>(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteVendor(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/vendors/${id}`, {
    method: 'DELETE',
  });
}

export async function upsertVendorIngredient(payload: VendorIngredientInput) {
  return apiClient<VendorIngredient>('/vendors/ingredients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listVendorIngredients(vendorId: string) {
  return apiClient<VendorIngredient[]>(`/vendors/${vendorId}/ingredients`);
}

export async function deleteVendorIngredient(ingredientId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/vendors/ingredients/${ingredientId}`,
    {
      method: 'DELETE',
    }
  );
}

export { AppApiError };
