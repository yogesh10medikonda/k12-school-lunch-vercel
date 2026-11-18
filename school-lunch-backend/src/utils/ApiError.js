/**
 * Operational error class used across services/controllers.
 * Carries an HTTP status code and optional field-level error details.
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}