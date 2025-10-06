import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateFormatterUtil } from '../utils/date-formatter.util';

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object') {
          return this.formatDatesInObject(data);
        }
        return data;
      }),
    );
  }

  private formatDatesInObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      return DateFormatterUtil.formatToChileanDateTime(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.formatDatesInObject(item));
    }

    if (typeof obj === 'object') {
      const formatted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (this.isDateField(key)) {
            const dateValue = obj[key];
            if (dateValue instanceof Date) {
              formatted[key] =
                DateFormatterUtil.formatToChileanDateTime(dateValue);
            } else if (
              typeof dateValue === 'string' &&
              this.isValidDateString(dateValue)
            ) {
              const dateObj = new Date(dateValue);
              formatted[key] =
                DateFormatterUtil.formatToChileanDateTime(dateObj);
            } else {
              formatted[key] = dateValue;
            }
          } else {
            formatted[key] = this.formatDatesInObject(obj[key]);
          }
        }
      }
      return formatted;
    }

    return obj;
  }

  private isDateField(fieldName: string): boolean {
    const dateFields = [
      'createdAt',
      'updatedAt',
      'lastScraped',
      'created_at',
      'updated_at',
      'last_scraped',
      'date',
      'timestamp',
    ];
    return dateFields.some((field) =>
      fieldName.toLowerCase().includes(field.toLowerCase()),
    );
  }

  private isValidDateString(str: string): boolean {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }
}
