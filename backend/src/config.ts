/**
 * Environment-derived configuration, read once at startup.
 * dotenv is loaded first in index.ts, so process.env is already populated.
 */
function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Max upload size in megabytes (default 10 MB, per the spec). */
export const MAX_UPLOAD_MB = positiveIntFromEnv('MAX_UPLOAD_MB', 10);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
