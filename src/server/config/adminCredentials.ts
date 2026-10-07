import crypto from 'crypto';
import dotenv from 'dotenv';

/**
 * Server-only administrator bootstrap credentials.
 *
 * Values are read exclusively from process-level environment variables so they
 * are never bundled into the client build. Nothing in this module is exported to
 * the browser: only `verifyAdminCredentials` and `isAdminConfigured` are used by
 * the API layer.
 *
 * ESM evaluates every import before the entry module body runs, so `dotenv.config()`
 * in `server.ts` is too late for module-level `process.env` reads. The variables are
 * therefore resolved lazily on first access, and `dotenv` is loaded here as well so the
 * `.env` file is available regardless of which module is evaluated first.
 */

let envLoaded = false;

const loadEnvOnce = (): void => {
  if (envLoaded) return;
  envLoaded = true;
  dotenv.config();
};

const readEnv = (key: string): string => {
  loadEnvOnce();
  return (process.env[key] || '').trim();
};

/**
 * Reads a secret without trimming it.
 *
 * `readEnv` strips surrounding whitespace, which is right for an email address
 * but silently rewrites a password that legitimately begins or ends with a
 * space: the operator sets one value, the server verifies another, and every
 * sign-in fails with a generic 401.
 */
const readSecretEnv = (key: string): string => {
  loadEnvOnce();
  return process.env[key] || '';
};

let loggedConfigurationWarning = false;

export const isAdminConfigured = (): boolean =>
  readEnv('ADMIN_EMAIL').length > 0 && readEnv('ADMIN_PASSWORD').length > 0;

/**
 * Reports exactly which variables are missing, by name only.
 *
 * Printed once at boot so a deployment that forgot to set the bootstrap
 * credentials fails loudly in the log instead of rejecting every sign-in with an
 * indistinguishable 401. No secret value is ever included.
 */
export const describeAdminConfiguration = (): string[] => {
  const missing: string[] = [];
  if (readEnv('ADMIN_EMAIL').length === 0) missing.push('ADMIN_EMAIL');
  if (readEnv('ADMIN_PASSWORD').length === 0) missing.push('ADMIN_PASSWORD');
  return missing;
};

export const warnIfAdminUnconfigured = (): void => {
  const missing = describeAdminConfiguration();
  if (missing.length === 0) return;
  console.error(
    `[AdminAuth] Administrator sign-in is DISABLED: ${missing.join(' and ')} ${
      missing.length === 1 ? 'is' : 'are'
    } not set in the server environment. POST /api/v1/admin/login will answer 503 until ${
      missing.length === 1 ? 'it is' : 'they are'
    } provided.`
  );
};

export const getAdminEmail = (): string => readEnv('ADMIN_EMAIL').toLowerCase();

export const getAdminDisplayName = (): string =>
  readEnv('ADMIN_DISPLAY_NAME') || 'Marketly Administrator';

/**
 * Compares two strings in constant time so response timing does not leak how
 * much of a secret matched.
 */
const safeCompare = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) {
    // Still perform a comparison to keep the work factor stable.
    crypto.timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
};

export const verifyAdminCredentials = (email: unknown, password: unknown): boolean => {
  if (!isAdminConfigured()) {
    if (!loggedConfigurationWarning) {
      loggedConfigurationWarning = true;
      console.error(
        '[AdminAuth] ADMIN_EMAIL and ADMIN_PASSWORD must be configured in the server environment before administrator sign-in is possible.'
      );
    }
    return false;
  }

  if (typeof email !== 'string' || typeof password !== 'string') return false;

  const normalizedEmail = email.trim().toLowerCase();
  const emailMatches = safeCompare(normalizedEmail, readEnv('ADMIN_EMAIL').toLowerCase());
  const passwordMatches = safeCompare(password, readSecretEnv('ADMIN_PASSWORD'));

  // Both checks always run: no early return that would leak which half failed.
  return emailMatches && passwordMatches;
};