import { formatDateKey } from './dateUtils';

/**
 * Generate rich starter tasks relative to today's date
 */
export const getStarterTasks = () => {
  const today = new Date();
  
  const getDateOffset = (days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return formatDateKey(d);
  };

  return [
    {
      id: 'demo_1',
      title: 'Quarterly Project Sprint Review',
      description: 'Present Q3 milestones, review velocity charts, and align on upcoming sprint deliverables with team leads.',
      date: getDateOffset(0),
      time: '14:00',
      priority: 'high',
      category: 'work',
      completed: false,
      completedAt: null,
      recurrence: 'weekly',
      subtasks: [
        { id: 'st_1', title: 'Prepare keynote presentation deck', completed: true },
        { id: 'st_2', title: 'Compile sprint KPI summary table', completed: true },
        { id: 'st_3', title: 'Distribute agenda notes to attendees', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_2',
      title: 'Morning HIIT & Mobility Workout',
      description: '45 mins interval training, core stability, and post-workout stretching routine.',
      date: getDateOffset(0),
      time: '08:00',
      priority: 'medium',
      category: 'health',
      completed: true,
      completedAt: new Date().toISOString(),
      recurrence: 'daily',
      subtasks: [
        { id: 'st_4', title: 'Warm-up jog (5 mins)', completed: true },
        { id: 'st_5', title: '4 rounds of kettlebell circuits', completed: true },
        { id: 'st_6', title: 'Cooldown & foam rolling', completed: true },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_3',
      title: 'Weekly Budget & Portfolio Rebalance',
      description: 'Review monthly credit card statements, categorize subscriptions, and log dividend yields.',
      date: getDateOffset(1),
      time: '11:00',
      priority: 'high',
      category: 'finance',
      completed: false,
      completedAt: null,
      recurrence: 'monthly',
      subtasks: [
        { id: 'st_7', title: 'Export transaction CSV from bank', completed: false },
        { id: 'st_8', title: 'Allocate savings to index fund', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_4',
      title: 'Deep Work: System Architecture Refactor',
      description: 'Optimize Postgres database indexes and refine caching layers for peak traffic handling.',
      date: getDateOffset(2),
      time: '13:30',
      priority: 'high',
      category: 'work',
      completed: false,
      completedAt: null,
      recurrence: 'none',
      subtasks: [
        { id: 'st_9', title: 'Profile slow SQL queries', completed: false },
        { id: 'st_10', title: 'Test read replica failover latency', completed: false },
        { id: 'st_11', title: 'Document connection pool tuning guidelines', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_5',
      title: 'Read 2 Chapters: Designing Data-Intensive Apps',
      description: 'Chapter 7: Transactions & Isolation Levels. Take Obsidian notes.',
      date: getDateOffset(0),
      time: '19:30',
      priority: 'low',
      category: 'study',
      completed: false,
      completedAt: null,
      recurrence: 'weekdays',
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_6',
      title: 'Weekly Grocery & Meal Prep',
      description: 'Restock fresh produce, Greek yogurt, chicken breast, and whole grains for the week.',
      date: getDateOffset(-1),
      time: '17:00',
      priority: 'low',
      category: 'personal',
      completed: true,
      completedAt: new Date().toISOString(),
      recurrence: 'weekly',
      subtasks: [
        { id: 'st_12', title: 'Write down recipes', completed: true },
        { id: 'st_13', title: 'Farmer market visit', completed: true },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_7',
      title: 'Submit Dental Claim Reimbursement',
      description: 'Submit itemized receipts and insurance claim form via the member portal.',
      date: getDateOffset(-2),
      time: '16:00',
      priority: 'medium',
      category: 'health',
      completed: false, // Overdue example!
      completedAt: null,
      recurrence: 'none',
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_8',
      title: 'Car Maintenance & Tire Pressure Check',
      description: 'Check oil level, top up washer fluid, and calibrate tire pressure before weekend road trip.',
      date: getDateOffset(4),
      time: '10:00',
      priority: 'low',
      category: 'personal',
      completed: false,
      completedAt: null,
      recurrence: 'none',
      subtasks: [],
      createdAt: new Date().toISOString(),
    }
  ];
};
