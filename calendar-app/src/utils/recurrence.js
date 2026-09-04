import { formatDateKey, parseDateKey } from './dateUtils';

/**
 * Calculates the next date based on the recurrence rule.
 * @param {string} dateStr - Current date YYYY-MM-DD
 * @param {string} recurrence - 'daily' | 'weekdays' | 'weekly' | 'monthly'
 * @returns {string} Next date in YYYY-MM-DD format
 */
export const getNextRecurrenceDate = (dateStr, recurrence) => {
  const current = parseDateKey(dateStr);
  const next = new Date(current);

  switch (recurrence) {
    case 'daily':
      next.setDate(current.getDate() + 1);
      break;

    case 'weekdays': {
      const day = current.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
      if (day === 5) {
        // Friday -> Monday (+3 days)
        next.setDate(current.getDate() + 3);
      } else if (day === 6) {
        // Saturday -> Monday (+2 days)
        next.setDate(current.getDate() + 2);
      } else {
        // Sun-Thu -> next day (+1 day)
        next.setDate(current.getDate() + 1);
      }
      break;
    }

    case 'weekly':
      next.setDate(current.getDate() + 7);
      break;

    case 'monthly': {
      const currentMonth = current.getMonth();
      const currentDay = current.getDate();
      next.setMonth(currentMonth + 1);
      // If month overflowed (e.g., Jan 31 -> Feb 28), adjust to last day of new month
      if (next.getDate() !== currentDay) {
        next.setDate(0);
      }
      break;
    }

    default:
      return null;
  }

  return formatDateKey(next);
};

/**
 * Clones a recurring task into its next instance when checked off
 */
export const spawnNextRecurringTask = (task) => {
  if (!task.recurrence || task.recurrence === 'none') {
    return null;
  }

  const nextDate = getNextRecurrenceDate(task.date, task.recurrence);
  if (!nextDate) return null;

  return {
    ...task,
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    date: nextDate,
    completed: false,
    completedAt: null,
    // Reset any subtasks so the new instance starts fresh
    subtasks: (task.subtasks || []).map((st) => ({
      ...st,
      completed: false,
    })),
    createdAt: new Date().toISOString(),
  };
};
