import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GlobalFilters {
  fromDate: string;
  toDate: string;
  companyId: number;
  departmentId?: number;
  teamId?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalFilterService {
  private filtersSubject = new BehaviorSubject<GlobalFilters>(this.getDefaultFilters());

  private getDefaultFilters(): GlobalFilters {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get company_id from localStorage or use default
    const companyId = localStorage.getItem('company_id') ? 
      parseInt(localStorage.getItem('company_id')!) : 1;
    
    return {
      fromDate: this.formatDate(firstDay),
      toDate: this.formatDate(lastDay),
      companyId: companyId
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public filters$ = this.filtersSubject.asObservable();

  getCurrentFilters(): GlobalFilters {
    return this.filtersSubject.value;
  }

  updateFilters(filters: Partial<GlobalFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filters };
    this.filtersSubject.next(newFilters);
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
