import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GlobalFilters {
  fromDate: string;
  toDate: string;
  companyId: number;
  departmentId?: number;
  teamId?: number;
}

@Injectable({ providedIn: 'root' })
export class GlobalFilterService {
  private filtersSubject = new BehaviorSubject<GlobalFilters>({
    fromDate: '2024-07-01',
    toDate: '2024-07-31',
    companyId: 85
  });

  public filters$ = this.filtersSubject.asObservable();

  getCurrentFilters(): GlobalFilters {
    return this.filtersSubject.value;
  }

  updateFilters(filters: Partial<GlobalFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filters };
    this.filtersSubject.next(newFilters);
    console.log('🔄 Global filters updated:', newFilters);
  }

  setDateRange(fromDate: string, toDate: string): void {
    this.updateFilters({ fromDate, toDate });
  }

  setDepartment(departmentId: number): void {
    this.updateFilters({ departmentId });
  }

  clearDepartmentFilter(): void {
    const filters = { ...this.getCurrentFilters() };
    delete filters.departmentId;
    this.filtersSubject.next(filters);
  }
}
