import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma.js';
import { JWT_SECRET, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return errorResponse('Invalid email or password.', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse('Invalid email or password.', 401);
    }

    // Check account approval status
    if (user.status === 'PENDING') {
      return Response.json({
        error: 'Your account is pending administrator approval. You will receive access once the admin approves your request.',
        status: 'PENDING',
        pending: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      }, { status: 403 });
    }

    if (user.status === 'REJECTED') {
      return Response.json({
        error: 'Your access request has been declined or deactivated by the administrator.',
        status: 'REJECTED',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      }, { status: 403 });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    }).catch(err => console.warn('Could not update lastLoginAt:', err));

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    }, JWT_SECRET, { expiresIn: '30d' });

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        specialty: user.specialty,
        bio: user.bio,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Could not log in. Please try again.', 500);
  }
}
