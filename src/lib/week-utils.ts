import { Week } from '@/types';

// Get the current date in Asia/Amman timezone
function getCurrentDateInAmman(): Date {
  const now = new Date();
  const ammanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Amman' }));
  return ammanTime;
}

// Get the ISO week number (1-52)
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

// Get the Sunday of the week containing the given date
function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Get the Saturday of the week containing the given date
function getSaturdayOfWeek(date: Date): Date {
  const sunday = getSundayOfWeek(date);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return saturday;
}

// Format date as short month and day: "Jan 11"
function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Generate ISO week ID in YYYY-WW format
export function generateIsoWeekId(date: Date): string {
  const weekNumber = getISOWeekNumber(date);
  const year = date.getFullYear();
  return `${year}-${weekNumber.toString().padStart(2, '0')}`;
}

// Parse ISO week ID (YYYY-WW) to get week boundaries
export function parseIsoWeekId(isoWeekId: string): { year: number; week: number } {
  const [yearStr, weekStr] = isoWeekId.split('-');
  return {
    year: parseInt(yearStr, 10),
    week: parseInt(weekStr, 10),
  };
}

// Get week boundaries from ISO week ID
export function getWeekBoundaries(isoWeekId: string): { weekStartDate: Date; weekEndDate: Date } {
  const { year, week } = parseIsoWeekId(isoWeekId);
  
  // Find January 4th of the year (always in week 1)
  const jan4 = new Date(year, 0, 4);
  
  // Get the Monday of week 1
  const dayOfWeek = jan4.getDay();
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Get the Monday of the target week
  const monday = new Date(mondayOfWeek1);
  monday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  
  // Our weeks run Sunday to Saturday, so adjust
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 1);
  sunday.setHours(0, 0, 0, 0);
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  
  return { weekStartDate: sunday, weekEndDate: saturday };
}

// Format week display label: "Week 03, 2026 (Jan 11 – Jan 17)"
export function formatWeekDisplayLabel(isoWeekId: string): string {
  const { year, week } = parseIsoWeekId(isoWeekId);
  const { weekStartDate, weekEndDate } = getWeekBoundaries(isoWeekId);
  
  const startFormatted = formatShortDate(weekStartDate);
  const endFormatted = formatShortDate(weekEndDate);
  
  return `Week ${week.toString().padStart(2, '0')}, ${year} (${startFormatted} – ${endFormatted})`;
}

// Get the current week
export function getCurrentWeek(): Week {
  const now = getCurrentDateInAmman();
  const isoWeekId = generateIsoWeekId(now);
  const { weekStartDate, weekEndDate } = getWeekBoundaries(isoWeekId);
  
  return {
    isoWeekId,
    weekStartDate,
    weekEndDate,
    displayLabel: formatWeekDisplayLabel(isoWeekId),
  };
}

// Get a list of weeks (current + past N weeks)
export function getWeeks(count: number = 12): Week[] {
  const weeks: Week[] = [];
  const now = getCurrentDateInAmman();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    
    const isoWeekId = generateIsoWeekId(date);
    
    // Skip duplicates
    if (weeks.some(w => w.isoWeekId === isoWeekId)) continue;
    
    const { weekStartDate, weekEndDate } = getWeekBoundaries(isoWeekId);
    
    weeks.push({
      isoWeekId,
      weekStartDate,
      weekEndDate,
      displayLabel: formatWeekDisplayLabel(isoWeekId),
    });
  }
  
  return weeks;
}

// Create a Week object from an ISO week ID
export function createWeekFromId(isoWeekId: string): Week {
  const { weekStartDate, weekEndDate } = getWeekBoundaries(isoWeekId);
  
  return {
    isoWeekId,
    weekStartDate,
    weekEndDate,
    displayLabel: formatWeekDisplayLabel(isoWeekId),
  };
}
