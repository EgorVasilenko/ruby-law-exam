import { z } from 'zod';

/**
 * Single source of truth for environment configuration.
 * Parsed and validated once (fail-fast) in the composition root, then injected
 * where needed — nothing else reads process.env.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(10),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),
  OPENAI_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(60_000),
  AI_SYSTEM_PROMPT: z.string().default(''),
});

export interface Config {
  server: { port: number; frontendUrl: string };
  upload: { maxMb: number; maxBytes: number };
  ai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxInputChars: number;
    systemPrompt: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Treat empty strings as "unset" so .default() applies (e.g. MAX_UPLOAD_MB=).
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== ''),
  );

  const result = EnvSchema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  const parsed = result.data;
  return {
    server: { port: parsed.PORT, frontendUrl: parsed.FRONTEND_URL },
    upload: { maxMb: parsed.MAX_UPLOAD_MB, maxBytes: parsed.MAX_UPLOAD_MB * 1024 * 1024 },
    ai: {
      apiKey: parsed.OPENAI_API_KEY,
      model: parsed.OPENAI_MODEL,
      temperature: parsed.OPENAI_TEMPERATURE,
      maxInputChars: parsed.OPENAI_MAX_INPUT_CHARS,
      systemPrompt: parsed.AI_SYSTEM_PROMPT,
    },
  };
}
