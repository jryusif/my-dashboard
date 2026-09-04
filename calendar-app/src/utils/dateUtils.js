export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Parse YYYY-MM-DD into a Date object at midnight local time
 */
export const parseDateKey = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Generate 42 cells (6 weeks x 7 days) for the calendar month grid,
 * correctly padding days from previous and next months.
 */
export const getMonthGrid = (year, month) => {
  const todayKey = formatDateKey(new Date());
  
  // First day of current month
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Last day of current month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Last day of previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  const cells = [];
  
  // 1. Previous month overflow days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = prevMonthLastDay - i;
    const date = new Date(year, month - 1, dayNumber);
    const dateKey = formatDateKey(date);
    cells.push({
      date,
      dateKey,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
    });
  }
  
  // 2. Current month days
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date = new Date(year, month, dayNumber);
    const dateKey = formatDateKey(date);
    cells.push({
      date,
      dateKey,
      dayNumber,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
    });
  }
  
  // 3. Next month overflow days (fill up to 42 cells = 6 rows)
  const remainingCells = 42 - cells.length;
  for (let dayNumber = 1; dayNumber <= remainingCells; dayNumber++) {
    const date = new Date(year, month + 1, dayNumber);
    const dateKey = formatDateKey(date);
    cells.push({
      date,
      dateKey,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
    });
  }
  
  return cells;
};

/**
 * Return 7 consecutive days for the week containing baseDate
 */
export const getWeekDays = (baseDate) => {
  const todayKey = formatDateKey(new Date());
  const current = new Date(baseDate);
  const dayOfWeek = current.getDay(); // 0 = Sunday
  
  // Move to start of week (Sunday)
  const sunday = new Date(current);
  sunday.setDate(current.getDate() - dayOfWeek);
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateKey = formatDateKey(d);
    days.push({
      date: d,
      dateKey,
      dayNumber: d.getDate(),
      dayName: WEEKDAY_NAMES_SHORT[d.getDay()],
      dayFullName: WEEKDAY_NAMES_FULL[d.getDay()],
      isToday: dateKey === todayKey,
    });
  }
  return days;
};

/**
 * Generate 24 hourly time slots (00:00 to 23:00)
 */
export const getHoursList = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const period = i >= 12 ? 'PM' : 'AM';
    const displayHour = i % 12 === 0 ? 12 : i % 12;
    hours.push({
      hour: i,
      label: `${displayHour} ${period}`,
      timeString: `${String(i).padStart(2, '0')}:00`,
    });
  }
  return hours;
};

/**
 * Check if a task is overdue (past date and time, and not completed)
 */
export const isTaskOverdue = (task) => {
  if (task.completed) return false;
  if (!task.date) return false;
  
  const taskTimeString = task.time || '23:59';
  const [hours, minutes] = taskTimeString.split(':').map(Number);
  
  const [y, m, d] = task.date.split('-').map(Number);
  const taskDeadline = new Date(y, m - 1, d, hours || 23, minutes || 59, 59);
  
  return taskDeadline.getTime() < Date.now();
};

/**
 * Format 24-hour time to 12-hour AM/PM
 */
export const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};
