import { Router } from 'express';
import { authenticate, permit, USER_ROLES } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  studentCreateSchema,
  studentUpdateSchema,
  studentIdParamSchema,
  studentListQuerySchema,
} from './student.validation.js';
import * as studentController from './student.controller.js';

const router = Router();

// Auth stub: allows all in development; real JWT enforcement in Phase 9.
router.use(authenticate);

router.post(
  '/',
  validate(studentCreateSchema),
  permit(...USER_ROLES),
  studentController.createStudent
);

router.get(
  '/',
  validate(studentListQuerySchema),
  permit(...USER_ROLES),
  studentController.listStudents
);

router.get(
  '/:id',
  validate(studentIdParamSchema),
  permit(...USER_ROLES),
  studentController.getStudent
);

router.put(
  '/:id',
  validate({ params: studentIdParamSchema.params, body: studentUpdateSchema.body }),
  permit(...USER_ROLES),
  studentController.updateStudent
);

router.delete(
  '/:id',
  validate(studentIdParamSchema),
  permit(...USER_ROLES),
  studentController.deleteStudent
);

export default router;