import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/authSecret';
import {
  getAdminDisplayName,
  getAdminEmail,
  isAdminConfigured,
  verifyAdminCredentials,
} from '../config/adminCredentials';
import { memoryStore } from '../config/memoryStore';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

const ADMIN_TOKEN_TTL = '8h';

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: 'super_admin';
  scope: 'admin';
}

const signAdminToken = (): string => {
  const payload: AdminTokenPayload = {
    id: 'admin_bootstrap',
    email: getAdminEmail(),
    name: getAdminDisplayName(),
    role: 'super_admin',
    scope: 'admin',
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ADMIN_TOKEN_TTL });
};

/**
 * Simple in-memory throttle for failed admin sign-in attempts. Blocks brute
 * force attempts without introducing a new persistence dependency.
 */
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000;
const attemptsByKey = new Map<string, { count: number; firstAt: number }>();

const consumeAttemptBudget = (key: string): { blocked: boolean; retryAfterSeconds: number } => {
  const now = Date.now();
  const entry = attemptsByKey.get(key);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attemptsByKey.set(key, { count: 1, firstAt: now });
    return { blocked: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - entry.firstAt)) / 1000);
    return { blocked: true, retryAfterSeconds };
  }
  return { blocked: false, retryAfterSeconds: 0 };
};

const clearAttempts = (key: string): void => {
  attemptsByKey.delete(key);
};

const clientKey = (req: Request): string =>
  String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

/**
 * POST /api/v1/admin/login
 * Verifies bootstrap administrator credentials against server environment
 * variables only, then issues a signed, expiring admin session token.
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const key = clientKey(req);
  const throttle = consumeAttemptBudget(key);

  if (throttle.blocked) {
    res.setHeader('Retry-After', String(throttle.retryAfterSeconds));
    res.status(429).json({
      success: false,
      message: 'Too many administrator sign-in attempts. Please wait and try again.',
    });
    return;
  }

  if (!isAdminConfigured()) {
    // A misconfigured server is NOT a credential problem. Answering 401 here made
    // every attempt look like a wrong password, which is unactionable for the
    // operator: the real cause (ADMIN_EMAIL / ADMIN_PASSWORD absent from the
    // process environment, e.g. a deploy where they were never set) only ever
    // appeared in the server log. 503 keeps the endpoint closed while telling the
    // caller - and the browser notification - that the service is not ready.
    res.status(503).json({
      success: false,
      message: 'Administrator sign-in is not configured on this server.',
    });
    return;
  }

  const { email, password } = req.body ?? {};
  const invalid = () =>
    res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });

  // A malformed request is a client error and is reported as one; only an
  // actual credential mismatch is a 401. Neither response distinguishes an
  // unknown email from a wrong password.
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  // Never log the submitted password or its length.
  if (!verifyAdminCredentials(email, password)) {
    invalid();
    return;
  }

  clearAttempts(key);

  try {
    if (memoryStore.users.every((u) => u.email.toLowerCase() !== getAdminEmail())) {
      memoryStore.users.unshift({
        id: 'admin_bootstrap',
        name: getAdminDisplayName(),
        email: getAdminEmail(),
        role: 'super_admin',
        phone: '',
        addresses: [],
      });
    }
  } catch {
    // The in-memory directory is a convenience only; auth does not depend on it.
  }

  try {
    await AuditLog.create({
      actor: getAdminDisplayName(),
      action: 'Admin Sign In',
      resource: 'Auth',
      details: 'Successful administrator console sign-in',
    });
  } catch {
    memoryStore.logAudit(
      getAdminDisplayName(),
      'Admin Sign In',
      'Auth',
      'Successful administrator console sign-in'
    );
  }

  res.json({
    success: true,
    token: signAdminToken(),
    expiresIn: ADMIN_TOKEN_TTL,
    user: {
      id: 'admin_bootstrap',
      name: getAdminDisplayName(),
      email: getAdminEmail(),
      role: 'super_admin' as const,
    },
  });
};

/**
 * GET /api/v1/admin/session
 * Validates an existing admin token so the client can restore its session after
 * a refresh without ever receiving credential material.
 */
export const getAdminSession = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};