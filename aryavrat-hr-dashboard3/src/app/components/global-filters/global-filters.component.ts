import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterService } from '../services/filter.service';

@Component({
  selector: 'app-global-filters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filters-container">
      <div class="filter-group">
        <label>Department</label>
        <select (change)="updateFilter('department', $event)">
          <option value="">All Departments</option>
          <option value="#development">Development</option>
          <option value="#marketing">Marketing</option>
          <option value="#Support">Support</option>
          <option value="#Backend">Backend</option>
          <option value="#design">Design</option>
          <option value="#BPO">BPO</option>
          <option value="#QA">QA</option>
          <option value="#sales">Sales</option>
          <option value="#Android">Android</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Team</label>
        <select (change)="updateFilter('team', $event)">
          <option value="">All Teams</option>
          <option value="$management">Management</option>
          <option value="$development">Development</option>
          <option value="$Digital Marketing">Digital Marketing</option>
          <option value="$Sales">Sales</option>
          <option value="$team">Team</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Month</label>
        <select (change)="updateFilter('month', $event)" #monthSelect>
          <option value="">All Months</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8" selected>August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Year</label>
        <select (change)="updateFilter('year', $event)">
          <option value="">All Years</option>
          <option value="2025">2025</option>
        </select>
      </div>
      
      <div class="filter-group date-range">
        <label>Date Range</label>
        <div class="date-inputs">
          <input type="date" (change)="updateDateRange('start', $event)" placeholder="Start">
          <input type="date" (change)="updateDateRange('end', $event)" placeholder="End">
        </div>
      </div>
      
      <div class="filter-group">
        <label>Search</label>
        <input type="text" placeholder="Search employees..." (input)="updateFilter('search', $event)">
      </div>
      
      <button (click)="resetFilters()" class="reset-btn">Reset</button>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: end;
      width: 100%;
      padding: 4px 0;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 90px;
    }
    .filter-group.date-range {
      min-width: 160px;
    }
    .date-inputs {
      display: flex;
      gap: 3px;
    }
    .date-inputs input {
      flex: 1;
    }
    label {
      font-size: 10px;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 1px;
    }
    select, input {
      padding: 3px 6px;
      border: 1px solid var(--border);
      border-radius: 3px;
      font-size: 11px;
      background: var(--background);
      color: var(--text-primary);
      height: 24px;
      min-width: 0;
      transition: all 0.2s ease;
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-accent);
      box-shadow: 0 0 0 1px var(--primary-accent);
    }
    select:hover, input:hover {
      border-color: var(--primary-accent);
    }
    .reset-btn {
      padding: 3px 8px;
      background: var(--primary-accent);
      color: white;
      border: none;
      border-radius: 3px;
      font-weight: 500;
      cursor: pointer;
      font-size: 10px;
      height: 24px;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .reset-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    @media (max-width: 768px) {
      .filters-container {
        gap: 8px;
      }
      .filter-group {
        min-width: 100px;
      }
      .filter-group.date-range {
        min-width: 160px;
      }
    }
  `]
})
export class GlobalFiltersComponent {
  constructor(private filterService: FilterService) {
    // Set default filters on initialization
    this.filterService.updateGlobalFilters({ month: '8', year: '2025' });
  }

  updateFilter(type: string, event: any) {
    const value = event.target.value;
    this.filterService.updateGlobalFilters({ [type]: value || null });
  }

  updateDateRange(type: 'start' | 'end', event: any) {
    const value = new Date(event.target.value);
    const currentFilters = this.filterService.getCurrentFilters();
    const dateRange = currentFilters.dateRange || {};
    this.filterService.updateGlobalFilters({
      dateRange: { ...dateRange, [type]: value }
    });
  }

  resetFilters() {
    this.filterService.resetFilters();
    // Reset form elements but keep August selected
    const selects = document.querySelectorAll('select');
    const inputs = document.querySelectorAll('input');
    selects.forEach((select, index) => {
      if (index === 2) { // Month select (3rd select)
        (select as HTMLSelectElement).value = '8'; // August
      } else if (index === 3) { // Year select (4th select)
        (select as HTMLSelectElement).value = '2025';
      } else {
        (select as HTMLSelectElement).selectedIndex = 0;
      }
    });
    inputs.forEach(input => (input as HTMLInputElement).value = '');
    // Set default filters again
    this.filterService.updateGlobalFilters({ month: '8', year: '2025' });
  }
}