import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { getMonthGrid, MONTH_NAMES, WEEKDAY_NAMES_SHORT, formatDateKey } from '../../utils/dateUtils';

export const MiniCalendar = () => {
  const { activeDate, setActiveDate } = useCalendar();
  const [navDate, setNavDate] = useState(() => new Date(activeDate));

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const cells = useMemo(() => {
    return getMonthGrid(year, month);
  }, [year, month]);

  const activeDateKey = formatDateKey(activeDate);

  const prevMiniMonth = () => {
    setNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMiniMonth = () => {
    setNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (cellDate) => {
    setActiveDate(cellDate);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMiniMonth}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMiniMonth}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Letters */}
      <div className="grid grid-cols-7 text-center mb-1">
        {WEEKDAY_NAMES_SHORT.map(name => (
          <span key={name} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {name[0]}
          </span>
        ))}
      </div>

      {/* 42-cell Mini Grid */}
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {cells.map((cell) => {
          const isSelected = cell.dateKey === activeDateKey;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => handleSelectDay(cell.date)}
              className={`h-6 w-6 mx-auto rounded-full text-[11px] font-medium flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : cell.isToday
                  ? 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                  : cell.isCurrentMonth
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
};
