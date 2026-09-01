import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  const adminEmail = 'jryusiif@gmail.com';

  console.log('🔍 Verifying and initializing Persona & Segments for master account:', adminEmail);

  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (adminUser) {
      const updated = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          persona: 'DOCTOR',
          experienceLevel: 'Senior / Specialist',
          specialty: 'Clinical & Restorative Dentistry, Prop Trader',
          primaryFocus: 'Master advanced clinical aesthetics & compound financial independence',
          currency: 'USD',
          onboardingCompleted: true,
          departmentSegments: {
            work: ['Clinical Cases & Surgery', 'Patient Consultations', 'Clinic Management', 'Emergency Procedures'],
            studies: ['Board Exams & Mocks', 'Evidence-Based Research', 'Continuing Medical Education (CME)'],
            finance: ['Clinical Revenue', 'Equipment & Materials', 'Private Practice Overhead', 'Investments'],
            fitness: ['Ergonomic Posture & Mobility', 'Strength & Core Conditioning', 'Cardio & Stamina'],
            roadmap: ['Clinical Mastery', 'Clinic Scaling & Ownership', 'Academic Fellowships', 'Financial Independence']
          }
        }
      });
      console.log('✅ Admin initialized with Persona and Segments:', updated.persona, updated.departmentSegments);
    } else {
      console.warn('⚠️ Admin user not found in database');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
