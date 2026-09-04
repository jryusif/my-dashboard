import React, { useState } from 'react';
import { Trash2, CheckSquare, Flame, BookOpen, Edit2, Check } from 'lucide-react';
import { TagBadgePreview } from '../capture/TagBadgePreview';

export function InboxItemRow({
  item,
  onConvertToTask,
  onConvertToHabit,
  onArchiveToVault,
  onDelete,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.cleanText || item.rawText);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdate(item.id, { cleanText: editText.trim(), rawText: editText.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col gap-2 group">
      <div className="flex items-start justify-between gap-3">
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="flex-1 bg-slate-900 border border-sky-500 rounded px-2.5 py-1 text-sm text-white outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="p-1 rounded bg-sky-500 text-white hover:bg-sky-600"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex-1 text-sm text-slate-200 leading-snug">
            {item.cleanText || item.rawText}
          </div>
        )}

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsEditing(prev => !prev)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title="Edit Thought"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1 text-slate-400 hover:text-rose-400 rounded"
            title="Delete Thought"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <TagBadgePreview parsed={item} />

      {/* Quick Row Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onConvertToTask(item, 'tomorrow')}
            className="hover:text-sky-400 flex items-center gap-1 font-medium transition-colors"
          >
            <CheckSquare className="w-3 h-3 text-sky-400" /> +Task
          </button>
          <button
            type="button"
            onClick={() => onConvertToHabit(item)}
            className="hover:text-amber-400 flex items-center gap-1 font-medium transition-colors"
          >
            <Flame className="w-3 h-3 text-amber-400" /> +Habit
          </button>
          <button
            type="button"
            onClick={() => onArchiveToVault(item)}
            className="hover:text-purple-400 flex items-center gap-1 font-medium transition-colors"
          >
            <BookOpen className="w-3 h-3 text-purple-400" /> Vault
          </button>
        </div>
      </div>
    </div>
  );
}
