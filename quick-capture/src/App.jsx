import React from 'react';
import { Zap, Moon, CheckSquare, Flame, BookOpen, Clock, Command, ArrowRight } from 'lucide-react';
import { QuickCaptureProvider, useQuickCapture } from './context/QuickCaptureContext';
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys';
import { Header } from './components/layout/Header';
import { EveningBanner } from './components/layout/EveningBanner';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal';
import { FloatingTriggerBtn } from './components/capture/FloatingTriggerBtn';
import { TriageRitualModal } from './components/triage/TriageRitualModal';
import { InboxDrawer } from './components/inbox/InboxDrawer';
import { NotesVaultModal } from './components/inbox/NotesVaultModal';

function AppContent() {
  const {
    inbox,
    vault,
    stats,
    setIsCaptureOpen,
    setIsTriageOpen,
    setIsDrawerOpen,
    setIsVaultOpen,
    theme,
    toggleTheme,
  } = useQuickCapture();

  // Setup universal hotkeys
  useGlobalHotkeys({
    onToggleCapture: () => setIsCaptureOpen(prev => !prev),
    onCloseModals: () => {
      setIsCaptureOpen(false);
      setIsTriageOpen(false);
      setIsDrawerOpen(false);
      setIsVaultOpen(false);
    },
    onStartTriage: () => setIsTriageOpen(true),
    onToggleDrawer: () => setIsDrawerOpen(prev => !prev),
    onToggleTheme: toggleTheme,
  });

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-100 text-slate-900'}`}>
      <EveningBanner />
      <Header />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Spotlight Command Bar Hero Preview */}
        <section className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Universal Floating Command Bar</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Capture any fleeting idea in 2 seconds flat.
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
              Press <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-sky-300">Ctrl + Space</kbd> anywhere
              to dump thoughts, tasks, and ideas with live smart tags (<span className="text-sky-300">@date</span>, <span className="text-purple-300">#tag</span>, <span className="text-rose-300">!priority</span>).
            </p>

            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCaptureOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Open Quick Capture</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTriageOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Nightly Reset ({inbox.length})</span>
              </button>
            </div>
          </div>

          {/* Mini Interactive Preview Tile */}
          <div
            onClick={() => setIsCaptureOpen(true)}
            className="w-full md:w-80 p-4 rounded-xl bg-slate-950/70 border border-slate-700/60 hover:border-sky-500/50 cursor-pointer transition-all shadow-inner group flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-sky-400 font-mono">
                <Command className="w-3.5 h-3.5" /> + Space
              </span>
              <span>Click to test</span>
            </div>
            <div className="text-sm text-slate-300 italic group-hover:text-white transition-colors">
              "Review dental crown case @tomorrow #work !high"
            </div>
            <div className="flex items-center gap-1.5 text-[10px] pt-1">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">📅 Tomorrow</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">#work</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">!HIGH</span>
            </div>
          </div>
        </section>

        {/* 3 Pillars Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Inbox Count */}
          <div
            onClick={() => setIsDrawerOpen(true)}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{inbox.length}</div>
              <div className="text-xs text-slate-400">Thoughts in Inbox</div>
            </div>
          </div>

          {/* Reset Streak */}
          <div
            onClick={() => setIsTriageOpen(true)}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{stats.streak || 0} Days</div>
              <div className="text-xs text-slate-400">Evening Reset Streak</div>
            </div>
          </div>

          {/* Notes Vault Count */}
          <div
            onClick={() => setIsVaultOpen(true)}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{vault.length} Notes</div>
              <div className="text-xs text-slate-400">Archived in Vault</div>
            </div>
          </div>
        </section>

        {/* Nightly Triage Ritual Explainer & Action Steps */}
        <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🌙 The 8:00 PM "Inbox Zero" Ritual</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every evening, clear mental clutter in under 2 minutes so your brain fully unwinds.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsTriageOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
            >
              <span>Run Triage Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> [T] Convert to Task
              </span>
              <p className="text-slate-400 text-[11px]">Schedules thought for Today, Tomorrow, Weekend, or Next Week.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> [H] Convert to Habit
              </span>
              <p className="text-slate-400 text-[11px]">Turns recurring routines into trackable streaks.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> [N] Archive to Vault
              </span>
              <p className="text-slate-400 text-[11px]">Saves reference ideas and clinical notes into searchable storage.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <span>🗑️</span> [D] Discard / Shred
              </span>
              <p className="text-slate-400 text-[11px]">Deletes non-actionable clutter with satisfying audio feedback.</p>
            </div>
          </div>
        </section>

      </main>

      {/* Floating Elements & Modals */}
      <FloatingTriggerBtn />
      <QuickCaptureModal />
      <TriageRitualModal />
      <InboxDrawer />
      <NotesVaultModal />
    </div>
  );
}

export default function App() {
  return (
    <QuickCaptureProvider>
      <AppContent />
    </QuickCaptureProvider>
  );
}
