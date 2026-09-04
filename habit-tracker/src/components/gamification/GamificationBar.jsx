import React from 'react';
import { Trophy, Shield, Zap, Sparkles } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { calculateLevel } from '../../utils/habitMath.js';

export function GamificationBar() {
  const { gamification, setIsBadgesModalOpen } = useHabits();
  const { level, progressPct, remainingXp, nextLevelXp } = calculateLevel(gamification.xp);

  return (
    <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
      
      {/* Left Level Info */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
          {level}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Mastery Level {level}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {gamification.xp} Total XP &bull; <span className="text-slate-300 font-semibold">{remainingXp} XP</span> to Level {level + 1}
          </p>
        </div>
      </div>

      {/* Center Progress Bar */}
      <div className="w-full md:flex-1 max-w-md">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>Level Progress</span>
          <span className="text-amber-400 font-bold">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Right Stats & Badge trigger */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Streak Freeze Shields */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold"
          title="Streak Freeze: Automatically preserves your streak if you miss a day."
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>{gamification.freezeTokens || 0} Freezes</span>
        </div>

        {/* Badges Gallery Button */}
        <button
          type="button"
          onClick={() => setIsBadgesModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Badges ({(gamification.unlockedBadges || []).length})</span>
        </button>
      </div>
    </div>
  );
}
