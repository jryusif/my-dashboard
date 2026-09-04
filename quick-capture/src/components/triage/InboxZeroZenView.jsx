import React, { useEffect } from 'react';
import { CheckCircle2, Flame, ArrowRight } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { fireConfetti } from '../../utils/confetti';

export function InboxZeroZenView({ onClose }) {
  const { stats } = useQuickCapture();

  useEffect(() => {
    fireConfetti();
  }, []);

  return (
    <div className="w-full max-w-lg bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center gap-5 animate-pop-in backdrop-blur-xl">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Inbox Zero Achieved!</h2>
        <p className="text-sm text-slate-400 mt-1">
          Your mind is clear, calm, and ready for tomorrow.
        </p>
      </div>

      {/* Streak Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-sm">
        <Flame className="w-4 h-4 fill-current text-amber-400" />
        <span>{stats.streak || 1}-Day Reset Streak</span>
      </div>

      <p className="text-xs text-slate-500 max-w-xs">
        Total thoughts organized to date: <strong className="text-slate-300">{stats.totalProcessed || 0}</strong>
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700"
      >
        <span>Finish Triage</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
