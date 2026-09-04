export function calculateLevel(totalXp) {
  // Level formula: Level = floor(sqrt(XP / 50)) + 1
  const level = Math.floor(Math.sqrt((totalXp || 0) / 50)) + 1;
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
  const nextLevelXp = Math.pow(level, 2) * 50;
  const progressInLevel = (totalXp - currentLevelBaseXp) / Math.max(1, nextLevelXp - currentLevelBaseXp);
  return {
    level,
    currentLevelBaseXp,
    nextLevelXp,
    progressPct: Math.min(100, Math.max(0, Math.round(progressInLevel * 100))),
    remainingXp: Math.max(0, nextLevelXp - totalXp),
  };
}

export function formatDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getPastDates(numDays) {
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDateKey(d));
  }
  return dates;
}

export function computeHabitStreak(habit, logs, freezeTokens = 0) {
  if (!habit) return { currentStreak: 0, longestStreak: 0, usedFreeze: false, missedYesterday: false };

  // For Break Habits: days since last relapse (or createdAt)
  if (habit.type === 'break') {
    const lastRelapse = habit.lastRelapseDate ? new Date(habit.lastRelapseDate) : new Date(habit.createdAt || Date.now());
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - lastRelapse.getTime());
    const daysAbstained = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return {
      currentStreak: daysAbstained,
      longestStreak: Math.max(daysAbstained, habit.longestStreak || 0),
      usedFreeze: false,
      missedYesterday: false,
    };
  }

  let streak = 0;
  let maxStreak = habit.longestStreak || 0;
  let freezesLeft = freezeTokens;
  let usedFreeze = false;
  let missedYesterday = false;

  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 86400000));

  // Check if completed today
  const todayVal = logs[today]?.[habit.id]?.completed;
  const yesterdayVal = logs[yesterday]?.[habit.id]?.completed;

  if (!todayVal && !yesterdayVal) {
    missedYesterday = true;
  }

  // Iterate backwards from yesterday (or today if completed)
  let checkDate = new Date();
  if (!todayVal) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = formatDateKey(checkDate);
    const dayEntry = logs[key]?.[habit.id];
    const isCompleted = dayEntry?.completed;

    if (isCompleted) {
      streak++;
    } else if (freezesLeft > 0 && streak > 0) {
      freezesLeft--;
      usedFreeze = true;
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  maxStreak = Math.max(maxStreak, streak);

  return {
    currentStreak: streak,
    longestStreak: maxStreak,
    usedFreeze,
    missedYesterday: !todayVal && missedYesterday,
  };
}

export function computeDailyConsistency(habits, logs, dateKey) {
  if (!habits || habits.length === 0) return 0;
  const activeHabits = habits.filter(h => h.type !== 'break');
  if (activeHabits.length === 0) return 100;

  const completedCount = activeHabits.filter(h => logs[dateKey]?.[h.id]?.completed).length;
  return Math.round((completedCount / activeHabits.length) * 100);
}

export function generateYearlyHeatmapData(habits, logs) {
  const result = [];
  const today = new Date();
  // 52 weeks = 364 days
  for (let i = 363; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);
    const pct = computeDailyConsistency(habits, logs, key);
    result.push({
      date: key,
      dayOfWeek: d.getDay(),
      completionRate: pct,
      level: pct === 0 ? 0 : pct <= 35 ? 1 : pct <= 70 ? 2 : pct < 100 ? 3 : 4,
    });
  }
  return result;
}
