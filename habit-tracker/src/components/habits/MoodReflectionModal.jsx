import React, { useState, useEffect } from 'react';
import { X, Star, Check } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';

export function MoodReflectionModal() {
  const { isMoodModalOpen, setIsMoodModalOpen, logs, selectedDate, saveReflection } = useHabits();
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');

  useEffect(() => {
    const existing = logs[selectedDate]?._reflections;
    if (existing) {
      setMood(existing.mood || 5);
      setNote(existing.note || '');
    } else {
      setMood(5);
      setNote('');
    }
  }, [selectedDate, logs, isMoodModalOpen]);

  if (!isMoodModalOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    saveReflection(mood, note.trim(), selectedDate);
    setIsMoodModalOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#121824] border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>Daily Mood &amp; Reflection</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMoodModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* 1-5 Star Rating */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2 text-center">
              How did you feel about your discipline today?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMood(rating)}
                  className="p-2 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-7 h-7 ${
                      rating <= mood
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Reflection Note */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Daily Win or Lesson (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What worked well? What distracted you? E.g. Great focus during morning session."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMoodModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Reflection (+10 XP)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
