import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { computeHabitStreak } from '../../utils/habitMath.js';

export function NeverMissTwiceBanner() {
  const { habits, logs, gamification, toggleHabit, selectedDate } = useHabits();

  // Find habits where missedYesterday is true and not completed today
  const atRiskHabits = habits.filter(h => {
    if (h.type === 'break') return false;
    const streak = computeHabitStreak(h, logs, gamification.freezeTokens);
    const completedToday = logs[selectedDate]?.[h.id]?.completed;
    return streak.missedYesterday && !completedToday;
  });

  if (atRiskHabits.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Behavioral Rule: Never Miss Twice
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            You skipped <strong>{atRiskHabits.map(h => h.title).join(', ')}</strong> yesterday. Complete it today to defend your neurochemical momentum!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {atRiskHabits.slice(0, 2).map(habit => (
          <button
            key={habit.id}
            type="button"
            onClick={() => toggleHabit(habit.id, selectedDate)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-sm shadow-amber-500/20 flex items-center gap-1"
          >
            <span>Do {habit.title.slice(0, 14)}...</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
