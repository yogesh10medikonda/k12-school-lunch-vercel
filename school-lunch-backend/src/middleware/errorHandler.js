import { ApiError } from '../utils/ApiError.js';

/**
 * Centralized error handler.
 * Response envelope: { success: false, message, errors? }
 * Never logs request bodies or error details — student allergy/dietary data
 * must never appear in logs.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  if (err?.name === "ZodError") {
  statusCode = 400;
  message = "Validation failed";
  errors = err.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
} else if (err.name === 'ValidationError') {
    // Mongoose document validation
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  } else if (err.code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    errors = [{ path: field, message: `${field} already exists` }];
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Safe logging: status + message only. Never log req.body or err.stack here
  // because they may contain sensitive student data (allergies, restrictions).
  console.error(`[${new Date().toISOString()}] ${statusCode} ${message}`);

  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};