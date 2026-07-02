import { describe, it, expect, vi } from 'vitest';
import { createAiAnalyzer } from './aiService';
import type { CompletionRequest } from './aiService';
import type { Config } from '../config';

const cfg: Config['ai'] = {
  apiKey: 'test',
  model: 'test-model',
  temperature: 0,
  maxInputChars: 100,
  systemPrompt: '',
};

const VALID = {
  type: 'NDA',
  riskScore: 130, // out of range on purpose
  missingClauses: [],
  recommendations: [],
  riskyClauses: [],
};

describe('createAiAnalyzer', () => {
  it('validates the reply and clamps riskScore into 0–100', async () => {
    const complete = vi.fn((_req: CompletionRequest): Promise<unknown> => Promise.resolve(VALID));
    const analyze = createAiAnalyzer(cfg, complete);

    const result = await analyze('contract text');

    expect(result.type).toBe('NDA');
    expect(result.riskScore).toBe(100); // 130 clamped
  });

  it('sends the default prompt and truncated text to the completer', async () => {
    const complete = vi.fn(
      (_req: CompletionRequest): Promise<unknown> => Promise.resolve({ ...VALID, riskScore: 20 }),
    );
    const analyze = createAiAnalyzer({ ...cfg, maxInputChars: 5 }, complete);

    await analyze('abcdefghij');

    const req = complete.mock.calls[0][0];
    expect(req.user).toBe('abcde'); // truncated to maxInputChars
    expect(req.system).toContain('legal'); // committed default prompt
  });

  it('throws InvalidAIResponseError when the reply fails the schema', async () => {
    const complete = vi.fn((_req: CompletionRequest): Promise<unknown> => Promise.resolve({ type: 'NDA' }));
    const analyze = createAiAnalyzer(cfg, complete);

    await expect(analyze('x')).rejects.toThrowError(/schema/i);
  });
});
