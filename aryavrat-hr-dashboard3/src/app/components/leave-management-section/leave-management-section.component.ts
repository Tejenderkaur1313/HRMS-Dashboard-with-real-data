import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartConfiguration, ChartType } from 'chart.js';
import { LeaveService, LeaveData } from '../services/leave.service';
import { GlobalFilterService } from '../services/global-filter.service';
import { DepartmentService, Department } from '../services/department.service';
import { TeamService, Team } from '../services/team.service';
import { Subject, takeUntil, combineLatest, map, distinctUntilChanged, switchMap } from 'rxjs';

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
        </div>

        <!-- Main Content - Only show when not loading -->
        <div *ngIf="!isLoadingData">
            <!-- KPI Row 1 -->
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Monthly Overview</h2>
            <div class="kpi-row">
                <div class="kpi-card leaves">
                  <div class="kpi-icon">
                    <i class="fas fa-calendar-alt"></i>
                  </div>
                  <div class="kpi-details">
                    <div class="kpi-value">{{ kpiData.totalLeavesMonth }}</div>
                    <div class="kpi-label">Total Leaves (This Month)</div>
                    <div class="kpi-trend positive">
                      <i class="fas fa-arrow-up"></i>
                      Based on approved requests
                    </div>
                  </div>
                </div>
                <div class="kpi-card employees">
                  <div class="kpi-icon">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div class="kpi-details">
                    <div class="kpi-value">{{ kpiData.avgLeavesWeekly }}</div>
                    <div class="kpi-label">Average Leaves (Weekly)</div>
                    <div class="kpi-trend positive">
                      <i class="fas fa-arrow-up"></i>
                      Average leaves taken per week
                    </div>
                  </div>
                </div>
                <div class="kpi-card leaves">
                  <div class="kpi-icon">
                    <i class="fas fa-clock"></i>
                  </div>
                  <div class="kpi-details">
                    <div class="kpi-value">{{ kpiData.pendingApprovals }}</div>
                    <div class="kpi-label">Pending Approvals</div>
                    <div class="kpi-trend negative">
                      <i class="fas fa-arrow-down"></i>
                      Avg 1.5 days to process
                    </div>
                  </div>
                </div>
                <div class="kpi-card performance">
                  <div class="kpi-icon">
                    <i class="fas fa-check-circle"></i>
                  </div>
                  <div class="kpi-details">
                    <div class="kpi-value">{{ kpiData.approvalRate }}</div>
                    <div class="kpi-label">Approval Rate</div>
                    <div class="kpi-trend positive">
                      <i class="fas fa-arrow-up"></i>
                      Manager approval rate monthly
                    </div>
                  </div>
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
                    </div>
                    <div id="department-utilization-chart" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="departmentUtilizationData" [options]="departmentUtilizationOptions" type="bar"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Department Utilization Chart</div>
                    </div>
                </div>

                <!-- Chart 4: Planned vs Unplanned Leaves -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <div class="chart-header">
                        <h3>Planned vs Unplanned</h3>
                        <div class="chart-actions">
                            <select [(ngModel)]="plannedVsUnplannedTimeRange" (ngModelChange)="updatePlannedVsUnplanned()" class="time-filter">
                                <option>Last Week</option>
                                <option>Last Month</option>
                                <option>Last 3 Months</option>
                                <option>YTD</option>
                            </select>
                        </div>
                    </div>
                    <div id="planned-vs-unplanned-chart" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="plannedVsUnplannedData" [options]="plannedVsUnplannedOptions" type="pie"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Planned vs Unplanned Chart</div>
                    </div>
                </div>
            </div>


             <!-- Dedicated Section: Top Employees Current Period -->
            <div class="mt-6">
              <div class="bg-white p-5 rounded-xl shadow chart-card w-full">
                <div class="mb-4">
                  <h3 class="text-lg font-semibold text-gray-900">Top Employees (Current Period)</h3>
                </div>
                <ul class="space-y-3">
                  <li *ngFor="let emp of getTopThreeEmployees(); let i = index" class="flex justify-between items-center text-sm p-2 rounded-md bg-gray-100">
                    <span class="font-medium text-gray-700">{{ i + 1 }}. {{ emp.name }}:&nbsp;&nbsp;&nbsp;{{ emp.leaveCount }} leaves</span>
                  </li>
                </ul>
              </div>
            </div>

        </div>
    </div>
  `,
  styles: [`
    /* Define color variables to match dashboard */
    :host {
      --primary-color: #4f46e5;
      --primary-light: #818cf8;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --border-color: #e5e7eb;
      --bg-light: #f9fafb;
      --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --border-radius: 12px;
    }

    /* KPI Row - Exact match to Dashboard Overview */
    .kpi-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin-bottom: 2rem;
      justify-content: space-between;
      
      @media (max-width: 767px) {
        flex-direction: column;
      }
      
      @media (min-width: 768px) and (max-width: 1023px) {
        justify-content: flex-start;
      }
      
      @media (min-width: 1024px) {
        justify-content: space-between;
        flex-wrap: nowrap;
      }
    }

    /* KPI Card - Exact match to dashboard */
    .kpi-card {
      background: white;
      border-radius: var(--border-radius);
      padding: 7px 6.5px 8px;
      box-shadow: var(--card-shadow);
      display: flex;
      align-items: left;
      transition: transform 0.2s, box-shadow 0.2s;
      flex: 1;
      min-width: 0;
      
      @media (max-width: 767px) {
        flex: 1 1 100%;
      }
      
      @media (min-width: 768px) and (max-width: 1023px) {
        flex: 1 1 calc(50% - 0.625rem);
      }
      
      @media (min-width: 1024px) {
        flex: 1 1 calc(25% - 0.9375rem);
        max-width: calc(25% - 0.9375rem);
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      
      .kpi-icon {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        font-size: 1.5rem;
        color: white;
        
        i {
          font-size: 1.5rem;
        }
      }
      
      .kpi-details {
        flex: 1;
      }
      
      .kpi-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
        margin-bottom: 0.25rem;
        
        .rating-out-of {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-left: 0.25rem;
        }
      }
      
      .kpi-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }
      
      .kpi-trend {
        display: flex;
        align-items: center;
        font-size: 0.75rem;
        font-weight: 500;
        
        i {
          font-size: 0.75rem;
          margin-right: 0.25rem;
        }
        
        &.positive {
          color: var(--success-color);
        }
        
        &.negative {
          color: var(--danger-color);
        }
      }
      
      // Card specific styles - exact match to dashboard
      &.attendance {
        border-left: 4px solid #4f46e5;
        
        .kpi-icon {
          background: linear-gradient(135deg, #4f46e5 0%, #818cf8 100%);
        }
      }
      
      &.employees {
        border-left: 4px solid #10b981;
        
        .kpi-icon {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        }
      }
      
      &.leaves {
        border-left: 4px solid #f59e0b;
        
        .kpi-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
        }
      }
      
      &.performance {
        border-left: 4px solid #8b5cf6;
        
        .kpi-icon {
          background: linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%);
        }
      }
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
    /* Chart Header Styles */
    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .chart-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }
    
    .chart-actions {
        display: flex;
        gap: 0.75rem;
    }
    
    .time-filter {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        color: #6b7280;
        cursor: pointer;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding-right: 2rem;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
    }
    
    .time-filter:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
    }
    
    .time-filter:hover {
        border-color: #d1d5db;
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
  isBrowser: boolean = false;
  isLoadingData: boolean = true;
  loadingMessage: string = 'Loading leave data...';
  masterData: any[] = [];
  departments: string[] = [];
  leaveTypes: string[] = [];
  selectedYear: number = new Date().getFullYear();
  selectedMonth: string = 'All';
  selectedDepartment: string = 'All';
  // API Response Properties
  totalLeaves: number = 0;
  approvedLeaves: number = 0;
  pendingLeaves: number = 0;
  rejectedLeaves: number = 0;
  leavesByDepartment: { name: string; value: number }[] = [];
  leavesByType: { name: string; value: number }[] = [];
  leaveTrend: { name: string; series: { name: string; value: number }[] }[] = [];
  allLeaveTypes: string[] = [];
  recentLeaves: { employee_name: string; leave_type: string; status: string; from_date: string }[] = [];

  // Available options for dropdowns
  months: string[] = [];

  // KPI Data
  kpiData: any = undefined;

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
    datasets: []
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
      data: [1, 1, 1, 1],
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'],
      borderColor: ['#dc2626', '#d97706', '#059669', '#4b5563'],
      borderWidth: 2
    }]
  };

  leaveDistributionOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: null as any
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        enabled: true,
        external: function(context: any) {
          // Keep tooltips but disable hover effects
        },
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}`;
          }
        }
      }
    },
    datasets: {
      pie: {
        hoverBackgroundColor: function(ctx: any) {
          return ctx.element.options.backgroundColor;
        },
        hoverBorderColor: function(ctx: any) {
          return ctx.element.options.borderColor;
        },
        hoverBorderWidth: function(ctx: any) {
          return ctx.element.options.borderWidth;
        }
      }
    },
    cutout: '60%'
  };

  departmentUtilizationData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  departmentUtilizationOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 11 },
          padding: 15,
          usePointStyle: true,
          boxWidth: 12
        }
      }
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          font: { size: 10 },
          stepSize: 1,
          precision: 0
        }
      },
      x: {
        stacked: true,
        ticks: {
          font: { size: 11 },
          maxRotation: 25,
          minRotation: 0
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 0, left: 10, right: 10 }
    }
  };

  plannedVsUnplannedData: ChartData<'pie'> = {
    labels: ['Planned', 'Unplanned'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#8b5cf6', '#f97316'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  plannedVsUnplannedOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
          boxWidth: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
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
    private leaveService: LeaveService,
    private globalFilterService: GlobalFilterService,
    private departmentService: DepartmentService,
    private teamService: TeamService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    
    // Load departments and teams data first
    this.loadDepartmentsAndTeams();

    // Subscribe to global filter changes for real API data only
    this.globalFilterService.filters$.pipe(
      takeUntil(this.destroy$),
      switchMap((filters: any) => {
                this.isLoadingData = true;
        this.loadingMessage = 'Loading leave data...';
        return this.leaveService.getLeaveData(filters.fromDate, filters.toDate);
      })
    ).subscribe({
      next: (data: LeaveData) => {
                this.processLeaveData(data);
        this.isLoadingData = false;
      },
      error: (error: any) => {
        console.error('❌ Leave API error:', error);
        this.loadingMessage = 'Failed to load leave data from API. Please check connection.';
        this.isLoadingData = false;
        // No fallback to mock data - show error state
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDepartmentsAndTeams(): void {
        
    // Load departments
    this.departmentService.getDepartments().subscribe({
      next: (departments: Department[]) => {
                this.departments = departments.map(d => d.name);
        this.distChartDepartments = [...this.departments];
        this.plannedVsUnplannedDepts = [...this.departments];
      },
      error: (error: any) => {
        console.error('❌ Failed to load departments:', error);
      }
    });
    
    // Load teams
    this.teamService.getTeamData().subscribe({
      next: (teams: Team[]) => {
                // You can use team data for employee-specific leave analytics
      },
      error: (error: any) => {
        console.error('❌ Failed to load team data:', error);
      }
    });
  }

  // Data loading is now handled by the global filter subscription

  private processLeaveData(data: LeaveData): void {
        
    // Store API response data in component properties
    this.totalLeaves = data.totalLeaves;
    this.approvedLeaves = data.approvedLeaves;
    this.pendingLeaves = data.pendingLeaves;
    this.rejectedLeaves = data.rejectedLeaves;
    this.leavesByDepartment = data.leavesByDepartment || [];
    this.leavesByType = data.leavesByType || [];
    this.leaveTrend = data.leaveTrend || [];
    this.recentLeaves = data.recentLeaves || [];
    this.allLeaveTypes = data.leavesByType.map(lt => lt.name);
    
    // Calculate monthly approval rate
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Filter leaves for current month
    const monthlyLeaves = data.recentLeaves?.filter((leave: any) => {
      if (leave.created_at || leave.date || leave.leave_date) {
        const leaveDate = new Date(leave.created_at || leave.date || leave.leave_date);
        return leaveDate.getMonth() + 1 === currentMonth && leaveDate.getFullYear() === currentYear;
      }
      return false;
    }) || [];
    
    const monthlyApproved = monthlyLeaves.filter((leave: any) => 
      leave.status === 'approved' || leave.status === 'Approved'
    ).length;
    
    const monthlyTotal = monthlyLeaves.length;
    const monthlyApprovalRate = monthlyTotal > 0 ? Math.round((monthlyApproved / monthlyTotal) * 100) : 0;
    
    // Update KPI data
    this.kpiData = {
      totalLeavesMonth: data.totalLeaves,
      avgLeavesWeekly: Math.round(data.totalLeaves / 4),
      pendingApprovals: data.pendingLeaves,
      approvalRate: `${monthlyApprovalRate}%`,
      rejectionRate: `${Math.round((data.rejectedLeaves / data.totalLeaves) * 100)}%`
    };
    
    // Update master data and departments
    this.masterData = data.recentLeaves;
    if (data.leavesByDepartment && data.leavesByDepartment.length > 0) {
      this.departments = data.leavesByDepartment.map(d => d.name);
    }
    this.distChartDepartments = [...this.departments];
    this.plannedVsUnplannedDepts = [...this.departments];

    // Update charts with new data
    this.updateAllCharts();

      }


  private updateAllCharts() {
        this.updateLeaveTrendChart();
    this.updateLeaveDistributionChart();
    this.updateDepartmentUtilizationChart();
    this.updatePlannedVsUnplannedChart();
    this.updateTopEmployeesChart();
      }

  private updateLeaveTrendChart() {
    if (!this.masterData || this.masterData.length === 0) return;

    // Get current filter dates to determine the selected month/period
    const currentFilters = this.globalFilterService.getCurrentFilters();
    const fromDate = new Date(currentFilters.fromDate);
    const toDate = new Date(currentFilters.toDate);
    
    // Check if the date range is within a single month
    const isSameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
    
    if (isSameMonth) {
      // Show weekly data for the selected month
      this.updateWeeklyLeaveTrendChart(fromDate, toDate);
    } else {
      // Show monthly data for multi-month ranges
      this.updateMonthlyLeaveTrendChart();
    }
  }

  private updateWeeklyLeaveTrendChart(fromDate: Date, toDate: Date) {
    const weeklyData: { [week: string]: { [leaveType: string]: number } } = {};
    
    // Generate week labels for the month
    const monthStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const monthEnd = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
    
    // Calculate weeks in the month
    const weeks: string[] = [];
    let weekNumber = 1;
    let currentWeekStart = new Date(monthStart);
    
    while (currentWeekStart <= monthEnd) {
      const weekLabel = `Week ${weekNumber}`;
      weeks.push(weekLabel);
      weeklyData[weekLabel] = {};
      
      // Initialize all leave types for this week
      this.allLeaveTypes.forEach(type => {
        weeklyData[weekLabel][type] = 0;
      });
      
      // Move to next week (7 days)
      currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      weekNumber++;
    }

    // Process leave data and assign to appropriate weeks
    this.masterData.forEach(item => {
      const leaveDate = new Date(item.from_date);
      
      // Check if leave is within the current month
      if (leaveDate.getMonth() === fromDate.getMonth() && leaveDate.getFullYear() === fromDate.getFullYear()) {
        // Calculate which week this leave belongs to
        const dayOfMonth = leaveDate.getDate();
        const weekIndex = Math.ceil(dayOfMonth / 7) - 1;
        const weekLabel = weeks[weekIndex];
        
        if (weekLabel && weeklyData[weekLabel] && item.leave_type) {
          weeklyData[weekLabel][item.leave_type] = (weeklyData[weekLabel][item.leave_type] || 0) + 1;
        }
      }
    });

    // Update chart data
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#14b8a6'];
    this.leaveTrendData.labels = weeks;
    this.leaveTrendData.datasets = this.allLeaveTypes.map((type, index) => ({
      label: type,
      data: weeks.map(week => weeklyData[week][type] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}1A`,
      tension: 0.4,
      fill: true
    }));
  }

  private updateMonthlyLeaveTrendChart() {
    const monthlyData: { [month: string]: { [leaveType: string]: number } } = {};
    const labels = [...new Set(this.masterData.map(item => new Date(item.from_date).toLocaleString('default', { month: 'short' })))]
      .sort((a, b) => new Date(`1 ${a} 2000`) > new Date(`1 ${b} 2000`) ? 1 : -1);

    labels.forEach(month => {
      monthlyData[month] = {};
      this.allLeaveTypes.forEach(type => {
        monthlyData[month][type] = 0;
      });
    });

    this.masterData.forEach(item => {
      const month = new Date(item.from_date).toLocaleString('default', { month: 'short' });
      if (monthlyData[month]) {
        monthlyData[month][item.leave_type] = (monthlyData[month][item.leave_type] || 0) + 1;
      }
    });

    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#14b8a6'];
    this.leaveTrendData.labels = labels;
    this.leaveTrendData.datasets = this.allLeaveTypes.map((type, index) => ({
      label: type,
      data: labels.map(month => monthlyData[month][type] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}1A`,
      tension: 0.4,
      fill: true
    }));
  }

  private updateLeaveDistributionChart() {
    
    // Use real data from API response
    if (this.leavesByType && this.leavesByType.length > 0) {
      // Use actual leave type names and values from API
      this.leaveDistributionData.labels = this.leavesByType.map(item => item.name);
      this.leaveDistributionData.datasets[0].data = this.leavesByType.map(item => item.value);
      
      // Generate colors dynamically based on number of leave types
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#6b7280', '#8b5cf6', '#f97316', '#06b6d4'];
      const borderColors = ['#dc2626', '#d97706', '#059669', '#4b5563', '#7c3aed', '#ea580c', '#0891b2'];
      
      this.leaveDistributionData.datasets[0].backgroundColor = this.leavesByType.map((_, i) => colors[i % colors.length]);
      this.leaveDistributionData.datasets[0].borderColor = this.leavesByType.map((_, i) => borderColors[i % borderColors.length]);
    } else {
      // Show empty state when no data
      this.leaveDistributionData.labels = ['No Data'];
      this.leaveDistributionData.datasets[0].data = [1];
      this.leaveDistributionData.datasets[0].backgroundColor = ['#e5e7eb'];
      this.leaveDistributionData.datasets[0].borderColor = ['#d1d5db'];
    }
  }

  private updateDepartmentUtilizationChart() {
    
    // Use real department data from API
    if (this.leavesByDepartment && this.leavesByDepartment.length > 0) {
      // Use actual department names from API (now properly mapped)
      const departmentNames = this.leavesByDepartment.map(dept => dept.name);
      this.departmentUtilizationData.labels = departmentNames;
      
      // Rebuild the data structure for the stacked bar chart
      const leaveTypesByDept: { [deptName: string]: { [leaveType: string]: number } } = {};

      // Initialize the structure with all departments and leave types
      departmentNames.forEach(deptName => {
        leaveTypesByDept[deptName] = {};
        this.allLeaveTypes.forEach(leaveType => {
          leaveTypesByDept[deptName][leaveType] = 0;
        });
      });

      // Populate the structure with actual leave counts from masterData
      this.masterData.forEach(leave => {
        if (leave.department_name && leaveTypesByDept[leave.department_name] && leave.leave_type) {
          leaveTypesByDept[leave.department_name][leave.leave_type]++;
        }
      });

      const colors = ['#ef4444', '#3b82f6', '#22c55e', '#6b7280', '#8b5cf6', '#f97316'];
      this.departmentUtilizationData.datasets = this.allLeaveTypes.map((leaveType, index) => ({
        label: leaveType,
        data: departmentNames.map(deptName => leaveTypesByDept[deptName][leaveType] || 0),
        backgroundColor: colors[index % colors.length],
        stack: 'a',
      }));

      this.departments = departmentNames;
    } else {
      // Show empty state when no data
      this.departmentUtilizationData.labels = ['No Data'];
      this.departmentUtilizationData.datasets = [{
        label: 'No Leaves',
        data: [0],
        backgroundColor: '#e5e7eb'
      }];
      this.departments = [];
    }
    
    this.distChartDepartments = [...this.departments];
    this.plannedVsUnplannedDepts = [...this.departments];
  }


  private getDepartmentFromEmployee(employeeName: string): string {
    // Map employee to department - you can enhance this based on your data structure
    // For now, using a simple mapping or default to first department
    return this.departments[0] || 'General';
  }

  private updatePlannedVsUnplannedChart() {
    if (!this.masterData || this.masterData.length === 0) {
      this.plannedVsUnplannedData.datasets[0].data = [0, 0];
      return;
    }

    // Filter data based on selected time range
    const filteredData = this.filterDataByTimeRange(this.masterData, this.plannedVsUnplannedTimeRange);
    
    // Analyze leave data to determine planned vs unplanned
    let plannedCount = 0;
    let unplannedCount = 0;
    
    filteredData.forEach(leave => {
      // Consider leaves as planned if they were requested more than 3 days in advance
      // or if leave_type indicates planned leave (like 'Annual', 'Vacation', etc.)
      const requestDate = new Date(leave.created_at || leave.request_date);
      const leaveStartDate = new Date(leave.from_date);
      const daysInAdvance = Math.ceil((leaveStartDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const plannedLeaveTypes = ['annual', 'vacation', 'planned', 'holiday'];
      const unplannedLeaveTypes = ['sick', 'emergency', 'medical', 'urgent'];
      
      const leaveType = (leave.leave_type || '').toLowerCase();
      
      if (daysInAdvance >= 3 || plannedLeaveTypes.some(type => leaveType.includes(type))) {
        plannedCount++;
      } else if (daysInAdvance < 3 || unplannedLeaveTypes.some(type => leaveType.includes(type))) {
        unplannedCount++;
      } else {
        // Default classification based on advance notice
        if (daysInAdvance >= 1) {
          plannedCount++;
        } else {
          unplannedCount++;
        }
      }
    });

    this.plannedVsUnplannedData.datasets[0].data = [plannedCount, unplannedCount];
  }

  private filterDataByTimeRange(data: any[], timeRange: string): any[] {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'Last Week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'YTD':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return data.filter(leave => {
      const leaveDate = new Date(leave.from_date);
      return leaveDate >= startDate && leaveDate <= now;
    });
  }

  private updateTopEmployeesChart() {
    
    // Use real recent leaves data from API, filtered by current selected date range
    if (this.recentLeaves && this.recentLeaves.length > 0) {
      // Get current filter dates to match the selected month/period
      const currentFilters = this.globalFilterService.getCurrentFilters();
      const fromDate = new Date(currentFilters.fromDate);
      const toDate = new Date(currentFilters.toDate);
      
      // Filter recent leaves to only include those within the selected date range
      const filteredLeaves = this.recentLeaves.filter(leave => {
        if (leave.from_date) {
          const leaveDate = new Date(leave.from_date);
          return leaveDate >= fromDate && leaveDate <= toDate;
        }
        return false;
      });
      
      // Count leaves per employee from filtered data
      const employeeLeaveCount: { [key: string]: number } = {};
      filteredLeaves.forEach(leave => {
        const name = leave.employee_name;
        employeeLeaveCount[name] = (employeeLeaveCount[name] || 0) + 1;
      });

      // Sort and get top 5
      const topEmployees = Object.entries(employeeLeaveCount)
        .map(([name, days]) => ({ name, days }))
        .sort((a, b) => b.days - a.days)
        .slice(0, 5);

      // Update lastMonthTopEmployees with leaveCount property and limit to 3
      this.lastMonthTopEmployees = topEmployees.slice(0, 3).map(emp => ({
        name: emp.name,
        leaveCount: emp.days
      }));
    }
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
    const monthIndex = typeof this.selectedMonth === 'string' ? parseInt(this.selectedMonth, 10) : this.selectedMonth;
    const monthName = this.months[monthIndex] || this.selectedMonth;
        // Re-process data with new month/year - data will be reloaded via global filter subscription
  }

  getTopThreeEmployees(): any[] {
    return this.lastMonthTopEmployees.slice(0, 3);
  }
}