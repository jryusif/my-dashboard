import React from 'react';
import { X, Inbox, Play, Trash2 } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { InboxItemRow } from './InboxItemRow';

export function InboxDrawer() {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    inbox,
    convertToTask,
    convertToHabit,
    archiveToVault,
    deleteThought,
    updateThought,
    setIsTriageOpen,
  } = useQuickCapture();

  if (!isDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsDrawerOpen(false)}
    >
      <div
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 font-bold text-white">
            <Inbox className="w-5 h-5 text-sky-400" />
            <span>Brain Dump Inbox</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
              {inbox.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Start Triage CTA Button */}
        {inbox.length > 0 && (
          <div className="p-4 border-b border-slate-800 bg-indigo-950/20">
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                setIsTriageOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-md transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start 2-Minute Triage ({inbox.length} items)</span>
            </button>
          </div>
        )}

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {inbox.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-medium text-slate-300">Inbox is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Press <strong>Ctrl + Space</strong> anywhere to capture fleeting ideas, tasks, or habits.
              </p>
            </div>
          ) : (
            inbox.map(item => (
              <InboxItemRow
                key={item.id}
                item={item}
                onConvertToTask={convertToTask}
                onConvertToHabit={convertToHabit}
                onArchiveToVault={archiveToVault}
                onDelete={deleteThought}
                onUpdate={updateThought}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
