import React from 'react';
import { Zap, Inbox, BookOpen, Moon, Sun, Play, Download, Upload, Flame } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { exportBrainDumpData, importBrainDumpData } from '../../utils/exportUtils';

export function Header() {
  const {
    inbox,
    vault,
    stats,
    setIsCaptureOpen,
    setIsDrawerOpen,
    setIsVaultOpen,
    setIsTriageOpen,
    theme,
    toggleTheme,
  } = useQuickCapture();

  const handleExport = () => {
    exportBrainDumpData(inbox, vault, stats);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBrainDumpData(file);
      if (data.inbox) localStorage.setItem('antigravity_inbox_items', JSON.stringify(data.inbox));
      if (data.vault) localStorage.setItem('antigravity_notes_vault', JSON.stringify(data.vault));
      if (data.stats) localStorage.setItem('antigravity_triage_stats', JSON.stringify(data.stats));
      window.location.reload();
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };

  return (
    <header className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-30">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Brain Dump</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
              Raycast Core
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Distraction-free universal quick capture &amp; 8 PM reset</p>
        </div>
      </div>

      {/* Action Hub */}
      <div className="flex items-center gap-2">
        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={() => setIsCaptureOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          title="Universal Quick Capture (Ctrl + Space)"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Capture</span>
          <kbd className="hidden md:inline px-1 py-0.2 rounded bg-sky-700/60 text-[9px] font-mono ml-1">Ctrl+Space</kbd>
        </button>

        {/* Start Triage */}
        <button
          type="button"
          onClick={() => setIsTriageOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          title="Start 2-Minute Nightly Triage Ritual (Hotkey: T)"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Evening Triage</span>
          <kbd className="hidden md:inline px-1 py-0.2 rounded bg-indigo-800/60 text-[9px] font-mono ml-1">T</kbd>
        </button>

        {/* Inbox Drawer Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all relative"
          title="Open Scratchpad Drawer (Hotkey: I)"
        >
          <Inbox className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Inbox</span>
          {inbox.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
              {inbox.length}
            </span>
          )}
        </button>

        {/* Notes Vault Button */}
        <button
          type="button"
          onClick={() => setIsVaultOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
          title="Searchable Notes & Ideas Vault"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Vault</span>
          <span className="text-[10px] text-slate-400 font-mono">({vault.length})</span>
        </button>

        {/* Streak Pill */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          <Flame className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span>{stats.streak || 0}d streak</span>
        </div>

        {/* Export / Backup */}
        <button
          type="button"
          onClick={handleExport}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          title="Export Brain Dump JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        <label
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer transition-colors"
          title="Import Backup"
        >
          <Upload className="w-4 h-4" />
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>

        {/* Dark / Light toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </header>
  );
}
