import OpenAI from 'openai';
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

const AIResultSchema = z.object({
  type: z.enum(['NDA', 'Employment', 'Service Agreement', 'Lease', 'Other']),
  riskScore: z.number().min(0).max(100),
  missingClauses: z.array(z.string()),
  recommendations: z.array(z.string()),
  riskyClauses: z.array(riskyClauseSchema),
});

/**
 * Builds the AI analysis function (the only code that knows about OpenAI) from
 * injected config. Returns an AnalyzeFn: already-extracted text -> validated,
 * structured analysis.
 * - AIUnavailableError: provider unreachable (no key, network, outage).
 * - InvalidAIResponseError: provider replied but not with the expected JSON.
 */
export function createAiAnalyzer(aiConfig: Config['ai']): AnalyzeFn {
  return async function analyze(text: string): Promise<ContractAIResult> {
    if (!aiConfig.apiKey) {
      throw new AIUnavailableError('OPENAI_API_KEY is not configured');
    }

    // Created per call (not at startup) so an empty key degrades gracefully
    // instead of crashing the process on boot.
    const client = new OpenAI({ apiKey: aiConfig.apiKey });
    const systemPrompt = aiConfig.systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT;
    const contractText = text.slice(0, aiConfig.maxInputChars);

    let raw: string | null;
    try {
      const completion = await client.chat.completions.create({
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contractText },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? null;
      if (completion.usage) {
        recordUsage(
          aiConfig.model,
          completion.usage.prompt_tokens,
          completion.usage.completion_tokens,
        );
      }
    } catch (err) {
      throw new AIUnavailableError(
        `AI provider request failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }

    if (!raw) {
      throw new InvalidAIResponseError('AI returned an empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InvalidAIResponseError('AI returned invalid JSON');
    }

    const result = AIResultSchema.safeParse(parsed);
    if (!result.success) {
      throw new InvalidAIResponseError('AI response did not match the expected schema');
    }

    return result.data;
  };
}
