import { prisma } from './prisma.js';

export async function seedNewUserWorkspace(userId) {
  try {
    // 1. Starter Workout Splits & Exercises
    const defaultSplits = [
      {
        dayName: 'Saturday',
        muscleGroup: 'Chest & Triceps (Push A)',
        order: 1,
        exercises: [
          { name: 'Barbell Flat Bench Press', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Cable Chest Flyes', targetSets: 3, targetReps: '12-15', order: 3 },
          { name: 'Overhead Tricep Rope Extension', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Tricep Straight Bar Pushdown', targetSets: 3, targetReps: '12-15', order: 5 }
        ]
      },
      {
        dayName: 'Sunday',
        muscleGroup: 'Back & Biceps (Pull A)',
        order: 2,
        exercises: [
          { name: 'Barbell Bent Over Row', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Lat Pulldown (Wide Grip)', targetSets: 3, targetReps: '8-12', order: 2 },
          { name: 'Seated Cable Row (Close Grip)', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Incline Dumbbell Bicep Curl', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Hammer Curls (Rope / Dumbbell)', targetSets: 3, targetReps: '12-15', order: 5 }
        ]
      },
      {
        dayName: 'Monday',
        muscleGroup: 'Legs & Core (Legs A)',
        order: 3,
        exercises: [
          { name: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Romanian Deadlift (RDL)', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Leg Press (45 Degree)', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Seated Leg Curl', targetSets: 3, targetReps: '12-15', order: 4 },
          { name: 'Standing Calf Raise', targetSets: 4, targetReps: '15-20', order: 5 }
        ]
      },
      {
        dayName: 'Tuesday',
        muscleGroup: 'Rest & Recovery',
        order: 4,
        exercises: [
          { name: 'Light Mobility & Stretching', targetSets: 1, targetReps: '20 mins', order: 1 },
          { name: 'Zone 2 Cardio / Walking', targetSets: 1, targetReps: '30 mins', order: 2 }
        ]
      },
      {
        dayName: 'Wednesday',
        muscleGroup: 'Shoulders & Arms (Upper Focus)',
        order: 5,
        exercises: [
          { name: 'Seated Overhead Dumbbell Press', targetSets: 4, targetReps: '8-10', order: 1 },
          { name: 'Cable Lateral Raise', targetSets: 4, targetReps: '12-15', order: 2 },
          { name: 'Face Pulls (Rear Delts)', targetSets: 3, targetReps: '15-20', order: 3 },
          { name: 'EZ Bar Preacher Curl', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Dips / Skull Crushers', targetSets: 3, targetReps: '10-12', order: 5 }
        ]
      },
      {
        dayName: 'Thursday',
        muscleGroup: 'Legs & Posterior Chain (Legs B)',
        order: 6,
        exercises: [
          { name: 'Conventional Deadlift', targetSets: 3, targetReps: '5', order: 1 },
          { name: 'Bulgarian Split Squat', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Lying Hamstring Curl', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Leg Extension', targetSets: 3, targetReps: '12-15', order: 4 },
          { name: 'Hanging Leg Raise', targetSets: 3, targetReps: '15', order: 5 }
        ]
      },
      {
        dayName: 'Friday',
        muscleGroup: 'Full Body Conditioning & Core',
        order: 7,
        exercises: [
          { name: 'Incline Smith Bench Press', targetSets: 3, targetReps: '8-10', order: 1 },
          { name: 'Neutral Grip Pull-ups', targetSets: 3, targetReps: 'AMRAP', order: 2 },
          { name: 'Dumbbell Walking Lunges', targetSets: 3, targetReps: '12/leg', order: 3 },
          { name: 'Ab Wheel Rollout', targetSets: 3, targetReps: '15', order: 4 }
        ]
      }
    ];

    for (const split of defaultSplits) {
      await prisma.workoutSplit.create({
        data: {
          userId,
          dayName: split.dayName,
          muscleGroup: split.muscleGroup,
          order: split.order
        }
      });

      for (const ex of split.exercises) {
        await prisma.workoutExercise.create({
          data: {
            userId,
            dayName: split.dayName,
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            order: ex.order
          }
        });
      }
    }

    // 2. Starter Routines
    const defaultRoutines = [
      { title: 'Morning Hydration & Electrolytes', type: 'morning', time: '07:00 AM', order: 1 },
      { title: 'Morning Quran / Prayer & Reflection', type: 'morning', time: '07:15 AM', order: 2 },
      { title: 'Pre-Shift Clinical / Study Review', type: 'morning', time: '08:00 AM', order: 3 },
      { title: 'Evening Daily Trading Journal Review', type: 'evening', time: '09:00 PM', order: 1 },
      { title: 'Nightly Dental Case Documentation', type: 'evening', time: '09:30 PM', order: 2 },
      { title: 'Night Sleep Prep & Blue Light Off', type: 'evening', time: '10:30 PM', order: 3 }
    ];

    for (const r of defaultRoutines) {
      await prisma.routine.create({
        data: {
          userId,
          title: r.title,
          type: r.type,
          time: r.time,
          order: r.order
        }
      });
    }

    // 3. Starter Financial Settings & Goals
    await prisma.financialSetting.create({
      data: {
        userId,
        currency: 'USD',
        monthlyBudget: 3500,
        savingsTargetPct: 25
      }
    });

    await prisma.financialGoal.create({
      data: {
        userId,
        title: '$100k Liquid Portfolio & Emergency Fortress',
        targetAmount: 100000,
        currentAmount: 15000,
        deadline: '2027-12-31'
      }
    });

    // 4. Starter Notification Preferences
    await prisma.notificationPreference.create({
      data: {
        userId,
        tasksReminder: true,
        reportsDigest: true,
        scheduledTimes: ['09:00', '14:00', '21:00'],
        soundEnabled: true
      }
    });

    // 5. Starter Life Roadmap Milestones
    const starterMilestones = [
      {
        pillar: 'Dental Career',
        phase: 'Phase 1: Foundation (Now)',
        title: 'Master Advanced Rotary Endodontics & Aesthetic Layering',
        targetHorizon: 'Q4 2026',
        status: 'in_progress',
        priority: 'High',
        progressPct: 65,
        keyResults: [
          { id: 'kr1', title: 'Complete 50 complex molar rotary endo cases', done: true },
          { id: 'kr2', title: 'Master anterior polychromatic composite layering technique', done: true },
          { id: 'kr3', title: 'Document every case with clinical photography', done: false }
        ],
        actionStrategy: 'Refine apex locator precision and 3D continuous wave obturation during clinic shifts.'
      },
      {
        pillar: 'Trading & Markets',
        phase: 'Phase 1: Foundation (Now)',
        title: 'Achieve Consistent Funded Trader Status ($100k+ Allocation)',
        targetHorizon: 'Q4 2026',
        status: 'in_progress',
        priority: 'High',
        progressPct: 75,
        keyResults: [
          { id: 'krt1', title: 'Pass Phase 1 evaluation challenge with strict 1% risk', done: true },
          { id: 'krt2', title: 'Pass Phase 2 verification challenge within drawdown', done: true },
          { id: 'krt3', title: 'Receive first 3 consecutive live profit split payouts', done: false }
        ],
        actionStrategy: 'Trade only New York session opening liquidity sweeps on EUR/USD, GBP/USD and NASDAQ.'
      },
      {
        pillar: 'Studies & Knowledge',
        phase: 'Phase 1: Foundation (Now)',
        title: 'Pass National Dental Licensing & Specialty Board Examinations',
        targetHorizon: 'Q1 2027',
        status: 'in_progress',
        priority: 'High',
        progressPct: 80,
        keyResults: [
          { id: 'krs1', title: 'Complete 1,500 comprehensive board review question bank', done: true },
          { id: 'krs2', title: 'Score >90% on 3 consecutive full-length clinical mock exams', done: true },
          { id: 'krs3', title: 'Finalize official exam registration & pass with honors', done: false }
        ],
        actionStrategy: 'Maintain 2-hour morning daily study block before clinic shifts.'
      },
      {
        pillar: 'Wealth & Freedom',
        phase: 'Phase 1: Foundation (Now)',
        title: 'Build 6-Month Liquid Emergency Vault & Zero High-Interest Debt',
        targetHorizon: 'Q4 2026',
        status: 'completed',
        priority: 'High',
        progressPct: 100,
        keyResults: [
          { id: 'krw1', title: 'Save 6 months of living expenses in high-yield liquid vault', done: true },
          { id: 'krw2', title: 'Eliminate 100% of consumer / high-interest debt', done: true },
          { id: 'krw3', title: 'Establish automated 50/30/20 savings and wealth split', done: true }
        ],
        actionStrategy: 'Automated paycheck split on the 1st of every month.'
      }
    ];

    for (const m of starterMilestones) {
      await prisma.roadmapMilestone.create({
        data: {
          userId,
          pillar: m.pillar,
          phase: m.phase,
          title: m.title,
          targetHorizon: m.targetHorizon,
          status: m.status,
          priority: m.priority,
          progressPct: m.progressPct,
          keyResults: m.keyResults,
          actionStrategy: m.actionStrategy
        }
      });
    }

  } catch (err) {
    console.error('Error seeding starter workspace:', err);
  }
}
