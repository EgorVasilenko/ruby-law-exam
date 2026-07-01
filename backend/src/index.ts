import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config, contractService } from './container';
import { createContractController } from './controllers/contractController';
import { createContractRoutes } from './routes/contracts';
import { createErrorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();

app.use(requestLogger);
app.use(cors({ origin: config.server.frontendUrl }));
app.use(express.json());

const contractController = createContractController(contractService);
app.use('/api/contracts', createContractRoutes(contractController, config.upload));

// Error-handling middleware must be registered last.
app.use(createErrorHandler(config.upload));

const server = app.listen(config.server.port, () => {
  console.log(`Backend running on http://localhost:${config.server.port}`);
});

// Graceful shutdown so restarts (tsx watch) and deploys exit promptly instead
// of hanging on the open listener / keep-alive connections.
function shutdown(): void {
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
