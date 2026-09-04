import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../types/capture';
import { STARTER_INBOX_ITEMS, STARTER_VAULT_ITEMS, DEFAULT_TRIAGE_STATS } from '../utils/starterData';
import { parseSmartCapture } from '../utils/smartParser';
import { playCaptureSound, playShredSound, playCelebrationChime } from '../utils/soundFeedback';

const QuickCaptureContext = createContext(null);

export function QuickCaptureProvider({ children }) {
  const [inbox, setInbox] = useLocalStorage(STORAGE_KEYS.INBOX, STARTER_INBOX_ITEMS);
  const [vault, setVault] = useLocalStorage(STORAGE_KEYS.VAULT, STARTER_VAULT_ITEMS);
  const [stats, setStats] = useLocalStorage(STORAGE_KEYS.STATS, DEFAULT_TRIAGE_STATS);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'dark');

  // Add new captured thought
  const addThought = (rawText) => {
    if (!rawText || !rawText.trim()) return;
    const parsed = parseSmartCapture(rawText);
    const newItem = {
      id: 'inbox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...parsed,
      createdAt: new Date().toISOString(),
    };
    setInbox(prev => [newItem, ...prev]);
    playCaptureSound();
    return newItem;
  };

  // Inline edit an inbox item
  const updateThought = (id, updatedFields) => {
    setInbox(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  // Delete an inbox item
  const deleteThought = (id) => {
    setInbox(prev => prev.filter(item => item.id !== id));
    playShredSound();
  };

  // Convert thought to task (syncs with dashboard & calendar)
  const convertToTask = (item, dateOption = 'today') => {
    const todayStr = new Date().toISOString().split('T')[0];
    let scheduledDate = todayStr;

    if (dateOption === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduledDate = tomorrow.toISOString().split('T')[0];
    } else if (dateOption === 'weekend') {
      const d = new Date();
      const day = d.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      scheduledDate = d.toISOString().split('T')[0];
    } else if (dateOption === 'nextweek') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      scheduledDate = d.toISOString().split('T')[0];
    }

    // Save into localStorage for calendar tasks
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.CALENDAR_TASKS) || '[]');
      const newTask = {
        id: 'task_' + Date.now(),
        title: item.cleanText || item.rawText,
        date: scheduledDate,
        category: item.category || 'work',
        priority: item.priority || 'medium',
        completed: false,
        source: 'brain_dump',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.CALENDAR_TASKS, JSON.stringify([...existing, newTask]));
    } catch (_) {}

    // Remove from inbox
    setInbox(prev => prev.filter(i => i.id !== item.id));
    recordTriageItemProcessed();
    playCaptureSound();
  };

  // Convert thought to habit
  const convertToHabit = (item) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
      const newHabit = {
        id: 'habit_' + Date.now(),
        title: item.cleanText || item.rawText,
        type: 'binary',
        frequency: 'daily',
        category: item.category || 'health',
        streak: 0,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify([...existing, newHabit]));
    } catch (_) {}

    setInbox(prev => prev.filter(i => i.id !== item.id));
    recordTriageItemProcessed();
    playCaptureSound();
  };

  // Archive thought to Notes Vault
  const archiveToVault = (item) => {
    const newNote = {
      id: 'vault_' + Date.now(),
      title: item.cleanText.slice(0, 48) || 'Captured Idea',
      content: item.cleanText || item.rawText,
      category: item.category || 'general',
      tags: item.tags || [],
      archivedAt: new Date().toISOString(),
    };
    setVault(prev => [newNote, ...prev]);
    setInbox(prev => prev.filter(i => i.id !== item.id));
    recordTriageItemProcessed();
    playCaptureSound();
  };

  // Record stats & streak when items are triaged
  const recordTriageItemProcessed = () => {
    setStats(prev => ({
      ...prev,
      totalProcessed: (prev.totalProcessed || 0) + 1,
    }));
  };

  // Complete evening triage (Inbox Zero)
  const completeEveningTriage = () => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const isConsecutive = prev.lastTriageDate !== today;
      return {
        ...prev,
        streak: isConsecutive ? (prev.streak || 0) + 1 : prev.streak,
        lastTriageDate: today,
      };
    });
    playCelebrationChime();
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <QuickCaptureContext.Provider
      value={{
        inbox,
        vault,
        stats,
        isCaptureOpen,
        setIsCaptureOpen,
        isTriageOpen,
        setIsTriageOpen,
        isDrawerOpen,
        setIsDrawerOpen,
        isVaultOpen,
        setIsVaultOpen,
        theme,
        toggleTheme,
        addThought,
        updateThought,
        deleteThought,
        convertToTask,
        convertToHabit,
        archiveToVault,
        completeEveningTriage,
      }}
    >
      {children}
    </QuickCaptureContext.Provider>
  );
}

export function useQuickCapture() {
  const ctx = useContext(QuickCaptureContext);
  if (!ctx) {
    throw new Error('useQuickCapture must be used within QuickCaptureProvider');
  }
  return ctx;
}
