/**
 * Nutrition domain types.
 * Field names match the backend models exactly (see school-lunch-backend
 * src/modules/nutrition/foodItem.model.js, nutritionGuideline.model.js)
 * so create/update payloads align 1:1.
 */

export interface NutrientLimits {
  calories?: { min?: number; max?: number | null };
  protein?: { min?: number; max?: number | null };
  carbohydrates?: { min?: number; max?: number | null };
  fats?: { min?: number; max?: number | null };
  fibre?: { min?: number; max?: number | null };
  vitamins?: Record<string, { min?: number; max?: number | null }>;
  minerals?: Record<string, { min?: number; max?: number | null }>;
}

export interface FoodItem {
  _id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fibre: number;
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export type FoodItemInput = Omit<
  FoodItem,
  '_id' | 'createdAt' | 'updatedAt'
>;

export interface FoodItemMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FoodItemsListResponse {
  data: FoodItem[];
  meta: FoodItemMeta;
}

export interface ListFoodItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface NutritionGuideline {
  _id: string;
  name: string;
  jurisdiction: string;
  gradeGroup: string;
  mealType: string;
  limits: NutrientLimits;
  createdAt?: string;
  updatedAt?: string;
}

export type NutritionGuidelineInput = Omit<
  NutritionGuideline,
  '_id' | 'createdAt' | 'updatedAt'
>;

export interface NutritionGuidelineMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NutritionGuidelinesListResponse {
  data: NutritionGuideline[];
  meta: NutritionGuidelineMeta;
}

export interface ListNutritionGuidelinesParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  jurisdiction?: string;
  gradeGroup?: string;
  mealType?: string;
}

export interface EvaluateItem {
  foodItemId: string;
  servings: number;
}

export interface EvaluateRequest {
  items: EvaluateItem[];
  guidelineId: string;
}

export interface NutrientCompliance {
  status: 'met' | 'below_minimum' | 'above_maximum' | 'no_limit';
  message: string;
  value?: number;
  min?: number;
  max?: number | null;
}

export interface ComplianceResult {
  calories: NutrientCompliance;
  protein: NutrientCompliance;
  carbohydrates: NutrientCompliance;
  fats: NutrientCompliance;
  fibre: NutrientCompliance;
  vitamins: Record<string, NutrientCompliance>;
  minerals: Record<string, NutrientCompliance>;
}

export interface NutrientValues {
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fibre: number;
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
}

export interface EvaluateResponse {
  perServing: NutrientValues;
  totals: NutrientValues;
  compliance: ComplianceResult;
  guideline: {
    _id: string;
    name: string;
    jurisdiction: string;
    gradeGroup: string;
    mealType: string;
  };
}