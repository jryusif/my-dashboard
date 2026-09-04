import { useEffect } from 'react';

export function useGlobalHotkeys({
  onToggleCapture,
  onCloseModals,
  onStartTriage,
  onToggleDrawer,
  onToggleTheme,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      // Ctrl + Space or Cmd + Space (Universal Quick Capture)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        onToggleCapture?.();
        return;
      }

      // Esc closes modals
      if (e.key === 'Escape') {
        onCloseModals?.();
        return;
      }

      // Don't trigger single-letter hotkeys when typing in form controls
      if (isInput) return;

      if (e.key === 't' || e.key === 'T') {
        onStartTriage?.();
      } else if (e.key === 'i' || e.key === 'I') {
        onToggleDrawer?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCapture, onCloseModals, onStartTriage, onToggleDrawer, onToggleTheme]);
}
