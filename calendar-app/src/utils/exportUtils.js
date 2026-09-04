import { formatDateKey } from './dateUtils';

/**
 * Trigger download of any text content as a file
 */
export const downloadBlob = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export full task dataset as a formatted JSON file
 */
export const exportTasksToJson = (tasks) => {
  const timestamp = formatDateKey(new Date());
  const jsonString = JSON.stringify(tasks, null, 2);
  downloadBlob(jsonString, `calendar-tasks-backup-${timestamp}.json`, 'application/json');
};

/**
 * Validate and parse an imported JSON file
 */
export const parseTasksFromJson = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) {
      throw new Error('Imported JSON must be an array of tasks.');
    }
    // Basic validation / sanitization
    const validTasks = data.filter(item => item && typeof item.title === 'string' && typeof item.date === 'string');
    return validTasks;
  } catch (err) {
    throw new Error('Failed to parse JSON file: ' + err.message);
  }
};

/**
 * Helper to convert Date to iCal UTC format: YYYYMMDDTHHMMSSZ
 */
const formatIcalDate = (dateObj) => {
  return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Export tasks as an RFC 5545 compliant .ics file for Google/Apple Calendar
 */
export const exportTasksToIcal = (tasks) => {
  const now = new Date();
  const dtstamp = formatIcalDate(now);

  const events = tasks.map(task => {
    // Determine start time and end time (default 1 hour duration)
    let startDate;
    if (task.date) {
      const [y, m, d] = task.date.split('-').map(Number);
      const [hour, minute] = (task.time || '09:00').split(':').map(Number);
      startDate = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
    } else {
      startDate = new Date();
    }
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

    // Clean summary and description
    const summary = (task.title || 'Untitled Task').replace(/\n/g, ' ');
    let description = (task.description || '').replace(/\n/g, '\\n');
    if (task.subtasks && task.subtasks.length > 0) {
      const subtaskText = task.subtasks.map(s => `[${s.completed ? 'x' : ' '}] ${s.title}`).join('\\n');
      description += `\\n\\nChecklist:\\n${subtaskText}`;
    }

    const priorityVal = task.priority === 'high' ? '1' : task.priority === 'medium' ? '5' : '9';
    const statusVal = task.completed ? 'COMPLETED' : 'NEEDS-ACTION';

    return [
      'BEGIN:VEVENT',
      `UID:${task.id || Math.random().toString(36).substr(2)}@antigravity-calendar.app`,
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
    'PRODID:-//Antigravity Personal Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  const timestamp = formatDateKey(new Date());
  downloadBlob(icalContent, `calendar-schedule-${timestamp}.ics`, 'text/calendar;charset=utf-8');
};
