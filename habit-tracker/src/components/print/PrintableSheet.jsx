import React from 'react';
import { X, Printer } from 'lucide-react';
import { useHabits } from '../../context/HabitContext.jsx';

export function PrintableSheet() {
  const { isPrintModalOpen, setIsPrintModalOpen, habits } = useHabits();

  if (!isPrintModalOpen) return null;

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl p-8 shadow-2xl relative my-auto">
        
        {/* Actions Bar (hidden when printing) */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Printable Habit Tracker Sheet</h2>
            <p className="text-xs text-slate-500">Offline bullet journal checklist for your desk</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow hover:bg-slate-800 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grid Sheet */}
        <div className="print-sheet">
          <div className="flex items-center justify-between mb-4 border-b-2 border-slate-900 pb-2">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">HabitOS Tracker</h1>
              <p className="text-xs text-slate-600 font-semibold">{currentMonth}</p>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              Never Miss Twice &bull; Discipline = Freedom
            </div>
          </div>

          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-left font-bold w-48">Habit Name</th>
                {daysInMonth.map(d => (
                  <th key={d} className="border border-slate-300 p-1 text-center font-mono text-[10px] w-6">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-2 font-medium text-slate-800">
                    <div className="font-bold">{habit.title}</div>
                    {habit.anchorHabit && (
                      <div className="text-[9px] text-slate-500">After: {habit.anchorHabit}</div>
                    )}
                  </td>
                  {daysInMonth.map(d => (
                    <td key={d} className="border border-slate-300 p-1 text-center">
                      <div className="w-3.5 h-3.5 border border-slate-400 rounded-sm mx-auto" />
                    </td>
                  ))}
                </tr>
              ))}
              {/* Extra blank rows for custom additions */}
              {[1, 2, 3].map(row => (
                <tr key={row}>
                  <td className="border border-slate-300 p-3 text-slate-400 italic">Custom Habit...</td>
                  {daysInMonth.map(d => (
                    <td key={d} className="border border-slate-300 p-1">
                      <div className="w-3.5 h-3.5 border border-slate-400 rounded-sm mx-auto" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
