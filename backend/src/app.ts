import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import type { Config } from './config';
import type { ContractService } from './services/contractService';
import { createContractController } from './controllers/contractController';
import { createContractRoutes } from './routes/contracts';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

interface AppDeps {
  config: Config;
  contractService: ContractService;
}

/**
 * Builds the Express app with its dependencies injected. Kept separate from the
 * server bootstrap (index.ts) so it can be imported and driven with supertest
 * without opening a port.
 */
export function createApp({ config, contractService }: AppDeps): Express {
  const app = express();

  // Trust the first proxy (e.g. the nginx frontend container) so rate limiting
  // keys on the real client IP from X-Forwarded-For, not the proxy's address.
  app.set('trust proxy', 1);

  app.use(requestLogger);
  app.use(cors({ origin: config.server.frontendUrl }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const contractController = createContractController(contractService);
  app.use(
    '/api/contracts',
    createContractRoutes(contractController, config.upload, config.rateLimit),
  );

  // Error-handling middleware must be registered last.
  app.use(errorHandler);

  return app;
}
