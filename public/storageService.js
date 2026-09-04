/**
 * =============================================================================
 * 🛡️ SOVEREIGN LOCAL-FIRST STORAGE SERVICE & REPOSITORY LAYER
 * =============================================================================
 * Architecture Principles:
 * 1. Instant Local Reads & Writes (0ms latency, localStorage/IndexedDB source of truth)
 * 2. Cloud-Ready Schema: id (UUID), created_at, updated_at, deleted_at (soft-delete), sync_status
 * 3. 100% Offline-First: never blocks UI with spinners or network dependencies
 * 4. Plug-and-Play Cloud Adapter: clean separation for future Supabase / Firebase / Neon sync
 * 5. Universal Data Ownership: 1-click Export & Import of all dashboard datasets
 * =============================================================================
 */

(function (window) {
  'use strict';

  // ── UUID Generator with Fallback ──
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ── Storage Keys ──
  const STORAGE_KEYS = {
    TASKS: 'antigravity_calendar_tasks',
    HABITS: 'antigravity_habits',
    INBOX: 'antigravity_inbox_items',
    VAULT: 'antigravity_notes_vault',
    SETTINGS: 'antigravity_settings_cache',
    SYNC_META: 'antigravity_sync_metadata',
  };

  // ── Event Bus for Reactive UI Updates ──
  const listeners = new Set();
  function notifyChange(entityType, action, item) {
    listeners.forEach((fn) => {
      try {
        fn({ entityType, action, item, timestamp: new Date().toISOString() });
      } catch (err) {
        console.warn('[StorageService] Listener error:', err);
      }
    });
  }

  // ── Safe LocalStorage Wrappers ──
  function readRaw(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data);
    } catch (e) {
      console.warn(`[StorageService] Failed to read ${key}:`, e);
      return fallback;
    }
  }

  function writeRaw(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[StorageService] Failed to write ${key}:`, e);
      return false;
    }
  }

  // ── Cloud-Ready Schema Normalizer ──
  function normalizeRecord(item, defaultValues = {}) {
    const now = new Date().toISOString();
    return {
      id: item.id || generateUUID(),
      created_at: item.created_at || item.createdAt || now,
      updated_at: item.updated_at || item.updatedAt || now,
      deleted_at: item.deleted_at !== undefined ? item.deleted_at : null,
      sync_status: item.sync_status || 'pending_sync',
      ...defaultValues,
      ...item,
    };
  }

  // ── Tasks Starter Seed ──
  function getStarterTasks() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Tomorrow date key
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return [
      {
        id: generateUUID(),
        title: 'Morning Clinical & Deep Work Sprint',
        description: 'Review morning schedule, prioritize top 3 high-impact tasks and focus blocks.',
        date: todayStr,
        time: '08:30',
        category: 'Work',
        priority: 'high',
        completed: false,
        completed_at: null,
        recurrence: 'weekdays',
        subtasks: [
          { id: generateUUID(), title: 'Clear zero-inbox triage items', completed: true },
          { id: generateUUID(), title: 'Prepare clinical case review notes', completed: false },
          { id: generateUUID(), title: 'Confirm afternoon appointments', completed: false }
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        deleted_at: null,
        sync_status: 'synced',
      },
      {
        id: generateUUID(),
        title: 'Weekly Wealth & Cash Reserves Review',
        description: 'Inspect liquid balances, live gold bullion rates, and update portfolio allocations.',
        date: todayStr,
        time: '14:00',
        category: 'Finance',
        priority: 'medium',
        completed: false,
        completed_at: null,
        recurrence: 'weekly',
        subtasks: [
          { id: generateUUID(), title: 'Log cash baseline changes', completed: false },
          { id: generateUUID(), title: 'Review live gold valuation metrics', completed: false }
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        deleted_at: null,
        sync_status: 'synced',
      },
      {
        id: generateUUID(),
        title: 'High-Performance Cardio & Mobility Routine',
        description: 'Zone 2 running session followed by full-body mobility stretching.',
        date: tomorrowStr,
        time: '18:00',
        category: 'Health',
        priority: 'medium',
        completed: false,
        completed_at: null,
        recurrence: 'daily',
        subtasks: [
          { id: generateUUID(), title: '30 min Zone 2 endurance', completed: false },
          { id: generateUUID(), title: '15 min hip and spine mobility', completed: false }
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        deleted_at: null,
        sync_status: 'synced',
      }
    ];
  }

  // ===========================================================================
  // 1. TASKS REPOSITORY (LOCAL-FIRST)
  // ===========================================================================
  const TasksRepository = {
    getAll(includeDeleted = false) {
      const raw = readRaw(STORAGE_KEYS.TASKS, null);
      if (!raw || !Array.isArray(raw) || raw.length === 0) {
        const seeded = getStarterTasks();
        writeRaw(STORAGE_KEYS.TASKS, seeded);
        return seeded;
      }
      // Normalize schema in case older records exist
      const normalized = raw.map(t => normalizeRecord(t, {
        title: 'Untitled Task',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        category: 'Work',
        priority: 'medium',
        completed: false,
        completed_at: null,
        recurrence: 'none',
        subtasks: [],
      }));

      if (includeDeleted) return normalized;
      return normalized.filter(t => t.deleted_at === null);
    },

    getById(id) {
      const tasks = this.getAll(true);
      return tasks.find(t => t.id === id) || null;
    },

    create(taskData) {
      const now = new Date().toISOString();
      const newTask = normalizeRecord({
        id: generateUUID(),
        title: (taskData.title || taskData.task || '').trim() || 'Untitled Task',
        description: taskData.description || '',
        date: taskData.date || taskData.dueDate || now.split('T')[0],
        time: taskData.time || '10:00',
        category: taskData.category || 'Work',
        priority: (taskData.priority || 'medium').toLowerCase(),
        completed: Boolean(taskData.completed),
        completed_at: taskData.completed ? now : null,
        recurrence: taskData.recurrence || 'none',
        subtasks: Array.isArray(taskData.subtasks)
          ? taskData.subtasks.map(st => ({
              id: st.id || generateUUID(),
              title: (st.title || '').trim(),
              completed: Boolean(st.completed),
            }))
          : [],
        created_at: now,
        updated_at: now,
        deleted_at: null,
        sync_status: 'pending_sync',
      });

      const current = readRaw(STORAGE_KEYS.TASKS, []);
      const updated = [newTask, ...current];
      writeRaw(STORAGE_KEYS.TASKS, updated);

      notifyChange('tasks', 'create', newTask);
      return newTask;
    },

    update(id, partialUpdates) {
      const current = readRaw(STORAGE_KEYS.TASKS, []);
      const now = new Date().toISOString();
      let updatedItem = null;

      const updated = current.map(item => {
        if (item.id === id) {
          updatedItem = normalizeRecord({
            ...item,
            ...partialUpdates,
            updated_at: now,
            sync_status: 'pending_sync',
          });
          return updatedItem;
        }
        return item;
      });

      if (updatedItem) {
        writeRaw(STORAGE_KEYS.TASKS, updated);
        notifyChange('tasks', 'update', updatedItem);
      }
      return updatedItem;
    },

    toggleComplete(id) {
      const task = this.getById(id);
      if (!task) return null;

      const willBeCompleted = !task.completed;
      const now = new Date().toISOString();

      let updates = {
        completed: willBeCompleted,
        completed_at: willBeCompleted ? now : null,
      };

      const result = this.update(id, updates);

      // Recurrence Auto-Spawn on Completion
      if (willBeCompleted && task.recurrence && task.recurrence !== 'none') {
        const nextDate = TasksRepository.computeNextRecurrenceDate(task.date, task.recurrence);
        if (nextDate) {
          const nextTask = this.create({
            title: task.title,
            description: task.description,
            date: nextDate,
            time: task.time,
            category: task.category,
            priority: task.priority,
            recurrence: task.recurrence,
            completed: false,
            subtasks: (task.subtasks || []).map(st => ({
              id: generateUUID(),
              title: st.title,
              completed: false,
            })),
          });
          notifyChange('tasks', 'recurrence_spawn', nextTask);
        }
      }

      return result;
    },

    delete(id, hardDelete = false) {
      const current = readRaw(STORAGE_KEYS.TASKS, []);
      const now = new Date().toISOString();
      let deletedItem = null;

      if (hardDelete) {
        const filtered = current.filter(t => t.id !== id);
        writeRaw(STORAGE_KEYS.TASKS, filtered);
        notifyChange('tasks', 'delete', { id });
        return true;
      }

      // Soft delete: sets deleted_at timestamp
      const updated = current.map(item => {
        if (item.id === id) {
          deletedItem = normalizeRecord({
            ...item,
            deleted_at: now,
            updated_at: now,
            sync_status: 'pending_sync',
          });
          return deletedItem;
        }
        return item;
      });

      writeRaw(STORAGE_KEYS.TASKS, updated);
      notifyChange('tasks', 'soft_delete', deletedItem);
      return true;
    },

    computeNextRecurrenceDate(currentDateStr, recurrence) {
      if (!currentDateStr) return null;
      const [y, m, d] = currentDateStr.split('-').map(Number);
      const current = new Date(y, m - 1, d);
      const next = new Date(current);

      switch (recurrence) {
        case 'daily':
          next.setDate(current.getDate() + 1);
          break;
        case 'weekdays': {
          const day = current.getDay(); // 0=Sun, 5=Fri, 6=Sat
          if (day === 5) next.setDate(current.getDate() + 3); // Fri -> Mon
          else if (day === 6) next.setDate(current.getDate() + 2); // Sat -> Mon
          else next.setDate(current.getDate() + 1);
          break;
        }
        case 'weekly':
          next.setDate(current.getDate() + 7);
          break;
        case 'monthly': {
          const originalDay = current.getDate();
          next.setMonth(current.getMonth() + 1);
          if (next.getDate() !== originalDay) {
            next.setDate(0); // clamp to end of month
          }
          break;
        }
        default:
          return null;
      }

      const ny = next.getFullYear();
      const nm = String(next.getMonth() + 1).padStart(2, '0');
      const nd = String(next.getDate()).padStart(2, '0');
      return `${ny}-${nm}-${nd}`;
    },
  };

  // ===========================================================================
  // 2. UNIVERSAL DATA OWNERSHIP: 1-CLICK EXPORT & IMPORT ENGINE
  // ===========================================================================
  function exportAllDataToJson() {
    const timestamp = new Date().toISOString().split('T')[0];
    const exportBundle = {
      meta: {
        app: 'My Personal Dashboard & Smart Calendar OS',
        version: '2.0-localfirst',
        exported_at: new Date().toISOString(),
        format: 'antigravity-unified-backup',
      },
      datasets: {
        tasks: TasksRepository.getAll(true),
        habits: readRaw(STORAGE_KEYS.HABITS, []),
        inbox: readRaw(STORAGE_KEYS.INBOX, []),
        vault: readRaw(STORAGE_KEYS.VAULT, []),
        settings: readRaw(STORAGE_KEYS.SETTINGS, {}),
      },
    };

    const jsonString = JSON.stringify(exportBundle, null, 2);
    downloadFile(jsonString, `dashboard-backup-full-${timestamp}.json`, 'application/json');
  }

  function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importAllDataFromJson(jsonString, mode = 'merge') {
    try {
      const bundle = JSON.parse(jsonString);
      if (!bundle || typeof bundle !== 'object') {
        throw new Error('Invalid JSON format.');
      }

      // Check format (support direct tasks array or full dashboard bundle)
      let importedTasks = [];
      let importedHabits = [];
      let importedInbox = [];
      let importedVault = [];

      if (Array.isArray(bundle)) {
        // Direct tasks array format
        importedTasks = bundle;
      } else if (bundle.datasets) {
        // Unified dashboard bundle
        importedTasks = bundle.datasets.tasks || [];
        importedHabits = bundle.datasets.habits || [];
        importedInbox = bundle.datasets.inbox || [];
        importedVault = bundle.datasets.vault || [];
      } else if (bundle.tasks) {
        importedTasks = bundle.tasks;
      }

      // 1. Process Tasks
      if (Array.isArray(importedTasks) && importedTasks.length > 0) {
        const normalized = importedTasks.map(t => normalizeRecord(t));
        if (mode === 'replace') {
          writeRaw(STORAGE_KEYS.TASKS, normalized);
        } else {
          // Merge by ID
          const existing = readRaw(STORAGE_KEYS.TASKS, []);
          const existingMap = new Map(existing.map(t => [t.id, t]));
          normalized.forEach(t => existingMap.set(t.id, t));
          writeRaw(STORAGE_KEYS.TASKS, Array.from(existingMap.values()));
        }
        notifyChange('tasks', 'import', null);
      }

      // 2. Process Habits
      if (Array.isArray(importedHabits) && importedHabits.length > 0) {
        if (mode === 'replace') {
          writeRaw(STORAGE_KEYS.HABITS, importedHabits);
        } else {
          const existing = readRaw(STORAGE_KEYS.HABITS, []);
          const existingMap = new Map(existing.map(h => [h.id, h]));
          importedHabits.forEach(h => existingMap.set(h.id, h));
          writeRaw(STORAGE_KEYS.HABITS, Array.from(existingMap.values()));
        }
        notifyChange('habits', 'import', null);
      }

      // 3. Process Inbox
      if (Array.isArray(importedInbox) && importedInbox.length > 0) {
        if (mode === 'replace') {
          writeRaw(STORAGE_KEYS.INBOX, importedInbox);
        } else {
          const existing = readRaw(STORAGE_KEYS.INBOX, []);
          const existingMap = new Map(existing.map(i => [i.id, i]));
          importedInbox.forEach(i => existingMap.set(i.id, i));
          writeRaw(STORAGE_KEYS.INBOX, Array.from(existingMap.values()));
        }
        notifyChange('inbox', 'import', null);
      }

      // 4. Process Vault
      if (Array.isArray(importedVault) && importedVault.length > 0) {
        if (mode === 'replace') {
          writeRaw(STORAGE_KEYS.VAULT, importedVault);
        } else {
          const existing = readRaw(STORAGE_KEYS.VAULT, []);
          const existingMap = new Map(existing.map(v => [v.id, v]));
          importedVault.forEach(v => existingMap.set(v.id, v));
          writeRaw(STORAGE_KEYS.VAULT, Array.from(existingMap.values()));
        }
        notifyChange('vault', 'import', null);
      }

      return {
        success: true,
        tasksCount: importedTasks.length,
        habitsCount: importedHabits.length,
        inboxCount: importedInbox.length,
      };
    } catch (err) {
      console.error('[StorageService] Import error:', err);
      throw new Error('Failed to import backup: ' + err.message);
    }
  }

  // ===========================================================================
  // 3. RFC 5545 iCALENDAR (.ics) EXPORT ENGINE
  // ===========================================================================
  function exportTasksToIcal() {
    const tasks = TasksRepository.getAll(false);
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const events = tasks.map(task => {
      let startDate;
      if (task.date) {
        const [y, m, d] = task.date.split('-').map(Number);
        const [h, min] = (task.time || '09:00').split(':').map(Number);
        startDate = new Date(Date.UTC(y, m - 1, d, h || 9, min || 0, 0));
      } else {
        startDate = new Date();
      }
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

      const formatIcalDate = (dObj) => dObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const summary = (task.title || 'Untitled Task').replace(/\n/g, ' ');
      let description = (task.description || '').replace(/\n/g, '\\n');
      if (task.subtasks && task.subtasks.length > 0) {
        const checklist = task.subtasks.map(s => `[${s.completed ? 'x' : ' '}] ${s.title}`).join('\\n');
        description += `\\n\\nChecklist:\\n${checklist}`;
      }

      const priorityVal = task.priority === 'high' ? '1' : task.priority === 'medium' ? '5' : '9';
      const statusVal = task.completed ? 'COMPLETED' : 'NEEDS-ACTION';

      return [
        'BEGIN:VEVENT',
        `UID:${task.id}@personal-dashboard.app`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${formatIcalDate(startDate)}`,
        `DTEND:${formatIcalDate(endDate)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `STATUS:${statusVal}`,
        `PRIORITY:${priorityVal}`,
        `CATEGORIES:${(task.category || 'General').toUpperCase()}`,
        'END:VEVENT'
      ].join('\r\n');
    });

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sovereign Personal Dashboard//Smart Calendar OS//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(icalContent, `calendar-schedule-${timestamp}.ics`, 'text/calendar;charset=utf-8');
  }

  // ===========================================================================
  // 4. BACKGROUND CLOUD SYNC ADAPTER (OPPORTUNISTIC & NON-BLOCKING)
  // ===========================================================================
  let syncInProgress = false;

  async function syncWithCloud() {
    if (syncInProgress) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const token = localStorage.getItem('antigravity_token');
    if (!token) return; // Unauthenticated or offline: stays 100% local

    syncInProgress = true;
    try {
      // Find pending tasks to sync
      const allTasks = TasksRepository.getAll(true);
      const pendingTasks = allTasks.filter(t => t.sync_status === 'pending_sync');

      // 1. Push pending tasks to backend
      if (pendingTasks.length > 0) {
        for (const task of pendingTasks) {
          try {
            if (task.deleted_at) {
              await fetch(`/api/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              // Remove hard locally once synced deletion
              TasksRepository.delete(task.id, true);
            } else {
              const postRes = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  id: task.id,
                  title: task.title,
                  date: task.date,
                  timeBlock: task.time,
                  category: task.category,
                  priority: task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium',
                  completed: task.completed,
                })
              });
              if (postRes.ok) {
                TasksRepository.update(task.id, { sync_status: 'synced' });
              }
            }
          } catch (itemErr) {
            // Silently retain pending_sync for next opportunity
          }
        }
      }

      // 2. Pull remote tasks across all dates and reconcile
      const fetchRes = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        const serverTasks = data.tasks || [];
        if (Array.isArray(serverTasks)) {
          const localTasks = TasksRepository.getAll(true);
          const localMap = new Map(localTasks.map(t => [String(t.id), t]));

          serverTasks.forEach(st => {
            const match = localMap.get(String(st.id));
            if (!match) {
              TasksRepository.create({
                id: String(st.id),
                title: st.title || st.task || 'Untitled Task',
                date: st.date || st.dueDate,
                time: st.timeBlock || '10:00',
                category: st.category || 'Work',
                priority: (st.priority || 'medium').toLowerCase(),
                completed: Boolean(st.completed),
                sync_status: 'synced',
              });
            } else if (match.sync_status !== 'pending_sync') {
              if (
                match.completed !== Boolean(st.completed) ||
                match.title !== (st.title || st.task) ||
                match.date !== (st.date || st.dueDate) ||
                match.category !== (st.category || 'Work')
              ) {
                TasksRepository.update(match.id, {
                  completed: Boolean(st.completed),
                  title: st.title || st.task,
                  date: st.date || st.dueDate,
                  time: st.timeBlock || match.time,
                  category: st.category || match.category,
                  priority: (st.priority || match.priority || 'medium').toLowerCase(),
                  sync_status: 'synced',
                });
              }
            }
          });
        }
      }
    } catch (syncErr) {
      console.warn('[StorageService] Background sync idle/offline:', syncErr);
    } finally {
      syncInProgress = false;
    }
  }

  // Trigger background sync periodically when online (every 60s)
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => syncWithCloud());
    setInterval(syncWithCloud, 60000);
  }

  // ── Public Storage Service API ──
  const StorageService = {
    tasks: TasksRepository,
    generateUUID,
    exportAllData: exportAllDataToJson,
    importAllData: importAllDataFromJson,
    exportIcal: exportTasksToIcal,
    syncWithCloud,
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  window.StorageService = StorageService;

})(typeof window !== 'undefined' ? window : this);
