import { formatDateKey } from './habitMath.js';

export const STARTER_HABITS = [
  {
    id: 'habit_water_1',
    title: 'Hydrate 2,500 ml',
    type: 'measurable',
    targetValue: 2500,
    unit: 'ml',
    stepIncrement: 250,
    timeOfDay: 'morning',
    category: 'health',
    frequency: 'daily',
    anchorHabit: 'Waking up & making bed',
    color: '#38bdf8',
    icon: 'Droplet',
    longestStreak: 12,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'habit_reading_2',
    title: '25-Min Deep Focus & Clinical Literature',
    type: 'duration',
    targetMinutes: 25,
    timeOfDay: 'afternoon',
    category: 'learning',
    frequency: 'daily',
    anchorHabit: 'After lunch espresso',
    color: '#f59e0b',
    icon: 'BookOpen',
    longestStreak: 9,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'habit_workout_3',
    title: 'Daily Functional Workout & Mobility',
    type: 'binary',
    timeOfDay: 'evening',
    category: 'health',
    frequency: 'daily',
    anchorHabit: 'Shutting down laptop',
    color: '#10b981',
    icon: 'Activity',
    longestStreak: 14,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'habit_nosugar_4',
    title: 'No Refined Sugar & Sodas',
    type: 'break',
    timeOfDay: 'anytime',
    category: 'health',
    frequency: 'daily',
    anchorHabit: '',
    color: '#ef4444',
    icon: 'ShieldOff',
    longestStreak: 18,
    lastRelapseDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

export function generateStarterLogs() {
  const logs = {};
  const today = new Date();

  // Populate past 14 days with realistic consistent progress
  for (let i = 14; i >= 1; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);

    logs[key] = {
      habit_water_1: { completed: true, currentValue: 2500 },
      habit_reading_2: { completed: i % 4 !== 0, elapsedMinutes: i % 4 !== 0 ? 25 : 10 },
      habit_workout_3: { completed: i % 5 !== 0 },
      _reflections: {
        mood: i % 3 === 0 ? 5 : 4,
        note: i === 1 ? 'Feeling energetic and locked in!' : undefined,
      },
    };
  }

  // Today initial empty or partial
  const todayKey = formatDateKey(today);
  logs[todayKey] = {
    habit_water_1: { completed: false, currentValue: 1000 },
    habit_reading_2: { completed: false, elapsedMinutes: 0 },
    habit_workout_3: { completed: false },
  };

  return logs;
}
