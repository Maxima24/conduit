import { z } from 'zod';

/** Typed, validated environment. Unknown keys (e.g. WEBHOOK_SECRET_*) are read via process.env. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WEB_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('conduit@example.dev'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${parsed.error.message}`);
  }
  return parsed.data;
}
