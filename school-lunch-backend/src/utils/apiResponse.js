/**
 * Builds the standard success response envelope expected by the frontend:
 * { success: true, data, message?, meta? }
 */
export const apiResponse = (res, statusCode, payload = {}) => {
  const { success = true, data, message, meta } = payload;
  const body = { success };
  if (message !== undefined) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};