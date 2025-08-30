import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FilterService {
  globalFilters = new BehaviorSubject<{ 
    department?: string, 
    dateRange?: {start: Date, end: Date}, 
    employeeType?: string, 
    status?: string, 
    search?: string,
    month?: string,
    year?: string,
    team?: string,
    employee?: string
  }>({});

  updateGlobalFilters(filters: any) {
    this.globalFilters.next({ ...this.globalFilters.value, ...filters });
  }

  resetFilters() {
    this.globalFilters.next({});
  }

  getCurrentFilters() {
    return this.globalFilters.value;
  }
}
