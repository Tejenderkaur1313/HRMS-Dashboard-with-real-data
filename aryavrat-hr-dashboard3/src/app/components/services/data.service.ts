import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataService {
  private apiUrl = 'http://192.168.1.81:8000/api/query';

  // Only cached observables
  private cachedIdleTimeData: Observable<any[]> | null = null;
  private cachedJulyLeaveData: Observable<any[]> | null = null;
  private cachedJulyAttendanceData: Observable<any[]> | null = null;

  constructor(private http: HttpClient) { }

  // API CALL: Get leave data for July month (यह POST रिक्वेस्ट भेजता है)
  getJulyLeaveData(): Observable<any[]> {
    if (this.cachedJulyLeaveData) {
      console.log('📋 Using cached July leave data');
      return this.cachedJulyLeaveData;
    }

    const query = {
      question: "Show me leave data of July month"
    };

    console.log('🚀 DataService: Making POST request for July leave data...');
    console.log('📤 Request payload:', query);

    // http.post() का उपयोग हो रहा है
    this.cachedJulyLeaveData = this.http.post<any[]>(`${this.apiUrl}`, query, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }).pipe(
      timeout(60000),
      tap(response => console.log('✅ Leave data received:', response)),
      catchError(error => {
        console.error('❌ Leave data API failed:', error);
        return throwError(() => new Error(`Leave data API failed: ${error.message}`));
      }),
      map(response => this.handleApiResponse(response)),
      shareReplay(1)
    );

    return this.cachedJulyLeaveData;
  }

  // API CALL: Get attendance data for July month (यह POST रिक्वेस्ट भेजता है)
  getJulyAttendanceData(): Observable<any[]> {
    if (this.cachedJulyAttendanceData) {
      console.log('📋 Using cached July attendance data');
      return this.cachedJulyAttendanceData;
    }

    const query = {
      question: "Show me attendance data of july month"
    };

    console.log('🚀 DataService: Making POST request for July attendance data...');
    console.log('📤 Request payload:', query);

    // http.post() का उपयोग हो रहा है
    this.cachedJulyAttendanceData = this.http.post<any[]>(`${this.apiUrl}`, query, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }).pipe(
      timeout(60000),
      tap(response => console.log('✅ Attendance data received:', response)),
      catchError(error => {
        console.error('❌ Attendance data API failed:', error);
        return throwError(() => new Error(`Attendance data API failed: ${error.message}`));
      }),
      map(response => this.handleApiResponse(response)),
      shareReplay(1)
    );

    return this.cachedJulyAttendanceData;
  }

  // API CALL: Get top 5 highest idle time users for July month (यह POST रिक्वेस्ट भेजता है)
  getIdleTimeAnalysis(): Observable<any[]> {
    if (this.cachedIdleTimeData) {
      console.log('📋 Using cached idle time data');
      return this.cachedIdleTimeData;
    }

    const idleTimeQuery = {
      question: "get me only top 5 users with highest idle time in july month, show only first_name, last_name, and total_idle_time"
    };

    // http.post() का उपयोग हो रहा है
    this.cachedIdleTimeData = this.http.post(`${this.apiUrl}`, idleTimeQuery, {
        headers: { 'Content-Type': 'application/json' }
    }).pipe(
      timeout(10000),
      catchError(error => {
        console.error('❌ Idle time API request failed:', error);
        return throwError(() => new Error('Idle time API request failed'));
      }),
      map((response: any) => {
        if (response && response.data) {
          return this.processIdleTimeData(response.data);
        } else if (Array.isArray(response)) {
          return this.processIdleTimeData(response);
        }
        console.warn('⚠️ Unexpected idle time data format:', response);
        return [];
      }),
      shareReplay(1)
    );

    return this.cachedIdleTimeData;
  }

  // Helper function to handle different API response structures
  private handleApiResponse(response: any): any[] {
    let data: any[] = [];
    if (response && response.full_table_data && Array.isArray(response.full_table_data)) {
      data = response.full_table_data;
    } else if (response && response.data && Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response)) {
      data = response;
    } else {
      console.warn('⚠️ Unexpected API response format:', response);
      return [];
    }
    return this.processJulySummaryData(data);
  }

  private processIdleTimeData(data: any[]): any[] {
    return data.slice(0, 5).map(user => ({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      idle_time: user.total_idle_time || user.idle_time || 0,
      department: user.department || user.dept || 'Unknown'
    }));
  }

  private processJulySummaryData(data: any[]): any[] {
    console.log('📊 Processing summary data:', data.length, 'records');
    return data.map(record => ({
      first_name: record.first_name || '',
      last_name: record.last_name || '',
      dept: record.department || record.dept || 'Unknown',
      team: record.team || '',
      total_desk_time: record.total_desk_time || 0,
      total_prod_time: record.total_prod_time || 0,
      total_idle_time: record.total_idle_time || 0,
      total_unprod_time: record.total_unprod_time || 0,
      act_date: record.act_date || record.date || '',
      week_no: record.week_no || 1,
      prod_percentage: record.prod_percentage || 0
    }));
  }
}