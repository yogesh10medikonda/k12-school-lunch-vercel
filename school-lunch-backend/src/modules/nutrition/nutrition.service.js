import { FoodItem } from './foodItem.model.js';
import { NutritionGuideline } from './nutritionGuideline.model.js';
import { getPagination, getMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function assertValidId(id, label = 'item') {
  if (!OBJECT_ID_RE.test(id)) {
    throw new ApiError(400, `Invalid ${label} ID format`);
  }
}

// ─── FoodItem CRUD ─────────────────────────────────────────────────────────────

export const createFoodItem = async (data) => {
  const existing = await FoodItem.findOne({
    name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  }).lean();
  if (existing) {
    throw new ApiError(409, `Food item "${data.name}" already exists`);
  }

  const foodItem = await FoodItem.create(data);
  return foodItem.toObject ? foodItem.toObject() : foodItem;
};

export const listFoodItems = async (query) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const filter = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const sort = {};
  if (query.sort) {
    const field = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const order = query.sort.startsWith('-') ? -1 : 1;
    sort[field] = order;
  } else {
    sort.createdAt = -1;
  }

  const [items, total] = await Promise.all([
    FoodItem.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    FoodItem.countDocuments(filter),
  ]);

  return { data: items, meta: getMeta(page, limit, total) };
};

export const getFoodItemById = async (id) => {
  assertValidId(id, 'food item');
  const item = await FoodItem.findById(id).lean();
  if (!item) throw new ApiError(404, 'Food item not found');
  return item;
};

export const updateFoodItem = async (id, data) => {
  assertValidId(id, 'food item');

  if (data.name) {
    const existing = await FoodItem.findOne({
      name: {
        $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
      _id: { $ne: id },
    }).lean();
    if (existing) {
      throw new ApiError(409, `Food item "${data.name}" already exists`);
    }
  }

  const item = await FoodItem.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  if (!item) throw new ApiError(404, 'Food item not found');
  return item;
};

export const deleteFoodItem = async (id) => {
  assertValidId(id, 'food item');
  const item = await FoodItem.findByIdAndDelete(id).lean();
  if (!item) throw new ApiError(404, 'Food item not found');
  return item;
};

// ─── NutritionGuideline CRUD ───────────────────────────────────────────────────

export const createNutritionGuideline = async (data) => {
  const existing = await NutritionGuideline.findOne({
    name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  }).lean();
  if (existing) {
    throw new ApiError(409, `Nutrition guideline "${data.name}" already exists`);
  }

  const guideline = await NutritionGuideline.create(data);
  return guideline.toObject ? guideline.toObject() : guideline;
};

export const listNutritionGuidelines = async (query) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const filter = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }
  if (query.jurisdiction) filter.jurisdiction = query.jurisdiction;
  if (query.gradeGroup) filter.gradeGroup = query.gradeGroup;
  if (query.mealType) filter.mealType = query.mealType;

  const sort = {};
  if (query.sort) {
    const field = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const order = query.sort.startsWith('-') ? -1 : 1;
    sort[field] = order;
  } else {
    sort.createdAt = -1;
  }

  const [guidelines, total] = await Promise.all([
    NutritionGuideline.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    NutritionGuideline.countDocuments(filter),
  ]);

  return { data: guidelines, meta: getMeta(page, limit, total) };
};

export const getNutritionGuidelineById = async (id) => {
  assertValidId(id, 'nutrition guideline');
  const guideline = await NutritionGuideline.findById(id).lean();
  if (!guideline) throw new ApiError(404, 'Nutrition guideline not found');
  return guideline;
};

