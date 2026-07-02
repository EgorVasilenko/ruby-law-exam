import { z } from 'zod';
import { DEFAULT_SYSTEM_PROMPT } from './prompts';
import { InvalidAIResponseError } from '../errors';
import type { Config } from '../config';
import type { ContractAIResult } from '../types';
import type { AnalyzeFn } from './contractService';

export interface CompletionRequest {
  system: string;
  user: string;
  /** Schema the model must conform to (used for structured outputs). */
  schema: z.ZodTypeAny;
  schemaName: string;
}

/**
 * Provider seam: run a schema-constrained completion and return the raw parsed
 * object. Implemented per provider (OpenAI, Azure, a fake in tests). Kept free
 * of our domain types so any provider can satisfy it.
 */
export type StructuredCompleter = (req: CompletionRequest) => Promise<unknown>;

const riskyClauseSchema = z.object({
  text: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
});

// No numeric min/max — strict json_schema (structured outputs) doesn't support
// them; riskScore is clamped to 0–100 after validation.
const AIResultSchema = z.object({
  type: z.enum(['NDA', 'Employment', 'Service Agreement', 'Lease', 'Other']),
  riskScore: z.number(),
  missingClauses: z.array(z.string()),
  recommendations: z.array(z.string()),
  riskyClauses: z.array(riskyClauseSchema),
});

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/**
 * Provider-agnostic contract analysis: builds the prompt, delegates the
 * schema-constrained completion to the injected StructuredCompleter, validates
 * the reply against our schema, and normalises riskScore. Swapping AI provider
 * is just a different StructuredCompleter — this logic doesn't change.
 */
export function createAiAnalyzer(cfg: Config['ai'], complete: StructuredCompleter): AnalyzeFn {
  return async function analyze(text: string): Promise<ContractAIResult> {
    const system = cfg.systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT;
    const user = text.slice(0, cfg.maxInputChars);

    const raw = await complete({
      system,
      user,
      schema: AIResultSchema,
      schemaName: 'contract_analysis',
    });

    const result = AIResultSchema.safeParse(raw);
    if (!result.success) {
      throw new InvalidAIResponseError('AI response did not match the expected schema');
    }

    return { ...result.data, riskScore: clamp(Math.round(result.data.riskScore), 0, 100) };
  };
}
