import { Router } from 'express';
import { authenticate, permit, USER_ROLES } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  vendorCreateSchema,
  vendorUpdateSchema,
  vendorIdParamSchema,
  vendorListQuerySchema,
} from './vendor.validation.js';
import {
  vendorIngredientCreateSchema,
  vendorIngredientIdParamSchema,
} from './vendorIngredient.validation.js';
import * as vendorController from './vendor.controller.js';

const router = Router();

// Auth stub: allows all in development; real JWT enforcement in Phase 9.
router.use(authenticate);

/* -------- Vendors -------- */

router.post(
  '/',
  validate(vendorCreateSchema),
  permit(...USER_ROLES),
  vendorController.createVendor
);

router.get(
  '/',
  validate(vendorListQuerySchema),
  permit(...USER_ROLES),
  vendorController.listVendors
);

/* -------- Vendor ingredient price catalog -------- */

router.post(
  '/ingredients',
  validate(vendorIngredientCreateSchema),
  permit(...USER_ROLES),
  vendorController.upsertVendorIngredient
);

router.get(
  '/:vendorId/ingredients',
  validate(vendorIngredientIdParamSchema),
  permit(...USER_ROLES),
  vendorController.listVendorIngredients
);

router.delete(
  '/ingredients/:ingredientId',
  validate(vendorIngredientIdParamSchema),
  permit(...USER_ROLES),
  vendorController.deleteVendorIngredient
);

/* -------- Vendor detail / update / delete -------- */

router.get(
  '/:id',
  validate(vendorIdParamSchema),
  permit(...USER_ROLES),
  vendorController.getVendor
);

router.put(
  '/:id',
  validate({ params: vendorIdParamSchema.params, body: vendorUpdateSchema.body }),
  permit(...USER_ROLES),
  vendorController.updateVendor
);

router.delete(
  '/:id',
  validate(vendorIdParamSchema),
  permit(...USER_ROLES),
  vendorController.deleteVendor
);

export default router;