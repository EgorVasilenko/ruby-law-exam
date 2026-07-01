import { ContractStore } from './services/contractStore';
import { ContractService } from './services/contractService';
import { callAI } from './services/aiService';
import { extractText } from './services/extractorService';

/**
 * Composition root: the single place where concrete implementations are
 * constructed and wired together. To switch AI provider (e.g. Azure OpenAI),
 * swap `callAI` for another AnalyzeFn here — nothing else changes.
 */
const store = new ContractStore();

export const contractService = new ContractService(store, callAI, extractText);
