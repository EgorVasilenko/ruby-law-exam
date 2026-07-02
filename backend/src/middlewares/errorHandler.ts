import type { ErrorRequestHandler } from 'express';
import {
  AIUnavailableError,
  ContractNotFoundError,
  DocumentUnreadableError,
  DomainError,
  InvalidAIResponseError,
  PayloadTooLargeError,
  ValidationError,
} from '../errors';

type DomainErrorClass = new (...args: never[]) => DomainError;

/**
 * Declarative map of domain error -> HTTP response. Adding a new error is one
 * line here; the handler logic never changes (open/closed). Domain errors stay
 * HTTP-agnostic — this transport layer is the only place that knows status codes.
 * Multer errors are normalised to domain errors in the routes, so they never
 * reach this map directly.
 */
const REGISTRY: ReadonlyArray<[DomainErrorClass, { status: number; code: string }]> = [
  [ValidationError, { status: 400, code: 'VALIDATION_ERROR' }],
  [ContractNotFoundError, { status: 404, code: 'NOT_FOUND' }],
  [PayloadTooLargeError, { status: 413, code: 'FILE_TOO_LARGE' }],
  [DocumentUnreadableError, { status: 422, code: 'DOCUMENT_UNREADABLE' }],
  [InvalidAIResponseError, { status: 422, code: 'INVALID_AI_RESPONSE' }],
  [AIUnavailableError, { status: 500, code: 'AI_UNAVAILABLE' }],
];

/** Resolve any error to its HTTP status + response body. Reused by the SSE
 *  stream (which sends {code, message} as an event, ignoring status). */
export function describeError(err: unknown): { status: number; code: string; message: string } {
  const match = REGISTRY.find(([ErrorClass]) => err instanceof ErrorClass);
  if (match && err instanceof Error) {
    return { status: match[1].status, code: match[1].code, message: err.message };
  }
  return { status: 500, code: 'INTERNAL', message: 'Unexpected error' };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { status, code, message } = describeError(err);
  res.status(status).json({ error: { code, message } });
};
