import { Router } from 'express';
import { authenticate, permit, USER_ROLES } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  ingredientCreateSchema,
  ingredientUpdateSchema,
  ingredientIdParamSchema,
  ingredientListQuerySchema,
  stockInSchema,
  stockOutSchema,
  movementListQuerySchema,
  alertsQuerySchema,
  availabilityCheckSchema,
} from './inventory.validation.js';
import * as inventoryController from './inventory.controller.js';

const router = Router();

// Auth stub: allows all in development; real JWT enforcement in Phase 9.
router.use(authenticate);

// ─── Ingredient CRUD ──────────────────────────────────────────────────────────

router.post(
  '/ingredients',
  validate(ingredientCreateSchema),
  permit(...USER_ROLES),
  inventoryController.createIngredient
);

router.get(
  '/ingredients',
  validate(ingredientListQuerySchema),
  permit(...USER_ROLES),
  inventoryController.listIngredients
);

// ─── Alerts (must come before /:id routes to avoid param collision) ───────────

router.get(
  '/alerts',
  validate(alertsQuerySchema),
  permit(...USER_ROLES),
  inventoryController.getAlerts
);

// ─── Availability check ───────────────────────────────────────────────────────

router.post(
  '/availability-check',
  validate(availabilityCheckSchema),
  permit(...USER_ROLES),
  inventoryController.checkAvailability
);

// ─── Single-ingredient routes ─────────────────────────────────────────────────

router.get(
  '/ingredients/:id',
  validate(ingredientIdParamSchema),
  permit(...USER_ROLES),
  inventoryController.getIngredient
);

router.put(
  '/ingredients/:id',
  validate({ params: ingredientIdParamSchema.params, body: ingredientUpdateSchema.body }),
  permit(...USER_ROLES),
  inventoryController.updateIngredient
);

router.delete(
  '/ingredients/:id',
  validate(ingredientIdParamSchema),
  permit(...USER_ROLES),
  inventoryController.deleteIngredient
);

// ─── Stock movements ──────────────────────────────────────────────────────────

router.post(
  '/ingredients/:id/stock-in',
  validate({ params: ingredientIdParamSchema.params, body: stockInSchema.body }),
  permit(...USER_ROLES),
  inventoryController.stockIn
);

router.post(
  '/ingredients/:id/stock-out',
  validate({ params: ingredientIdParamSchema.params, body: stockOutSchema.body }),
  permit(...USER_ROLES),
  inventoryController.stockOut
);

router.get(
  '/ingredients/:id/movements',
  validate({ params: ingredientIdParamSchema.params, query: movementListQuerySchema.query }),
  permit(...USER_ROLES),
  inventoryController.listMovements
);

export default router;
