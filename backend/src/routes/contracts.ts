import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../errors';
import { DOCX_MIME, PDF_MIME } from '../services/extractorService';
import type { Config } from '../config';
import type { ContractController } from '../controllers/contractController';

export function createContractRoutes(
  controller: ContractController,
  uploadConfig: Config['upload'],
): Router {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: uploadConfig.maxBytes },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === PDF_MIME || file.mimetype === DOCX_MIME) {
        cb(null, true);
      } else {
        // Forwarded to the error middleware -> 400.
        cb(new ValidationError('Only .pdf and .docx files are accepted'));
      }
    },
  });

  const router = Router();
  router.post('/upload', upload.single('file'), asyncHandler(controller.upload));
  router.get('/:id', asyncHandler(controller.getById));
  return router;
}
