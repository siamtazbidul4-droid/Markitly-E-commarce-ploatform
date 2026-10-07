import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/authSecret';

export interface AuthUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'content_manager' | 'customer';
  name: string;
  scope?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const KNOWN_ROLES: readonly AuthUser['role'][] = [
  'super_admin',
  'admin',
  'content_manager',
  'customer',
];

const isKnownRole = (value: unknown): value is AuthUser['role'] =>
  typeof value === 'string' && (KNOWN_ROLES as readonly string[]).includes(value);

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (!decoded || typeof decoded !== 'object' || !isKnownRole(decoded.role)) {
      res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
      return;
    }
    const id = typeof decoded.id === 'string' ? decoded.id : '';
    const email = typeof decoded.email === 'string' ? decoded.email : '';
    if (!id || !email) {
      res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
      return;
    }
    req.user = {
      id,
      email,
      name: typeof decoded.name === 'string' ? decoded.name : email,
      role: decoded.role,
      scope: typeof decoded.scope === 'string' ? decoded.scope : undefined,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

/**
 * Populates `req.user` when a valid token is present but never rejects the
 * request. Used by endpoints that are usable anonymously yet show richer data
 * to the signed-in owner or to staff.
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (decoded && typeof decoded === 'object' && isKnownRole(decoded.role)) {
      const id = typeof decoded.id === 'string' ? decoded.id : '';
      const email = typeof decoded.email === 'string' ? decoded.email : '';
      if (id && email) {
        req.user = {
          id,
          email,
          name: typeof decoded.name === 'string' ? decoded.name : email,
          role: decoded.role,
          scope: typeof decoded.scope === 'string' ? decoded.scope : undefined,
        };
      }
    }
  } catch {
    // An unusable token is treated as "not signed in" rather than an error.
  }

  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please sign in.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message:
          'Forbidden. You do not possess the required administrative permissions for this operation.',
      });
      return;
    }
    next();
  };
};