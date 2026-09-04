import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { STARTER_HABITS, generateStarterLogs } from '../utils/starterHabits.js';
import { formatDateKey, calculateLevel } from '../utils/habitMath.js';
import { playCompletionChime, playStepperTick, playLevelUpFanfare } from '../utils/soundEffects.js';
import { XP_CONFIG, BADGES_LIST } from '../types/habit.js';

const HabitContext = createContext(null);

export function HabitProvider({ children }) {
  const [habits, setHabits] = useLocalStorage('antigravity_habits', STARTER_HABITS);
  const [logs, setLogs] = useLocalStorage('antigravity_habit_logs', generateStarterLogs);
  const [gamification, setGamification] = useLocalStorage('antigravity_habit_gamification', {
    xp: 285,
    level: 3,
    freezeTokens: 1,
    unlockedBadges: ['first_step', 'streak_3', 'ice_shield'],
  });

  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [activeTimerHabit, setActiveTimerHabit] = useState(null);
  const [activeRelapseHabit, setActiveRelapseHabit] = useState(null);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Gamification & Level Helper
  function awardXp(amount, reason = '') {
    setGamification(prev => {
      const newXp = (prev.xp || 0) + amount;
      const { level: newLevel } = calculateLevel(newXp);
      const leveledUp = newLevel > (prev.level || 1);

      if (leveledUp) {
        playLevelUpFanfare();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      // Check for first_step badge
      const badges = [...(prev.unlockedBadges || [])];
      if (!badges.includes('first_step')) {
        badges.push('first_step');
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        unlockedBadges: badges,
      };
    });
  }

  // Toggle Binary or Break Habit
  function toggleHabit(habitId, dateKey = selectedDate) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    setLogs(prev => {
      const dayLogs = { ...(prev[dateKey] || {}) };
      const currentEntry = dayLogs[habitId] || { completed: false };
      const nextCompleted = !currentEntry.completed;

      dayLogs[habitId] = {
        ...currentEntry,
        completed: nextCompleted,
      };

      if (nextCompleted) {
        playCompletionChime();
        awardXp(XP_CONFIG.PER_COMPLETION, `Completed ${habit.title}`);

        // Check if all active habits for this date are completed
        const activeHabits = habits.filter(h => h.type !== 'break');
        const allDone = activeHabits.every(h => h.id === habitId ? true : dayLogs[h.id]?.completed);
        if (allDone && activeHabits.length > 0) {
          awardXp(XP_CONFIG.FLAWLESS_DAY, 'Flawless Day!');
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.65 },
          });
        }
      }

      return {
        ...prev,
        [dateKey]: dayLogs,
      };
    });
  }

  // Increment or Decrement Measurable Habit
  function updateMeasurable(habitId, delta, dateKey = selectedDate) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    setLogs(prev => {
      const dayLogs = { ...(prev[dateKey] || {}) };
      const currentEntry = dayLogs[habitId] || { completed: false, currentValue: 0 };
      const currentVal = currentEntry.currentValue || 0;
      const target = habit.targetValue || 100;
      const step = habit.stepIncrement || 1;

      const nextVal = Math.max(0, currentVal + delta * step);
      const isCompleted = nextVal >= target;

      dayLogs[habitId] = {
        ...currentEntry,
        currentValue: nextVal,
        completed: isCompleted,
      };

      if (delta > 0) {
        playStepperTick();
        awardXp(XP_CONFIG.PER_STEPPER, `Logged ${habit.title}`);
        if (isCompleted && !currentEntry.completed) {
          playCompletionChime();
          awardXp(XP_CONFIG.PER_COMPLETION, `Reached goal for ${habit.title}`);
        }
      }

      return {
        ...prev,
        [dateKey]: dayLogs,
      };
    });
  }

  // Log elapsed duration for Timer habits
  function logDuration(habitId, minutes, dateKey = selectedDate) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    setLogs(prev => {
      const dayLogs = { ...(prev[dateKey] || {}) };
      const currentEntry = dayLogs[habitId] || { completed: false, elapsedMinutes: 0 };
      const currentMinutes = currentEntry.elapsedMinutes || 0;
      const nextMinutes = currentMinutes + minutes;
      const isCompleted = nextMinutes >= (habit.targetMinutes || 25);

      dayLogs[habitId] = {
        ...currentEntry,
        elapsedMinutes: nextMinutes,
        completed: isCompleted,
      };

      playCompletionChime();
      awardXp(XP_CONFIG.POMODORO_COMPLETED, `Focus session for ${habit.title}`);

      return {
        ...prev,
        [dateKey]: dayLogs,
      };
    });
  }

  // Relapse Logger for Break habits
  function logRelapse(habitId, note = '') {
    const nowIso = new Date().toISOString();
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          lastRelapseDate: nowIso,
          relapseHistory: [...(h.relapseHistory || []), { date: nowIso, note }],
        };
      }
      return h;
    }));
  }

  // Daily reflection & mood
  function saveReflection(mood, note, dateKey = selectedDate) {
    setLogs(prev => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        _reflections: { mood, note, loggedAt: new Date().toISOString() },
      },
    }));
    awardXp(10, 'Daily reflection');
  }

  // Habit CRUD
  function addHabit(newHabit) {
    const habit = {
      id: 'habit_' + Date.now(),
      createdAt: new Date().toISOString(),
      longestStreak: 0,
      ...newHabit,
    };
    setHabits(prev => [...prev, habit]);
  }

  function editHabit(id, updatedFields) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updatedFields } : h));
  }

  function deleteHabit(id) {
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        gamification,
        selectedDate,
        setSelectedDate,
        activeTimerHabit,
        setActiveTimerHabit,
        activeRelapseHabit,
        setActiveRelapseHabit,
        isHabitModalOpen,
        setIsHabitModalOpen,
        editingHabit,
        setEditingHabit,
        isBadgesModalOpen,
        setIsBadgesModalOpen,
        isMoodModalOpen,
        setIsMoodModalOpen,
        isPrintModalOpen,
        setIsPrintModalOpen,
        toggleHabit,
        updateMeasurable,
        logDuration,
        logRelapse,
        saveReflection,
        addHabit,
        editHabit,
        deleteHabit,
        awardXp,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within a HabitProvider');
  return ctx;
}
