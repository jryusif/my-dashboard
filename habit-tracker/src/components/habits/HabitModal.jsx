import React, { useState, useEffect } from 'react';
import { X, Check, Link2 } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { HABIT_TYPES, TIME_OF_DAY, HABIT_CATEGORIES } from '../../types/habit.js';

export function HabitModal() {
  const {
    isHabitModalOpen,
    setIsHabitModalOpen,
    editingHabit,
    addHabit,
    editHabit,
  } = useHabits();

  const [title, setTitle] = useState('');
  const [type, setType] = useState(HABIT_TYPES.BINARY);
  const [category, setCategory] = useState('health');
  const [timeOfDay, setTimeOfDay] = useState(TIME_OF_DAY.MORNING);
  const [anchorHabit, setAnchorHabit] = useState('');
  const [targetValue, setTargetValue] = useState(2000);
  const [unit, setUnit] = useState('ml');
  const [stepIncrement, setStepIncrement] = useState(250);
  const [targetMinutes, setTargetMinutes] = useState(25);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setType(editingHabit.type || HABIT_TYPES.BINARY);
      setCategory(editingHabit.category || 'health');
      setTimeOfDay(editingHabit.timeOfDay || TIME_OF_DAY.MORNING);
      setAnchorHabit(editingHabit.anchorHabit || '');
      setTargetValue(editingHabit.targetValue || 2000);
      setUnit(editingHabit.unit || 'ml');
      setStepIncrement(editingHabit.stepIncrement || 250);
      setTargetMinutes(editingHabit.targetMinutes || 25);
    } else {
      setTitle('');
      setType(HABIT_TYPES.BINARY);
      setCategory('health');
      setTimeOfDay(TIME_OF_DAY.MORNING);
      setAnchorHabit('');
      setTargetValue(2000);
      setUnit('ml');
      setStepIncrement(250);
      setTargetMinutes(25);
    }
  }, [editingHabit, isHabitModalOpen]);

  if (!isHabitModalOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      type,
      category,
      timeOfDay,
      anchorHabit: anchorHabit.trim(),
      targetValue: Number(targetValue) || 100,
      unit: unit.trim() || 'units',
      stepIncrement: Number(stepIncrement) || 1,
      targetMinutes: Number(targetMinutes) || 25,
      frequency: 'daily',
    };

    if (editingHabit) {
      editHabit(editingHabit.id, payload);
    } else {
      addHabit(payload);
    }

    setIsHabitModalOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121824] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {editingHabit ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button
            type="button"
            onClick={() => setIsHabitModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Habit Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Drink 2,500 ml water, Read 25 mins, Cold shower"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Habit Type Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Engine Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType(HABIT_TYPES.BINARY)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === HABIT_TYPES.BINARY
                    ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>✓ Checkbox</div>
                <div className="text-[10px] text-slate-500 font-normal">Yes/No binary check-off</div>
              </button>

              <button
                type="button"
                onClick={() => setType(HABIT_TYPES.MEASURABLE)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === HABIT_TYPES.MEASURABLE
                    ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>📊 Measurable Target</div>
                <div className="text-[10px] text-slate-500 font-normal">Numeric goals with + / -</div>
              </button>

              <button
                type="button"
                onClick={() => setType(HABIT_TYPES.DURATION)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === HABIT_TYPES.DURATION
                    ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>⏱️ Stopwatch &amp; Timer</div>
                <div className="text-[10px] text-slate-500 font-normal">Deep work &amp; meditation</div>
              </button>

              <button
                type="button"
                onClick={() => setType(HABIT_TYPES.BREAK)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === HABIT_TYPES.BREAK
                    ? 'border-rose-500 bg-rose-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>🚫 Break a Habit</div>
                <div className="text-[10px] text-slate-500 font-normal">Track days abstained</div>
              </button>
            </div>
          </div>

          {/* Conditional Type Config */}
          {type === HABIT_TYPES.MEASURABLE && (
            <div className="grid grid-cols-3 gap-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Target</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="ml, pages"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Step (+/-)</label>
                <input
                  type="number"
                  value={stepIncrement}
                  onChange={e => setStepIncrement(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
          )}

          {type === HABIT_TYPES.DURATION && (
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <label className="block text-slate-400 mb-1">Target Duration (Minutes)</label>
              <input
                type="number"
                value={targetMinutes}
                onChange={e => setTargetMinutes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          )}

          {/* Routine Time-of-Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Routine Time</label>
              <select
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                <option value={TIME_OF_DAY.MORNING}>🌅 Morning Routine</option>
                <option value={TIME_OF_DAY.AFTERNOON}>☀️ Afternoon Focus</option>
                <option value={TIME_OF_DAY.EVENING}>🌙 Evening Wind-down</option>
                <option value={TIME_OF_DAY.ANYTIME}>⚡ Anytime</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                {HABIT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Behavioral Psychology: Habit Stacking Anchor */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              <label className="text-slate-300 font-semibold">Habit Stacking Anchor (Optional)</label>
            </div>
            <input
              type="text"
              value={anchorHabit}
              onChange={e => setAnchorHabit(e.target.value)}
              placeholder="e.g. After I pour morning coffee / After shutting laptop"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Connects this habit to an established daily ritual to dramatically increase behavioral adherence.
            </p>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsHabitModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingHabit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
