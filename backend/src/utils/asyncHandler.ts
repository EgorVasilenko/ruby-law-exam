import type { RequestHandler } from 'express';

/**
 * Wraps a route handler so both sync throws and rejected promises are
 * forwarded to the error-handling middleware. Express 4 does not catch
 * async errors on its own, so controllers stay free of try/catch.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
