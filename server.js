// =============================================================================
// server.js — Production Full-Stack Backend with PostgreSQL & Prisma ORM
// Multi-tenant architecture with JWT authentication & row-level data isolation.
// =============================================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-jwt-secret-replace-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
  }
}

// Optional Auth (for initial loads or public check)
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.userId, email: decoded.email };
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// =============================================================================
// STARTER WORKSPACE SEEDING (FOR NEW USERS)
// =============================================================================

async function seedNewUserWorkspace(userId) {
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
    console.error('Error seeding starter user workspace:', err);
  }
}

// =============================================================================
// AUTH ROUTES
// =============================================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
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

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Could not log in. Please try again.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Could not retrieve user session.' });
  }
});

// =============================================================================
// TASKS & WEEKLY PLANNER API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/tasks — List tasks for authenticated user
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { category, date, weekStart, completed } = req.query;
    const where = { userId: req.user.id };

    if (category) where.category = category;
    if (date) where.date = date;
    if (completed !== undefined) where.completed = completed === 'true';

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ date: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }]
    });

    res.json({
      date: date || new Date().toISOString().split('T')[0],
      tasks
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Could not fetch tasks.' });
  }
});

// POST /api/tasks — Create task
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, category, segment, date, completed, timeBlock } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        category: category || 'Work',
        segment: segment || null,
        date: date || new Date().toISOString().split('T')[0],
        completed: Boolean(completed),
        timeBlock: timeBlock || null
      }
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Could not create task.' });
  }
});

// PATCH /api/tasks/:id — Update task (mark done, rename, etc.)
app.patch('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Could not update task.' });
  }
});

// DELETE /api/tasks/:id — Delete task
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    await prisma.task.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Could not delete task.' });
  }
});

// =============================================================================
// ROUTINES & HABITS API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/routines
app.get('/api/routines', authMiddleware, async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const routines = await prisma.routine.findMany({
      where: { userId: req.user.id, active: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }]
    });

    const logs = await prisma.routineLog.findMany({
      where: { userId: req.user.id, date: targetDate }
    });

    const completedIds = new Set(logs.filter(l => l.completed).map(l => l.routineId));

    const morning = routines
      .filter(r => r.type === 'morning')
      .map(r => ({ ...r, completed: completedIds.has(r.id) }));

    const evening = routines
      .filter(r => r.type === 'evening')
      .map(r => ({ ...r, completed: completedIds.has(r.id) }));

    res.json({ morning, evening });
  } catch (err) {
    console.error('Error fetching routines:', err);
    res.status(500).json({ error: 'Could not fetch routines.' });
  }
});

// POST /api/routines — Add routine
app.post('/api/routines', authMiddleware, async (req, res) => {
  try {
    const { title, type, time } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required.' });

    const routine = await prisma.routine.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        type: type === 'evening' ? 'evening' : 'morning',
        time: time || null
      }
    });

    res.status(201).json(routine);
  } catch (err) {
    console.error('Error creating routine:', err);
    res.status(500).json({ error: 'Could not create routine.' });
  }
});

// POST /api/routines/:id/log — Toggle completion for date
app.post('/api/routines/:id/log', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, completed } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existingLog = await prisma.routineLog.findUnique({
      where: {
        userId_routineId_date: {
          userId: req.user.id,
          routineId: id,
          date: targetDate
        }
      }
    });

    let result;
    if (existingLog) {
      result = await prisma.routineLog.update({
        where: { id: existingLog.id },
        data: { completed: completed !== undefined ? Boolean(completed) : !existingLog.completed }
      });
    } else {
      result = await prisma.routineLog.create({
        data: {
          userId: req.user.id,
          routineId: id,
          date: targetDate,
          completed: completed !== undefined ? Boolean(completed) : true
        }
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error logging routine:', err);
    res.status(500).json({ error: 'Could not log routine.' });
  }
});

// =============================================================================
// DENTAL CASES & PATIENT GALLERY API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/dental-cases
app.get('/api/dental-cases', authMiddleware, async (req, res) => {
  try {
    const { q, specialty, showcase } = req.query;
    const where = { userId: req.user.id };

    if (specialty && specialty !== 'All') {
      where.specialty = specialty;
    }

    if (showcase === 'true') {
      where.showcaseForPatients = true;
    }

    let cases = await prisma.dentalCase.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      cases = cases.filter(c => 
        (c.title && c.title.toLowerCase().includes(term)) ||
        (c.patientCode && c.patientCode.toLowerCase().includes(term)) ||
        (c.teeth && c.teeth.toLowerCase().includes(term)) ||
        (c.diagnosis && c.diagnosis.toLowerCase().includes(term))
      );
    }

    res.json({
      count: cases.length,
      cases
    });
  } catch (err) {
    console.error('Error fetching dental cases:', err);
    res.status(500).json({ error: 'Could not fetch dental cases.' });
  }
});

