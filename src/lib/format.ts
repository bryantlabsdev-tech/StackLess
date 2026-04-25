import { format, isSameDay, parseISO } from 'date-fns'

export function formatISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function parseISODate(s: string): Date {
  return parseISO(s)
}

export function isTodayISO(dateStr: string): boolean {
  return isSameDay(parseISO(dateStr), new Date())
}

export function formatDisplayDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy')
  } catch {
    return iso
  }
}

export function formatMonthYear(d: Date): string {
  return format(d, 'MMMM yyyy')
}

export function formatWeekdayShort(d: Date): string {
  return format(d, 'EEE')
}
