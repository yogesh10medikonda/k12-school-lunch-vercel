/**
 * Inventory domain types.
 * Field names match the backend Ingredient model exactly (see school-lunch-backend
 * src/modules/inventory/ingredient.model.js) so create/update payloads align 1:1.
 */
export type Unit = 'g' | 'ml' | 'piece';
export type IngredientStatus = 'Active' | 'Inactive';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type ExpiryStatus = 'Valid' | 'Expiring Soon' | 'Expired' | null;

export type AvailabilityFilter = 'in_stock' | 'low_stock' | 'out_of_stock';
export type ExpiryFilter = 'expired' | 'expiring_soon' | 'valid';

export interface Ingredient {
  _id: string;
  name: string;
  category?: string | null;
  unit: Unit;
  quantity: number;
  minStockLevel: number;
  expiryDate?: string | null;
  vendor?: string | null;
  status: IngredientStatus;
  stockStatus?: StockStatus;
  expiryStatus?: ExpiryStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload for create/update (server-generated fields omitted). */
export type IngredientInput = Omit<
  Ingredient,
  '_id' | 'createdAt' | 'updatedAt' | 'stockStatus' | 'expiryStatus'
>;

export interface IngredientMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IngredientsListResponse {
  data: Ingredient[];
  meta: IngredientMeta;
}

export interface ListIngredientsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  category?: string;
  status?: IngredientStatus;
  availability?: AvailabilityFilter;
  expiry?: ExpiryFilter;
}

export interface StockMovement {
  _id: string;
  ingredient: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  reference?: string | null;
  createdAt?: string;
}

export interface StockMovementMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StockMovementsResponse {
  data: StockMovement[];
  meta: StockMovementMeta;
}

export interface StockInOutPayload {
  quantity: number;
  reason?: string;
  reference?: string | null;
}

export interface StockInOutResponse {
  ingredient: Ingredient;
  movement: StockMovement;
}

export interface AlertsResponse {
  lowStock: Ingredient[];
  expired: Ingredient[];
  expiringSoon: Ingredient[];
  expiryWindowDays: number;
}