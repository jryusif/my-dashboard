import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { formatDateKey, getHoursList, WEEKDAY_NAMES_FULL, MONTH_NAMES } from '../../utils/dateUtils';
import { TaskCard } from '../tasks/TaskCard';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export const DayView = () => {
  const {
    activeDate,
    tasksByDate,
    toggleTaskComplete,
    toggleSubtask,
    openEditTaskModal,
    deleteTask,
    openNewTaskModal,
  } = useCalendar();

  const dateKey = formatDateKey(activeDate);
  const dayTasks = tasksByDate[dateKey] || [];
  const hours = getHoursList();

  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.completed).length;
  const remaining = total - completed;

  const dayOfWeek = WEEKDAY_NAMES_FULL[activeDate.getDay()];
  const monthName = MONTH_NAMES[activeDate.getMonth()];
  const dayNum = activeDate.getDate();
  const year = activeDate.getFullYear();

  return (
    <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden backdrop-blur-xs">
      {/* Day View Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {dayOfWeek}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {monthName} {dayNum}, {year}
          </h2>
        </div>

        {/* Day Stats & Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completed} Completed
            </span>
            {remaining > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {remaining} Remaining
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => openNewTaskModal(dateKey)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-4 md:p-6">
        {hours.map((slot) => {
          const hourPrefix = String(slot.hour).padStart(2, '0');
          const slotTasks = dayTasks.filter(t => (t.time || '10:00').startsWith(hourPrefix));

          return (
            <div
              key={slot.hour}
              className="py-3 flex items-start gap-4 group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 rounded-xl px-2 transition-colors"
            >
              {/* Hour marker */}
              <div className="w-16 shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500 pt-1 select-none">
                {slot.label}
              </div>

              {/* Tasks or empty state */}
              <div className="flex-1 min-w-0">
                {slotTasks.length > 0 ? (
                  <div className="space-y-2">
                    {slotTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onToggleSubtask={toggleSubtask}
                        onEdit={openEditTaskModal}
                        onDelete={deleteTask}
                        compact={false}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openNewTaskModal(dateKey)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 py-1 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule a task at {slot.label}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
