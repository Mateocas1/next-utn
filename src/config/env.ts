import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'), // Hardcodeado a production
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
  IDEMPOTENCY_TTL: z.coerce.number().int().positive().default(86400),
  CORS_ORIGIN: z.string().default('*'),
});

export type EnvConfig = z.infer<typeof envSchema>;

class EnvConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvConfigError';
  }
}

export function loadEnvConfig(): EnvConfig {
  try {
    const parsed = envSchema.safeParse(process.env);
    
    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      throw new EnvConfigError(
        `Environment validation failed:\n${errorMessages}\n\n` +
        'Please check your .env file or environment variables.'
      );
    }
    
    return parsed.data;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw error;
    }
    throw new EnvConfigError(
      `Failed to load environment configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = loadEnvConfig();
  }
  return cachedEnv;
}

// Don't export env as a constant to avoid immediate validation
// Use getEnv() instead