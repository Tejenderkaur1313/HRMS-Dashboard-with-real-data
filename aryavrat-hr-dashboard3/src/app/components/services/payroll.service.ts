import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export interface PayrollData {
  summary: {
    totalCost: number;
    totalEmployees: number;
    avgNetPay: number;
    variablePay: number;
  };
  trend: {
    labels: string[];
    data: number[];
  };
  composition: {
    baseSalary: number;
    bonuses: number;
    overtime: number;
  };
  departmentBreakdown: {
    name: string;
    value: number;
  }[];
  topEarners: {
    name: string;
    department: string;
    position: string;
    salary: number;
  }[];
  data: PayrollEntry[];
}

export interface PayrollEntry {
  employeeId: number;
  name: string;
  department: string;
  jobTitle: string;
  baseSalary: number;
  bonus: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  totalCost: number;
  payDate: string;
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private cache = new Map<string, { data: PayrollData; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor(private http: HttpClient) {}

  getPayrollData(period: string = '30'): Observable<PayrollData> {
    const cacheKey = `payroll-${period}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < this.CACHE_DURATION) {
      return of(cachedData.data);
    }

    // In a real implementation, you would make an HTTP request here
    // return this.http.post<PayrollData>(this.apiUrl, {
    //   command: 'get_payroll_data',
    //   period: period
    // }).pipe(
    //   tap(data => {
    //     this.cache.set(cacheKey, { data, timestamp: Date.now() });
    //   }),
    //   catchError(error => {
    //     console.error('Error fetching payroll data:', error);
    //     return of(this.getEmptyPayrollData(period));
    //   })
    // );

    // For now, return empty data structure
    const emptyData = this.getEmptyPayrollData(period);
    this.cache.set(cacheKey, { data: emptyData, timestamp: Date.now() });
    return of(emptyData);
  }

  private getEmptyPayrollData(period: string): PayrollData {
    return {
      summary: {
        totalCost: 0,
        totalEmployees: 0,
        avgNetPay: 0,
        variablePay: 0
      },
      trend: {
        labels: [],
        data: []
      },
      composition: {
        baseSalary: 0,
        bonuses: 0,
        overtime: 0
      },
      departmentBreakdown: [],
      topEarners: [],
      data: []
    };
  }
}
