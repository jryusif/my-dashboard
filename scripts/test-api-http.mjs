import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || 'dev-fallback-jwt-secret-replace-in-production';

async function testHttpEndpoints() {
  console.log('📡 Testing Study HTTP Endpoints on http://localhost:3000...\n');

  try {
    const user = await prisma.user.findFirst({
      where: { email: { contains: '@' } }
    });

    if (!user) {
      console.error('No user found in database');
      process.exit(1);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, status: user.status },
      secret,
      { expiresIn: '1h' }
    );

    const endpoints = [
      '/api/study/profile',
      '/api/study/semesters',
      '/api/study/subjects',
      '/api/study/timetable',
      '/api/study/courses',
      '/api/study/resources',
      '/api/study/sessions',
      '/api/study/goals'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`http://localhost:3000${ep}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ ${ep} returned ${res.status}: ${text}`);
        process.exit(1);
      }

      const data = await res.json();
      console.log(`✅ ${ep} -> 200 OK (${Array.isArray(data) ? data.length + ' items' : typeof data})`);
    }

    console.log('\n🎉 ALL STUDY HTTP API ENDPOINTS VERIFIED AND RESPONDING 200 OK!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testHttpEndpoints();
