import { useEffect } from 'react';

export function useHabitHotkeys({ onNewHabit, onToggleHabitByIndex, onToggleTheme }) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore when user is typing in form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewHabit?.();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onToggleTheme?.();
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        onToggleHabitByIndex?.(index);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewHabit, onToggleHabitByIndex, onToggleTheme]);
}
