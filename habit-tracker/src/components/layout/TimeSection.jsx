import React, { useState } from 'react';
import { Sunrise, Sun, Moon, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { HabitCard } from '../habits/HabitCard.jsx';

const SECTION_CONFIG = {
  morning: { title: 'Morning Routine', icon: Sunrise, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  afternoon: { title: 'Afternoon Focus', icon: Sun, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  evening: { title: 'Evening Wind-Down', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  anytime: { title: 'Anytime & Lifelong Habits', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

export function TimeSection({ slot, habits, logs, selectedDate }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const cfg = SECTION_CONFIG[slot] || SECTION_CONFIG.anytime;
  const Icon = cfg.icon;

  if (!habits || habits.length === 0) return null;

  const total = habits.length;
  const completed = habits.filter(h => {
    if (h.type === 'break') {
      // Break habits count as complete if not relapsed today
      return true;
    }
    return logs[selectedDate]?.[h.id]?.completed;
  }).length;

  const pct = Math.round((completed / total) * 100);

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-200">{cfg.title}</h2>
          <span className="text-xs font-mono text-slate-500">
            {completed}/{total} ({pct}%)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Habit Cards Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {habits.map((habit, idx) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={idx}
              logs={logs}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
