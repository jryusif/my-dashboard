import React, { useState, useEffect } from 'react';
import { HabitProvider, useHabits } from './context/HabitContext.jsx';
import { Header } from './components/layout/Header.jsx';
import { TimeSection } from './components/layout/TimeSection.jsx';
import { NeverMissTwiceBanner } from './components/alerts/NeverMissTwiceBanner.jsx';
import { GamificationBar } from './components/gamification/GamificationBar.jsx';
import { HealthScore } from './components/analytics/HealthScore.jsx';
import { Heatmap } from './components/analytics/Heatmap.jsx';
import { HabitModal } from './components/habits/HabitModal.jsx';
import { TimerModal } from './components/habits/TimerModal.jsx';
import { RelapseModal } from './components/habits/RelapseModal.jsx';
import { MoodReflectionModal } from './components/habits/MoodReflectionModal.jsx';
import { BadgesModal } from './components/gamification/BadgesModal.jsx';
import { PrintableSheet } from './components/print/PrintableSheet.jsx';
import { useHabitHotkeys } from './hooks/useHabitHotkeys.js';
import { TIME_OF_DAY } from './types/habit.js';

function HabitTrackerInner({ darkMode, setDarkMode }) {
  const { habits, logs, selectedDate, toggleHabit, setIsHabitModalOpen, setEditingHabit } = useHabits();

  // Keyboard Hotkeys
  useHabitHotkeys({
    onNewHabit: () => {
      setEditingHabit(null);
      setIsHabitModalOpen(true);
    },
    onToggleTheme: () => setDarkMode(prev => !prev),
    onToggleHabitByIndex: (index) => {
      if (habits[index]) {
        toggleHabit(habits[index].id, selectedDate);
      }
    },
  });

  // Group habits by Time of Day
  const morningHabits = habits.filter(h => h.timeOfDay === TIME_OF_DAY.MORNING);
  const afternoonHabits = habits.filter(h => h.timeOfDay === TIME_OF_DAY.AFTERNOON);
  const eveningHabits = habits.filter(h => h.timeOfDay === TIME_OF_DAY.EVENING);
  const anytimeHabits = habits.filter(h => !h.timeOfDay || h.timeOfDay === TIME_OF_DAY.ANYTIME);

  return (
    <div className="min-h-screen pb-16">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        
        {/* Behavioral Psychology: Never Miss Twice Banner */}
        <NeverMissTwiceBanner />

        {/* Gamification Bar */}
        <GamificationBar />

        {/* Consistency Index & Health Score */}
        <HealthScore />

        {/* Routine Time Sections */}
        <div className="space-y-2">
          <TimeSection slot="morning" habits={morningHabits} logs={logs} selectedDate={selectedDate} />
          <TimeSection slot="afternoon" habits={afternoonHabits} logs={logs} selectedDate={selectedDate} />
          <TimeSection slot="evening" habits={eveningHabits} logs={logs} selectedDate={selectedDate} />
          <TimeSection slot="anytime" habits={anytimeHabits} logs={logs} selectedDate={selectedDate} />
        </div>

        {/* GitHub Style Heatmap Matrix */}
        <Heatmap />
      </main>

      {/* Modals & Dialogs */}
      <HabitModal />
      <TimerModal />
      <RelapseModal />
      <MoodReflectionModal />
      <BadgesModal />
      <PrintableSheet />
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  return (
    <HabitProvider>
      <HabitTrackerInner darkMode={darkMode} setDarkMode={setDarkMode} />
    </HabitProvider>
  );
}
