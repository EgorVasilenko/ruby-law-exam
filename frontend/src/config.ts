/** Client configuration derived from Vite env vars (see .env.example). */

const parsedMax = Number(import.meta.env.VITE_MAX_UPLOAD_MB);
export const MAX_UPLOAD_MB =
  Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Empty by default -> relative "/api" (proxied to the backend in dev). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
