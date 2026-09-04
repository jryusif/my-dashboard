import React from 'react';
import {
  X,
  Trophy,
  Sparkles,
  Flame,
  Zap,
  Crown,
  CheckCheck,
  Shield,
  Timer,
  Anchor,
  Star,
  Lock,
} from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';
import { BADGES_LIST } from '../../types/habit.js';

const ICON_MAP = {
  Sparkles,
  Flame,
  Zap,
  Crown,
  CheckCheck,
  Shield,
  Trophy,
  Timer,
  Anchor,
  Star,
};

export function BadgesModal() {
  const { isBadgesModalOpen, setIsBadgesModalOpen, gamification } = useHabits();

  if (!isBadgesModalOpen) return null;

  const unlocked = gamification.unlockedBadges || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#121824] border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Achievements &amp; Milestones</h2>
              <p className="text-xs text-slate-400">
                Unlocked {unlocked.length} of {BADGES_LIST.length} Badges
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBadgesModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {BADGES_LIST.map(badge => {
            const isUnlocked = unlocked.includes(badge.id);
            const Icon = ICON_MAP[badge.icon] || Trophy;

            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-amber-500/30 shadow-sm shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isUnlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                      {badge.name}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      +{badge.xpReward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsBadgesModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
