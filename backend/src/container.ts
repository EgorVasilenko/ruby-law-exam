import { loadConfig } from './config';
import { ContractStore } from './services/contractStore';
import { ContractService } from './services/contractService';
import { createAiAnalyzer } from './services/aiService';
import { openAiCompleter } from './services/openAiCompleter';
import { extractText } from './services/extractorService';

/**
 * Composition root: the single place where config is loaded and concrete
 * implementations are constructed and wired. To switch AI provider, swap
 * `openAiCompleter` for another StructuredCompleter here — nothing else changes.
 */
export const config = loadConfig();

const store = new ContractStore();
const analyze = createAiAnalyzer(config.ai, openAiCompleter(config.ai));

export const contractService = new ContractService(store, analyze, extractText);
