import React, { useMemo } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { getMonthGrid, WEEKDAY_NAMES_SHORT } from '../../utils/dateUtils';
import { DayCell } from './DayCell';

export const MonthView = () => {
  const {
    activeDate,
    tasksByDate,
    toggleTaskComplete,
    toggleSubtask,
    openEditTaskModal,
    deleteTask,
    openNewTaskModal,
    moveTaskDate,
  } = useCalendar();

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();

  const gridCells = useMemo(() => {
    return getMonthGrid(year, month);
  }, [year, month]);

  return (
    <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden backdrop-blur-xs">
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
        {WEEKDAY_NAMES_SHORT.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-2.5 text-center text-xs font-bold uppercase tracking-wider ${
              idx === 0 || idx === 6
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* 42-Cell Month Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {gridCells.map((cell) => (
          <DayCell
            key={cell.dateKey}
            cell={cell}
            tasks={tasksByDate[cell.dateKey] || []}
            onToggleComplete={toggleTaskComplete}
            onToggleSubtask={toggleSubtask}
            onEditTask={openEditTaskModal}
            onDeleteTask={deleteTask}
            onQuickAdd={openNewTaskModal}
            onDropTask={moveTaskDate}
          />
        ))}
      </div>
    </div>
  );
};
