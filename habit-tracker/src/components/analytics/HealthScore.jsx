import React from 'react';
import { Activity, Flame, CheckCircle, Award } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { computeHabitStreak } from '../../utils/habitMath.js';

export function HealthScore() {
  const { habits, logs, gamification } = useHabits();

  // Compute total completions across all historical logs
  let totalCompletions = 0;
  Object.keys(logs).forEach(dateKey => {
    const day = logs[dateKey];
    habits.forEach(h => {
      if (day[h.id]?.completed) totalCompletions++;
    });
  });

  // Longest streak across any habit
  const maxStreak = Math.max(
    0,
    ...habits.map(h => computeHabitStreak(h, logs, gamification.freezeTokens).longestStreak)
  );

  // Overall score (based on active habits, total completions, and XP)
  const healthIndex = Math.min(99, Math.max(35, Math.round(50 + (totalCompletions * 0.8) + (maxStreak * 1.5))));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
      <div className="glass-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 text-sky-400 mb-1">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-semibold">Momentum Score</span>
        </div>
        <div className="text-2xl font-black text-white font-mono">{healthIndex}/100</div>
        <p className="text-[11px] text-slate-400">Holistic consistency rating</p>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 text-orange-400 mb-1">
          <Flame className="w-4 h-4 fill-orange-400" />
          <span className="text-xs font-semibold">Peak Streak</span>
        </div>
        <div className="text-2xl font-black text-white font-mono">{maxStreak} Days</div>
        <p className="text-[11px] text-slate-400">Longest unbroken chain</p>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-semibold">Total Logs</span>
        </div>
        <div className="text-2xl font-black text-white font-mono">{totalCompletions}</div>
        <p className="text-[11px] text-slate-400">Total habits checked off</p>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <Award className="w-4 h-4" />
          <span className="text-xs font-semibold">Active Habits</span>
        </div>
        <div className="text-2xl font-black text-white font-mono">{habits.length}</div>
        <p className="text-[11px] text-slate-400">Tracked in your routine</p>
      </div>
    </div>
  );
}
