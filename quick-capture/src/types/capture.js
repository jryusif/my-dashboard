export const STORAGE_KEYS = {
  INBOX: 'antigravity_inbox_items',
  VAULT: 'antigravity_notes_vault',
  STATS: 'antigravity_triage_stats',
  THEME: 'antigravity_qc_theme',
  EVENING_TIME: 'antigravity_triage_time', // e.g. "20:00"
  CALENDAR_TASKS: 'antigravity_calendar_tasks',
  HABITS: 'antigravity_habits',
};

export const PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const CATEGORIES = [
  { id: 'work', label: 'Work', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'personal', label: 'Personal', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'health', label: 'Health', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'finance', label: 'Finance', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'studies', label: 'Studies', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
];
