import React from 'react';
import { Moon, Play, X } from 'lucide-react';
import { useEveningTimer } from '../../hooks/useEveningTimer';
import { useQuickCapture } from '../../context/QuickCaptureContext';

export function EveningBanner() {
  const isEvening = useEveningTimer(20); // 8:00 PM
  const { inbox, setIsTriageOpen } = useQuickCapture();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isEvening || inbox.length === 0 || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-sky-950/80 border-b border-indigo-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-200 animate-slide-up">
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-indigo-400 fill-current animate-pulse" />
        <span>
          <strong>Evening Brain Reset:</strong> You have <strong>{inbox.length}</strong> thoughts ready for your 2-minute nightly triage.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsTriageOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-500/50 text-white font-semibold transition-all"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Triage</span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
