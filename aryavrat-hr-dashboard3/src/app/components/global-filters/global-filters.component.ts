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
        <select [(ngModel)]="selectedDepartmentId">
          <option [ngValue]="undefined">All Departments</option>
          <option *ngFor="let department of departments" [value]="department.id">{{department.name}}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Team</label>
        <select [(ngModel)]="selectedTeamId">
          <option [ngValue]="undefined">All Teams</option>
          <option *ngFor="let team of teams" [value]="team.id">{{team.name}}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Month</label>
        <select [(ngModel)]="selectedMonth" (change)="updateDateFromMonth()">
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
          <input type="date" [(ngModel)]="fromDate" placeholder="From Date">
          <input type="date" [(ngModel)]="toDate" placeholder="To Date">
        </div>
      </div>
      
      <div class="filter-group">
        <label>Search</label>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search employees...">
      </div>
      
      <button (click)="applyFilters()" class="search-btn">Search</button>
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
    .search-btn {
      padding: 3px 8px;
      background-color: var(--primary-accent);
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
    .search-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .reset-btn {
      padding: 3px 8px;
      background: var(--background-secondary);
      color: var(--text-secondary);
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
  fromDate: string = '';
  toDate: string = '';
  selectedMonth: string = '';
  selectedDepartmentId: number | undefined;
  selectedTeamId: number | undefined;
  searchQuery: string | undefined;

  constructor(
    private globalFilterService: GlobalFilterService,
    private departmentService: DepartmentService,
    private teamService: TeamService
  ) {
    this.setToCurrentMonth();
  }

  ngOnInit(): void {
    // Apply initial filters on load
    this.applyFilters();
    
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

  applyFilters(): void {
    if (this.fromDate && this.toDate) {
      this.globalFilterService.setDateRange(this.fromDate, this.toDate);
    }

    this.globalFilterService.updateFilters({
      departmentId: this.selectedDepartmentId,
      teamId: this.selectedTeamId,
      search: this.searchQuery
    });
  }

  setToCurrentMonth(): void {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.selectedMonth = month;
    this.updateDateFromMonth();
  }

  updateDateFromMonth(): void {
    if (this.selectedMonth) {
      const currentYear = new Date().getFullYear();
      const month = this.selectedMonth;
      const fromDate = `${currentYear}-${month}-01`;
      const lastDay = new Date(currentYear, parseInt(month), 0).getDate();
      const toDate = `${currentYear}-${month}-${lastDay.toString().padStart(2, '0')}`;
      
      this.fromDate = fromDate;
      this.toDate = toDate;
    }
  }

  resetFilters(): void {
    this.setToCurrentMonth();
    this.selectedDepartmentId = undefined;
    this.selectedTeamId = undefined;
    this.searchQuery = undefined;
    this.applyFilters();
  }
}