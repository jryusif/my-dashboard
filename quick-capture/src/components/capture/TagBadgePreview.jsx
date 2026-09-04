import React from 'react';
import { formatRelativeDateLabel } from '../../utils/smartParser';

export function TagBadgePreview({ parsed }) {
  const { dateStr, category, priority } = parsed;
  if (!dateStr && !category && !priority) return null;

  return (
    <div className="flex items-center gap-2 pt-2 flex-wrap text-xs animate-fade-in">
      {dateStr && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
          📅 {formatRelativeDateLabel(dateStr)}
        </span>
      )}
      {category && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
          🏷️ #{category}
        </span>
      )}
      {priority && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
          ⚡ !{priority.toUpperCase()}
        </span>
      )}
    </div>
  );
}
