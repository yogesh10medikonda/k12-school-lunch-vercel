import { asyncHandler } from '../../middleware/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as inventoryService from './inventory.service.js';

// ─── Ingredient CRUD ──────────────────────────────────────────────────────────

export const createIngredient = asyncHandler(async (req, res) => {
  const ingredient = await inventoryService.createIngredient(req.body);
  return apiResponse(res, 201, {
    success: true,
    data: ingredient,
    message: 'Ingredient created successfully',
  });
});

export const listIngredients = asyncHandler(async (req, res) => {
  const { data, meta } = await inventoryService.listIngredients(
    req.validatedQuery ?? req.query
  );
  return apiResponse(res, 200, {
    success: true,
    data,
    message: 'Ingredients retrieved successfully',
    meta,
  });
});

export const getIngredient = asyncHandler(async (req, res) => {
  const ingredient = await inventoryService.getIngredientById(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: ingredient,
    message: 'Ingredient retrieved successfully',
  });
});

export const updateIngredient = asyncHandler(async (req, res) => {
  const ingredient = await inventoryService.updateIngredient(
    req.params.id,
    req.body
  );
  return apiResponse(res, 200, {
    success: true,
    data: ingredient,
    message: 'Ingredient updated successfully',
  });
});

export const deleteIngredient = asyncHandler(async (req, res) => {
  await inventoryService.deleteIngredient(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: null,
    message: 'Ingredient deleted successfully',
  });
});

// ─── Stock movements ──────────────────────────────────────────────────────────

export const stockIn = asyncHandler(async (req, res) => {
  const result = await inventoryService.stockIn(req.params.id, req.body);
  return apiResponse(res, 200, {
    success: true,
    data: result,
    message: 'Stock received successfully',
  });
});

export const stockOut = asyncHandler(async (req, res) => {
  const result = await inventoryService.stockOut(req.params.id, req.body);
  return apiResponse(res, 200, {
    success: true,
    data: result,
    message: 'Stock issued successfully',
  });
});

export const listMovements = asyncHandler(async (req, res) => {
  const { data, meta } = await inventoryService.listMovements(
    req.params.id,
    req.validatedQuery ?? req.query
  );
  return apiResponse(res, 200, {
    success: true,
    data,
    message: 'Stock movements retrieved successfully',
    meta,
  });
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const getAlerts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery ?? req.query;
  const days = query.days !== undefined ? Number(query.days) : 7;
  const result = await inventoryService.getAlerts(days);
  return apiResponse(res, 200, {
    success: true,
    data: result,
    message: 'Inventory alerts retrieved successfully',
  });
});

// ─── Availability check ───────────────────────────────────────────────────────

export const checkAvailability = asyncHandler(async (req, res) => {
  const result = await inventoryService.checkAvailability(req.body.items);
  return apiResponse(res, 200, {
    success: true,
    data: result,
    message: 'Availability check complete',
  });
});
