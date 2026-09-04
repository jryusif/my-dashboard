/**
 * Extracts @dates, #categories, and !priorities from raw captured text
 * e.g. "Order new dental burrs @tomorrow #work !high"
 */
export function parseSmartCapture(rawText) {
  if (!rawText) {
    return {
      cleanText: '',
      dateStr: null,
      category: null,
      priority: null,
      tags: [],
    };
  }

  let text = rawText.trim();
  let dateStr = null;
  let category = null;
  let priority = null;
  const tags = [];

  // Match @date (e.g. @today, @tomorrow, @weekend, @monday, etc.)
  const dateMatch = text.match(/@([a-zA-Z0-9_-]+)/);
  if (dateMatch) {
    dateStr = dateMatch[1].toLowerCase();
  }

  // Match #category (e.g. #work, #personal, #health, #finance, #studies)
  const categoryMatch = text.match(/#([a-zA-Z0-9_-]+)/);
  if (categoryMatch) {
    category = categoryMatch[1].toLowerCase();
    tags.push(category);
  }

  // Match !priority (e.g. !high, !urgent, !medium, !low)
  const priorityMatch = text.match(/!([a-zA-Z0-9_-]+)/);
  if (priorityMatch) {
    const rawP = priorityMatch[1].toLowerCase();
    if (rawP === 'high' || rawP === 'urgent' || rawP === 'p1') priority = 'high';
    else if (rawP === 'med' || rawP === 'medium' || rawP === 'p2') priority = 'medium';
    else if (rawP === 'low' || rawP === 'p3') priority = 'low';
    else priority = rawP;
  }

  // Remove the tokens for clean display
  const cleanText = text
    .replace(/@([a-zA-Z0-9_-]+)/g, '')
    .replace(/#([a-zA-Z0-9_-]+)/g, '')
    .replace(/!([a-zA-Z0-9_-]+)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanText: cleanText || text,
    rawText: text,
    dateStr,
    category,
    priority,
    tags,
  };
}

export function formatRelativeDateLabel(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.toLowerCase();
  if (s === 'today') return 'Today';
  if (s === 'tomorrow') return 'Tomorrow';
  if (s === 'weekend') return 'This Weekend';
  if (s === 'nextweek' || s === 'next-week') return 'Next Week';
  return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}
