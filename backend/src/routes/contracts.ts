import { Router } from 'express';
import type { RequestHandler } from 'express';
import multer, { MulterError } from 'multer';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { PayloadTooLargeError, ValidationError } from '../errors';
import { DOCX_MIME, PDF_MIME } from '../services/extractorService';
import type { Config } from '../config';
import type { ContractController } from '../controllers/contractController';

export function createContractRoutes(
  controller: ContractController,
  uploadConfig: Config['upload'],
  rateLimitConfig: Config['rateLimit'],
): Router {
  // Per-IP limit on the paid/abusable upload endpoint (reads stay unlimited).
  const uploadLimiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,
    limit: rateLimitConfig.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many uploads — please try again shortly.' },
      });
    },
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: uploadConfig.maxBytes },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === PDF_MIME || file.mimetype === DOCX_MIME) {
        cb(null, true);
      } else {
        cb(new ValidationError('Only .pdf and .docx files are accepted'));
      }
    },
  }).single('file');

  // Run multer, then normalise its errors into domain errors so the error
  // middleware only ever deals with HTTP-agnostic domain errors.
  const uploadFile: RequestHandler = (req, res, next) => {
    upload(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        next(
          err.code === 'LIMIT_FILE_SIZE'
            ? new PayloadTooLargeError(`File exceeds the ${uploadConfig.maxMb} MB limit`)
            : new ValidationError(err.message),
        );
        return;
      }
      next(err); // ValidationError from fileFilter, or nothing
    });
  };

  const router = Router();
  router.post('/upload', uploadLimiter, uploadFile, asyncHandler(controller.upload));
  router.get('/:id', asyncHandler(controller.getById));
  return router;
}
