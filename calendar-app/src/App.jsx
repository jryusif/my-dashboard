import React from 'react';
import { useCalendar } from './context/CalendarContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { FilterBar } from './components/widgets/FilterBar';
import { StatsWidget } from './components/widgets/StatsWidget';
import { MonthView } from './components/calendar/MonthView';
import { WeekView } from './components/calendar/WeekView';
import { DayView } from './components/calendar/DayView';
import { TaskModal } from './components/tasks/TaskModal';
import { ExportImportModal } from './components/modals/ExportImportModal';

export const AppContent = () => {
  const {
    currentView,
    setCurrentView,
    isTaskModalOpen,
    editingTask,
    initialTaskDate,
    closeTaskModal,
    openNewTaskModal,
    addTask,
    updateTask,
    deleteTask,
    isExportModalOpen,
    setIsExportModalOpen,
    isStatsOpen,
    goToToday,
    goToPrev,
    goToNext,
  } = useCalendar();

  // Global Hotkeys
  useKeyboardShortcuts({
    onToday: goToToday,
    onPrev: goToPrev,
    onNext: goToNext,
    onNewTask: () => openNewTaskModal(),
    onFocusSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search tasks"]');
      searchInput?.focus();
    },
    onSetView: (view) => setCurrentView(view),
    onCloseModals: () => {
      closeTaskModal();
      setIsExportModalOpen(false);
    },
  });

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Header />

      {/* Main Workspace: Sidebar + Calendar Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Calendar Workspace */}
        <main className="flex-1 flex flex-col min-w-0 p-3 md:p-4 gap-3 overflow-hidden">
          {/* Top Filter Bar */}
          <FilterBar />

          {/* Conditional Stats Banner if toggled on top for quick view on smaller screens */}
          {isStatsOpen && (
            <div className="animate-pop-in">
              <StatsWidget />
            </div>
          )}

          {/* Calendar Views */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {currentView === 'month' && <MonthView />}
            {currentView === 'week' && <WeekView />}
            {currentView === 'day' && <DayView />}
          </div>
        </main>
      </div>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        onDelete={deleteTask}
        initialDate={initialTaskDate}
        taskToEdit={editingTask}
      />

      {/* Backup & Sync Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
