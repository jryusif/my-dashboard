import jwt from 'jsonwebtoken';

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
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email };
  } catch (err) {
    return null;
  }
}

export function unauthorizedResponse(message = 'Authentication required. Please sign in.') {
  return Response.json({ error: message }, { status: 401 });
}

export function errorResponse(message, status = 500) {
  return Response.json({ error: message }, { status });
}

export function successResponse(data, status = 200) {
  return Response.json(data, { status });
}
