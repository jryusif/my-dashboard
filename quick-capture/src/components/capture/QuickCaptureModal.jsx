import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CornerDownLeft, X, Zap } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { parseSmartCapture } from '../../utils/smartParser';
import { TagBadgePreview } from './TagBadgePreview';

export function QuickCaptureModal() {
  const { isCaptureOpen, setIsCaptureOpen, addThought, inbox } = useQuickCapture();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const parsed = parseSmartCapture(text);

  useEffect(() => {
    if (isCaptureOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } else {
      setText('');
    }
  }, [isCaptureOpen]);

  if (!isCaptureOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!text.trim()) return;

      addThought(text);
      if (e.ctrlKey || e.metaKey) {
        // Multi-capture mode: keep modal open and clear text
        setText('');
      } else {
        // Save and close
        setText('');
        setIsCaptureOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCaptureOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 md:pt-28 px-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={() => setIsCaptureOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-slate-900/90 dark:bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-700/60 spotlight-modal overflow-hidden animate-pop-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
              <Zap className="w-3 h-3 fill-current" />
            </span>
            <span>Universal Brain Dump</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-400 font-mono">
              {inbox.length} in inbox
            </span>
            <button
              type="button"
              onClick={() => setIsCaptureOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Body */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? e.g. Fix margin @tomorrow #work !urgent"
            className="w-full bg-transparent resize-none border-none outline-none text-slate-100 placeholder-slate-500 text-lg leading-relaxed"
          />

          <TagBadgePreview parsed={parsed} />
        </div>

        {/* Bottom Bar Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/70 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Enter</kbd>
              <span>Save &amp; close</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+Enter</kbd>
              <span>Quick next</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Esc</kbd>
              <span>Dismiss</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500">
            <span>Supports <strong>@date</strong>, <strong>#tag</strong>, <strong>!priority</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
