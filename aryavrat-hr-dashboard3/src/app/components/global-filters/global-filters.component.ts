import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalFilterService } from '../services/global-filter.service';
import { DepartmentService, Department } from '../services/department.service';
import { TeamService, Team } from '../services/team.service';

@Component({
  selector: 'app-global-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-container">
      <div class="filter-group">
        <label>Department</label>
        <select (change)="updateDepartment($event)">
          <option value="">All Departments</option>
          <option *ngFor="let department of departments" [value]="department.id">{{department.name}}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Team</label>
        <select (change)="updateTeam($event)">
          <option value="">All Teams</option>
          <option *ngFor="let team of teams" [value]="team.id">{{team.name}}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Month</label>
        <select [(ngModel)]="selectedMonth" (change)="updateMonth()">
          <option value="">Select Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
      
      <div class="filter-group date-range">
        <label>Date Range</label>
        <div class="date-inputs">
          <input type="date" [(ngModel)]="fromDate" (change)="updateDateRange()" placeholder="From Date">
          <input type="date" [(ngModel)]="toDate" (change)="updateDateRange()" placeholder="To Date">
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
export class GlobalFiltersComponent implements OnInit {
  departments: Department[] = [];
  teams: Team[] = [];
  fromDate: string = '2025-08-01';
  toDate: string = '2025-08-31';
  selectedMonth: string = '08';

  constructor(
    private globalFilterService: GlobalFilterService,
    private departmentService: DepartmentService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    // Initialize with August 2025 date range
    this.globalFilterService.setDateRange(this.fromDate, this.toDate);
    
    // Load departments
    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
      }
    });

    // Load teams
    this.teamService.getTeamData().subscribe({
      next: (teams) => {
        this.teams = teams;
      },
      error: (error) => {
        console.error('Failed to load teams:', error);
      }
    });
  }

  updateDepartment(event: any): void {
    const departmentId = event.target.value ? parseInt(event.target.value) : undefined;
    this.globalFilterService.updateFilters({ departmentId });
  }

  updateDateRange(): void {
    if (this.fromDate && this.toDate) {
      this.globalFilterService.setDateRange(this.fromDate, this.toDate);
    }
  }

  updateTeam(event: any): void {
    const teamId = event.target.value ? parseInt(event.target.value) : undefined;
    this.globalFilterService.updateFilters({ teamId });
  }

  updateFilter(type: string, event: any): void {
    const value = event.target.value;
    this.globalFilterService.updateFilters({ [type]: value || undefined });
  }

  updateMonth(): void {
    if (this.selectedMonth) {
      const currentYear = new Date().getFullYear();
      const month = this.selectedMonth;
      const fromDate = `${currentYear}-${month}-01`;
      const lastDay = new Date(currentYear, parseInt(month), 0).getDate();
      const toDate = `${currentYear}-${month}-${lastDay.toString().padStart(2, '0')}`;
      
      this.fromDate = fromDate;
      this.toDate = toDate;
      this.globalFilterService.setDateRange(fromDate, toDate);
    }
  }

  resetFilters(): void {
    this.fromDate = '2025-08-01';
    this.toDate = '2025-08-31';
    this.selectedMonth = '08';
    this.globalFilterService.updateFilters({
      fromDate: this.fromDate,
      toDate: this.toDate,
      departmentId: undefined
    });
  }
}