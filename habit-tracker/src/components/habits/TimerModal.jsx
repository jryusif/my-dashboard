import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';

export function TimerModal() {
  const { activeTimerHabit, setActiveTimerHabit, logDuration, selectedDate } = useHabits();
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [initialDuration] = useState(25 * 60);

  useEffect(() => {
    let interval = null;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      // Auto-log target minutes
      const mins = Math.round(initialDuration / 60);
      if (activeTimerHabit) {
        logDuration(activeTimerHabit.id, mins, selectedDate);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds, activeTimerHabit, initialDuration, logDuration, selectedDate]);

  if (!activeTimerHabit) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const elapsedMinutes = Math.max(1, Math.round((initialDuration - seconds) / 60));

  function handleSaveAndClose() {
    logDuration(activeTimerHabit.id, elapsedMinutes, selectedDate);
    setActiveTimerHabit(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#121824] border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Focus Engine</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTimerHabit(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-1">{activeTimerHabit.title}</h3>
        <p className="text-xs text-slate-400 mb-6">Target: {activeTimerHabit.targetMinutes || 25} minutes</p>

        {/* Big Circular Flip/Timer Display */}
        <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center rounded-full bg-slate-900 border-4 border-amber-500/20 shadow-inner">
          <div className="text-4xl font-extrabold font-mono tracking-tight text-amber-400 drop-shadow">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSeconds(initialDuration)}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="p-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950" />}
          </button>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="p-3 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
            title="Complete & Log Now"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveAndClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
        >
          Save &amp; Log {elapsedMinutes} min to Habit
        </button>
      </div>
    </div>
  );
}
