import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Repeat, 
  AlertCircle, 
  GripVertical, 
  Edit3, 
  Trash2, 
  ListChecks, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '../../types/task';
import { isTaskOverdue, formatTime12h } from '../../utils/dateUtils';
import { SubtaskList } from './SubtaskList';

export const TaskCard = ({
  task,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const overdue = isTaskOverdue(task);

  const category = CATEGORIES.find(c => c.id === task.category) || CATEGORIES[CATEGORIES.length - 1];
  const priority = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[1];

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;

  // HTML5 Drag handling
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
          : overdue
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 hover:shadow-md hover:border-rose-400'
          : 'bg-white dark:bg-slate-850 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
      } ${compact ? 'p-1.5' : 'p-2.5'}`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 -ml-1 cursor-grab">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Interactive Checkbox with Micro-interaction animation */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className={`shrink-0 w-4.5 h-4.5 mt-0.5 rounded-md flex items-center justify-center border transition-all duration-200 ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-100'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
          }`}
          title={task.completed ? "Mark incomplete" : "Mark completed"}
        >
          {task.completed && (
            <Check className="w-3.5 h-3.5 stroke-[3] animate-pop-in" />
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold tracking-tight transition-all duration-200 ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              } truncate`}
              title={task.title}
            >
              {task.title}
            </span>
          </div>

          {/* Badges & Metadata */}
          {!compact && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[10px]">
              {/* Category chip */}
              <span className={`px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-1 ${category.bg} ${category.text} ${category.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${category.dot}`} />
                {category.name}
              </span>

              {/* Priority badge */}
              <span className={`px-1.5 py-0.5 rounded-md font-semibold ${priority.badgeClass}`}>
                {priority.name}
              </span>

              {/* Time display */}
              {task.time && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime12h(task.time)}
                </span>
              )}

              {/* Recurrence badge */}
              {task.recurrence && task.recurrence !== 'none' && (
                <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium" title={`Repeats: ${task.recurrence}`}>
                  <Repeat className="w-2.5 h-2.5" />
                  <span className="capitalize">{task.recurrence}</span>
                </span>
              )}

              {/* Overdue alert */}
              {overdue && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold animate-pulse-subtle shadow-xs">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Overdue
                </span>
              )}

              {/* Subtask count chip */}
              {subtasks.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ListChecks className="w-2.5 h-2.5" />
                  <span>{completedSubtasks}/{subtasks.length}</span>
                  {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>
              )}
            </div>
          )}

          {/* Description snippet if present and not compact */}
          {!compact && task.description && !isExpanded && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Expanded Subtasks View */}
          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
              {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line">
                  {task.description}
                </p>
              )}
              <SubtaskList
                subtasks={subtasks}
                onToggle={(stId) => onToggleSubtask(task.id, stId)}
                editable={false}
              />
            </div>
          )}
        </div>

        {/* Hover Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit task"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
