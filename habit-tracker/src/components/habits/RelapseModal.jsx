import React, { useState } from 'react';
import { X, HeartHandshake, AlertCircle } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';

export function RelapseModal() {
  const { activeRelapseHabit, setActiveRelapseHabit, logRelapse } = useHabits();
  const [triggerNote, setTriggerNote] = useState('');

  if (!activeRelapseHabit) return null;

  function handleConfirm(e) {
    e.preventDefault();
    logRelapse(activeRelapseHabit.id, triggerNote.trim());
    setActiveRelapseHabit(null);
    setTriggerNote('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#121824] border border-rose-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Compassionate Reset</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveRelapseHabit(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-white mb-2">
          Resetting streak for "{activeRelapseHabit.title}"
        </h3>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-4 text-xs text-slate-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Growth is non-linear.</strong> Relapses are valuable data points, not failures. Acknowledge what happened and restart with momentum today.
          </p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              What triggered this? (Optional reflection)
            </label>
            <textarea
              rows={3}
              value={triggerNote}
              onChange={e => setTriggerNote(e.target.value)}
              placeholder="e.g. Stress at work, social pressure, lack of sleep..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveRelapseHabit(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold transition-all active:scale-95 shadow-md shadow-rose-500/20"
            >
              Reset Streak &amp; Begin Day 1
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
