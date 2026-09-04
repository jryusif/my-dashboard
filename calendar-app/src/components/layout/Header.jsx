import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sun, 
  Moon, 
  Plus, 
  LayoutGrid, 
  Columns3, 
  CalendarDays, 
  TrendingUp,
  Download
} from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { MONTH_NAMES } from '../../utils/dateUtils';

export const Header = () => {
  const {
    activeDate,
    currentView,
    setCurrentView,
    isDarkMode,
    setIsDarkMode,
    goToToday,
    goToPrev,
    goToNext,
    jumpToMonthYear,
    openNewTaskModal,
    setIsExportModalOpen,
    setIsStatsOpen,
    isStatsOpen,
  } = useCalendar();

  const currentYear = activeDate.getFullYear();
  const currentMonth = activeDate.getMonth();

  // Generate list of years (e.g. currentYear - 10 to currentYear + 10)
  const years = [];
  for (let y = currentYear - 7; y <= currentYear + 7; y++) {
    years.push(y);
  }

  return (
    <header className="px-4 py-3 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      {/* Left: App Brand & Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* App Title with Icon */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
              Smart Calendar
            </h1>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Tasks & Schedule
            </span>
          </div>
        </div>

        {/* Today Button */}
        <button
          type="button"
          onClick={goToToday}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
          title="Jump to Today (Hotkey: T)"
        >
          <span>Today</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-[9px] text-slate-500 dark:text-slate-400 font-mono">
            T
          </kbd>
        </button>

        {/* Prev / Next Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrev}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Previous (Hotkey: Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Next (Hotkey: Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Year Direct Pickers */}
        <div className="flex items-center gap-1.5">
          <select
            value={currentMonth}
            onChange={(e) => jumpToMonthYear(currentYear, parseInt(e.target.value, 10))}
            className="text-sm font-bold bg-transparent text-slate-900 dark:text-white border-0 focus:ring-1 focus:ring-indigo-500 rounded-lg py-1 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {name}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => jumpToMonthYear(parseInt(e.target.value, 10), currentMonth)}
            className="text-sm font-bold bg-transparent text-slate-900 dark:text-white border-0 focus:ring-1 focus:ring-indigo-500 rounded-lg py-1 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: View Toggle, Theme, Stats, New Task */}
      <div className="flex items-center gap-2">
        {/* View Switcher: Month, Week, Day */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setCurrentView('month')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentView === 'month'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Month View (Hotkey: 1)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Month</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('week')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentView === 'week'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Week View (Hotkey: 2)"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Week</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('day')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentView === 'day'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Day Agenda (Hotkey: 3)"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Day</span>
          </button>
        </div>

        {/* Insights Toggle */}
        <button
          type="button"
          onClick={() => setIsStatsOpen(!isStatsOpen)}
          className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
            isStatsOpen
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title="Toggle Productivity Insights"
        >
          <TrendingUp className="w-4 h-4" />
        </button>

        {/* Data Backup / Export Modal Opener */}
        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Backup & Sync (JSON & iCal)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* New Task Button */}
        <button
          type="button"
          onClick={() => openNewTaskModal()}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all hover:shadow-indigo-500/35"
          title="Create New Task (Hotkey: N)"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">New Task</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-indigo-500 rounded text-[9px] font-mono">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
};
