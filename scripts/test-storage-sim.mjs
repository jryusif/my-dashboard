import jwt from 'jsonwebtoken';
import fs from 'fs';

// Let's test the exact storageService logic
const STORAGE = {};
const localStorage = {
  getItem: (k) => STORAGE[k] || null,
  setItem: (k, v) => { STORAGE[k] = String(v); },
  removeItem: (k) => { delete STORAGE[k]; }
};

function generateUUID() {
  return 'uuid-' + Math.random().toString(36).substr(2, 9);
}

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

function readRaw(key, fallback = []) {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  return JSON.parse(data);
}
function writeRaw(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

const TasksRepository = {
  getAll(includeDeleted = false) {
    const raw = readRaw('antigravity_calendar_tasks', null);
    if (!raw) return [];
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

  bulkUpsert(tasksList) {
    if (!Array.isArray(tasksList) || tasksList.length === 0) return [];
    const current = readRaw('antigravity_calendar_tasks', []);
    const map = new Map(current.map(t => [String(t.id), t]));
    const now = new Date().toISOString();

    tasksList.forEach(incoming => {
      const id = String(incoming.id || generateUUID());
      const existing = map.get(id);
      if (!existing) {
        const newTask = normalizeRecord({
          id,
          title: (incoming.title || incoming.task || '').trim() || 'Untitled Task',
          description: incoming.description !== undefined ? incoming.description : (incoming.segment ? `Segment: ${incoming.segment}` : ''),
          date: incoming.date || incoming.dueDate || now.split('T')[0],
          time: incoming.time || incoming.timeBlock || '10:00',
          category: incoming.category || 'Work',
          priority: (incoming.priority || 'medium').toLowerCase(),
          completed: Boolean(incoming.completed),
          completed_at: incoming.completed ? (incoming.completed_at || now) : null,
          recurrence: incoming.recurrence || 'none',
          subtasks: Array.isArray(incoming.subtasks) ? incoming.subtasks : [],
          created_at: incoming.created_at || incoming.createdAt || now,
          updated_at: incoming.updated_at || incoming.updatedAt || now,
          deleted_at: incoming.deleted_at !== undefined ? incoming.deleted_at : null,
          sync_status: incoming.sync_status || 'synced',
        });
        map.set(id, newTask);
      } else if (existing.sync_status !== 'pending_sync') {
        const updated = normalizeRecord({
          ...existing,
          title: incoming.title || incoming.task || existing.title,
          description: incoming.description !== undefined ? incoming.description : (incoming.segment ? `Segment: ${incoming.segment}` : existing.description),
          date: incoming.date || incoming.dueDate || existing.date,
          time: incoming.time || incoming.timeBlock || existing.time,
          category: incoming.category || existing.category,
          priority: (incoming.priority || existing.priority || 'medium').toLowerCase(),
          completed: Boolean(incoming.completed),
          completed_at: incoming.completed ? (existing.completed_at || now) : null,
          updated_at: incoming.updated_at || now,
          sync_status: incoming.sync_status || 'synced',
        });
        map.set(id, updated);
      }
    });

    const merged = Array.from(map.values());
    writeRaw('antigravity_calendar_tasks', merged);
    return merged;
  }
};

async function test() {
  const env = fs.readFileSync('.env', 'utf8');
  const secretMatch = env.match(/JWT_SECRET="?([^"\r\n]+)"?/);
  const JWT_SECRET = secretMatch ? secretMatch[1] : 'dev-fallback-jwt-secret-replace-in-production';
  const token = jwt.sign({ userId: 'cmtidl7up0000llityy9nhmtu', email: 'jryusiif@gmail.com', role: 'ADMIN' }, JWT_SECRET);

  const res = await fetch('http://localhost:3000/api/tasks', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  const serverTasks = data.tasks;

  const mappedServerTasks = serverTasks.map(apiTask => ({
    id: String(apiTask.id),
    title: apiTask.title || apiTask.task || 'Untitled Task',
    description: apiTask.segment ? `Segment: ${apiTask.segment}` : '',
    date: apiTask.date || apiTask.dueDate || '2026-09-05',
    time: apiTask.timeBlock || '10:00',
    category: apiTask.category || 'Work',
    priority: (apiTask.priority || 'medium').toLowerCase(),
    completed: Boolean(apiTask.completed),
    sync_status: 'synced',
  }));

  TasksRepository.bulkUpsert(mappedServerTasks);

  console.log('After bulkUpsert, raw length in storage:', readRaw('antigravity_calendar_tasks').length);
  const gotTasks = TasksRepository.getAll(false);
  console.log('TasksRepository.getAll(false) length:', gotTasks.length);
}

test().catch(console.error);
