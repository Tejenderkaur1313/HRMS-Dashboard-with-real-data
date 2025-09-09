import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Holiday {
  name: string;
  date: Date;
  day: string;
  month: string;
  type: string;
}

export interface HolidayData {
  holidays: Holiday[];
  totalHolidays: number;
}

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private apiUrl = environment.php_base_url;
  private cachedData: Observable<HolidayData> | null = null;
  private lastFilters: string = '';

  constructor(private http: HttpClient) {}

  getHolidayData(
    fromDate: string,
    toDate: string,
    companyId: any = localStorage.getItem('company_id')
  ): Observable<HolidayData> {
    const filterKey = `${fromDate}-${toDate}-${companyId}`;

    // Always clear cache and fetch new data when filters change
    if (this.lastFilters !== filterKey) {
      this.cachedData = null;
    }

    if (this.cachedData && this.lastFilters === filterKey) {
      return this.cachedData;
    }

    this.lastFilters = filterKey;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const requestBody = {
      command: 'getHolidays',
      company_id: companyId,
      from_date: fromDate,
      to_date: toDate
    };

    this.cachedData = this.http.post<any>(`${this.apiUrl}/desktop_tracking/web/v1/index/index`, requestBody, { headers })
      .pipe(
        timeout(30000),
        map(response => this.processHolidayData(response)),
        catchError(error => {
          console.error('Holiday API Error:', error);
          // Return fallback data instead of throwing error
          return this.getFallbackHolidayData();
        }),
        shareReplay(1)
      );

    return this.cachedData;
  }

  private processHolidayData(response: any): HolidayData {
    try {
      const holidays = response?.data?.holidays || [];
      
      const processedHolidays: Holiday[] = holidays.map((holiday: any) => {
        const holidayDate = new Date(holiday.holiday_date || holiday.date);
        return {
          name: holiday.holiday_name || holiday.name || 'Holiday',
          date: holidayDate,
          day: holidayDate.getDate().toString(),
          month: holidayDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          type: holiday.holiday_type || holiday.type || 'General'
        };
      });

      // Filter to get only upcoming holidays and sort by date
      const currentDate = new Date();
      const upcomingHolidays = processedHolidays
        .filter(holiday => holiday.date > currentDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        holidays: upcomingHolidays,
        totalHolidays: upcomingHolidays.length
      };
    } catch (error) {
      console.error('Error processing holiday data:', error);
      return this.getFallbackHolidayDataSync();
    }
  }

  private getFallbackHolidayData(): Observable<HolidayData> {
    // Return empty holiday data instead of static holidays
    return new Observable(observer => {
      observer.next({ holidays: [], totalHolidays: 0 });
      observer.complete();
    });
  }

  private getFallbackHolidayDataSync(): HolidayData {
    return { holidays: [], totalHolidays: 0 };
  }
}
