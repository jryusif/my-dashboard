import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash('0193010+Toty', 10);

  // 1. Ensure jryusiif@gmail.com exists as ADMIN & APPROVED
  const user1 = await prisma.user.upsert({
    where: { email: 'jryusiif@gmail.com' },
    update: {
      password: passwordHash,
      name: 'Mohamed Yousef',
      role: 'ADMIN',
      status: 'APPROVED',
      approvedAt: new Date()
    },
    create: {
      email: 'jryusiif@gmail.com',
      password: passwordHash,
      name: 'Mohamed Yousef',
      role: 'ADMIN',
      status: 'APPROVED',
      approvedAt: new Date()
    }
  });

  // 2. Also update jryusif@dashboard.com password to match so both logins work
  const user2 = await prisma.user.updateMany({
    where: { email: 'jryusif@dashboard.com' },
    data: {
      password: passwordHash,
      role: 'ADMIN',
      status: 'APPROVED'
    }
  });

  console.log('✅ Admin accounts synced and ready:');
  console.log('User 1 (jryusiif@gmail.com):', user1.id, user1.role, user1.status);
  console.log('User 2 updated count:', user2.count);

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, status: true }
  });
  console.log('All Users:', JSON.stringify(allUsers, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
