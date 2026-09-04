import React from 'react';
import { Flame, Calendar as CalendarIcon } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { generateYearlyHeatmapData, formatDateKey } from '../../utils/habitMath.js';

export function Heatmap() {
  const { habits, logs, selectedDate, setSelectedDate } = useHabits();
  const heatmapData = generateYearlyHeatmapData(habits, logs);

  const LEVEL_COLORS = [
    'bg-slate-900 border-slate-800/80',
    'bg-emerald-950/80 border-emerald-800/40',
    'bg-emerald-800/80 border-emerald-600/50',
    'bg-emerald-600 border-emerald-400/60',
    'bg-emerald-400 border-emerald-200 shadow-sm shadow-emerald-400/40',
  ];

  return (
    <div className="glass-card rounded-2xl p-5 mb-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Yearly Consistency Matrix</h3>
          <span className="text-xs text-slate-500 font-mono">52-Week GitHub Heatmap</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950/80 border border-emerald-800/40" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-800/80 border border-emerald-600/50" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-400/60" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-200" />
          <span>More</span>
        </div>
      </div>

      {/* Grid of Weeks (52 columns x 7 rows) */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {heatmapData.map(item => {
            const isSelected = item.date === selectedDate;
            const colorCls = LEVEL_COLORS[item.level] || LEVEL_COLORS[0];

            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                title={`${item.date}: ${item.completionRate}% completed`}
                className={`w-3 h-3 rounded-[3px] border transition-all hover:scale-125 ${colorCls} ${
                  isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950' : ''
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
        <span>Click any day square to inspect or log habits</span>
        <span>Viewing: <strong className="text-emerald-400">{selectedDate}</strong></span>
      </div>
    </div>
  );
}
