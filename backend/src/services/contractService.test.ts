import { describe, it, expect, vi } from 'vitest';
import { ContractService } from './contractService';
import { ContractStore } from './contractStore';
import { AIUnavailableError } from '../errors';
import type { ContractAIResult } from '../types';

const ANALYSIS: ContractAIResult = {
  type: 'NDA',
  riskScore: 42,
  missingClauses: ['Governing law'],
  recommendations: ['Add a termination clause'],
  riskyClauses: [{ text: 'as-is', severity: 'medium', reason: 'No warranty' }],
};

/**
 * Dependencies are injected via the constructor, so tests pass plain fakes —
 * no module mocking needed. The AI is always mocked here (per the spec).
 */
function makeService(overrides: {
  analyze?: (text: string) => Promise<ContractAIResult>;
  extract?: (buffer: Buffer, mimetype: string) => Promise<string>;
} = {}) {
  const store = new ContractStore();
  const analyze = overrides.analyze ?? vi.fn().mockResolvedValue(ANALYSIS);
  const extract = overrides.extract ?? vi.fn().mockResolvedValue('contract text');
  const service = new ContractService(store, analyze, extract);
  return { store, analyze, extract, service };
}

describe('ContractService', () => {
  it('returns a fully-formed ContractAnalysis when upload succeeds', async () => {
    const { service } = makeService();

    const { record, cached } = await service.analyseContract(
      Buffer.from('nda-content'),
      'application/pdf',
      'nda.pdf',
    );

    expect(cached).toBe(false);
    expect(record.id).toBeTruthy();
    expect(record.filename).toBe('nda.pdf');
    expect(record.createdAt).toBeTruthy();
    expect(record).toMatchObject(ANALYSIS);
  });

  it('caches by content hash and does not call the AI twice for the same file', async () => {
    const analyze = vi.fn().mockResolvedValue(ANALYSIS);
    const extract = vi.fn().mockResolvedValue('contract text');
    const { service } = makeService({ analyze, extract });
    const buffer = Buffer.from('identical-bytes');

    const first = await service.analyseContract(buffer, 'application/pdf', 'a.pdf');
    const second = await service.analyseContract(buffer, 'application/pdf', 'b.pdf');

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.record.id).toBe(first.record.id);
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('propagates the error when the AI service is unavailable', async () => {
    const analyze = vi.fn().mockRejectedValue(new AIUnavailableError('provider down'));
    const { service } = makeService({ analyze });

    await expect(
      service.analyseContract(Buffer.from('x'), 'application/pdf', 'x.pdf'),
    ).rejects.toBeInstanceOf(AIUnavailableError);
  });
});
