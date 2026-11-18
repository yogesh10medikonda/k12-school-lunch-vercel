import mongoose from 'mongoose';
import { Ingredient } from './ingredient.model.js';
import { StockMovement } from './stockMovement.model.js';
import { getPagination, getMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidId(id, label = 'ingredient') {
  if (!OBJECT_ID_RE.test(id)) {
    throw new ApiError(400, `Invalid ${label} ID format`);
  }
}

/**
 * Compute stockStatus from quantity and minStockLevel.
 * Returns 'Out of Stock' | 'Low Stock' | 'In Stock'.
 */
export function computeStockStatus(quantity, minStockLevel) {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= minStockLevel) return 'Low Stock';
  return 'In Stock';
}

/**
 * Compute expiryStatus from expiryDate.
 * Returns 'Valid' | 'Expiring Soon' | 'Expired' | null (no date set).
 */
export function computeExpiryStatus(expiryDate, soonDays = 7) {
  if (!expiryDate) return null;
  const now = new Date();
  const exp = new Date(expiryDate);
  if (exp < now) return 'Expired';
  const msUntil = exp - now;
  const daysUntil = msUntil / (1000 * 60 * 60 * 24);
  if (daysUntil <= soonDays) return 'Expiring Soon';
  return 'Valid';
}

/**
 * Attach computed fields to a plain ingredient object.
 */
function decorate(ing) {
  if (!ing) return ing;
  return {
    ...ing,
    stockStatus: computeStockStatus(ing.quantity, ing.minStockLevel),
    expiryStatus: computeExpiryStatus(ing.expiryDate),
  };
}

// ─── Ingredient CRUD ──────────────────────────────────────────────────────────

export const createIngredient = async (data) => {
  // Case-insensitive duplicate check (Mongo unique index is case-sensitive by default)
  const existing = await Ingredient.findOne({
    name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  }).lean();
  if (existing) {
    throw new ApiError(409, `Ingredient "${data.name}" already exists`);
  }

  const ingredient = await Ingredient.create(data);
  return decorate(ingredient.toObject ? ingredient.toObject() : ingredient);
};

export const listIngredients = async (query) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const filter = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }
  if (query.category) {
    filter.category = { $regex: query.category, $options: 'i' };
  }
  if (query.status) {
    filter.status = query.status;
  }

  // availability filter
  if (query.availability) {
    if (query.availability === 'out_of_stock') {
      filter.quantity = 0;
    } else if (query.availability === 'low_stock') {
      // quantity > 0 AND quantity <= minStockLevel
      // We use an aggregation-like $where alternative via $expr
      filter.$expr = {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$minStockLevel'] },
        ],
      };
    } else if (query.availability === 'in_stock') {
      filter.$expr = { $gt: ['$quantity', '$minStockLevel'] };
    }
  }

  // expiry filter
  const now = new Date();
  if (query.expiry) {
    if (query.expiry === 'expired') {
      filter.expiryDate = { $lt: now, $ne: null };
    } else if (query.expiry === 'expiring_soon') {
      const soonDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filter.expiryDate = { $gte: now, $lte: soonDate };
    } else if (query.expiry === 'valid') {
      const soonDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filter.$or = [
        { expiryDate: null },
        { expiryDate: { $gt: soonDate } },
      ];
    }
  }

  const sort = {};
  if (query.sort) {
    const field = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const order = query.sort.startsWith('-') ? -1 : 1;
    sort[field] = order;
  } else {
    sort.createdAt = -1;
  }

  const [ingredients, total] = await Promise.all([
    Ingredient.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Ingredient.countDocuments(filter),
  ]);

  return {
    data: ingredients.map(decorate),
    meta: getMeta(page, limit, total),
  };
};

export const getIngredientById = async (id) => {
  assertValidId(id);
  const ingredient = await Ingredient.findById(id).lean();
  if (!ingredient) throw new ApiError(404, 'Ingredient not found');
  return decorate(ingredient);
};

