import React from 'react';
import { 
  FolderCheck, 
  Download, 
  Upload, 
  Keyboard, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { CATEGORIES } from '../../types/task';
import { MiniCalendar } from '../widgets/MiniCalendar';

export const Sidebar = () => {
  const {
    tasks,
    selectedCategory,
    setSelectedCategory,
    setIsExportModalOpen,
  } = useCalendar();

  // Calculate task counts per category
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return tasks.length;
    return tasks.filter(t => t.category === categoryId).length;
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-4 p-4 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 overflow-y-auto hidden lg:flex">
      {/* Mini Calendar Widget */}
      <MiniCalendar />

      {/* Categories Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <FolderCheck className="w-3.5 h-3.5" />
            Categories
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Reset
          </button>
        </div>

        <div className="space-y-1">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${selectedCategory === 'all' ? 'bg-white' : 'bg-slate-400'}`} />
              <span>All Categories</span>
            </div>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'}`}>
              {getCategoryCount('all')}
            </span>
          </button>

          {/* Individual Category Items */}
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.id);
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                  <span>{cat.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Cheatsheet */}
      <div className="mt-auto p-3 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
          <span>Hotkeys</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>Today</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">T</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>New Task</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">N</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">F</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Views</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">1-3</kbd>
          </div>
        </div>
      </div>

      {/* Sync & Backup Trigger Button */}
      <button
        type="button"
        onClick={() => setIsExportModalOpen(true)}
        className="w-full py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Backup & Sync (iCal/JSON)</span>
      </button>
    </aside>
  );
};
