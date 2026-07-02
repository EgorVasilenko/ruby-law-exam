import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { DEFAULT_SYSTEM_PROMPT } from './prompts';
import { recordUsage } from './usageTracker';
import { AIUnavailableError, InvalidAIResponseError } from '../errors';
import type { Config } from '../config';
import type { ContractAIResult } from '../types';
import type { AnalyzeFn } from './contractService';

const riskyClauseSchema = z.object({
  text: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
});

// Schema for OpenAI Structured Outputs. No numeric min/max — strict json_schema
// doesn't support them; riskScore is clamped to 0–100 after parsing.
const AIResultSchema = z.object({
  type: z.enum(['NDA', 'Employment', 'Service Agreement', 'Lease', 'Other']),
  riskScore: z.number(),
  missingClauses: z.array(z.string()),
  recommendations: z.array(z.string()),
  riskyClauses: z.array(riskyClauseSchema),
});

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/**
 * Builds the AI analysis function (the only code that knows about OpenAI) from
 * injected config. Uses Structured Outputs so the model is constrained to our
 * schema server-side, then the SDK validates the reply against the same Zod
 * schema — far fewer malformed-response cases than "ask for JSON and hope".
 * - AIUnavailableError: provider unreachable (no key, network, outage).
 * - InvalidAIResponseError: model refused or returned no parseable output.
 */
export function createAiAnalyzer(aiConfig: Config['ai']): AnalyzeFn {
  return async function analyze(text: string): Promise<ContractAIResult> {
    if (!aiConfig.apiKey) {
      throw new AIUnavailableError('OPENAI_API_KEY is not configured');
    }

    const client = new OpenAI({ apiKey: aiConfig.apiKey });
    const systemPrompt = aiConfig.systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT;
    const contractText = text.slice(0, aiConfig.maxInputChars);

    const completion = await client.chat.completions
      .parse({
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contractText },
        ],
        response_format: zodResponseFormat(AIResultSchema, 'contract_analysis'),
      })
      .catch((err: unknown) => {
        throw new AIUnavailableError(
          `AI provider request failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      });

    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      throw new InvalidAIResponseError(`AI refused the request: ${message.refusal}`);
    }
    const parsed = message?.parsed;
    if (!parsed) {
      throw new InvalidAIResponseError('AI returned no parseable structured output');
    }

    if (completion.usage) {
      recordUsage(
        aiConfig.model,
        completion.usage.prompt_tokens,
        completion.usage.completion_tokens,
      );
    }

    return { ...parsed, riskScore: clamp(Math.round(parsed.riskScore), 0, 100) };
  };
}
