import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User as UserModel } from '../models/User';
import { AuditLog as AuditLogModel } from '../models/AuditLog';
import { isDbConnected } from '../config/db';
import { memoryStore } from '../config/memoryStore';
import { getJwtSecret } from '../config/authSecret';
import { AuthRequest } from '../middleware/auth';
import { User as UserType } from '../../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (isDbConnected()) {
      const existing = await UserModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const user = await UserModel.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'customer',
        addresses: [],
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
        },
      });
      return;
    }

    const existingMem = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingMem) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const newUser: UserType = {
      id: 'usr_' + Date.now(),
      name,
      email: email.toLowerCase(),
      role: 'customer',
      phone: phone || '',
      addresses: [],
    };
    memoryStore.users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth] register failed:', error.message || error);
    // A duplicate unique index still means "this email is taken".
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Registration could not be completed. Please try again.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    if (isDbConnected()) {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      // Staff accounts must authenticate through /v1/admin/login so that the
      // environment-configured administrator credentials are always enforced.
      if (user.role !== 'customer') {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      await AuditLogModel.create({
        actor: user.name,
        action: 'User Sign In',
        resource: 'Auth',
        details: `Successful sign-in with role ${user.role}`,
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          addresses: user.addresses,
        },
      });
      return;
    }

    // In-memory fallback cannot verify a password: the fallback store keeps no
    // credential material. Returning a session here would let anyone who knows a
    // customer email sign in, so customer password authentication is only
    // available once a real database is configured.
    res.status(503).json({
      success: false,
      message:
        'Customer sign-in requires a configured database connection. Set MONGODB_URI on the server to enable account authentication.',
    });
  } catch (error: any) {
    console.error('[Auth] login failed:', error.message || error);
    res.status(500).json({ success: false, message: 'Sign-in could not be completed. Please try again.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = req.user;
    if (!session) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (isDbConnected()) {
      // The administrator session id is the synthetic `admin_bootstrap`, not an
      // ObjectId. Passing it to `findById` raised a CastError that surfaced as a
      // 500 on /auth/me, so the lookup is only attempted for a real document id.
      if (mongoose.Types.ObjectId.isValid(session.id)) {
        const user = await UserModel.findById(session.id).select('-password');
        if (user) {
          res.json({ success: true, user });
          return;
        }
      }
    }

    const user = memoryStore.users.find((u) => u.id === session.id || u.email === session.email);
    res.json({ success: true, user: user || session });
  } catch (error: any) {
    console.error('[Auth] getMe failed:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Your session could not be verified right now. Please try again.',
    });
  }
};