export const updateNutritionGuideline = async (id, data) => {
  assertValidId(id, 'nutrition guideline');

  if (data.name) {
    const existing = await NutritionGuideline.findOne({
      name: {
        $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
      _id: { $ne: id },
    }).lean();
    if (existing) {
      throw new ApiError(409, `Nutrition guideline "${data.name}" already exists`);
    }
  }

  const guideline = await NutritionGuideline.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  if (!guideline) throw new ApiError(404, 'Nutrition guideline not found');
  return guideline;
};

export const deleteNutritionGuideline = async (id) => {
  assertValidId(id, 'nutrition guideline');
  const guideline = await NutritionGuideline.findByIdAndDelete(id).lean();
  if (!guideline) throw new ApiError(404, 'Nutrition guideline not found');
  return guideline;
};

// ─── Evaluation Logic ──────────────────────────────────────────────────────────

/**
 * Evaluate a meal against a nutrition guideline.
 * Returns per-serving and total nutrients, plus compliance status per nutrient.
 */
export const evaluateMeal = async (items, guidelineId) => {
  assertValidId(guidelineId, 'nutrition guideline');

  // Fetch all food items
  const foodItemIds = items.map((item) => item.foodItemId);
  const foodItems = await FoodItem.find({ _id: { $in: foodItemIds } }).lean();

  const foodItemMap = new Map(foodItems.map((fi) => [String(fi._id), fi]));

  // Fetch guideline
  const guideline = await NutritionGuideline.findById(guidelineId).lean();
  if (!guideline) throw new ApiError(404, 'Nutrition guideline not found');

  // Calculate total nutrients
  const totals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fibre: 0,
    vitamins: {},
    minerals: {},
  };

  const perServing = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fibre: 0,
    vitamins: {},
    minerals: {},
  };

  for (const { foodItemId, servings } of items) {
    const fi = foodItemMap.get(foodItemId);
    if (!fi) {
      throw new ApiError(404, `Food item ${foodItemId} not found`);
    }

    totals.calories += fi.calories * servings;
    totals.protein += fi.protein * servings;
    totals.carbohydrates += fi.carbohydrates * servings;
    totals.fats += fi.fats * servings;
    totals.fibre += fi.fibre * servings;

    // Accumulate vitamins
    for (const [vitamin, amount] of Object.entries(fi.vitamins || {})) {
      totals.vitamins[vitamin] = (totals.vitamins[vitamin] || 0) + amount * servings;
    }
    // Accumulate minerals
    for (const [mineral, amount] of Object.entries(fi.minerals || {})) {
      totals.minerals[mineral] = (totals.minerals[mineral] || 0) + amount * servings;
    }
  }

  // Calculate per-serving (average across items weighted by servings)
  const totalServings = items.reduce((sum, item) => sum + item.servings, 0);
  if (totalServings > 0) {
    perServing.calories = totals.calories / totalServings;
    perServing.protein = totals.protein / totalServings;
    perServing.carbohydrates = totals.carbohydrates / totalServings;
    perServing.fats = totals.fats / totalServings;
    perServing.fibre = totals.fibre / totalServings;

    for (const [vitamin, amount] of Object.entries(totals.vitamins)) {
      perServing.vitamins[vitamin] = amount / totalServings;
    }
    for (const [mineral, amount] of Object.entries(totals.minerals)) {
      perServing.minerals[mineral] = amount / totalServings;
    }
  }

  // Evaluate compliance against guideline limits
  const compliance = evaluateCompliance(totals, guideline.limits || {});

  return {
    perServing: roundNutrients(perServing),
    totals: roundNutrients(totals),
    compliance,
    guideline: {
      _id: guideline._id,
      name: guideline.name,
      jurisdiction: guideline.jurisdiction,
      gradeGroup: guideline.gradeGroup,
      mealType: guideline.mealType,
    },
  };
};

/**
 * Compare nutrient values against min/max limits.
 */
function evaluateCompliance(nutrients, limits) {
  const result = {};

  const checkNutrient = (value, limit, name) => {
    if (!limit) return { status: 'no_limit', message: 'No limit defined' };
    if (limit.min !== undefined && value < limit.min) {
      return {
        status: 'below_minimum',
        message: `${name} is below minimum (${value.toFixed(2)} < ${limit.min})`,
        value,
        min: limit.min,
        max: limit.max,
      };
    }
    if (limit.max !== undefined && value > limit.max) {
      return {
        status: 'above_maximum',
        message: `${name} exceeds maximum (${value.toFixed(2)} > ${limit.max})`,
        value,
        min: limit.min,
        max: limit.max,
      };
    }
    return { status: 'met', message: 'Within limits', value, min: limit.min, max: limit.max };
  };

  // Core nutrients
  result.calories = checkNutrient(nutrients.calories, limits.calories, 'Calories');
  result.protein = checkNutrient(nutrients.protein, limits.protein, 'Protein');
  result.carbohydrates = checkNutrient(nutrients.carbohydrates, limits.carbohydrates, 'Carbohydrates');
  result.fats = checkNutrient(nutrients.fats, limits.fats, 'Fats');
  result.fibre = checkNutrient(nutrients.fibre, limits.fibre, 'Fibre');

  // Vitamins
  result.vitamins = {};
  for (const [vitamin, amount] of Object.entries(nutrients.vitamins || {})) {
    const limit = limits.vitamins?.[vitamin];
    result.vitamins[vitamin] = checkNutrient(amount, limit, vitamin);
  }

  // Minerals
  result.minerals = {};
  for (const [mineral, amount] of Object.entries(nutrients.minerals || {})) {
    const limit = limits.minerals?.[mineral];
    result.minerals[mineral] = checkNutrient(amount, limit, mineral);
  }

  return result;
}

function roundNutrients(obj) {
  const rounded = { ...obj };
  for (const key of ['calories', 'protein', 'carbohydrates', 'fats', 'fibre']) {
    if (rounded[key] !== undefined) {
      rounded[key] = Math.round(rounded[key] * 100) / 100;
    }
  }
  for (const mapKey of ['vitamins', 'minerals']) {
    if (rounded[mapKey]) {
      const newMap = {};
      for (const [k, v] of Object.entries(rounded[mapKey])) {
        newMap[k] = Math.round(v * 100) / 100;
      }
      rounded[mapKey] = newMap;
    }
  }
  return rounded;
}