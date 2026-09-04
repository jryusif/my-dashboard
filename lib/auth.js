import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-jwt-secret-replace-in-production';

export function getAuthUser(req) {
  let authHeader = null;
  if (req.headers) {
    if (typeof req.headers.get === 'function') {
      authHeader = req.headers.get('authorization');
    } else {
      authHeader = req.headers.authorization || req.headers.Authorization;
    }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      userId: null,
      user: null,
      error: 'Authentication required. Please sign in.',
      status: 401
    };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      authenticated: true,
      userId: decoded.userId,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'USER',
        status: decoded.status || 'APPROVED',
        currency: decoded.currency || null
      },
      email: decoded.email,
      role: decoded.role || 'USER',
      userStatus: decoded.status || 'APPROVED',
      currency: decoded.currency || null
    };
  } catch (err) {
    return {
      authenticated: false,
      userId: null,
      user: null,
      error: 'Session expired. Please sign in again.',
      status: 401
    };
  }
}

/**
 * Check if the request is from an authenticated user with ADMIN role in database
 */
export async function requireAdmin(req) {
  const auth = getAuthUser(req);
  if (!auth.authenticated || !auth.userId) {
    return { authorized: false, error: auth.error || 'Authentication required.', status: 401 };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, name: true, role: true, status: true }
    });

    if (!user) {
      return { authorized: false, error: 'User not found.', status: 401 };
    }

    if (user.role !== 'ADMIN') {
      return { authorized: false, error: 'Administrator access required.', status: 403 };
    }

    if (user.status !== 'APPROVED') {
      return { authorized: false, error: 'Administrator account is not active.', status: 403 };
    }

    return { authorized: true, user };
  } catch (err) {
    console.error('Error verifying admin authorization:', err);
    return { authorized: false, error: 'Internal server authorization check failed.', status: 500 };
  }
}

export function unauthorizedResponse(message = 'Authentication required. Please sign in.') {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Access denied. Administrator privileges required.') {
  return Response.json({ error: message }, { status: 403 });
}

export function errorResponse(message, status = 500) {
  return Response.json({ error: message }, { status });
}

export function jsonError(message, status = 500) {
  return Response.json({ error: message }, { status });
}

export function successResponse(data, status = 200) {
  return Response.json(data, { status });
}

export function jsonSuccess(data, status = 200) {
  return Response.json(data, { status });
}