// POST /api/dental-cases
app.post('/api/dental-cases', authMiddleware, async (req, res) => {
  try {
    const {
      patientCode,
      title,
      specialty,
      teeth,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      materialsUsed,
      totalCost,
      status,
      showcaseForPatients,
      date,
      photos,
      steps
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Case title is required.' });
    }

    const dentalCase = await prisma.dentalCase.create({
      data: {
        userId: req.user.id,
        patientCode: patientCode ? patientCode.trim() : `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        specialty: specialty || 'Restorative & Aesthetics',
        teeth: teeth || '',
        diagnosis: diagnosis || '',
        treatmentPlan: treatmentPlan || '',
        clinicalNotes: clinicalNotes || '',
        materialsUsed: materialsUsed || '',
        totalCost: totalCost ? parseFloat(totalCost) : null,
        status: status || 'In Progress',
        showcaseForPatients: Boolean(showcaseForPatients),
        date: date || new Date().toISOString().split('T')[0],
        photos: Array.isArray(photos) ? photos : [],
        steps: Array.isArray(steps) ? steps : []
      }
    });

    res.status(201).json(dentalCase);
  } catch (err) {
    console.error('Error creating dental case:', err);
    res.status(500).json({ error: 'Could not create dental case.' });
  }
});

// PUT /api/dental-cases/:id
app.put('/api/dental-cases/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ error: 'Case not found or access denied.' });

    const updated = await prisma.dentalCase.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating dental case:', err);
    res.status(500).json({ error: 'Could not update dental case.' });
  }
});

// DELETE /api/dental-cases/:id
app.delete('/api/dental-cases/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ error: 'Case not found.' });

    await prisma.dentalCase.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting dental case:', err);
    res.status(500).json({ error: 'Could not delete dental case.' });
  }
});

// =============================================================================
// WORKOUTS & PR EXERCISE WEIGHTS API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/workouts/splits
app.get('/api/workouts/splits', authMiddleware, async (req, res) => {
  try {
    const splits = await prisma.workoutSplit.findMany({
      where: { userId: req.user.id },
      orderBy: { order: 'asc' }
    });

    const exercises = await prisma.workoutExercise.findMany({
      where: { userId: req.user.id },
      orderBy: { order: 'asc' }
    });

    res.json({ splits, exercises });
  } catch (err) {
    console.error('Error fetching workout splits:', err);
    res.status(500).json({ error: 'Could not fetch workout splits.' });
  }
});

// GET /api/workouts/pr-stats
app.get('/api/workouts/pr-stats', authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.exerciseWeightLog.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    // Compute PRs per exercise
    const prMap = {};
    for (const log of logs) {
      if (!prMap[log.exerciseName] || log.weightKg > prMap[log.exerciseName].weightKg) {
        prMap[log.exerciseName] = {
          exerciseName: log.exerciseName,
          maxKg: log.weightKg,
          maxLbs: log.weightLbs,
          date: log.date,
          setsReps: log.setsReps
        };
      }
    }

    res.json({
      prs: Object.values(prMap),
      logs
    });
  } catch (err) {
    console.error('Error fetching PR stats:', err);
    res.status(500).json({ error: 'Could not fetch PR stats.' });
  }
});

// POST /api/workouts/log-weight
app.post('/api/workouts/log-weight', authMiddleware, async (req, res) => {
  try {
    const { exerciseName, weightKg, weightLbs, setsReps, notes, date } = req.body;
    if (!exerciseName || weightKg === undefined) {
      return res.status(400).json({ error: 'Exercise name and weight are required.' });
    }

    const kg = parseFloat(weightKg);
    const lbs = weightLbs ? parseFloat(weightLbs) : Math.round(kg * 2.20462 * 10) / 10;

    // Check if new PR
    const highestPrevious = await prisma.exerciseWeightLog.findFirst({
      where: { userId: req.user.id, exerciseName: exerciseName.trim() },
      orderBy: { weightKg: 'desc' }
    });

    const isPr = !highestPrevious || kg > highestPrevious.weightKg;

    const log = await prisma.exerciseWeightLog.create({
      data: {
        userId: req.user.id,
        exerciseName: exerciseName.trim(),
        weightKg: kg,
        weightLbs: lbs,
        setsReps: setsReps || null,
        isPr,
        notes: notes || null,
        date: date || new Date().toISOString().split('T')[0]
      }
    });

    res.status(201).json({ log, isPr });
  } catch (err) {
    console.error('Error logging exercise weight:', err);
    res.status(500).json({ error: 'Could not log weight.' });
  }
});

// DELETE /api/workouts/log-weight/:id
app.delete('/api/workouts/log-weight/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.exerciseWeightLog.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!log) return res.status(404).json({ error: 'Log not found.' });

    await prisma.exerciseWeightLog.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting workout log:', err);
    res.status(500).json({ error: 'Could not delete workout log.' });
  }
});

// =============================================================================
// LIFE MASTER ROADMAP API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/roadmap
app.get('/api/roadmap', authMiddleware, async (req, res) => {
  try {
    const { pillar, phase, status } = req.query;
    const where = { userId: req.user.id };

    if (pillar && pillar !== 'All') where.pillar = pillar;
    if (phase && phase !== 'All') where.phase = phase;
    if (status && status !== 'All') where.status = status;

    const milestones = await prisma.roadmapMilestone.findMany({
      where,
      orderBy: [{ phase: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(milestones);
  } catch (err) {
    console.error('Error fetching roadmap:', err);
    res.status(500).json({ error: 'Could not fetch roadmap.' });
  }
});

// POST /api/roadmap
app.post('/api/roadmap', authMiddleware, async (req, res) => {
  try {
    const {
      pillar,
      phase,
      title,
      targetHorizon,
      status,
      priority,
      progressPct,
      keyResults,
      actionStrategy,
      metricsTarget
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const milestone = await prisma.roadmapMilestone.create({
      data: {
        userId: req.user.id,
        pillar: pillar || 'Dental Career',
        phase: phase || 'Phase 1: Foundation (Now)',
        title: title.trim(),
        targetHorizon: targetHorizon || '2027',
        status: status || 'in_progress',
        priority: priority || 'High',
        progressPct: typeof progressPct === 'number' ? progressPct : 0,
        keyResults: Array.isArray(keyResults) ? keyResults : [],
        actionStrategy: actionStrategy || '',
        metricsTarget: metricsTarget || ''
      }
    });

    res.status(201).json(milestone);
  } catch (err) {
    console.error('Error creating milestone:', err);
    res.status(500).json({ error: 'Could not create milestone.' });
  }
});

// PUT /api/roadmap/:id
app.put('/api/roadmap/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.roadmapMilestone.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ error: 'Milestone not found.' });

    const updated = await prisma.roadmapMilestone.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating milestone:', err);
    res.status(500).json({ error: 'Could not update milestone.' });
  }
});

// POST /api/roadmap/:id/toggle-key-result
app.post('/api/roadmap/:id/toggle-key-result', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { keyResultId } = req.body;
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!milestone) return res.status(404).json({ error: 'Milestone not found.' });

    let keyResults = Array.isArray(milestone.keyResults) ? [...milestone.keyResults] : [];
    const targetKr = keyResults.find(k => k.id === keyResultId);
    if (targetKr) {
      targetKr.done = !targetKr.done;
      const total = keyResults.length;
      const doneCount = keyResults.filter(k => k.done).length;
      const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      let status = milestone.status;
      if (progressPct === 100) status = 'completed';
      else if (progressPct > 0) status = 'in_progress';

      const updated = await prisma.roadmapMilestone.update({
        where: { id },
        data: {
          keyResults,
          progressPct,
          status
        }
      });
      return res.json(updated);
    }

    res.json(milestone);
  } catch (err) {
    console.error('Error toggling key result:', err);
    res.status(500).json({ error: 'Could not toggle key result.' });
  }
});

// DELETE /api/roadmap/:id
app.delete('/api/roadmap/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.roadmapMilestone.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ error: 'Milestone not found.' });

    await prisma.roadmapMilestone.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting milestone:', err);
    res.status(500).json({ error: 'Could not delete milestone.' });
  }
});

// =============================================================================
// FINANCES & ASSETS API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/finance
app.get('/api/finance', authMiddleware, async (req, res) => {
  try {
    const transactions = await prisma.financialTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    const goals = await prisma.financialGoal.findMany({
      where: { userId: req.user.id }
    });

    let settings = await prisma.financialSetting.findUnique({
      where: { userId: req.user.id }
    });

    if (!settings) {
      settings = { currency: 'USD', monthlyBudget: 3500, savingsTargetPct: 25 };
    }

    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        monthlyBudget: settings.monthlyBudget,
        currency: settings.currency
      },
      transactions,
      goals,
      settings
    });
  } catch (err) {
    console.error('Error fetching finances:', err);
    res.status(500).json({ error: 'Could not fetch finances.' });
  }
});

// POST /api/finance/transactions
app.post('/api/finance/transactions', authMiddleware, async (req, res) => {
  try {
    const { type, category, amount, date, description, account } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        userId: req.user.id,
        type: type === 'expense' ? 'expense' : 'income',
        category: category || 'General',
        amount: Math.abs(parseFloat(amount)),
        date: date || new Date().toISOString().split('T')[0],
        description: description || null,
        account: account || null
      }
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Could not create transaction.' });
  }
});

// GET /api/finance/assets
app.get('/api/finance/assets', authMiddleware, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const lots = await prisma.goldLot.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    res.json({ assets, lots });
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: 'Could not fetch assets.' });
  }
});

// POST /api/finance/assets
app.post('/api/finance/assets', authMiddleware, async (req, res) => {
  try {
    const { name, type, status, quantity, unit, purchasePrice, purchaseDate, notes } = req.body;
    if (!name || quantity === undefined) {
      return res.status(400).json({ error: 'Asset name and quantity are required.' });
    }

    const asset = await prisma.asset.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        type: type || 'Gold Bullion',
        status: status || 'Owned',
        quantity: parseFloat(quantity),
        unit: unit || 'grams',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        notes: notes || null
      }
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error('Error creating asset:', err);
    res.status(500).json({ error: 'Could not create asset.' });
  }
});

// GET /api/finance/assets/gold-price
app.get('/api/finance/assets/gold-price', async (req, res) => {
  try {
    // Current gold reference price (~$88.50/gram, $2,750/oz)
    const pricePerGram24k = 88.50;
    res.json({
      pricePerGram24k,
      pricePerGram21k: Math.round(pricePerGram24k * (21 / 24) * 100) / 100,
      pricePerGram18k: Math.round(pricePerGram24k * (18 / 24) * 100) / 100,
      pricePerOunce: Math.round(pricePerGram24k * 31.1035 * 100) / 100,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch gold price.' });
  }
});

// =============================================================================
// NOTIFICATIONS API (Multi-Tenant Isolated)
// =============================================================================

// GET /api/notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notificationLog.count({
      where: { userId: req.user.id, read: false }
    });

    res.json({ logs, unreadCount });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Could not fetch notifications.' });
  }
});

// POST /api/notifications
app.post('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const { type, title, message, linkCategory } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const notif = await prisma.notificationLog.create({
      data: {
        userId: req.user.id,
        type: type || 'system',
        title: title.trim(),
        message: message || '',
        linkCategory: linkCategory || null
      }
    });

    res.status(201).json(notif);
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Could not create notification.' });
  }
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notificationLog.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ error: 'Could not mark notifications as read.' });
  }
});

// =============================================================================
// ANALYTICS & PROGRESS INTELLIGENCE (Multi-Tenant Dynamic Engine)
// =============================================================================

app.get('/api/analytics/progress', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Group by category
    const catMap = {};
    for (const t of tasks) {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, completed: 0 };
      catMap[t.category].total++;
      if (t.completed) catMap[t.category].completed++;
    }

    const categoryBreakdown = Object.entries(catMap).map(([category, stats]) => ({
      category,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));

    res.json({
      overall: {
        totalTasks,
        completedTasks,
        completionRate: overallRate
      },
      categoryBreakdown
    });
  } catch (err) {
    console.error('Error computing analytics progress:', err);
    res.status(500).json({ error: 'Could not compute progress analytics.' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'error', error: err.message });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Personal Productivity Dashboard running at http://localhost:${PORT}`);
  console.log(`🐘 PostgreSQL & Prisma Multi-Tenant Engine active.`);
  console.log(`🔐 JWT Auth security layer enabled.\n`);
});
