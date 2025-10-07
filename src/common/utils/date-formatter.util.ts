import { parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime, format } from 'date-fns-tz';

export class DateFormatterUtil {
  private static readonly CHILE_TIMEZONE = 'America/Santiago';

  /**
   * Formats a date to Chilean format (DD/MM/YYYY)
   */
  static formatToChileanDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy', {
      locale: es,
      timeZone: this.CHILE_TIMEZONE,
    });
  }

  /**
   * Formats a date to Chilean format with time (DD/MM/YYYY HH:MM:SS)
   */
  static formatToChileanDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm:ss', {
      locale: es,
      timeZone: this.CHILE_TIMEZONE,
    });
  }

  /**
   * Gets current date in Chile timezone
   */
  static getCurrentChileTime(): Date {
    const utcDate = new Date();
    return toZonedTime(utcDate, this.CHILE_TIMEZONE);
  }

  /**
   * Converts a date to Chile timezone
   */
  static toChileTimezone(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return toZonedTime(dateObj, this.CHILE_TIMEZONE);
  }

  /**
   * Formats a date for API responses (ISO string with timezone offset)
   */
  static formatForAPI(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", {
      timeZone: this.CHILE_TIMEZONE,
    });
  }
}
