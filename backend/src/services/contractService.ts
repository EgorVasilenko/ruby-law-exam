import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { ContractStore } from './contractStore';
import type { ContractAIResult, ContractAnalysis, ProgressListener } from '../types';

export type AnalyzeFn = (text: string) => Promise<ContractAIResult>;
export type ExtractFn = (buffer: Buffer, mimetype: string) => Promise<string>;

export interface AnalyseResult {
  record: ContractAnalysis;
  /** True when the record was served from the content cache (no AI call). */
  cached: boolean;
}

/**
 * Orchestrates the upload -> extract -> analyse -> store flow.
 * Dependencies are injected (constructor DI) so the provider and parser are
 * swappable and easy to fake in tests. Knows nothing about HTTP.
 */
export class ContractService {
  constructor(
    private readonly store: ContractStore,
    private readonly analyze: AnalyzeFn,
    private readonly extract: ExtractFn,
  ) {}

  /**
   * `onProgress` is an optional observer for lifecycle stages — used by the
   * streaming endpoint. The sync path omits it and the return contract is
   * unchanged, so the service core stays simple.
   */
  async analyseContract(
    buffer: Buffer,
    mimetype: string,
    filename: string,
    onProgress?: ProgressListener,
  ): Promise<AnalyseResult> {
    const hash = createHash('sha256').update(buffer).digest('hex');

    const existing = this.store.findByHash(hash);
    if (existing) {
      return { record: existing, cached: true };
    }

    onProgress?.('extracting');
    const text = await this.extract(buffer, mimetype);
    onProgress?.('analyzing');
    const analysis = await this.analyze(text);

    const record: ContractAnalysis = {
      id: uuidv4(),
      filename,
      fullText: text,
      ...analysis,
      createdAt: new Date().toISOString(),
    };

    this.store.save(record, hash);
    return { record, cached: false };
  }

  getById(id: string): ContractAnalysis | undefined {
    return this.store.getById(id);
  }
}
