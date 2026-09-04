import React, { useState } from 'react';
import { CheckSquare, Flame, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { TagBadgePreview } from '../capture/TagBadgePreview';
import { QuickDatePicker } from './QuickDatePicker';

export function TriageCard({
  item,
  index,
  total,
  onConvertToTask,
  onConvertToHabit,
  onArchiveToVault,
  onDiscard,
  onSkip,
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-pop-in relative overflow-hidden backdrop-blur-xl">
      {/* Top Progress Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
        <span className="font-semibold text-sky-400 uppercase tracking-wider">
          Thought {index + 1} of {total}
        </span>
        <span className="text-slate-500">
          Created {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Main Text Content */}
      <div className="py-2">
        <p className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed">
          {item.cleanText || item.rawText}
        </p>
        <TagBadgePreview parsed={item} />
      </div>

      {/* Quick Date Picker popup if user clicked Task */}
      {showDatePicker ? (
        <QuickDatePicker
          onSelectDate={(opt) => {
            setShowDatePicker(false);
            onConvertToTask(item, opt);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      ) : (
        /* Action Buttons Grid */
        <div className="flex flex-col gap-3 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Convert to Task */}
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition-all hover:scale-[1.02] active:scale-95 group"
              title="Convert to Task (Shortcut: T)"
            >
              <CheckSquare className="w-5 h-5 mb-1 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white">Task</span>
              <kbd className="mt-1 px-1.5 py-0.5 rounded bg-sky-950/60 text-[10px] text-sky-300 border border-sky-800 font-mono">T</kbd>
            </button>

            {/* 2. Convert to Habit */}
            <button
              type="button"
              onClick={() => onConvertToHabit(item)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all hover:scale-[1.02] active:scale-95 group"
              title="Convert to Habit (Shortcut: H)"
            >
              <Flame className="w-5 h-5 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white">Habit</span>
              <kbd className="mt-1 px-1.5 py-0.5 rounded bg-amber-950/60 text-[10px] text-amber-300 border border-amber-800 font-mono">H</kbd>
            </button>

            {/* 3. Archive to Notes Vault */}
            <button
              type="button"
              onClick={() => onArchiveToVault(item)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition-all hover:scale-[1.02] active:scale-95 group"
              title="Archive to Notes Vault (Shortcut: N)"
            >
              <BookOpen className="w-5 h-5 mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white">Note Vault</span>
              <kbd className="mt-1 px-1.5 py-0.5 rounded bg-purple-950/60 text-[10px] text-purple-300 border border-purple-800 font-mono">N</kbd>
            </button>

            {/* 4. Discard / Shred */}
            <button
              type="button"
              onClick={() => onDiscard(item.id)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all hover:scale-[1.02] active:scale-95 group"
              title="Discard / Shred (Shortcut: D or Backspace)"
            >
              <Trash2 className="w-5 h-5 mb-1 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white">Discard</span>
              <kbd className="mt-1 px-1.5 py-0.5 rounded bg-rose-950/60 text-[10px] text-rose-300 border border-rose-800 font-mono">D</kbd>
            </button>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
          >
            <span>Skip for now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
