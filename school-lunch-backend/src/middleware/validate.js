import { ZodError } from 'zod';

const PARTS = ['body', 'query', 'params'];

/**
 * Zod request-validation middleware.
 * schema shape: { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 * On failure passes a 400 error (with field details) to the error handler.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    for (const part of PARTS) {
      if (!schema[part]) continue;
      const parsed = schema[part].parse(req[part]);
      if (part === 'query') {
        // Express 5: req.query is read-only, so keep parsed values separately.
        req.validatedQuery = parsed;
      } else {
        req[part] = parsed;
      }
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const validationError = new Error('Validation error');
      validationError.statusCode = 400;
      validationError.errors = err.issues.map((e) => ({
        path: (e.path || []).join('.'),
        message: e.message,
      }));
      return next(validationError);
    }
    next(err);
  }
};