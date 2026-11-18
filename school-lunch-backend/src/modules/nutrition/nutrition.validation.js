import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ─── FoodItem ──────────────────────────────────────────────────────────────────

export const foodItemCreateBodySchema = z.object({
  name: z.string().min(1, 'Food item name is required').trim(),
  servingSize: z.number().min(0.01, 'Serving size must be positive'),
  servingUnit: z.string().min(1, 'Serving unit is required').trim(),
  calories: z.number().min(0, 'Calories cannot be negative'),
  protein: z.number().min(0, 'Protein cannot be negative'),
  carbohydrates: z.number().min(0, 'Carbohydrates cannot be negative'),
  fats: z.number().min(0, 'Fats cannot be negative'),
  fibre: z.number().min(0, 'Fibre cannot be negative'),
  vitamins: z.record(z.number().min(0, 'Vitamin amount cannot be negative')).optional().default({}),
  minerals: z.record(z.number().min(0, 'Mineral amount cannot be negative')).optional().default({}),
});

export const foodItemUpdateBodySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    servingSize: z.number().min(0.01).optional(),
    servingUnit: z.string().min(1).trim().optional(),
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbohydrates: z.number().min(0).optional(),
    fats: z.number().min(0).optional(),
    fibre: z.number().min(0).optional(),
    vitamins: z.record(z.number().min(0)).optional(),
    minerals: z.record(z.number().min(0)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const foodItemIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid food item ID format'),
  }),
});

export const foodItemListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
  }),
});

// ─── NutritionGuideline ────────────────────────────────────────────────────────

const nutrientLimitSchema = z.object({
  min: z.number().optional(),
  max: z.number().nullable().optional(),
}).optional();

export const nutritionGuidelineCreateBodySchema = z.object({
  name: z.string().min(1, 'Guideline name is required').trim(),
  jurisdiction: z.string().min(1, 'Jurisdiction is required').trim(),
  gradeGroup: z.string().min(1, 'Grade group is required').trim(),
  mealType: z.string().min(1, 'Meal type is required').trim(),
  limits: z
    .object({
      calories: nutrientLimitSchema,
      protein: nutrientLimitSchema,
      carbohydrates: nutrientLimitSchema,
      fats: nutrientLimitSchema,
      fibre: nutrientLimitSchema,
      vitamins: z.record(nutrientLimitSchema).optional().default({}),
      minerals: z.record(nutrientLimitSchema).optional().default({}),
    })
    .optional()
    .default({}),
});

export const nutritionGuidelineUpdateBodySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    jurisdiction: z.string().min(1).trim().optional(),
    gradeGroup: z.string().min(1).trim().optional(),
    mealType: z.string().min(1).trim().optional(),
    limits: z
      .object({
        calories: nutrientLimitSchema,
        protein: nutrientLimitSchema,
        carbohydrates: nutrientLimitSchema,
        fats: nutrientLimitSchema,
        fibre: nutrientLimitSchema,
        vitamins: z.record(nutrientLimitSchema).optional(),
        minerals: z.record(nutrientLimitSchema).optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const nutritionGuidelineIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid nutrition guideline ID format'),
  }),
});

export const nutritionGuidelineListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    jurisdiction: z.string().optional(),
    gradeGroup: z.string().optional(),
    mealType: z.string().optional(),
  }),
});

// ─── Evaluation ────────────────────────────────────────────────────────────────

const evaluateBodySchemaInner = z.object({
  items: z
    .array(
      z.object({
        foodItemId: z.string().regex(objectIdRegex, 'Invalid food item ID format'),
        servings: z.number().min(0.01, 'Servings must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  guidelineId: z.string().regex(objectIdRegex, 'Invalid guideline ID format'),
});

export const evaluateBodySchema = { body: evaluateBodySchemaInner };

// ─── Route-ready wrappers ──────────────────────────────────────────────────────

export const foodItemCreateSchema = { body: foodItemCreateBodySchema };
export const foodItemUpdateSchema = { body: foodItemUpdateBodySchema };
export const nutritionGuidelineCreateSchema = { body: nutritionGuidelineCreateBodySchema };
export const nutritionGuidelineUpdateSchema = { body: nutritionGuidelineUpdateBodySchema };