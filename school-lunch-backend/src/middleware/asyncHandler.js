/**
 * Wraps async route handlers so rejected promises are forwarded to
 * Express' central error-handling middleware instead of crashing the server.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};