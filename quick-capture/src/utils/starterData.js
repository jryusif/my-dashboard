export const STARTER_INBOX_ITEMS = [
  {
    id: 'inbox_1',
    rawText: 'Order restorative composite materials and check matrix bands @tomorrow #work !high',
    cleanText: 'Order restorative composite materials and check matrix bands',
    dateStr: 'tomorrow',
    category: 'work',
    priority: 'high',
    tags: ['work'],
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'inbox_2',
    rawText: 'Read Deep Work summary chapter on deliberate rest #studies',
    cleanText: 'Read Deep Work summary chapter on deliberate rest',
    dateStr: null,
    category: 'studies',
    priority: 'medium',
    tags: ['studies'],
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
  },
  {
    id: 'inbox_3',
    rawText: 'Gift idea for Mom birthday: silk scarf or custom tea set @weekend #personal',
    cleanText: 'Gift idea for Mom birthday: silk scarf or custom tea set',
    dateStr: 'weekend',
    category: 'personal',
    priority: 'low',
    tags: ['personal'],
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
];

export const STARTER_VAULT_ITEMS = [
  {
    id: 'vault_1',
    title: 'Rubber dam isolation protocol tips',
    content: 'Always invert edges into the sulcus with floss ligatures before placing clamp to prevent seepage.',
    category: 'work',
    tags: ['work', 'clinical'],
    archivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'vault_2',
    title: 'Asset allocation rule',
    content: 'Maintain 35% physical gold bullion, 40% liquid cash reserves, 25% growth equities.',
    category: 'finance',
    tags: ['finance', 'wealth'],
    archivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

export const DEFAULT_TRIAGE_STATS = {
  streak: 3,
  lastTriageDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
  totalProcessed: 28,
};
