export interface ServerConfig {
  readonly port: number;
  /** Null runs the deterministic stub — used by tests and by local demos with no key. */
  readonly geminiApiKey: string | null;
  /** Tried in order. A capacity spike on Gemini is per-model, so a second one is
   *  the difference between an error and an answer. */
  readonly models: readonly string[];
  readonly allowedOrigin: string;
}

export const DEFAULT_MODELS: readonly string[] = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
];
export const DEFAULT_PORT = 8080;

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Model preference order.
 *
 * `GEMINI_MODELS` sets the whole list; `GEMINI_MODEL` sets just the first and
 * keeps the built-in fallbacks behind it.
 */
export function parseModels(env: Env): readonly string[] {
  const list = env.GEMINI_MODELS?.split(',')
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
  if (list !== undefined && list.length > 0) {
    return list;
  }
  const primary = env.GEMINI_MODEL?.trim();
  if (primary === undefined || primary.length === 0) {
    return DEFAULT_MODELS;
  }
  return [primary, ...DEFAULT_MODELS.filter((model) => model !== primary)];
}

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
    models: parseModels(env),
    allowedOrigin: env.ALLOWED_ORIGIN?.trim() ?? '*',
  };
}
