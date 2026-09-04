export const HABIT_TYPES = {
  BINARY: 'binary',       // Yes/No check-off
  MEASURABLE: 'measurable', // Numeric target with + / -
  DURATION: 'duration',   // Stopwatch & Pomodoro
  BREAK: 'break',         // Break a bad habit (abstained days)
};

export const TIME_OF_DAY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  ANYTIME: 'anytime',
};

export const HABIT_CATEGORIES = [
  { id: 'health', name: 'Health & Fitness', color: '#10b981', icon: 'Heart' },
  { id: 'focus', name: 'Deep Work & Career', color: '#38bdf8', icon: 'Briefcase' },
  { id: 'mindfulness', name: 'Mind & Rest', color: '#818cf8', icon: 'Moon' },
  { id: 'learning', name: 'Studies & Reading', color: '#f59e0b', icon: 'BookOpen' },
  { id: 'finance', name: 'Wealth & Capital', color: '#eab308', icon: 'Coins' },
];

export const BADGES_LIST = [
  { id: 'first_step', name: 'First Step', description: 'Complete your first habit', icon: 'Sparkles', xpReward: 25 },
  { id: 'streak_3', name: '3-Day Spark', description: 'Maintain a 3-day active streak', icon: 'Flame', xpReward: 50 },
  { id: 'streak_7', name: '7-Day Momentum', description: 'Maintain a 7-day active streak', icon: 'Zap', xpReward: 100 },
  { id: 'streak_30', name: '30-Day Master', description: 'Achieve a 30-day streak on any habit', icon: 'Crown', xpReward: 300 },
  { id: 'flawless_day', name: 'Flawless Day', description: 'Complete 100% of all habits in a single day', icon: 'CheckCheck', xpReward: 75 },
  { id: 'ice_shield', name: 'Freeze Protector', description: 'Earn and store your first Streak Freeze token', icon: 'Shield', xpReward: 50 },
  { id: 'centurion', name: 'Century Club', description: 'Log 100 total habit completions', icon: 'Trophy', xpReward: 500 },
  { id: 'pomodoro_pro', name: 'Focus Master', description: 'Complete 5 Pomodoro focus sessions', icon: 'Timer', xpReward: 120 },
  { id: 'break_chain', name: 'Chain Breaker', description: 'Reach 14 days abstained from a negative habit', icon: 'Anchor', xpReward: 200 },
  { id: 'zen_reflector', name: 'Mindful Soul', description: 'Log 5 daily mood reflections', icon: 'Star', xpReward: 80 },
];

export const XP_CONFIG = {
  PER_COMPLETION: 15,
  PER_STEPPER: 5,
  FLAWLESS_DAY: 35,
  POMODORO_COMPLETED: 20,
  FREEZE_TOKEN_THRESHOLD_DAYS: 14,
  MAX_FREEZE_TOKENS: 2,
};
