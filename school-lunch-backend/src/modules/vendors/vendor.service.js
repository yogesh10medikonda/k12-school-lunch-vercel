import { Vendor } from './vendor.model.js';
import { VendorIngredient } from './vendorIngredient.model.js';
import { getPagination, getMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export const createVendor = async (data) => {
  const existing = await Vendor.findOne({ name: data.name }).lean();
  if (existing) {
    throw new ApiError(409, `Vendor "${data.name}" already exists`);
  }
  const vendor = await Vendor.create(data);
  return vendor.toObject ? vendor.toObject() : vendor;
};

export const listVendors = async (query) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const filter = {};

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [{ name: regex }, { contactPerson: regex }];
  }
  if (query.status) filter.status = query.status;

  const sort = {};
  if (query.sort) {
    const field = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const order = query.sort.startsWith('-') ? -1 : 1;
    sort[field] = order;
  } else {
    sort.createdAt = -1;
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Vendor.countDocuments(filter),
  ]);

  return { data: vendors, meta: getMeta(page, limit, total) };
};

export const getVendorById = async (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(400, 'Invalid vendor ID format');
  const vendor = await Vendor.findById(id).lean();
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
};

export const updateVendor = async (id, data) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(400, 'Invalid vendor ID format');
  if (data.name) {
    const existing = await Vendor.findOne({
      name: data.name,
      _id: { $ne: id },
    }).lean();
    if (existing) {
      throw new ApiError(409, `Vendor "${data.name}" already exists`);
    }
  }
  const vendor = await Vendor.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
};

export const deleteVendor = async (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(400, 'Invalid vendor ID format');
  // Confirm the vendor exists before deleting.
  const vendor = await Vendor.findById(id).lean();
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  // Never leave orphaned price-catalog rows behind.
  const ingredientCount = await VendorIngredient.countDocuments({ vendor: id });
  if (ingredientCount > 0) {
    throw new ApiError(
      409,
      'Cannot delete vendor with existing ingredient price records. Remove them first.'
    );
  }
  await Vendor.findByIdAndDelete(id);
  return vendor;
};

/* -------- VendorIngredient (price catalog) -------- */

export const upsertVendorIngredient = async (data) => {
  const vendorExists = await Vendor.exists({ _id: data.vendor });
  if (!vendorExists) throw new ApiError(404, 'Vendor not found');

  const record = await VendorIngredient.findOneAndUpdate(
    { vendor: data.vendor, ingredient: data.ingredient },
    { $set: { price: data.price, unit: data.unit } },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  return record;
};

export const listVendorIngredients = async (vendorId) => {
  if (!/^[0-9a-fA-F]{24}$/.test(vendorId)) throw new ApiError(400, 'Invalid vendor ID format');
  const vendorExists = await Vendor.exists({ _id: vendorId });
  if (!vendorExists) throw new ApiError(404, 'Vendor not found');
  return VendorIngredient.find({ vendor: vendorId }).sort({ ingredient: 1 }).lean();
};

export const deleteVendorIngredient = async (ingredientId) => {
  if (!/^[0-9a-fA-F]{24}$/.test(ingredientId)) throw new ApiError(400, 'Invalid ingredient price ID format');
  const record = await VendorIngredient.findByIdAndDelete(ingredientId).lean();
  if (!record) throw new ApiError(404, 'Vendor ingredient price not found');
  return record;
};