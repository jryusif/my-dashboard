import React from 'react';
import { Calendar, Sun, Clock, Compass } from 'lucide-react';

export function QuickDatePicker({ onSelectDate, onCancel }) {
  const options = [
    { id: 'today', label: 'Today', icon: Sun, desc: 'Do it before bed' },
    { id: 'tomorrow', label: 'Tomorrow', icon: Clock, desc: 'First thing tomorrow' },
    { id: 'weekend', label: 'This Weekend', icon: Calendar, desc: 'Saturday / Sunday' },
    { id: 'nextweek', label: 'Next Week', icon: Compass, desc: '7 days from now' },
  ];

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl animate-pop-in">
      <div className="text-xs font-semibold text-slate-400 px-1">Schedule Task:</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectDate(opt.id)}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 hover:border-sky-500/40 border border-slate-700/50 text-left transition-all text-slate-200 group"
            >
              <Icon className="w-4 h-4 text-sky-400 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-sky-300">{opt.label}</div>
                <div className="text-[10px] text-slate-400">{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-1 text-center text-xs text-slate-400 hover:text-slate-200 py-1"
      >
        Cancel
      </button>
    </div>
  );
}
