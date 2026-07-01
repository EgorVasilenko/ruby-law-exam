import type { ContractAnalysis } from '../types';

/**
 * In-memory contract storage with content-based deduplication.
 * - byId: the primary store, keyed by the public UUID.
 * - idByHash: an internal index (sha256 of file bytes -> id) used for caching.
 *   The hash is never exposed through the API.
 *
 * A single instance is created in the composition root (container.ts) and
 * injected where needed — the module system already makes it a singleton, so
 * no getInstance() boilerplate is required.
 */
export class ContractStore {
  private readonly byId = new Map<string, ContractAnalysis>();
  private readonly idByHash = new Map<string, string>();

  getById(id: string): ContractAnalysis | undefined {
    return this.byId.get(id);
  }

  findByHash(hash: string): ContractAnalysis | undefined {
    const id = this.idByHash.get(hash);
    return id === undefined ? undefined : this.byId.get(id);
  }

  save(record: ContractAnalysis, hash: string): void {
    this.byId.set(record.id, record);
    this.idByHash.set(hash, record.id);
  }
}
