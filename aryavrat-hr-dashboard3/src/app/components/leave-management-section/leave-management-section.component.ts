import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartConfiguration, ChartType } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { Subject, takeUntil, combineLatest } from 'rxjs';

@Component({
  selector: 'app-leave-management-section',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Dashboard Header -->
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">📊 Leave Management Dashboard</h1>
          <p class="text-gray-500 mt-1">HR analytics and insights for workforce management.</p>
        </header>

        <!-- Loading State -->
        <div *ngIf="isLoadingData" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600 text-lg">{{ loadingMessage }}</p>
          <p class="text-gray-400 text-sm mt-2">Loading leave data...</p>
        </div>

        <!-- Main Content - Only show when not loading -->
        <div *ngIf="!isLoadingData">
            <!-- KPI Row 1 -->
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Monthly Overview</h2>
            <div class="kpi-row">
                <div class="kpi-card" style="border-left-color: var(--primary-accent);">
                  <div class="kpi-value">{{ kpiData.totalLeavesMonth }}</div>
                  <div class="kpi-label">Total Leaves (This Month)</div>
                  <div class="kpi-trend">Based on approved requests</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--teal);">
                  <div class="kpi-value">{{ kpiData.avgLeavesWeekly }}</div>
                  <div class="kpi-label">Average Leaves (Weekly)</div>
                  <div class="kpi-trend">Average leaves taken per week</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--warning);">
                  <div class="kpi-value">{{ kpiData.pendingApprovals }}</div>
                  <div class="kpi-label">Pending Approvals</div>
                  <div class="kpi-trend">Avg 1.5 days to process</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--success);">
                  <div class="kpi-value">{{ kpiData.approvalRate }}</div>
                  <div class="kpi-label">Approval Rate</div>
                  <div class="kpi-trend">Manager approval rate YTD</div>
                </div>
            </div>

            <!-- Charts Grid Container -->
            <div class="charts-grid-container mt-6">

                <!-- Chart 1: Leave Trend Over Time -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Leave Trend Over Time</h3>
                    <div id="leave-trend-chart" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="leaveTrendData" [options]="leaveTrendOptions" type="line"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Leave Trend Chart</div>
                    </div>
                </div>

                <!-- Chart 2: Leave Distribution by Type -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Leave Distribution by Type</h3>
                        <div class="relative">
                          <button
                            (click)="toggleDistFilterDropdown()"
                            class="filter-select flex items-center justify-between w-full">
                            <span>Department ({{ distChartDepartments.length }})</span>
                          </button>
                          <div *ngIf="distFilterOpen" class="absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200">
                            <div class="py-1">
                              <div class="px-4 py-2 border-b border-gray-200">
                                <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                  <input
                                    type="checkbox"
                                    class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                    [checked]="distChartDepartments.length === departments.length"
                                    (change)="toggleSelectAllDistFilters()"/>
                                  <span>Select All</span>
                                </label>
                              </div>
                              <div class="max-h-60 overflow-y-auto">
                                <div *ngFor="let dept of departments" class="px-4 py-2 hover:bg-gray-100">
                                  <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                    <input
                                      type="checkbox"
                                      class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                      [checked]="distChartDepartments.includes(dept)"
                                      (change)="toggleDistFilter(dept)"/>
                                    <span>{{ dept }}</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                    <div id="leave-distribution-chart" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="leaveDistributionData" [options]="leaveDistributionOptions" type="pie"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Leave Distribution Chart</div>
                    </div>
                </div>

                <!-- Chart 3: Department-wise Leave Utilization -->
                 <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Department-wise Leave Utilization</h3>
                        <div class="flex items-center gap-2">
                            <select [(ngModel)]="deptUtilTimePeriod" (ngModelChange)="updateDepartmentUtilization()" class="filter-select">
                                <option>Last Month</option>
                                <option>Last 3 Months</option>
                                <option>YTD</option>
                            </select>
                            <div class="relative">
                                <button (click)="toggleDeptFilterDropdown()" class="filter-select flex items-center justify-between w-full">
                                    <span>Leave Type ({{ deptUtilLeaveTypes.length }})</span>
                                </button>
                                <div *ngIf="deptFilterOpen" class="absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200">
                                    <div class="py-1">
                                        <div class="px-4 py-2 border-b border-gray-200">
                                            <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                            <input type="checkbox" class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                                [checked]="deptUtilLeaveTypes.length === leaveTypes.length" (change)="toggleSelectAllDeptFilters()"/>
                                            <span>Select All</span>
                                            </label>
                                        </div>
                                        <div class="max-h-60 overflow-y-auto">
                                            <div *ngFor="let leaveType of leaveTypes" class="px-4 py-2 hover:bg-gray-100">
                                                <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                                    <input type="checkbox" class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                                    [checked]="deptUtilLeaveTypes.includes(leaveType)" (change)="toggleDeptFilter(leaveType)"/>
                                                    <span>{{ leaveType }}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="department-utilization-chart" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="departmentUtilizationData" [options]="departmentUtilizationOptions" type="bar"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Department Utilization Chart</div>
                    </div>
                </div>

                <!-- Chart 4: Planned vs Unplanned Leaves -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Planned vs Unplanned</h3>
                         <div class="flex items-center gap-2">
                            <select [(ngModel)]="plannedVsUnplannedTimeRange" (ngModelChange)="updatePlannedVsUnplanned()" class="filter-select">
                                <option>Last Month</option>
                                <option>Last 3 Months</option>
                                <option>YTD</option>
                            </select>
                            <div class="relative">
                                <button (click)="togglePlannedFilterDropdown()" class="filter-select flex items-center justify-between w-full">
                                    <span>Department ({{ plannedVsUnplannedDepts.length }})</span>
                                </button>
                                <div *ngIf="plannedFilterOpen" class="absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200">
                                    <div class="py-1">
                                    <div class="px-4 py-2 border-b border-gray-200">
                                        <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                        <input type="checkbox" class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                            [checked]="plannedVsUnplannedDepts.length === departments.length" (change)="toggleSelectAllPlannedFilters()"/>
                                        <span>Select All</span>
                                        </label>
                                    </div>
                                    <div class="max-h-60 overflow-y-auto">
                                        <div *ngFor="let dept of departments" class="px-4 py-2 hover:bg-gray-100">
                                        <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                            <input type="checkbox" class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                            [checked]="plannedVsUnplannedDepts.includes(dept)" (change)="togglePlannedFilter(dept)"/>
                                            <span>{{ dept }}</span>
                                        </label>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="planned-vs-unplanned-chart" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="plannedVsUnplannedData" [options]="plannedVsUnplannedOptions" type="bar"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Planned vs Unplanned Chart</div>
                    </div>
                </div>
            </div>

            <!-- Full Width Bottom Section: Top Performers -->
            <div class="mt-6">
                <div class="bg-white p-5 rounded-xl shadow chart-card w-full">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Top 5 Employees with Highest Leave Taken</h3>
                         <div class="flex items-center gap-2">
                            <select [(ngModel)]="topEmpTimeRange" (ngModelChange)="updateTopEmployees()" class="filter-select">
                                <option>Last Month</option>
                                <option>Last 3 Months</option>
                                <option>YTD</option>
                            </select>
                            <div class="relative">
                                <button (click)="toggleTopEmpFilterDropdown()" class="filter-select flex items-center justify-between w-full">
                                    <span>Leave Type ({{ topEmpLeaveTypes.length }})</span>
                                </button>
                                <div *ngIf="topEmpFilterOpen" class="absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200">
                                    <div class="py-1">
                                        <div class="px-4 py-2 border-b border-gray-200">
                                            <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                            <input type="checkbox" class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                                [checked]="topEmpLeaveTypes.length === leaveTypes.length" (change)="toggleSelectAllTopEmpFilters()"/>
                                            <span>Select All</span>
                                            </label>
                                        </div>
                                        <div class="max-h-60 overflow-y-auto">
                                            <div *ngFor="let leaveType of leaveTypes" class="px-4 py-2 hover:bg-gray-100">
                                            <label class="flex items-center space-x-2 cursor-pointer text-gray-700">
                                                <input type="checkbox" class="form-checkbox h-4 w-4 rounded bg-gray-100 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                                [checked]="topEmpLeaveTypes.includes(leaveType)" (change)="updateTopEmployees()"/>
                                                <span>{{ leaveType }}</span>
                                            </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                     <p class="text-sm text-gray-500 mb-4">Based on selected filters</p>
                    <div id="top-employees-chart" style="height: 250px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="topEmployeesData" [options]="topEmployeesOptions" type="bar"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Top Employees Chart</div>
                    </div>
                </div>
            </div>

             <!-- Dedicated Section: Top Employees Last Month -->
            <div class="mt-6">
              <div class="bg-white p-5 rounded-xl shadow chart-card w-full">
                <div class="flex items-center space-x-2 mb-4">
                  <!-- === CHANGE IS HERE === -->
                  <svg style="width: 24px; height: 24px; flex-shrink: 0;" class="text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 class="text-lg font-semibold text-gray-900">Top Employees (Last Month)</h3>
                </div>
                <ul class="space-y-3">
                  <li *ngFor="let emp of lastMonthTopEmployees; let i = index" class="flex justify-between items-center text-sm p-2 rounded-md bg-gray-100">
                    <span class="font-medium text-gray-700">{{ i + 1 }}. {{ emp.name }}</span>
                    <span class="font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded-full text-xs">{{ emp.days }} days</span>
                  </li>
                </ul>
              </div>
            </div>

        </div>
    </div>
  `,
  styles: [`
    /* Define color variables locally for this component */
    :host {
        --primary-accent: #4f46e5;
        --warning: #f97316;
        --success: #10b981;
        --info: #3b82f6;
        --teal: #14b8a6;
        --purple: #8b5cf6;
        --text-muted: #6b7280;
    }

    .kpi-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem; /* 16px */
    }

    .kpi-card {
      border-left-width: 4px;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      background: white;
      padding: 5px 5px; /* Reduced padding */
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px 0 rgba(0,0,0,.06);
      min-height: 80px; /* Fixed smaller height */
    }
    
    .kpi-value {
      font-size: 2.25rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .kpi-label {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .kpi-trend {
      font-size: 0.875rem;
      color: #9ca3af;
    }

    .chart-card {
        width: 100%;
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    /* Responsive behavior for KPI cards */
    @media (max-width: 639px) { /* Mobile */
      .kpi-card { flex: 1 1 100%; }
    }
    @media (min-width: 640px) and (max-width: 1023px) { /* Tablet */
      .kpi-card { flex: 1 1 calc(50% - 0.5rem); }
    }
    @media (min-width: 1024px) { /* Desktop */
      .kpi-card {
        flex: 1 1 calc(25% - 0.75rem); 
        max-width: 320px;
      }
    }

    .charts-grid-container {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem; /* 24px */
    }

    .charts-grid-container > .chart-card {
        flex: 1 1 100%; /* Mobile-first: 100% width */
        min-width: 300px; 
    }

    @media (min-width: 1024px) { /* Desktop: 2 columns */
        .charts-grid-container > .chart-card {
            flex: 1 1 calc(50% - 0.75rem); /* 50% width minus half the gap */
        }
    }

    .kpi-card:hover, .chart-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .chart-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-style: italic;
      min-height: 180px;
    }
    .filter-select {
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid #d1d5db;
        background-color: #f9fafb;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding-right: 1.5rem;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
    }
    .rotate-180 {
      transform: rotate(180deg);
    }
  `]
})
export class LeaveManagementSectionComponent implements OnInit, OnDestroy {

  // Loading state
  isLoadingData: boolean = true;
  loadingMessage: string = 'Loading leave data...';

  // Master data
  masterData: any[] = [];
  departments: string[] = [];
  leaveTypes: string[] = ['Sick', 'Casual', 'Paid', 'Unpaid'];
  isBrowser: boolean;

  // Dynamic month and year selection (user can change via UI)
  selectedMonth: number = 6; // July (0-indexed)
  selectedYear: number = 2025;

  // Available options for dropdowns
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  years: number[] = [2024, 2025, 2026, 2027];

  // KPI Data
  kpiData = {
    totalLeavesMonth: 0,
    avgLeavesWeekly: 0,
    pendingApprovals: 0,
    rejectionRate: '0%',
    approvalRate: '0%'
  };

  // Filter states
  distChartDepartments: string[] = [];
  topEmpTimeRange: string = 'YTD';
  topEmpLeaveTypes: string[] = ['Sick', 'Casual', 'Paid', 'Unpaid'];
  deptUtilTimePeriod: string = 'YTD';
  deptUtilLeaveTypes: string[] = ['Sick', 'Casual', 'Paid', 'Unpaid'];
  plannedVsUnplannedDepts: string[] = [];
  plannedVsUnplannedTimeRange: string = 'YTD';

  // Dropdown states
  deptFilterOpen: boolean = false;
  distFilterOpen: boolean = false;
  plannedFilterOpen: boolean = false;
  topEmpFilterOpen: boolean = false;

  // Chart data
  leaveTrendData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Sick Leave',
      data: [],
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: true
    }, {
      label: 'Casual Leave',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }, {
      label: 'Paid Leave',
      data: [],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  leaveTrendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 8 },
          maxTicksLimit: 4
        }
      },
      x: {
        ticks: {
          font: { size: 8 },
          maxRotation: 0
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  leaveDistributionData: ChartData<'pie'> = {
    labels: ['Sick', 'Casual', 'Paid', 'Unpaid'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#ef4444', '#3b82f6', '#22c55e', '#6b7280'],
      borderWidth: 2,
    }]
  };

  leaveDistributionOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}`;
          }
        }
      }
    },
    cutout: '60%'
  };

  departmentUtilizationData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Sick',
      data: [],
      backgroundColor: '#ef4444',
    }, {
      label: 'Casual',
      data: [],
      backgroundColor: '#3b82f6',
    }, {
      label: 'Paid',
      data: [],
      backgroundColor: '#22c55e',
    }, {
      label: 'Unpaid',
      data: [],
      backgroundColor: '#6b7280',
    }]
  };

  departmentUtilizationOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 8 },
          maxTicksLimit: 4
        }
      },
      x: {
        ticks: {
          font: { size: 8 },
          maxRotation: 0
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  plannedVsUnplannedData: ChartData<'bar'> = {
    labels: ['Leaves'],
    datasets: [{
      label: 'Planned',
      data: [0],
      backgroundColor: '#8b5cf6',
    }, {
      label: 'Unplanned',
      data: [0],
      backgroundColor: '#f97316',
    }]
  };

  plannedVsUnplannedOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 8 },
          maxTicksLimit: 4
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  topEmployeesData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Leave Days',
      data: [],
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      borderColor: '#22c55e',
      borderWidth: 1,
    }]
  };

  topEmployeesOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: { size: 8 },
          maxTicksLimit: 4
        }
      },
      y: {
        ticks: {
          font: { size: 8 },
          maxRotation: 0
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  // Top employees last month
  lastMonthTopEmployees: any[] = [];

  // Subscription management
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private filterService: FilterService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    console.log('🎯 Leave Management Component Initialized');

    // Initialize departments
    this.departments = ['Engineering', 'HR', 'Marketing', 'Sales', 'Design', 'Support'];
    this.distChartDepartments = [...this.departments];
    this.plannedVsUnplannedDepts = [...this.departments];

    // Subscribe to global filters
    this.filterService.globalFilters
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        console.log('📊 Leave Section: Filters received:', filters);
        // Load leave data when filters change
        this.loadLeaveData();
      });

    // Initial data load
    this.loadLeaveData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLeaveData() {
    console.log('🔄 Leave Section: Loading leave data from API...');
    this.isLoadingData = true;
    this.loadingMessage = 'Loading leave data from API...';

    // Call actual API to get July month leave data
    this.dataService.getJulyLeaveData().subscribe({
      next: (data: any[]) => {
        console.log('✅ Leave Section: July API data received:', data);
        this.processLeaveData(data);
        this.isLoadingData = false;
      },
      error: (error: any) => {
        console.error('❌ Leave Section: API error:', error);
        this.loadingMessage = 'Failed to load data. Please try again.';
        this.isLoadingData = false;
        // Fallback to empty data
        this.processLeaveData([]);
      }
    });
  }

  private processLeaveData(data: any[]) {
    console.log('📊 Processing leave data:', data.length, 'records');

    this.masterData = data;

    // Update KPI data
    this.updateKPIData(data);

    // Update all charts
    this.updateAllCharts();

    console.log('✅ Leave data processing completed');
  }

  private updateKPIData(data: any[]) {
    console.log('📊 Calculating KPI data...');

    // Use selected month/year instead of hardcoded values
    const targetYear = this.selectedYear;
    const targetMonth = this.selectedMonth;

    const thisMonthLeaves = data.filter(d => {
      const leaveDate = new Date(d.startDate || d.act_date);
      return leaveDate.getFullYear() === targetYear &&
             leaveDate.getMonth() === targetMonth;
    });

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekLeaves = data.filter(d => {
      const leaveDate = new Date(d.startDate || d.act_date);
      return leaveDate >= lastWeekStart;
    });

    const pending = data.filter(d => d.status === 'Pending').length;
    const approved = data.filter(d => d.status === 'Approved').length;
    const rejected = data.filter(d => d.status === 'Rejected').length;
    const totalDecided = approved + rejected;

    this.kpiData.totalLeavesMonth = thisMonthLeaves.length;
    this.kpiData.avgLeavesWeekly = lastWeekLeaves.length > 0 ? Math.round((lastWeekLeaves.length / 1) * 10) / 10 : 0;
    this.kpiData.pendingApprovals = pending;
    this.kpiData.rejectionRate = totalDecided > 0 ? `${((rejected / totalDecided) * 100).toFixed(1)}%` : '0%';
    this.kpiData.approvalRate = totalDecided > 0 ? `${((approved / totalDecided) * 100).toFixed(1)}%` : '0%';

    console.log('✅ KPI data updated');
  }

  private updateAllCharts() {
    console.log('📊 Updating all leave charts...');
    this.updateLeaveTrendChart();
    this.updateLeaveDistributionChart();
    this.updateDepartmentUtilizationChart();
    this.updatePlannedVsUnplannedChart();
    this.updateTopEmployeesChart();
    console.log('✅ All leave charts updated');
  }

  private updateLeaveTrendChart() {
    console.log('📈 Updating leave trend chart...');

    // Initialize trend data with proper typing and correct year
    const trend: { name: string; Sick: number; Casual: number; Paid: number; Unpaid: number }[] = [];
    for (let i = 0; i < 12; i++) {
      trend.push({ name: new Date(this.selectedYear, i).toLocaleString('default', { month: 'short' }), Sick: 0, Casual: 0, Paid: 0, Unpaid: 0 });
    }

    this.masterData.forEach(item => {
      const date = new Date(item.startDate || item.act_date);
      if (!isNaN(date.getTime())) {
        const monthIndex = date.getMonth();
        const leaveType = item.leaveType || item.leave_type;
        if (trend[monthIndex] && this.leaveTypes.includes(leaveType)) {
          trend[monthIndex][leaveType as keyof typeof trend[0]]++;
        }
      }
    });

    this.leaveTrendData.labels = trend.map(t => t.name);
    this.leaveTrendData.datasets[0].data = trend.map(t => t.Sick);
    this.leaveTrendData.datasets[1].data = trend.map(t => t.Casual);
    this.leaveTrendData.datasets[2].data = trend.map(t => t.Paid);
  }

  private updateLeaveDistributionChart() {
    console.log('📊 Updating leave distribution chart...');

    const distribution = this.leaveTypes.map(type => ({ name: type, value: 0 }));
    const departmentFilteredData = this.masterData.filter(item =>
      this.distChartDepartments.includes(item.department || item.dept)
    );

    departmentFilteredData.forEach(item => {
      const leaveType = item.leaveType || item.leave_type;
      const leaveTypeData = distribution.find(d => d.name === leaveType);
      if (leaveTypeData) {
        leaveTypeData.value++;
      }
    });

    const filteredDistribution = distribution.filter(d => d.value > 0);

    this.leaveDistributionData.labels = filteredDistribution.map(d => d.name);
    this.leaveDistributionData.datasets[0].data = filteredDistribution.map(d => d.value);
  }

  private updateDepartmentUtilizationChart() {
    console.log('🏢 Updating department utilization chart...');

    const now = new Date();
    let startDate;
    switch (this.deptUtilTimePeriod) {
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'YTD':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filtered = this.masterData.filter(item => {
      const leaveDate = new Date(item.startDate || item.act_date);
      return leaveDate >= startDate && this.deptUtilLeaveTypes.includes(item.leaveType || item.leave_type);
    });

    const utilization: Record<string, { name: string; Sick: number; Casual: number; Paid: number; Unpaid: number }> = {};
    this.departments.forEach(dep => {
      utilization[dep] = { name: dep, Sick: 0, Casual: 0, Paid: 0, Unpaid: 0 };
    });

    filtered.forEach(item => {
      const dept = item.department || item.dept;
      const leaveType = item.leaveType || item.leave_type;
      if (utilization[dept] && this.deptUtilLeaveTypes.includes(leaveType)) {
        // Use switch statement for better type safety
        switch (leaveType as string) {
          case 'Sick':
            utilization[dept].Sick++;
            break;
          case 'Casual':
            utilization[dept].Casual++;
            break;
          case 'Paid':
            utilization[dept].Paid++;
            break;
          case 'Unpaid':
            utilization[dept].Unpaid++;
            break;
        }
      }
    });

    const utilizationData = Object.values(utilization);
    this.departmentUtilizationData.labels = utilizationData.map(d => (d as any).name);
    this.departmentUtilizationData.datasets[0].data = utilizationData.map(d => (d as any).Sick);
    this.departmentUtilizationData.datasets[1].data = utilizationData.map(d => (d as any).Casual);
    this.departmentUtilizationData.datasets[2].data = utilizationData.map(d => (d as any).Paid);
    this.departmentUtilizationData.datasets[3].data = utilizationData.map(d => (d as any).Unpaid);
  }

  private updatePlannedVsUnplannedChart() {
    console.log('📊 Updating planned vs unplanned chart...');

    const now = new Date();
    let startDate;
    switch (this.plannedVsUnplannedTimeRange) {
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'YTD':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filtered = this.masterData.filter(item => {
      const leaveDate = new Date(item.startDate || item.act_date);
      return leaveDate >= startDate && this.plannedVsUnplannedDepts.includes(item.department || item.dept);
    });

    const data = { Planned: 0, Unplanned: 0 };
    filtered.forEach(item => {
      if (item.isPlanned || item.is_planned) {
        data.Planned++;
      } else {
        data.Unplanned++;
      }
    });

    this.plannedVsUnplannedData.datasets[0].data = [data.Planned];
    this.plannedVsUnplannedData.datasets[1].data = [data.Unplanned];
  }

  private updateTopEmployeesChart() {
    console.log('👨‍💼 Updating top employees chart...');

    const now = new Date();
    let startDate;
    switch (this.topEmpTimeRange) {
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'YTD':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filtered = this.masterData.filter(item => {
      const leaveDate = new Date(item.startDate || item.act_date);
      return leaveDate >= startDate && this.topEmpLeaveTypes.includes(item.leaveType || item.leave_type);
    });

    const employeeLeaves: Record<string, number> = {};
    filtered.forEach(item => {
      const empName = item.employeeName || item.employee_name ||
                      (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` :
                       item.user_id ? `User ${item.user_id}` : 'Unknown');
      employeeLeaves[empName] = (employeeLeaves[empName] || 0) + (item.duration || 1);
    });

    const topEmployees = Object.entries(employeeLeaves)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, days]) => ({ name, days }));

    // Update last month top employees
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthData = this.masterData.filter(d => {
      const leaveDate = new Date(d.startDate || d.act_date);
      return leaveDate >= lastMonthStart && leaveDate <= lastMonthEnd;
    });

    const lastMonthEmployeeLeaves: Record<string, number> = {};
    lastMonthData.forEach(item => {
      const empName = item.employeeName || item.employee_name ||
                      (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` :
                       item.user_id ? `User ${item.user_id}` : 'Unknown');
      lastMonthEmployeeLeaves[empName] = (lastMonthEmployeeLeaves[empName] || 0) + (item.duration || 1);
    });

    this.lastMonthTopEmployees = Object.entries(lastMonthEmployeeLeaves)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, days]) => ({ name, days }));

    this.topEmployeesData.labels = topEmployees.map(emp => emp.name);
    this.topEmployeesData.datasets[0].data = topEmployees.map(emp => emp.days as number);
  }

  // Filter dropdown methods
  toggleDeptFilterDropdown() {
    this.deptFilterOpen = !this.deptFilterOpen;
  }

  toggleDistFilterDropdown() {
    this.distFilterOpen = !this.distFilterOpen;
  }

  togglePlannedFilterDropdown() {
    this.plannedFilterOpen = !this.plannedFilterOpen;
  }

  toggleTopEmpFilterDropdown() {
    this.topEmpFilterOpen = !this.topEmpFilterOpen;
  }

  toggleDeptFilter(leaveType: string) {
    if (this.deptUtilLeaveTypes.includes(leaveType)) {
      this.deptUtilLeaveTypes = this.deptUtilLeaveTypes.filter(type => type !== leaveType);
    } else {
      this.deptUtilLeaveTypes.push(leaveType);
    }
    this.updateDepartmentUtilizationChart();
  }

  toggleSelectAllDeptFilters() {
    if (this.deptUtilLeaveTypes.length === this.leaveTypes.length) {
      this.deptUtilLeaveTypes = [];
    } else {
      this.deptUtilLeaveTypes = [...this.leaveTypes];
    }
    this.updateDepartmentUtilizationChart();
  }

  toggleDistFilter(dept: string) {
    if (this.distChartDepartments.includes(dept)) {
      this.distChartDepartments = this.distChartDepartments.filter(d => d !== dept);
    } else {
      this.distChartDepartments.push(dept);
    }
    this.updateLeaveDistributionChart();
  }

  toggleSelectAllDistFilters() {
    if (this.distChartDepartments.length === this.departments.length) {
      this.distChartDepartments = [];
    } else {
      this.distChartDepartments = [...this.departments];
    }
    this.updateLeaveDistributionChart();
  }

  togglePlannedFilter(dept: string) {
    if (this.plannedVsUnplannedDepts.includes(dept)) {
      this.plannedVsUnplannedDepts = this.plannedVsUnplannedDepts.filter(d => d !== dept);
    } else {
      this.plannedVsUnplannedDepts.push(dept);
    }
    this.updatePlannedVsUnplannedChart();
  }

  toggleSelectAllPlannedFilters() {
    if (this.plannedVsUnplannedDepts.length === this.departments.length) {
      this.plannedVsUnplannedDepts = [];
    } else {
      this.plannedVsUnplannedDepts = [...this.departments];
    }
    this.updatePlannedVsUnplannedChart();
  }

  toggleSelectAllTopEmpFilters() {
    if (this.topEmpLeaveTypes.length === this.leaveTypes.length) {
      this.topEmpLeaveTypes = [];
    } else {
      this.topEmpLeaveTypes = [...this.leaveTypes];
    }
    this.updateTopEmployeesChart();
  }

  updateTopEmployees() {
    this.updateTopEmployeesChart();
  }

  updateDepartmentUtilization() {
    this.updateDepartmentUtilizationChart();
  }

  updatePlannedVsUnplanned() {
    this.updatePlannedVsUnplannedChart();
  }

  // Method to handle month/year changes
  onMonthYearChange() {
    console.log(`📅 Month/Year changed to: ${this.months[this.selectedMonth]} ${this.selectedYear}`);
    // Re-process data with new month/year
    if (this.masterData.length > 0) {
      this.updateKPIData(this.masterData);
      this.updateAllCharts();
    }
  }
}