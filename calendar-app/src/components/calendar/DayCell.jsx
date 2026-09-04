import React, { useState } from 'react';
import { Plus, CheckCheck } from 'lucide-react';
import { TaskCard } from '../tasks/TaskCard';

export const DayCell = ({
  cell,
  tasks = [],
  onToggleComplete,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  onQuickAdd,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const remainingTasks = totalTasks - completedTasks;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, cell.dateKey);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group min-h-[120px] md:min-h-[140px] flex flex-col p-1.5 md:p-2 transition-all duration-150 relative border-r border-b border-slate-200/80 dark:border-slate-800/80 ${
        cell.isCurrentMonth
          ? 'bg-white/40 dark:bg-slate-900/30'
          : 'bg-slate-50/60 dark:bg-slate-950/40 opacity-40'
      } ${
        isDragOver
          ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
          : ''
      }`}
    >
      {/* Date Header & Badges */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              cell.isToday
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30'
                : cell.isCurrentMonth
                ? 'text-slate-700 dark:text-slate-300'
                : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            {cell.dayNumber}
          </span>

          {/* Badge: Remaining vs. Completed */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-1">
              {remainingTasks === 0 ? (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <CheckCheck className="w-2.5 h-2.5" />
                  All done
                </span>
              ) : (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                  {remainingTasks} left
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Button on Cell Hover */}
        <button
          type="button"
          onClick={() => onQuickAdd(cell.dateKey)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title={`Add task for ${cell.dateKey}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task List Stack */}
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[140px] pr-0.5">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onToggleSubtask={onToggleSubtask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            compact={tasks.length > 2}
          />
        ))}
      </div>
    </div>
  );
};
