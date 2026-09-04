export const CATEGORIES = [
  { id: 'work', name: 'Work', color: 'indigo', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', dot: 'bg-indigo-500' },
  { id: 'personal', name: 'Personal', color: 'emerald', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  { id: 'health', name: 'Health & Fitness', color: 'rose', bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-500' },
  { id: 'study', name: 'Study & Learning', color: 'amber', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  { id: 'finance', name: 'Finance', color: 'cyan', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30', dot: 'bg-cyan-500' },
  { id: 'other', name: 'General', color: 'slate', bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-500' },
];

export const PRIORITIES = [
  { id: 'high', name: 'High', color: 'rose', badgeClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800' },
  { id: 'medium', name: 'Medium', color: 'amber', badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' },
  { id: 'low', name: 'Low', color: 'blue', badgeClass: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800' },
];

export const RECURRENCE_OPTIONS = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Every weekday (Mon-Fri)' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const createBlankTask = (initialDate = '') => ({
  id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
  title: '',
  description: '',
  date: initialDate || new Date().toISOString().split('T')[0],
  time: '10:00',
  priority: 'medium',
  category: 'work',
  completed: false,
  completedAt: null,
  recurrence: 'none',
  subtasks: [],
  createdAt: new Date().toISOString(),
});
