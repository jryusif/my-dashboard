import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function updateAdmin() {
  const prisma = new PrismaClient();
  const adminEmail = 'jryusiif@gmail.com';

  console.log('🔄 Syncing full segment suite and financial setting for:', adminEmail);

  try {
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (admin) {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          persona: 'DOCTOR',
          experienceLevel: 'Senior / Specialist',
          specialty: 'Clinical & Restorative Dentistry, Prop Trader',
          currency: 'USD',
          departmentSegments: {
            work: ['Clinical Cases & Surgery', 'Patient Consultations', 'Clinic Management', 'Emergency Procedures'],
            studies: ['Board Exams & Mocks', 'Evidence-Based Research', 'Continuing Medical Education (CME)'],
            incomeSources: ['Clinical Practice', 'US Stocks Trading', 'Salary', 'Investment Returns', 'Freelance / Consulting', 'Other Income'],
            expenseCategories: ['Clinic & Dental Materials', 'Trading Tools / Subscriptions', 'Studies & Books', 'Gym & Nutrition', 'Living & Food', 'Transport', 'Tech & Gear', 'Other Expenses'],
            accounts: ['Cash Wallet', 'Bank Checking', 'Trading Account', 'Gold Bullion Vault', 'Savings Account'],
            fitness: ['Ergonomic Posture & Mobility', 'Strength & Core Conditioning', 'Cardio & Stamina'],
            trading: ['Pre-Market Prep', 'Execution & Tape Reading', 'Journaling & Review']
          }
        }
      });

      await prisma.financialSetting.upsert({
        where: { userId: admin.id },
        update: {
          monthlyBudget: 3500,
          savingsTargetPct: 30,
          currency: 'USD'
        },
        create: {
          userId: admin.id,
          monthlyBudget: 3500,
          savingsTargetPct: 30,
          currency: 'USD'
        }
      });

      console.log('✅ Admin user synced successfully!');
    }
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
