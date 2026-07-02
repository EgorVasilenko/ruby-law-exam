import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { recordUsage } from './usageTracker';
import { AIUnavailableError, InvalidAIResponseError } from '../errors';
import type { Config } from '../config';
import type { StructuredCompleter } from './aiService';

/**
 * OpenAI implementation of the StructuredCompleter seam — the only code that
 * knows about OpenAI. Uses Structured Outputs (zodResponseFormat) so the model
 * is constrained to the schema server-side; reports token usage.
 * - AIUnavailableError: provider unreachable (no key, network, outage).
 * - InvalidAIResponseError: model refused or returned nothing parseable.
 */
export function openAiCompleter(cfg: Config['ai']): StructuredCompleter {
  return async ({ system, user, schema, schemaName }) => {
    if (!cfg.apiKey) {
      throw new AIUnavailableError('OPENAI_API_KEY is not configured');
    }

    const client = new OpenAI({ apiKey: cfg.apiKey });

    const completion = await client.chat.completions
      .parse({
        model: cfg.model,
        temperature: cfg.temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: zodResponseFormat(schema, schemaName),
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
    if (message?.parsed === null || message?.parsed === undefined) {
      throw new InvalidAIResponseError('AI returned no parseable structured output');
    }

    if (completion.usage) {
      recordUsage(cfg.model, completion.usage.prompt_tokens, completion.usage.completion_tokens);
    }

    return message.parsed;
  };
}
