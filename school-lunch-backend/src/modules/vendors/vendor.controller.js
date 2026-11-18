import { asyncHandler } from '../../middleware/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as vendorService from './vendor.service.js';

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(req.body);
  return apiResponse(res, 201, {
    success: true,
    data: vendor,
    message: 'Vendor created successfully',
  });
});

export const listVendors = asyncHandler(async (req, res) => {
  const { data, meta } = await vendorService.listVendors(req.query);
  return apiResponse(res, 200, {
    success: true,
    data,
    message: 'Vendors retrieved successfully',
    meta,
  });
});

export const getVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: vendor,
    message: 'Vendor retrieved successfully',
  });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(req.params.id, req.body);
  return apiResponse(res, 200, {
    success: true,
    data: vendor,
    message: 'Vendor updated successfully',
  });
});

export const deleteVendor = asyncHandler(async (req, res) => {
  await vendorService.deleteVendor(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: null,
    message: 'Vendor deleted successfully',
  });
});

/* -------- VendorIngredient controllers -------- */

export const upsertVendorIngredient = asyncHandler(async (req, res) => {
  const record = await vendorService.upsertVendorIngredient(req.body);
  return apiResponse(res, 200, {
    success: true,
    data: record,
    message: 'Vendor ingredient price saved successfully',
  });
});

export const listVendorIngredients = asyncHandler(async (req, res) => {
  const records = await vendorService.listVendorIngredients(req.params.vendorId);
  return apiResponse(res, 200, {
    success: true,
    data: records,
    message: 'Vendor ingredient prices retrieved successfully',
  });
});

export const deleteVendorIngredient = asyncHandler(async (req, res) => {
  await vendorService.deleteVendorIngredient(req.params.ingredientId);
  return apiResponse(res, 200, {
    success: true,
    data: null,
    message: 'Vendor ingredient price removed successfully',
  });
});