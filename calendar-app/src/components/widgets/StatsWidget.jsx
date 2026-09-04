import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { Flame, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { MONTH_NAMES } from '../../utils/dateUtils';

export const StatsWidget = () => {
  const { stats, activeDate } = useCalendar();
  const monthName = MONTH_NAMES[activeDate.getMonth()];

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 p-4 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {monthName} Insights
          </h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
          Monthly
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Completion Rate */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Completion</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.completionRate}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Daily Streak */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Day Streak
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-amber-500">
              {stats.streak}
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            Keep momentum going!
          </span>
        </div>
      </div>

      {/* Total Finished & Overdue Details */}
      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Completed Tasks
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {stats.completed} / {stats.total}
          </span>
        </div>

        {stats.overdue > 0 && (
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Overdue Tasks
            </span>
            <span className="font-bold">{stats.overdue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
