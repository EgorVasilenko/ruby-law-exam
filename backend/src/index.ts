import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { contractService } from './container';
import { createContractController } from './controllers/contractController';
import { createContractRoutes } from './routes/contracts';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(requestLogger);
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json());

const contractController = createContractController(contractService);
app.use('/api/contracts', createContractRoutes(contractController));

// Error-handling middleware must be registered last.
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Graceful shutdown so restarts (tsx watch) and deploys exit promptly instead
// of hanging on the open listener / keep-alive connections.
function shutdown(): void {
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
