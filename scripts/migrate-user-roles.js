import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const adminEmails = [
    (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
    'jryusif@dashboard.com',
    'jryusiif@gmail.com'
  ].filter(Boolean);

  console.log(`Setting Admins:`, adminEmails);

  // Set admin user to ADMIN & APPROVED
  const adminUpdate = await prisma.user.updateMany({
    where: { email: { in: adminEmails } },
    data: {
      role: 'ADMIN',
      status: 'APPROVED',
      approvedAt: new Date()
    }
  });
  console.log(`Updated admin count: ${adminUpdate.count}`);

  // Set all other existing users to USER & PENDING (per requirement: even existing users need approval)
  const pendingUpdate = await prisma.user.updateMany({
    where: {
      email: { notIn: adminEmails }
    },
    data: {
      role: 'USER',
      status: 'PENDING'
    }
  });
  console.log(`Updated pending non-admin users count: ${pendingUpdate.count}`);

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, status: true }
  });
  console.log('Current DB Users status:');
  console.log(JSON.stringify(allUsers, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
