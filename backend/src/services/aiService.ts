import OpenAI from 'openai';
import { z } from 'zod';
import { DEFAULT_SYSTEM_PROMPT } from './prompts';
import { recordUsage } from './usageTracker';
import { AIUnavailableError, InvalidAIResponseError } from '../errors';
import type { ContractAIResult } from '../types';

/** Cap the text sent to the model to keep token usage and cost bounded. */
const MAX_INPUT_CHARS = 60_000;
const DEFAULT_MODEL = 'gpt-4o-mini';

const AIResultSchema = z.object({
  type: z.enum(['NDA', 'Employment', 'Service Agreement', 'Lease', 'Other']),
  riskScore: z.number().min(0).max(100),
  missingClauses: z.array(z.string()),
  recommendations: z.array(z.string()),
});

/**
 * The only module that knows about OpenAI. Takes already-extracted contract
 * text and returns a validated, structured analysis.
 * - AIUnavailableError: provider unreachable (no key, network, outage).
 * - InvalidAIResponseError: provider replied but not with the expected JSON.
 */
export async function callAI(text: string): Promise<ContractAIResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIUnavailableError('OPENAI_API_KEY is not configured');
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const systemPrompt = process.env.AI_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT;
  const contractText = text.slice(0, MAX_INPUT_CHARS);

  let raw: string | null;
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contractText },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
    if (completion.usage) {
      recordUsage(model, completion.usage.prompt_tokens, completion.usage.completion_tokens);
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
}
