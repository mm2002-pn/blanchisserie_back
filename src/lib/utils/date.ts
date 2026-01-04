import { format, formatDistance, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format a date to French locale string
 */
export function formatDate(date: Date | string, formatStr: string = 'PP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr, { locale: fr });
}

/**
 * Format a date to short format (dd/MM/yyyy)
 */
export function formatShortDate(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Format a date to long format (dd MMMM yyyy)
 */
export function formatLongDate(date: Date | string): string {
  return formatDate(date, 'dd MMMM yyyy');
}

/**
 * Format a date with time (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Format a date as relative time (il y a 2 heures)
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: fr });
}

/**
 * Get current date in ISO format
 */
export function getCurrentDate(): string {
  return new Date().toISOString();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}
