import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { getWeekDays, getHoursList } from '../../utils/dateUtils';
import { TaskCard } from '../tasks/TaskCard';
import { Plus } from 'lucide-react';

export const WeekView = () => {
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

  const weekDays = getWeekDays(activeDate);
  const hours = getHoursList();

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dateKey) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTaskDate(taskId, dateKey);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden backdrop-blur-xs">
      {/* 7-Day Header */}
      <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 sticky top-0 z-10">
        <div className="py-3 px-2 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800">
          Time
        </div>
        {weekDays.map((day) => (
          <div
            key={day.dateKey}
            className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
              day.isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {day.dayName}
            </div>
            <div
              className={`inline-flex items-center justify-center w-7 h-7 mt-0.5 rounded-full text-xs font-bold ${
                day.isToday
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {day.dayNumber}
            </div>
          </div>
        ))}
      </div>

      {/* Hourly Grid Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((slot) => {
          const hourPrefix = String(slot.hour).padStart(2, '0');

          return (
            <div
              key={slot.hour}
              className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800/60 min-h-[64px]"
            >
              {/* Hour Label */}
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 py-2 px-2 text-right border-r border-slate-200 dark:border-slate-800 select-none">
                {slot.label}
              </div>

              {/* 7 Day Columns for this hour */}
              {weekDays.map((day) => {
                const dayTasks = tasksByDate[day.dateKey] || [];
                // Filter tasks matching this hour slot
                const slotTasks = dayTasks.filter(t => (t.time || '10:00').startsWith(hourPrefix));

                return (
                  <div
                    key={`${day.dateKey}_${slot.hour}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.dateKey)}
                    className="p-1 border-r border-slate-100 dark:border-slate-800/40 last:border-r-0 relative group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Inline Quick Add button on hover */}
                    <button
                      type="button"
                      onClick={() => openNewTaskModal(day.dateKey)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all z-10"
                      title={`Add task at ${slot.label}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    {/* Task Cards in this slot */}
                    <div className="space-y-1">
                      {slotTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={toggleTaskComplete}
                          onToggleSubtask={toggleSubtask}
                          onEdit={openEditTaskModal}
                          onDelete={deleteTask}
                          compact={true}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
