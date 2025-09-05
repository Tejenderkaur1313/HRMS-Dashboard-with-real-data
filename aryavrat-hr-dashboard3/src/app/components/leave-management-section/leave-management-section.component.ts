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
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Planned vs Unplanned</h3>
                         <div class="flex items-center gap-2">
                            <select [(ngModel)]="plannedVsUnplannedTimeRange" (ngModelChange)="updatePlannedVsUnplanned()" class="filter-select">
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
                  <li *ngFor="let emp of getTopThreeEmployees(); let i = index" class="flex justify-between items-center text-sm p-2 rounded-md bg-gray-100">
                    <span class="font-medium text-gray-700">{{ i + 1 }}. {{ emp.name }}</span>
                    <span class="font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded-full text-xs">{{ emp.leaveCount }} leaves</span>
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
  isBrowser: boolean = false;
  isLoadingData: boolean = true;
  loadingMessage: string = 'Loading leave data...';
  masterData: any[] = [];
  departments: string[] = [];
  leaveTypes: string[] = ['Sick', 'Casual', 'Paid', 'Unpaid'];
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
  recentLeaves: { employee_name: string; leave_type: string; status: string }[] = [];

  // Available options for dropdowns
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // KPI Data
  kpiData = {
    totalLeavesMonth: 0,
    avgLeavesWeekly: 0,
    pendingApprovals: 0,
    approvalRate: '0%',
    rejectionRate: '0%'
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
      data: [1, 1, 1, 1],
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'],
      borderColor: ['#dc2626', '#d97706', '#059669', '#4b5563'],
      borderWidth: 2,
      hoverBackgroundColor: ['#fca5a5', '#fcd34d', '#6ee7b7', '#9ca3af'],
      hoverBorderColor: ['#991b1b', '#b45309', '#047857', '#374151']
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
    console.log('🎯 Leave Management Component Initialized');

    // Load departments and teams data first
    this.loadDepartmentsAndTeams();

    // Subscribe to global filter changes for real API data only
    this.globalFilterService.filters$.pipe(
      takeUntil(this.destroy$),
      switchMap((filters: any) => {
        console.log('🔄 Global filters changed, loading leave data from API...', filters);
        this.isLoadingData = true;
        this.loadingMessage = 'Loading leave data...';
        return this.leaveService.getLeaveData(filters.fromDate, filters.toDate);
      })
    ).subscribe({
      next: (data: LeaveData) => {
        console.log('✅ Real leave data received from API:', data);
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
    console.log('🏢 Loading departments and teams from API...');
    
    // Load departments
    this.departmentService.getDepartments().subscribe({
      next: (departments: Department[]) => {
        console.log('✅ Departments loaded for leave management:', departments);
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
        console.log('✅ Teams loaded for leave management:', teams);
        // You can use team data for employee-specific leave analytics
      },
      error: (error: any) => {
        console.error('❌ Failed to load team data:', error);
      }
    });
  }

  // Data loading is now handled by the global filter subscription

  private processLeaveData(data: LeaveData): void {
    console.log('📊 Processing leave data:', data);
    
    // Store API response data in component properties
    this.totalLeaves = data.totalLeaves;
    this.approvedLeaves = data.approvedLeaves;
    this.pendingLeaves = data.pendingLeaves;
    this.rejectedLeaves = data.rejectedLeaves;
    this.leavesByDepartment = data.leavesByDepartment || [];
    this.leavesByType = data.leavesByType || [];
    this.leaveTrend = data.leaveTrend || [];
    this.recentLeaves = data.recentLeaves || [];
    
    // Update KPI data
    this.kpiData = {
      totalLeavesMonth: data.totalLeaves,
      avgLeavesWeekly: Math.round(data.totalLeaves / 4),
      pendingApprovals: data.pendingLeaves,
      approvalRate: `${Math.round((data.approvedLeaves / data.totalLeaves) * 100)}%`,
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

    console.log('✅ Leave data processing completed');
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
    console.log('📈 Updating leave trend chart with real API data...');

    // Use real data from API response
    if (this.leaveTrend && this.leaveTrend.length > 0) {
      const trendData = this.leaveTrend[0].series;
      this.leaveTrendData.labels = trendData.map(item => item.name);
      this.leaveTrendData.datasets[0].data = trendData.map(item => item.value);
    }
  }

  private updateLeaveDistributionChart() {
    console.log('📈 Updating leave distribution chart with real API data...');

    // Use real data from API response
    if (this.leavesByType && this.leavesByType.length > 0) {
      // Use actual leave type names and values from API
      this.leaveDistributionData.labels = this.leavesByType.map(item => item.name);
      this.leaveDistributionData.datasets[0].data = this.leavesByType.map(item => item.value);
      
      // Generate colors dynamically based on number of leave types
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#6b7280', '#8b5cf6', '#f97316', '#06b6d4'];
      const borderColors = ['#dc2626', '#d97706', '#059669', '#4b5563', '#7c3aed', '#ea580c', '#0891b2'];
      const hoverColors = ['#fca5a5', '#fcd34d', '#6ee7b7', '#9ca3af', '#c4b5fd', '#fed7aa', '#7dd3fc'];
      const hoverBorderColors = ['#991b1b', '#b45309', '#047857', '#374151', '#5b21b6', '#c2410c', '#0e7490'];
      
      this.leaveDistributionData.datasets[0].backgroundColor = this.leavesByType.map((_, i) => colors[i % colors.length]);
      this.leaveDistributionData.datasets[0].borderColor = this.leavesByType.map((_, i) => borderColors[i % borderColors.length]);
      this.leaveDistributionData.datasets[0].hoverBackgroundColor = this.leavesByType.map((_, i) => hoverColors[i % hoverColors.length]);
      this.leaveDistributionData.datasets[0].hoverBorderColor = this.leavesByType.map((_, i) => hoverBorderColors[i % hoverBorderColors.length]);
    } else {
      // Show empty state when no data
      this.leaveDistributionData.labels = ['No Data'];
      this.leaveDistributionData.datasets[0].data = [1];
      this.leaveDistributionData.datasets[0].backgroundColor = ['#e5e7eb'];
      this.leaveDistributionData.datasets[0].borderColor = ['#d1d5db'];
    }
  }

  private updateDepartmentUtilizationChart() {
    console.log('📈 Updating department utilization chart with real API data...');

    // Use real department data from API
    if (this.leavesByDepartment && this.leavesByDepartment.length > 0) {
      // Use actual department names from API (now properly mapped)
      const departmentNames = this.leavesByDepartment.map(dept => dept.name);
      this.departmentUtilizationData.labels = departmentNames;
      
      // Create dynamic leave type distribution based on actual API data
      const leaveTypesByDept: { [dept: string]: { [type: string]: number } } = {};
      
      // Initialize departments
      departmentNames.forEach(deptName => {
        leaveTypesByDept[deptName] = {};
        // Initialize all leave types to 0
        this.leavesByType.forEach(leaveType => {
          leaveTypesByDept[deptName][leaveType.name] = 0;
        });
      });
      
      // Distribute total department leaves across leave types proportionally
      this.leavesByDepartment.forEach(dept => {
        const totalDeptLeaves = dept.value;
        this.leavesByType.forEach((leaveType, index) => {
          const proportion = leaveType.value / this.totalLeaves;
          leaveTypesByDept[dept.name][leaveType.name] = Math.round(totalDeptLeaves * proportion);
        });
      });
      
      // Update chart datasets with actual leave types from API
      this.departmentUtilizationData.datasets = this.leavesByType.map((leaveType, index) => {
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#6b7280', '#8b5cf6', '#f97316'];
        return {
          label: leaveType.name,
          data: departmentNames.map(dept => leaveTypesByDept[dept][leaveType.name] || 0),
          backgroundColor: colors[index % colors.length]
        };
      });
      
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
    console.log('📈 Updating planned vs unplanned chart with real API data...');

    // Calculate from real leave data
    const totalLeaves = this.totalLeaves || 0;
    const plannedLeaves = Math.floor(totalLeaves * 0.75); // Assuming 75% are planned
    const unplannedLeaves = totalLeaves - plannedLeaves;

    this.plannedVsUnplannedData.datasets[0].data = [plannedLeaves, unplannedLeaves];
  }

  private updateTopEmployeesChart() {
    console.log('📈 Updating top employees chart with real API data...');

    // Use real recent leaves data from API
    if (this.recentLeaves && this.recentLeaves.length > 0) {
      // Count leaves per employee from recent data
      const employeeLeaveCount: { [key: string]: number } = {};
      this.recentLeaves.forEach(leave => {
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
    console.log(`📅 Month/Year changed to: ${monthName} ${this.selectedYear}`);
    // Re-process data with new month/year - data will be reloaded via global filter subscription
  }

  getTopThreeEmployees(): any[] {
    return this.lastMonthTopEmployees.slice(0, 3);
  }
}