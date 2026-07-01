import type { RequestHandler } from 'express';

/**
 * Logs one line per request once the response is sent:
 *   METHOD /path STATUS DURATIONms
 * Dependency-free; uses the 'finish' event so the final status code and
 * duration are known.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });

  next();
};
