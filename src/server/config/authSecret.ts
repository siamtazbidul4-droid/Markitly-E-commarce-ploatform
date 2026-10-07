import dotenv from 'dotenv';
import crypto from 'crypto';

/**
 * Single source of truth for the JWT signing secret.
 *
 * Previously both `middleware/auth.ts` and `controllers/authController.ts` read
 * `process.env.AUTH_SECRET` independently and silently fell back to a hard-coded
 * string, which meant tokens could be forged whenever the variable was missing.
 *
 * The value is resolved lazily because ESM evaluates imports before the entry
 * module body runs, so `dotenv.config()` in `server.ts` executes too late for a
 * module-level `process.env` read.
 */

let envLoaded = false;

const loadEnvOnce = (): void => {
  if (envLoaded) return;
  envLoaded = true;
  dotenv.config();
};

/**
 * A per-process random secret is generated when `AUTH_SECRET` is absent. It is
 * never a fixed literal, so tokens cannot survive a restart or be forged from
 * a value published in source control. Production additionally fails fast.
 */
const resolveSecret = (): string => {
  loadEnvOnce();
  const configured = (process.env.AUTH_SECRET || '').trim();
  if (configured.length >= 16) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Auth] AUTH_SECRET must be set to at least 16 characters in production. Refusing to sign or verify tokens with an insecure secret.'
    );
  }

  console.warn(
    '[Auth] AUTH_SECRET is not set. Using a random per-process development secret; all sessions reset on restart.'
  );
  return crypto.randomBytes(48).toString('hex');
};

let cachedSecret: string | null = null;

export const getJwtSecret = (): string => {
  if (cachedSecret === null) cachedSecret = resolveSecret();
  return cachedSecret;
};

export const isJwtSecretConfigured = (): boolean => {
  loadEnvOnce();
  return (process.env.AUTH_SECRET || '').trim().length >= 16;
};