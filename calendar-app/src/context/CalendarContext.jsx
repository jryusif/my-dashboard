import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getStarterTasks } from '../utils/starterData';
import { spawnNextRecurringTask } from '../utils/recurrence';
import { formatDateKey, isTaskOverdue } from '../utils/dateUtils';

const CalendarContext = createContext(null);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }) => {
  // 1. Data persistence
  const [tasks, setTasks] = useLocalStorage('antigravity_calendar_tasks', getStarterTasks);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('antigravity_calendar_theme_dark', true);

  // 2. Navigation & Views
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [currentView, setCurrentView] = useState('month'); // 'month' | 'week' | 'day'

  // 3. Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'completed' | 'overdue'

  // 4. Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialTaskDate, setInitialTaskDate] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Synchronize HTML dark class with isDarkMode
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Task Mutations
  const addTask = (taskData) => {
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: [],
      ...taskData,
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Toggle complete with recurrence engine
  const toggleTaskComplete = (id) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;

      const target = prev[taskIndex];
      const willBeCompleted = !target.completed;
      const updatedTarget = {
        ...target,
        completed: willBeCompleted,
        completedAt: willBeCompleted ? new Date().toISOString() : null,
      };

      const updatedList = [...prev];
      updatedList[taskIndex] = updatedTarget;

      // If marked complete and recurring, spawn the next occurrence
      if (willBeCompleted && target.recurrence && target.recurrence !== 'none') {
        const nextOccurrence = spawnNextRecurringTask(target);
        if (nextOccurrence) {
          updatedList.unshift(nextOccurrence);
        }
      }

      return updatedList;
    });
  };

  // Subtask toggle
  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const subtasks = (t.subtasks || []).map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      // If all subtasks are done, keep task state or let user check manually
      return { ...t, subtasks };
    }));
  };

  // Move task date (Drag and drop)
  const moveTaskDate = (taskId, newDateKey) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, date: newDateKey } : t));
  };

  // Modal openers
  const openNewTaskModal = (initialDate = '') => {
    setEditingTask(null);
    setInitialTaskDate(initialDate || formatDateKey(activeDate));
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setInitialTaskDate(task.date);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Navigation helpers
  const goToToday = () => {
    setActiveDate(new Date());
  };

  const goToPrev = () => {
    setActiveDate(prev => {
      const d = new Date(prev);
      if (currentView === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (currentView === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const goToNext = () => {
    setActiveDate(prev => {
      const d = new Date(prev);
      if (currentView === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (currentView === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const jumpToMonthYear = (year, month) => {
    setActiveDate(new Date(year, month, 1));
  };

  // Filtered task calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Live search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchSubtasks = (task.subtasks || []).some(st => (st.title || '').toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSubtasks) return false;
      }

      // 2. Category
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Priority
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // 4. Status
      if (selectedStatus === 'completed' && !task.completed) return false;
      if (selectedStatus === 'pending' && task.completed) return false;
      if (selectedStatus === 'overdue') {
        if (!isTaskOverdue(task)) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedCategory, selectedPriority, selectedStatus]);

  // Tasks grouped by date key YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = {};
    filteredTasks.forEach(task => {
      const key = task.date;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(task);
    });
    // Sort tasks by time within each date
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });
    return map;
  }, [filteredTasks]);

  // Productivity stats for active month
  const stats = useMemo(() => {
    const currentYear = activeDate.getFullYear();
    const currentMonth = activeDate.getMonth();

    // Tasks in active month
    const monthTasks = tasks.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split('-').map(Number);
      return y === currentYear && (m - 1) === currentMonth;
    });

    const total = monthTasks.length;
    const completed = monthTasks.filter(t => t.completed).length;
    const overdue = monthTasks.filter(t => isTaskOverdue(t)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate daily streak (consecutive days leading up to today with at least 1 completed task)
    let streak = 0;
    const checkDate = new Date();
    // Check up to 60 days back
    for (let i = 0; i < 60; i++) {
      const key = formatDateKey(checkDate);
      const hasCompleted = tasks.some(t => t.date === key && t.completed);
      if (hasCompleted) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no completed task yet, don't break streak if yesterday did
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    const highPriority = monthTasks.filter(t => t.priority === 'high').length;
    const mediumPriority = monthTasks.filter(t => t.priority === 'medium').length;
    const lowPriority = monthTasks.filter(t => t.priority === 'low').length;

    return {
      total,
      completed,
      overdue,
      completionRate,
      streak,
      highPriority,
      mediumPriority,
      lowPriority,
    };
  }, [tasks, activeDate]);

  const value = {
    tasks,
    setTasks,
    filteredTasks,
    tasksByDate,
    activeDate,
    setActiveDate,
    currentView,
    setCurrentView,
    isDarkMode,
    setIsDarkMode,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    isTaskModalOpen,
    editingTask,
    initialTaskDate,
    isExportModalOpen,
    setIsExportModalOpen,
    isStatsOpen,
    setIsStatsOpen,
    openNewTaskModal,
    openEditTaskModal,
    closeTaskModal,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubtask,
    moveTaskDate,
    goToToday,
    goToPrev,
    goToNext,
    jumpToMonthYear,
    stats,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
