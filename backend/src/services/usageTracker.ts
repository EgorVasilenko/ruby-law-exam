/**
 * Tracks estimated OpenAI spend since process start.
 *
 * We only use plain Chat Completions (no web search / file search / code
 * interpreter / containers), so cost is simply:
 *   input_tokens * input_rate + output_tokens * output_rate
 * Prices are USD per 1M tokens and are an ESTIMATE (rates change over time);
 * the authoritative figure is OpenAI's own billing dashboard.
 *
 * The running total is in-memory, so it resets on restart.
 */
interface ModelPricing {
  /** USD per 1M input (prompt) tokens. */
  input: number;
  /** USD per 1M output (completion) tokens. */
  output: number;
}

const PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
};

const FALLBACK_PRICING: ModelPricing = PRICING['gpt-4o-mini'];

let totalUsd = 0;

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const price = PRICING[model] ?? FALLBACK_PRICING;
  return (promptTokens * price.input + completionTokens * price.output) / 1_000_000;
}

/** Record one completion's token usage and log the incremental + cumulative cost. */
export function recordUsage(
  model: string,
  promptTokens: number,
  completionTokens: number,
): void {
  const cost = estimateCost(model, promptTokens, completionTokens);
  totalUsd += cost;
  console.log(
    `AI cost: $${cost.toFixed(5)} (${promptTokens} in + ${completionTokens} out) · ` +
      `total since start: $${totalUsd.toFixed(4)}`,
  );
}

/** Estimated total spend (USD) since process start. */
export function getTotalSpendUsd(): number {
  return totalUsd;
}
