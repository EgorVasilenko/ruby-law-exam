import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../errors';
import { MAX_UPLOAD_BYTES } from '../config';
import { DOCX_MIME, PDF_MIME } from '../services/extractorService';
import type { ContractController } from '../controllers/contractController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === PDF_MIME || file.mimetype === DOCX_MIME) {
      cb(null, true);
    } else {
      // Forwarded to the error middleware -> 400.
      cb(new ValidationError('Only .pdf and .docx files are accepted'));
    }
  },
});

export function createContractRoutes(controller: ContractController): Router {
  const router = Router();
  router.post('/upload', upload.single('file'), asyncHandler(controller.upload));
  router.get('/:id', asyncHandler(controller.getById));
  return router;
}
