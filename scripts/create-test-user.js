// =============================================================================
// scripts/create-test-user.js — Create & Seed Master Test Account
// Run: node scripts/create-test-user.js
// =============================================================================

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { seedNewUserWorkspace } from '../lib/seed.js';

const prisma = new PrismaClient();

async function createTestAccount() {
  const email = 'jryusif@dashboard.com';
  const password = 'password123';
  const name = 'Mohamed Yousef';

  console.log(`\n🐘 Connecting to Neon PostgreSQL: ${process.env.DATABASE_URL.split('@')[0]}@*****`);

  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      console.log(`ℹ️ User ${email} already exists. Updating password...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, name }
      });
    } else {
      console.log(`✨ Creating user ${email}...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        }
      });
      console.log('🌱 Seeding workspace modules (splits, routines, roadmap, finances)...');
      await seedNewUserWorkspace(user.id);
    }

    // Add some sample tasks for today
    const today = new Date().toISOString().split('T')[0];
    const taskCount = await prisma.task.count({ where: { userId: user.id } });
    if (taskCount === 0) {
      console.log('📋 Creating initial sample tasks...');
      await prisma.task.createMany({
        data: [
          { userId: user.id, title: 'Review Dental Anatomy & Rotary Endo Protocol', category: 'Studies', date: today, completed: false, timeBlock: 'Morning' },
          { userId: user.id, title: 'Push Day: Flat Barbell Bench 4x8 & Incline DB 3x10', category: 'Workouts', date: today, completed: true, timeBlock: 'Afternoon' },
          { userId: user.id, title: 'Analyze EUR/USD London & New York Session Liquidity', category: 'Us stocks trading', date: today, completed: false, timeBlock: 'Afternoon' },
          { userId: user.id, title: 'Document Aesthetic Anterior Composite Veneer Case', category: 'Work', date: today, completed: false, timeBlock: 'Evening' },
          { userId: user.id, title: 'Review Monthly Savings Rate & Allocate Gold Vault', category: 'Religion', date: today, completed: true, timeBlock: 'Night' }
        ]
      });
    }

    // Add a sample dental case if none exist
    const dentalCount = await prisma.dentalCase.count({ where: { userId: user.id } });
    if (dentalCount === 0) {
      console.log('🦷 Adding showcase dental case...');
      await prisma.dentalCase.create({
        data: {
          userId: user.id,
          patientCode: 'PT-8821',
          title: 'Class IV Direct Aesthetic Composite Layering (#11 & #21)',
          specialty: 'Restorative & Aesthetics',
          teeth: '11, 21',
          diagnosis: 'Coronal fracture involving enamel and dentin without pulp exposure following sports trauma.',
          treatmentPlan: 'Diagnostic wax-up, palatal silicone index, polychromatic composite stratification, high-gloss micro-polishing.',
          clinicalNotes: 'Rubber dam isolation applied. 37% phosphoric acid etch for 15s. Universal adhesive light-cured. Dentin shade A2 followed by Enamel A1 and translucent incisal halo.',
          materialsUsed: '3M Filtek Supreme XTE, OptiBond FL, Sof-Lex Discs, DiaShine Paste',
          totalCost: 650,
          status: 'Completed',
          showcaseForPatients: true,
          date: today,
          photos: [
            { label: 'Pre-Op Fracture', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80' },
            { label: 'Post-Op High Polish', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80' }
          ],
          steps: [
            { stepNum: 1, title: 'Isolation & Bevel', desc: 'Absolute isolation with rubber dam and 2mm infinity bevel on facial margin.' },
            { stepNum: 2, title: 'Stratification', desc: 'Palatal shell using silicone index, internal characterization, body dentin, and enamel coat.' },
            { stepNum: 3, title: 'Macro/Micro Texture & Polish', desc: 'Perikymata creation using fine diamond bur, spiral wheels, and diamond paste.' }
          ]
        }
      });
    }

    // Add a sample workout PR log if none exist
    const logCount = await prisma.exerciseWeightLog.count({ where: { userId: user.id } });
    if (logCount === 0) {
      console.log('🏋️ Logging starter PRs...');
      await prisma.exerciseWeightLog.createMany({
        data: [
          { userId: user.id, exerciseName: 'Barbell Flat Bench Press', weightKg: 100, weightLbs: 220.5, setsReps: '4x6 @ 100kg', isPr: true, date: today, notes: 'Solid lockouts with clean pause on chest' },
          { userId: user.id, exerciseName: 'Barbell Back Squat', weightKg: 140, weightLbs: 308.6, setsReps: '4x5 @ 140kg', isPr: true, date: today, notes: 'Hit full depth below parallel' },
          { userId: user.id, exerciseName: 'Conventional Deadlift', weightKg: 180, weightLbs: 396.8, setsReps: '3x5 @ 180kg', isPr: true, date: today, notes: 'Felt very explosive off the floor' }
        ]
      });
    }

    console.log('\n=============================================================');
    console.log('✅ TEST ACCOUNT READY & LIVE ON NEON POSTGRESQL');
    console.log('=============================================================');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name:     ${name}`);
    console.log(`🆔 User ID:  ${user.id}`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Error creating test account:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccount();
