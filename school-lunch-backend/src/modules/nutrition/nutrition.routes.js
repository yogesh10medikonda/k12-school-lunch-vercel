import { Router } from 'express';
import { authenticate, permit, USER_ROLES } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  foodItemCreateSchema,
  foodItemUpdateSchema,
  foodItemIdParamSchema,
  foodItemListQuerySchema,
  nutritionGuidelineCreateSchema,
  nutritionGuidelineUpdateSchema,
  nutritionGuidelineIdParamSchema,
  nutritionGuidelineListQuerySchema,
  evaluateBodySchema,
} from './nutrition.validation.js';
import * as nutritionController from './nutrition.controller.js';

const router = Router();

// Auth stub: allows all in development; real JWT enforcement in Phase 9.
router.use(authenticate);

// ─── FoodItem CRUD ─────────────────────────────────────────────────────────────

router.post(
  '/food-items',
  validate(foodItemCreateSchema),
  permit(...USER_ROLES),
  nutritionController.createFoodItem
);

router.get(
  '/food-items',
  validate(foodItemListQuerySchema),
  permit(...USER_ROLES),
  nutritionController.listFoodItems
);

router.get(
  '/food-items/:id',
  validate(foodItemIdParamSchema),
  permit(...USER_ROLES),
  nutritionController.getFoodItem
);

router.put(
  '/food-items/:id',
  validate({ params: foodItemIdParamSchema.params, body: foodItemUpdateSchema.body }),
  permit(...USER_ROLES),
  nutritionController.updateFoodItem
);

router.delete(
  '/food-items/:id',
  validate(foodItemIdParamSchema),
  permit(...USER_ROLES),
  nutritionController.deleteFoodItem
);

// ─── NutritionGuideline CRUD ───────────────────────────────────────────────────

router.post(
  '/guidelines',
  validate(nutritionGuidelineCreateSchema),
  permit(...USER_ROLES),
  nutritionController.createNutritionGuideline
);

router.get(
  '/guidelines',
  validate(nutritionGuidelineListQuerySchema),
  permit(...USER_ROLES),
  nutritionController.listNutritionGuidelines
);

router.get(
  '/guidelines/:id',
  validate(nutritionGuidelineIdParamSchema),
  permit(...USER_ROLES),
  nutritionController.getNutritionGuideline
);

router.put(
  '/guidelines/:id',
  validate({ params: nutritionGuidelineIdParamSchema.params, body: nutritionGuidelineUpdateSchema.body }),
  permit(...USER_ROLES),
  nutritionController.updateNutritionGuideline
);

router.delete(
  '/guidelines/:id',
  validate(nutritionGuidelineIdParamSchema),
  permit(...USER_ROLES),
  nutritionController.deleteNutritionGuideline
);

// ─── Evaluation ────────────────────────────────────────────────────────────────

router.post(
  '/evaluate',
  validate(evaluateBodySchema),
  permit(...USER_ROLES),
  nutritionController.evaluateMeal
);

export default router;