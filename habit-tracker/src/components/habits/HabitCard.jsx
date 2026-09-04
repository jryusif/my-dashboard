import React, { useState } from 'react';
import {
  Check,
  Flame,
  Plus,
  Minus,
  Play,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  Link2,
  Shield,
  Clock,
} from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { computeHabitStreak } from '../../utils/habitMath.js';

export function HabitCard({ habit, index, logs, selectedDate }) {
  const {
    gamification,
    toggleHabit,
    updateMeasurable,
    setActiveTimerHabit,
    setActiveRelapseHabit,
    setEditingHabit,
    setIsHabitModalOpen,
    deleteHabit,
  } = useHabits();

  const [showMenu, setShowMenu] = useState(false);

  const entry = logs[selectedDate]?.[habit.id] || {};
  const isCompleted = !!entry.completed;
  const streakInfo = computeHabitStreak(habit, logs, gamification.freezeTokens);

  return (
    <div
      className={`glass-card rounded-2xl p-4 transition-all duration-200 relative group flex flex-col justify-between ${
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-950/10 shadow-sm shadow-emerald-500/5'
          : 'hover:border-slate-700'
      }`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-mono font-bold text-slate-500 w-4">
              #{index + 1}
            </span>
            <h3
              className={`text-sm font-semibold tracking-tight transition-colors line-clamp-1 ${
                isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'
              }`}
            >
              {habit.title}
            </h3>
          </div>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setEditingHabit(habit);
                    setIsHabitModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-sky-400" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm(`Delete habit "${habit.title}"?`)) {
                      deleteHabit(habit.id);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Behavioral Psychology: Habit Stacking Anchor */}
        {habit.anchorHabit && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-3 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px]">
            <Link2 className="w-3 h-3 text-indigo-400" />
            <span>After <strong>{habit.anchorHabit}</strong></span>
          </div>
        )}
      </div>

      {/* Center Dynamic Area depending on Habit Type */}
      <div className="my-2">
        {/* 1. Measurable Habit (Stepper + Progress Bar) */}
        {habit.type === 'measurable' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-mono">
                {entry.currentValue || 0} / {habit.targetValue} {habit.unit}
              </span>
              <span className="font-bold text-sky-400 font-mono">
                {Math.min(100, Math.round(((entry.currentValue || 0) / (habit.targetValue || 1)) * 100))}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((entry.currentValue || 0) / (habit.targetValue || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateMeasurable(habit.id, -1, selectedDate)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1 text-xs font-semibold active:scale-95 transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-{habit.stepIncrement || 1}</span>
              </button>
              <button
                type="button"
                onClick={() => updateMeasurable(habit.id, 1, selectedDate)}
                className="flex-1 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1 text-xs font-semibold active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+{habit.stepIncrement || 1}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Duration / Pomodoro Habit */}
        {habit.type === 'duration' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-mono">
                {entry.elapsedMinutes || 0} / {habit.targetMinutes || 25} min
              </span>
              <span className="text-amber-400 font-bold font-mono">
                {Math.min(100, Math.round(((entry.elapsedMinutes || 0) / (habit.targetMinutes || 25)) * 100))}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((entry.elapsedMinutes || 0) / (habit.targetMinutes || 25)) * 100)}%`,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveTimerHabit(habit)}
              className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-amber-300" />
              <span>Launch Focus Timer</span>
            </button>
          </div>
        )}

        {/* 3. Break a Habit (Abstinence counter + Relapse button) */}
        {habit.type === 'break' && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold text-rose-400 font-mono">
              {streakInfo.currentStreak} Days
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Clean Streak Abstained</div>
            <button
              type="button"
              onClick={() => setActiveRelapseHabit(habit)}
              className="w-full py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Log Relapse</span>
            </button>
          </div>
        )}

        {/* 4. Binary Checkbox Habit */}
        {habit.type === 'binary' && (
          <button
            type="button"
            onClick={() => toggleHabit(habit.id, selectedDate)}
            className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 ${
              isCompleted
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
            }`}
          >
            <Check className={`w-4 h-4 transition-transform ${isCompleted ? 'scale-110' : 'opacity-40'}`} />
            <span>{isCompleted ? 'Completed' : 'Mark as Done'}</span>
          </button>
        )}
      </div>

      {/* Bottom Footer: Streaks & Psychology Indicators */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-orange-400 font-bold font-mono">
            <Flame className="w-3.5 h-3.5 fill-orange-400" />
            {streakInfo.currentStreak}
          </span>
          <span>streak (best: {streakInfo.longestStreak})</span>
        </div>

        {streakInfo.usedFreeze && (
          <span className="flex items-center gap-1 text-cyan-400" title="Streak Freeze Shield protected your streak">
            <Shield className="w-3 h-3" />
            <span>Frozen</span>
          </span>
        )}
      </div>
    </div>
  );
}
