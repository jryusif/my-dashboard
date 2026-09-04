import { useEffect } from 'react';

/**
 * Hook to handle global application hotkeys
 */
export function useKeyboardShortcuts({
  onToday,
  onPrev,
  onNext,
  onNewTask,
  onFocusSearch,
  onSetView,
  onCloseModals,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if focus is in an input or textarea
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      if (e.key === 'Escape') {
        onCloseModals?.();
        return;
      }

      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case 't':
          e.preventDefault();
          onToday?.();
          break;
        case 'n':
          e.preventDefault();
          onNewTask?.();
          break;
        case 'f':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case 'arrowleft':
          e.preventDefault();
          onPrev?.();
          break;
        case 'arrowright':
          e.preventDefault();
          onNext?.();
          break;
        case '1':
          e.preventDefault();
          onSetView?.('month');
          break;
        case '2':
          e.preventDefault();
          onSetView?.('week');
          break;
        case '3':
          e.preventDefault();
          onSetView?.('day');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToday, onPrev, onNext, onNewTask, onFocusSearch, onSetView, onCloseModals]);
}
