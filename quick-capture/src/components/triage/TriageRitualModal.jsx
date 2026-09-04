import React, { useState, useEffect } from 'react';
import { Moon, X } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { TriageCard } from './TriageCard';
import { InboxZeroZenView } from './InboxZeroZenView';

export function TriageRitualModal() {
  const {
    isTriageOpen,
    setIsTriageOpen,
    inbox,
    convertToTask,
    convertToHabit,
    archiveToVault,
    deleteThought,
    completeEveningTriage,
  } = useQuickCapture();

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isTriageOpen) {
      setCurrentIndex(0);
    }
  }, [isTriageOpen]);

  // Keyboard navigation inside triage
  useEffect(() => {
    if (!isTriageOpen) return;

    function handleTriageHotkeys(e) {
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      if (isInput) return;

      const currentItem = inbox[currentIndex];
      if (!currentItem) return;

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        convertToTask(currentItem, 'tomorrow');
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        convertToHabit(currentItem);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        archiveToVault(currentItem);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'Backspace') {
        e.preventDefault();
        deleteThought(currentItem.id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsTriageOpen(false);
      }
    }

    window.addEventListener('keydown', handleTriageHotkeys);
    return () => window.removeEventListener('keydown', handleTriageHotkeys);
  }, [isTriageOpen, inbox, currentIndex]);

  if (!isTriageOpen) return null;

  const currentItem = inbox[currentIndex];
  const isComplete = inbox.length === 0 || !currentItem;

  const handleSkip = () => {
    if (currentIndex < inbox.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleFinish = () => {
    completeEveningTriage();
    setIsTriageOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in"
      onClick={() => setIsTriageOpen(false)}
    >
      {/* Top Banner Navigation */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-slate-300 font-semibold text-sm">
        <Moon className="w-5 h-5 text-indigo-400" />
        <span>2-Minute Nightly Triage Ritual</span>
      </div>

      <button
        type="button"
        onClick={() => setIsTriageOpen(false)}
        className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center">
        {isComplete ? (
          <InboxZeroZenView onClose={handleFinish} />
        ) : (
          <TriageCard
            item={currentItem}
            index={currentIndex}
            total={inbox.length}
            onConvertToTask={(item, opt) => convertToTask(item, opt)}
            onConvertToHabit={(item) => convertToHabit(item)}
            onArchiveToVault={(item) => archiveToVault(item)}
            onDiscard={(id) => deleteThought(id)}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  );
}
