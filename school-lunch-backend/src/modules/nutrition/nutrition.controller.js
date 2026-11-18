import { asyncHandler } from '../../middleware/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as nutritionService from './nutrition.service.js';

// ─── FoodItem CRUD ─────────────────────────────────────────────────────────────

export const createFoodItem = asyncHandler(async (req, res) => {
  const foodItem = await nutritionService.createFoodItem(req.body);
  return apiResponse(res, 201, {
    success: true,
    data: foodItem,
    message: 'Food item created successfully',
  });
});

export const listFoodItems = asyncHandler(async (req, res) => {
  const { data, meta } = await nutritionService.listFoodItems(req.validatedQuery ?? req.query);
  return apiResponse(res, 200, {
    success: true,
    data,
    message: 'Food items retrieved successfully',
    meta,
  });
});

export const getFoodItem = asyncHandler(async (req, res) => {
  const foodItem = await nutritionService.getFoodItemById(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: foodItem,
    message: 'Food item retrieved successfully',
  });
});

export const updateFoodItem = asyncHandler(async (req, res) => {
  const foodItem = await nutritionService.updateFoodItem(req.params.id, req.body);
  return apiResponse(res, 200, {
    success: true,
    data: foodItem,
    message: 'Food item updated successfully',
  });
});

export const deleteFoodItem = asyncHandler(async (req, res) => {
  await nutritionService.deleteFoodItem(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: null,
    message: 'Food item deleted successfully',
  });
});

// ─── NutritionGuideline CRUD ───────────────────────────────────────────────────

export const createNutritionGuideline = asyncHandler(async (req, res) => {
  const guideline = await nutritionService.createNutritionGuideline(req.body);
  return apiResponse(res, 201, {
    success: true,
    data: guideline,
    message: 'Nutrition guideline created successfully',
  });
});

export const listNutritionGuidelines = asyncHandler(async (req, res) => {
  const { data, meta } = await nutritionService.listNutritionGuidelines(req.validatedQuery ?? req.query);
  return apiResponse(res, 200, {
    success: true,
    data,
    message: 'Nutrition guidelines retrieved successfully',
    meta,
  });
});

export const getNutritionGuideline = asyncHandler(async (req, res) => {
  const guideline = await nutritionService.getNutritionGuidelineById(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: guideline,
    message: 'Nutrition guideline retrieved successfully',
  });
});

export const updateNutritionGuideline = asyncHandler(async (req, res) => {
  const guideline = await nutritionService.updateNutritionGuideline(req.params.id, req.body);
  return apiResponse(res, 200, {
    success: true,
    data: guideline,
    message: 'Nutrition guideline updated successfully',
  });
});

export const deleteNutritionGuideline = asyncHandler(async (req, res) => {
  await nutritionService.deleteNutritionGuideline(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: null,
    message: 'Nutrition guideline deleted successfully',
  });
});

// ─── Evaluation ────────────────────────────────────────────────────────────────

export const evaluateMeal = asyncHandler(async (req, res) => {
  const { items, guidelineId } = req.body;
  const result = await nutritionService.evaluateMeal(items, guidelineId);
  return apiResponse(res, 200, {
    success: true,
    data: result,
    message: 'Meal evaluation completed',
  });
});