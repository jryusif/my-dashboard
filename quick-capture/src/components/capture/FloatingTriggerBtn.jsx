import React from 'react';
import { Zap } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';

export function FloatingTriggerBtn() {
  const { setIsCaptureOpen, inbox } = useQuickCapture();

  return (
    <button
      type="button"
      onClick={() => setIsCaptureOpen(true)}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 active:scale-95 transition-all duration-200 group"
      title="Quick Brain Dump (Ctrl + Space)"
    >
      <Zap className="w-5 h-5 fill-current transition-transform group-hover:rotate-12" />
      <span className="hidden md:inline text-sm font-semibold tracking-wide">Capture</span>
      {inbox.length > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold font-mono">
          {inbox.length}
        </span>
      )}
    </button>
  );
}
