import { loadConfig } from './config';
import { ContractStore } from './services/contractStore';
import { ContractService } from './services/contractService';
import { createAiAnalyzer } from './services/aiService';
import { extractText } from './services/extractorService';

/**
 * Composition root: the single place where config is loaded and concrete
 * implementations are constructed and wired. To switch AI provider, swap
 * `createAiAnalyzer` for another AnalyzeFn factory here — nothing else changes.
 */
export const config = loadConfig();

const store = new ContractStore();
const analyze = createAiAnalyzer(config.ai);

export const contractService = new ContractService(store, analyze, extractText);
