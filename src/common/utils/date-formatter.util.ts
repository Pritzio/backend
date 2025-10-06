import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export class DateFormatterUtil {
  private static readonly CHILE_TIMEZONE = 'America/Santiago';

  /**
   * Formats a date to Chilean format (DD/MM/YYYY)
   */
  static formatToChileanDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  }

  /**
   * Formats a date to Chilean format with time (DD/MM/YYYY HH:MM:SS)
   */
  static formatToChileanDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm:ss', { locale: es });
  }

  /**
   * Gets current date in Chile timezone
   */
  static getCurrentChileTime(): Date {
    return new Date(
      new Date().toLocaleString('en-US', { timeZone: this.CHILE_TIMEZONE }),
    );
  }

  /**
   * Converts a date to Chile timezone
   */
  static toChileTimezone(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Date(
      dateObj.toLocaleString('en-US', { timeZone: this.CHILE_TIMEZONE }),
    );
  }

  /**
   * Formats a date for API responses (ISO string in Chile timezone)
   */
  static formatForAPI(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return this.toChileTimezone(dateObj).toISOString();
  }
}
