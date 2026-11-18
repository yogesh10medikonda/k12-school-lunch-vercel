import { z } from 'zod';

/**
 * Environment validation with Zod.
 * Secrets (MONGODB_URI, JWT_SECRET later) live only in .env — never hardcoded.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('5000'),
  MONGODB_URI: z
    .string()
    .url('MONGODB_URI must be a valid MongoDB connection string'),
  FRONTEND_ORIGIN: z
    .string()
    .url('FRONTEND_ORIGIN must be a valid URL (never "*")'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;