import React from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

export const SubtaskList = ({ subtasks = [], onToggle, onDelete, onAdd, editable = false }) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');

  const total = subtasks.length;
  const completedCount = subtasks.filter(s => s.completed).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const handleAdd = (e) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAdd?.({
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: newSubtaskTitle.trim(),
      completed: false,
    });
    setNewSubtaskTitle('');
  };

  if (!editable && total === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Progress Bar Header */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Subtasks & Checklist</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {completedCount}/{total} done ({percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask Items */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {subtasks.map((st) => (
          <div
            key={st.id}
            className={`group flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
              st.completed
                ? 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500'
                : 'bg-white/60 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none">
              <button
                type="button"
                onClick={() => onToggle?.(st.id)}
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 ${
                  st.completed
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-indigo-500'
                }`}
              >
                {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span className={`truncate ${st.completed ? 'line-through' : 'font-medium'}`}>
                {st.title}
              </span>
            </label>

            {editable && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(st.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                title="Remove subtask"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Inline Add Field in Edit Mode */}
      {editable && (
        <form onSubmit={handleAdd} className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!newSubtaskTitle.trim()}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
      )}
    </div>
  );
};
