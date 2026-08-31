import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function checkCases() {
  const cases = await prisma.dentalCase.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Found ${cases.length} dental cases in Neon PostgreSQL:`);
  cases.forEach(c => {
    console.log(`- [${c.id}] Patient: ${c.patientCode} | Title: "${c.title}" | Date: ${c.date} | User: ${c.userId}`);
  });
  await prisma.$disconnect();
}

checkCases();
