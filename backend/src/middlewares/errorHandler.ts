import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { MAX_UPLOAD_MB } from '../config';
import {
  AIUnavailableError,
  ContractNotFoundError,
  DocumentUnreadableError,
  InvalidAIResponseError,
  ValidationError,
} from '../errors';

interface MappedError {
  status: number;
  code: string;
  message: string;
}

/**
 * The single place that knows how domain/upload errors map to HTTP.
 * Everything below the transport layer throws HTTP-agnostic domain errors.
 */
function mapError(err: unknown): MappedError {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return {
        status: 413,
        code: 'FILE_TOO_LARGE',
        message: `File exceeds the ${MAX_UPLOAD_MB} MB limit`,
      };
    }
    return { status: 400, code: 'UPLOAD_ERROR', message: err.message };
  }
  if (err instanceof ValidationError) {
    return { status: 400, code: 'VALIDATION_ERROR', message: err.message };
  }
  if (err instanceof ContractNotFoundError) {
    return { status: 404, code: 'NOT_FOUND', message: err.message };
  }
  if (err instanceof DocumentUnreadableError) {
    return { status: 422, code: 'DOCUMENT_UNREADABLE', message: err.message };
  }
  if (err instanceof InvalidAIResponseError) {
    return { status: 422, code: 'INVALID_AI_RESPONSE', message: err.message };
  }
  if (err instanceof AIUnavailableError) {
    return { status: 500, code: 'AI_UNAVAILABLE', message: err.message };
  }
  return { status: 500, code: 'INTERNAL', message: 'Unexpected error' };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { status, code, message } = mapError(err);
  res.status(status).json({ error: { code, message } });
};
