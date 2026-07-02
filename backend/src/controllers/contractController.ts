import type { RequestHandler } from 'express';
import type { ContractService } from '../services/contractService';
import { ContractNotFoundError, ValidationError } from '../errors';
import { describeError } from '../middlewares/errorHandler';
import { sseStream } from '../utils/sseStream';

export interface ContractController {
  upload: RequestHandler;
  uploadStream: RequestHandler;
  getById: RequestHandler;
}

/**
 * Thin HTTP adapter over ContractService. Only the happy path lives here;
 * domain errors are thrown and translated by the error middleware.
 */
export function createContractController(service: ContractService): ContractController {
  const upload: RequestHandler = async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { record, cached } = await service.analyseContract(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    );

    // 201 when freshly analysed, 200 when served from the content cache.
    res.status(cached ? 200 : 201).json({ data: record });
  };

  // Same flow as `upload`, but streams lifecycle stages over SSE. Errors before
  // the stream opens (no file) become normal HTTP errors; once streaming, they
  // are emitted as an 'error' event instead (status is already 200).
  const uploadStream: RequestHandler = async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const stream = sseStream(res);
    try {
      const { record, cached } = await service.analyseContract(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        (stage) => stream.send({ stage }),
      );
      stream.send({ stage: 'done', contract: record, cached });
    } catch (err) {
      const { code, message } = describeError(err);
      stream.send({ stage: 'error', code, message });
    } finally {
      stream.close();
    }
  };

  const getById: RequestHandler = (req, res) => {
    const record = service.getById(req.params.id ?? '');
    if (!record) {
      throw new ContractNotFoundError('Contract not found');
    }
    res.json({ data: record });
  };

  return { upload, uploadStream, getById };
}
