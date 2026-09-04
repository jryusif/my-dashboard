import React, { useRef } from 'react';
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  Trophy,
  Smile,
  Printer,
  Download,
  Upload,
  Shield,
  Zap,
} from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { formatDateKey, calculateLevel } from '../../utils/habitMath.js';
import { exportHabitData, importHabitData } from '../../utils/exportImport.js';

export function Header({ darkMode, setDarkMode }) {
  const {
    habits,
    logs,
    gamification,
    selectedDate,
    setSelectedDate,
    setIsHabitModalOpen,
    setEditingHabit,
    setIsBadgesModalOpen,
    setIsMoodModalOpen,
    setIsPrintModalOpen,
  } = useHabits();

  const fileInputRef = useRef(null);
  const todayKey = formatDateKey(new Date());
  const isToday = selectedDate === todayKey;

  const { level, progressPct } = calculateLevel(gamification.xp);

  function shiftDate(deltaDays) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(formatDateKey(current));
  }

  function handleExport() {
    exportHabitData(habits, logs, gamification);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    importHabitData(file)
      .then(data => {
        if (data.habits) window.localStorage.setItem('antigravity_habits', JSON.stringify(data.habits));
        if (data.logs) window.localStorage.setItem('antigravity_habit_logs', JSON.stringify(data.logs));
        if (data.gamification) window.localStorage.setItem('antigravity_habit_gamification', JSON.stringify(data.gamification));
        window.location.reload();
      })
      .catch(err => alert('Failed to import data: ' + err.message));
  }

  return (
    <header className="border-b border-slate-800/80 bg-[#0e1422]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">HabitOS</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25">
                Pro Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Behavioral psychology &amp; momentum tracker</p>
          </div>
        </div>

        {/* Center: Date Navigation */}
        <div className="flex items-center justify-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(todayKey)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              isToday
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {isToday ? 'Today' : selectedDate}
          </button>

          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* XP / Level Pill */}
          <button
            type="button"
            onClick={() => setIsBadgesModalOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800/80"
            title="View Badges & Gamification"
          >
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Lvl {level}</span>
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{gamification.xp} XP</span>
          </button>

          {/* Freeze Shield Token */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold"
            title={`Streak Freeze Shields: ${gamification.freezeTokens || 0} stored. Protects your streak on missed days.`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{gamification.freezeTokens || 0}</span>
          </div>

          {/* Daily Mood / Reflection */}
          <button
            type="button"
            onClick={() => setIsMoodModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Log Daily Reflection & Mood"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Print Sheet */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Print Monthly Habit Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExport}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Download JSON Backup"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Import JSON hidden input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Restore from Backup"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Toggle Theme (D)"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* New Habit Button */}
          <button
            type="button"
            onClick={() => {
              setEditingHabit(null);
              setIsHabitModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 bg-black/20 text-[10px] rounded font-mono">N</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
