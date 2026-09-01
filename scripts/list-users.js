import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true }
  });
  console.log('CURRENT USERS IN DB:');
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
