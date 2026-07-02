import 'dotenv/config';
import { createApp } from './app';
import { config, contractService } from './container';

const app = createApp({ config, contractService });

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
