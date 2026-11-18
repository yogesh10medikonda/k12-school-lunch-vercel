import { ApiError } from '../utils/ApiError.js';

/**
 * User roles matching the frontend (src/lib/auth/roles.tsx).
 * Administrator, Nutritionist, Kitchen Staff, Inventory Manager.
 */
export const USER_ROLES = [
  'Administrator',
  'Nutritionist',
  'Kitchen Staff',
  'Inventory Manager',
];

/**
 * Authentication stub (Phase 9 replaces this with real JWT verification).
 * Development: attaches a default developer user so the API can be built
 * against without auth blocking frontend work.
 */
export const authenticate = (req, res, next) => {
  req.user = {
    id: 'dev-user-01',
    name: 'Development User',
    role: 'Administrator',
  };
  next();
};

/**
 * Authorization stub.
 * Allows all roles in development. Real enforcement is the backend's job.
 */
export const permit = (...roles) => (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }
  next();
};