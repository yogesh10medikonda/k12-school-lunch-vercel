/**
 * Vendor domain types.
 * Field names match the backend Vendor model exactly (see school-lunch-backend
 * src/modules/vendors/vendor.model.js) so create/update payloads align 1:1.
 */
export type VendorStatus = 'Active' | 'Inactive';

export interface Vendor {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: VendorStatus;
  rating?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload for create/update (server-generated fields omitted). */
export type VendorInput = Omit<Vendor, '_id' | 'createdAt' | 'updatedAt'>;

export interface VendorMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VendorsListResponse {
  data: Vendor[];
  meta: VendorMeta;
}

export interface ListVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  status?: VendorStatus;
}

export interface VendorIngredient {
  _id: string;
  vendor: string;
  ingredient: string;
  price: number;
  unit: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VendorIngredientInput = Omit<
  VendorIngredient,
  '_id' | 'createdAt' | 'updatedAt'
>;