export const updateIngredient = async (id, data) => {
  assertValidId(id);

  if (data.name) {
    const existing = await Ingredient.findOne({
      name: {
        $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
      _id: { $ne: id },
    }).lean();
    if (existing) {
      throw new ApiError(409, `Ingredient "${data.name}" already exists`);
    }
  }

  const ingredient = await Ingredient.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  if (!ingredient) throw new ApiError(404, 'Ingredient not found');
  return decorate(ingredient);
};

export const deleteIngredient = async (id) => {
  assertValidId(id);

  const ingredient = await Ingredient.findById(id).lean();
  if (!ingredient) throw new ApiError(404, 'Ingredient not found');

  const movementCount = await StockMovement.countDocuments({ ingredient: id });
  if (movementCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete "${ingredient.name}" because it has ${movementCount} stock movement record(s). ` +
        'Set the ingredient to Inactive instead.'
    );
  }

  await Ingredient.findByIdAndDelete(id);
  return ingredient;
};

// ─── Stock movements ──────────────────────────────────────────────────────────

/**
 * Stock-in: add quantity unconditionally, record the movement.
 * Uses two-step (fetch quantityBefore → $inc) with movement rollback on failure.
 */
export const stockIn = async (id, { quantity, reason, reference }) => {
  assertValidId(id);
  if (quantity <= 0) throw new ApiError(400, 'Quantity must be greater than zero');

  const ingredient = await Ingredient.findById(id).lean();
  if (!ingredient) throw new ApiError(404, 'Ingredient not found');

  const quantityBefore = ingredient.quantity;
  const quantityAfter = quantityBefore + quantity;

  // Atomically increment quantity
  const updated = await Ingredient.findByIdAndUpdate(
    id,
    { $inc: { quantity } },
    { returnDocument: 'after' }
  ).lean();

  // Record movement; if it fails, roll back the increment
  let movement;
  try {
    movement = await StockMovement.create({
      ingredient: id,
      type: 'IN',
      quantity,
      quantityBefore,
      quantityAfter,
      reason: reason || '',
      reference: reference || null,
    });
  } catch (movErr) {
    // Roll back
    await Ingredient.findByIdAndUpdate(id, { $inc: { quantity: -quantity } });
    throw movErr;
  }

  return {
    ingredient: decorate(updated),
    movement: movement.toObject ? movement.toObject() : movement,
  };
};

/**
 * Stock-out: atomic conditional decrement so stock cannot go negative.
 * Uses a filter { _id, quantity: { $gte: requested } } + $inc to prevent race
 * conditions with concurrent requests.
 */
export const stockOut = async (id, { quantity, reason, reference }) => {
  assertValidId(id);
  if (quantity <= 0) throw new ApiError(400, 'Quantity must be greater than zero');

  // Read current ingredient to get quantityBefore (and validate existence)
  const current = await Ingredient.findById(id).lean();
  if (!current) throw new ApiError(404, 'Ingredient not found');

  const quantityBefore = current.quantity;

  // Atomic conditional decrement: only succeeds if quantity >= requested
  const updated = await Ingredient.findOneAndUpdate(
    { _id: id, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { returnDocument: 'after' }
  ).lean();

  if (!updated) {
    throw new ApiError(
      409,
      `Insufficient stock. Available: ${quantityBefore} ${current.unit}, ` +
        `requested: ${quantity} ${current.unit}.`
    );
  }

  const quantityAfter = updated.quantity;

  // Record movement; roll back on failure
  let movement;
  try {
    movement = await StockMovement.create({
      ingredient: id,
      type: 'OUT',
      quantity,
      quantityBefore,
      quantityAfter,
      reason: reason || '',
      reference: reference || null,
    });
  } catch (movErr) {
    // Roll back the decrement
    await Ingredient.findByIdAndUpdate(id, { $inc: { quantity } });
    throw movErr;
  }

  return {
    ingredient: decorate(updated),
    movement: movement.toObject ? movement.toObject() : movement,
  };
};

export const listMovements = async (ingredientId, query) => {
  assertValidId(ingredientId);

  const ingredient = await Ingredient.findById(ingredientId).lean();
  if (!ingredient) throw new ApiError(404, 'Ingredient not found');

  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [movements, total] = await Promise.all([
    StockMovement.find({ ingredient: ingredientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StockMovement.countDocuments({ ingredient: ingredientId }),
  ]);

  return {
    data: movements,
    meta: getMeta(page, limit, total),
  };
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const getAlerts = async (days = 7) => {
  const daysNum = Math.max(Number(days) || 7, 0);
  const now = new Date();
  const soonDate = new Date(now.getTime() + daysNum * 24 * 60 * 60 * 1000);

  const [lowStock, expired, expiringSoon] = await Promise.all([
    // Low stock: quantity > 0 but <= minStockLevel, or quantity === 0
    Ingredient.find({
      status: 'Active',
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
    })
      .sort({ quantity: 1 })
      .lean(),

    // Expired
    Ingredient.find({
      status: 'Active',
      expiryDate: { $lt: now, $ne: null },
    })
      .sort({ expiryDate: 1 })
      .lean(),

    // Expiring soon (within N days, not yet expired)
    Ingredient.find({
      status: 'Active',
      expiryDate: { $gte: now, $lte: soonDate },
    })
      .sort({ expiryDate: 1 })
      .lean(),
  ]);

  return {
    lowStock: lowStock.map(decorate),
    expired: expired.map(decorate),
    expiringSoon: expiringSoon.map(decorate),
    expiryWindowDays: daysNum,
  };
};

// ─── Availability check ───────────────────────────────────────────────────────

export const checkAvailability = async (items) => {
  const ids = items.map((item) => item.ingredientId);

  // Validate all IDs
  for (const id of ids) {
    assertValidId(id, 'ingredient');
  }

  const ingredients = await Ingredient.find({ _id: { $in: ids } })
    .select('_id name quantity unit')
    .lean();

  const ingredientMap = new Map(ingredients.map((i) => [String(i._id), i]));

  const results = items.map(({ ingredientId, requiredQuantity }) => {
    const ing = ingredientMap.get(ingredientId);
    if (!ing) {
      return {
        ingredientId,
        name: null,
        available: 0,
        required: requiredQuantity,
        missing: requiredQuantity,
        sufficient: false,
        found: false,
      };
    }
    const available = ing.quantity;
    const missing = Math.max(0, requiredQuantity - available);
    return {
      ingredientId,
      name: ing.name,
      unit: ing.unit,
      available,
      required: requiredQuantity,
      missing,
      sufficient: available >= requiredQuantity,
      found: true,
    };
  });

  const allSufficient = results.every((r) => r.sufficient);

  return { allSufficient, results };
};
