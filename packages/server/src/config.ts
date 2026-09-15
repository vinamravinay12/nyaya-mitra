export interface ServerConfig {
  readonly port: number;
  /** Null runs the deterministic stub — used by tests and by local demos with no key. */
  readonly geminiApiKey: string | null;
  readonly model: string;
  readonly allowedOrigin: string;
}

export const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
export const DEFAULT_PORT = 8080;

type Env = Readonly<Record<string, string | undefined>>;

const parsePort = (value: string | undefined): number => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65_536 ? port : DEFAULT_PORT;
};

/**
 * Reads configuration from the environment.
 *
 * Missing credentials are tolerated in development so the app runs end to end
 * without a key, but refused in production: silently degrading a deployed legal
 * assistant to canned answers would be worse than failing to start.
 */
export function loadConfig(env: Env): ServerConfig {
  const geminiApiKey = env.GEMINI_API_KEY?.trim();
  const isProduction = env.NODE_ENV === 'production';

  if (isProduction && (geminiApiKey === undefined || geminiApiKey.length === 0)) {
    throw new Error('GEMINI_API_KEY is required in production');
  }

  return {
    port: parsePort(env.PORT),
    geminiApiKey: geminiApiKey !== undefined && geminiApiKey.length > 0 ? geminiApiKey : null,
    model: env.GEMINI_MODEL?.trim() ?? DEFAULT_MODEL,
    allowedOrigin: env.ALLOWED_ORIGIN?.trim() ?? '*',
  };
}
