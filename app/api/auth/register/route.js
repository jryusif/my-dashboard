import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma.js';
import { JWT_SECRET, errorResponse, successResponse } from '@/lib/auth.js';
import { seedNewUserWorkspace } from '@/lib/seed.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required.', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return errorResponse('An account with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name ? name.trim() : normalizedEmail.split('@')[0]
      }
    });

    // Seed default workspace modules for this new user
    await seedNewUserWorkspace(user.id);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    return errorResponse('Could not create account. Please try again.', 500);
  }
}
