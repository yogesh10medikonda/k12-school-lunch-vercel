const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse page/limit query params into skip/limit for MongoDB.
 */
export const getPagination = (page, limit) => {
  const p = Math.max(Number.parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(Number.parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: p, limit: l, skip: (p - 1) * l };
};

/**
 * Build pagination meta object for list responses.
 * meta = { page, limit, total, totalPages }
 */
export const getMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});