import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartConfiguration } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-attendance-section',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Dashboard Header -->
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">📊 Attendance & Productivity Analytics Dashboard</h1>
            <p class="text-gray-500 mt-1">Real-time insights into workforce attendance and productivity patterns.</p>
        </header>

        <!-- Loading State -->
        <div *ngIf="isLoadingData" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-gray-600 text-lg">{{ loadingMessage }}</p>
            <p class="text-gray-400 text-sm mt-2">Processing your July month data...</p>
        </div>

        <!-- Main Content - Only show when not loading -->
        <div *ngIf="!isLoadingData">
            <!-- KPI Row 1: Workforce Overview -->
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Workforce Overview</h2>
            <div class="kpi-row">
                <div class="kpi-card" style="border-left-color: var(--primary-accent);">
                    <div class="kpi-value">{{ attendanceStats.totalEmployees }}</div>
                    <div class="kpi-label">Total Employees</div>
                    <div class="kpi-trend">Active workforce</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--warning);">
                    <div class="kpi-value">{{ attendanceStats.avgProductiveHours }}h</div>
                    <div class="kpi-label">Avg Productive Hours</div>
                    <div class="kpi-trend">Daily average</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--success);">
                    <div class="kpi-value">{{ attendanceStats.deskTimeTrend }}%</div>
                    <div class="kpi-label">Efficiency Rate</div>
                    <div class="kpi-trend">Productivity efficiency</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--purple);">
                    <div class="kpi-value">{{ attendanceStats.totalEmployees }}</div>
                    <div class="kpi-label">Active Employees</div>
                    <div class="kpi-trend">Currently active</div>
                </div>
            </div>

            <!-- KPI Row 2: Productivity Snapshot -->
            <h2 class="text-lg font-semibold text-gray-700 mt-6 mb-4">Productivity Snapshot</h2>
            <div class="kpi-row">
                 <div class="kpi-card" style="border-left-color: var(--teal);">
                    <div class="kpi-value">{{ attendanceStats.avgProductiveHours }}h</div>
                    <div class="kpi-label">Avg Productive Hours</div>
                    <div class="kpi-trend">Per employee</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--info);">
                    <div class="kpi-value">{{ attendanceStats.avgIdleTime }}h</div>
                    <div class="kpi-label">Avg Idle Time</div>
                    <div class="kpi-trend">Non-productive hours</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--warning);">
                    <div class="kpi-value">{{ attendanceStats.attendanceRate }}%</div>
                    <div class="kpi-label">Attendance Rate</div>
                    <div class="kpi-trend">Overall attendance</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--success);">
                    <div class="kpi-value">{{ attendanceStats.productivityTrend }}%</div>
                    <div class="kpi-label">Productivity Score</div>
                    <div class="kpi-trend">Performance metric</div>
                </div>
            </div>

            <!-- Charts Grid Container -->
            <div class="charts-grid-container mt-6">
                <!-- Chart 1: Weekly Trend -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Weekly Attendance & Productivity Trend</h3>
                        <div class="flex items-center gap-2">
                            <select [(ngModel)]="weeklyTrendDeptFilter" (ngModelChange)="onFilterChange('weekly')" class="filter-select">
                                <option value="All">All Departments</option>
                                <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
                            </select>
                            <select [(ngModel)]="weeklyTrendDateFilter" (ngModelChange)="onFilterChange('weekly')" class="filter-select">
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="quarter">Quarterly</option>
                            </select>
                        </div>
                    </div>
                    <div id="productivity-line-chart" style="height: 280px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="weeklyTrendData" [options]="weeklyTrendOptions" type="line"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Weekly Trend Chart</div>
                    </div>
                </div>

                <!-- Chart 2: Time Distribution -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Daily Time Distribution (Productive vs. Idle)</h3>
                    <div id="time-donut-chart" style="height: 280px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="timeDistributionData" [options]="donutOptions" type="doughnut"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Time Distribution Chart</div>
                    </div>
                </div>

                <!-- Chart 3: Correlation -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                     <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Attendance vs. Productivity Correlation</h3>
                        <div class="flex items-center gap-2">
                            <select [(ngModel)]="correlationDeptFilter" (ngModelChange)="onFilterChange('correlation')" class="filter-select">
                                <option value="All">All Departments</option>
                                <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
                            </select>
                            <select [(ngModel)]="correlationTimeFilter" (ngModelChange)="onFilterChange('correlation')" class="filter-select">
                                <option value="month">Monthly</option>
                                <option value="quarter">Quarterly</option>
                            </select>
                        </div>
                    </div>
                    <div id="scatter-chart-container" style="height: 280px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="attendanceCorrelationData" [options]="scatterOptions" type="scatter"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Correlation Chart</div>
                    </div>
                </div>

                <!-- Chart 4: Attendance Source -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Present vs. On Leave</h3>
                    <div id="hiring-chart-container" class="flex items-center justify-center" style="height: 200px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="attendanceSourceData" [options]="attendanceSourceOptions" type="doughnut"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Attendance Source Chart</div>
                    </div>
                    <div id="hiring-legend" class="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2"></div>
                </div>

                <!-- Chart 5: Department Productivity -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Department-wise Productivity & Attendance</h3>
                         <div class="flex items-center gap-2">
                            <select [(ngModel)]="deptProdTimeFilter" (ngModelChange)="onFilterChange('department')" class="filter-select">
                                <option value="month">Monthly</option>
                                <option value="quarter">Quarterly</option>
                            </select>
                        </div>
                    </div>
                    <div id="bubble-bar-chart-container" style="height: 280px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="departmentProductivityData" [options]="bubbleBarOptions" type="bar"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Department Productivity Chart</div>
                    </div>
                </div>

                <!-- Chart 6: Team Productivity -->
                <div class="bg-white p-5 rounded-xl shadow chart-card">
                     <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Team-wise Monthly Productivity Levels</h3>
                         <div class="flex items-center gap-2">
                            <select [(ngModel)]="teamProdTimeFilter" (ngModelChange)="onFilterChange('team')" class="filter-select">
                                <option value="year">Yearly</option>
                                <option value="quarter">Quarterly</option>
                            </select>
                        </div>
                    </div>
                    <div id="satisfaction-chart-container" style="height: 300px;">
                        <canvas *ngIf="isBrowser" baseChart [data]="teamProductivityData" [options]="teamProductivityOptions" type="bar"></canvas>
                        <div *ngIf="!isBrowser" class="chart-placeholder">Team Productivity Chart</div>
                    </div>
                </div>
            </div>

            <!-- Full Width Bottom Section: Top Performers -->
            <div class="mt-6">
                 <div class="bg-white p-5 rounded-xl shadow chart-card w-full">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-2">
                        <h3 class="text-lg font-semibold text-gray-800">Top Consistent Employees (Attendance + Productivity)</h3>
                        <div class="flex items-center gap-2">
                            <select [(ngModel)]="topPerformersDeptFilter" (ngModelChange)="onFilterChange('topPerformers')" class="filter-select">
                               <option value="All">All Departments</option>
                               <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
                            </select>
                            <select [(ngModel)]="topPerformersTimeFilter" (ngModelChange)="onFilterChange('topPerformers')" class="filter-select">
                               <option value="all">All Time</option>
                               <option value="quarter">Last Quarter</option>
                               <option value="month">Last Month</option>
                            </select>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="w-full text-sm text-left text-gray-500">
                            <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-6 py-3">Employee</th>
                                    <th class="px-6 py-3">Department</th>
                                    <th class="px-6 py-3">Attendance %</th>
                                    <th class="px-6 py-3">Productive Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let employee of topEmployees" class="bg-white border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 font-medium text-gray-900">{{ employee.name }}</td>
                                    <td class="px-6 py-4">{{ employee.dept || 'Unknown' }}</td>
                                    <td class="px-6 py-4">{{ employee.attendance }}%</td>
                                    <td class="px-6 py-4">{{ employee.productiveHours }}h</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
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
    .table-container {
      max-height: 300px;
      overflow-y: auto;
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
  `]
})
export class AttendanceSectionComponent implements OnInit {

  private masterData: any[] = [];
  departments: string[] = [];
  isBrowser: boolean;

  // Loading state
  isLoadingData: boolean = true;
  loadingMessage: string = 'Loading attendance data...';

  // Filter States
  weeklyTrendDeptFilter: string = 'All';
  weeklyTrendDateFilter: string = 'week';
  correlationDeptFilter: string = 'All';
  correlationTimeFilter: string = 'month';
  deptProdTimeFilter: string = 'month';
  teamProdTimeFilter: string = 'year';
  topPerformersDeptFilter: string = 'All';
  topPerformersTimeFilter: string = 'all';

  // Attendance Statistics
  attendanceStats = {
    totalEmployees: 0,
    avgProductiveHours: 0,
    avgDeskTime: 0,
    avgIdleTime: 0,
    productivityTrend: 0,
    deskTimeTrend: 0,
    idleTrend: 0,
    attendanceRate: 0
  };

  // Top Performers
  topEmployees: any[] = [];

  // Insights
  attendanceInsights: any[] = [];
  
  // Chart Configurations (data and options) remain the same as in the original code
  // Weekly Attendance & Productivity Trend Chart
  weeklyTrendData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Avg Hours / Attendance %',
      data: [],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      tension: 0.4,
      borderWidth: 3,
      pointBackgroundColor: '#2563EB',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5
    }]
  };

  // Attendance vs. Productivity Correlation Chart
  attendanceCorrelationData: ChartConfiguration['data'] = {
    datasets: [{
      label: 'Attendance vs Productivity',
      data: [],
      borderColor: '#3B82F6',
      backgroundColor: '#3B82F6',
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  // Department-wise Productivity & Attendance Chart
  departmentProductivityData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Avg Productivity Hours',
      data: [],
      backgroundColor: ['#2563EB', '#0D9488', '#7C3AED', '#F59E0B', '#16A34A'],
      borderRadius: 4,
      borderSkipped: false
    }]
  };

  // Daily Time Distribution Chart
  timeDistributionData: ChartConfiguration['data'] = {
    labels: ['Productive Hours', 'Idle Hours', 'Leaves'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#14b8a6', '#f97316', '#ef4444'],
      borderWidth: 0,
      hoverBackgroundColor: ['#0d9488', '#ea580c', '#dc2626']
    }]
  };

  // Attendance Source Breakdown Chart
  attendanceSourceData: ChartData<'doughnut'> = {
    labels: ['Present', 'On Leave'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#059669', '#dc2626'],
      borderWidth: 2,
    }]
  };

  // Team-wise Monthly Productivity Levels Chart
  teamProductivityData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Avg Productivity Score',
      data: [],
      backgroundColor: ['#16A34A', '#2563EB', '#F59E0B', '#DC2626'],
      borderRadius: 4,
      borderSkipped: false
    }]
  };
    // Chart options (weeklyTrendOptions, scatterOptions, etc.) are unchanged...
  weeklyTrendOptions: ChartConfiguration['options'] = {
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

  scatterOptions: ChartConfiguration['options'] = {
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
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Attendance %'
        },
        ticks: {
          font: { size: 8 }
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Productivity Score'
        },
        ticks: {
          font: { size: 8 }
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  bubbleBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Avg Productivity Hours'
        },
        ticks: {
          font: { size: 8 }
        }
      },
      y: {
        title: {
          display: false
        },
        ticks: {
          font: { size: 8 }
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  donutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 8,
          usePointStyle: true,
          font: { size: 9 },
          boxWidth: 10,
          boxHeight: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };

  attendanceSourceOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
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

  teamProductivityOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Avg Productivity Score'
        },
        ticks: {
          font: { size: 8 }
        }
      },
      y: {
        title: {
          display: false
        },
        ticks: {
          font: { size: 8 }
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  };


  constructor(
    private dataService: DataService,
    private filterService: FilterService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    console.log('🎯 Attendance Section Component Initialized');
    this.filterService.globalFilters.subscribe(filters => {
      console.log('📊 Attendance Section: Filters received:', filters);
      this.loadMarchData(); // Call API when filters change
    });

    // Also call API immediately on component init
    this.loadMarchData();
  }

  private loadMarchData() {
    console.log('🔄 Attendance Section: Calling getMarchUserSummary API...');
      // Call the API to get July month attendance data
      this.dataService.getJulyAttendanceData().subscribe({
        next: (data: any[]) => {
          console.log('✅ July Attendance Data received:', data);
          console.log('📊 Data length:', data?.length || 0);
          console.log('🔍 Data type:', Array.isArray(data) ? 'Array' : typeof data);
          console.log('📋 First item sample:', data?.[0]);
          console.log('🏗️ Starting data processing for KPI cards and charts...');

          // Set loading to false when data arrives
          this.isLoadingData = false;
          this.loadingMessage = '';

          // Process the data (real API data)
          this.processData(data || []);
          console.log('🎯 Data processing completed - KPI cards and charts should now show real July attendance data!');
          console.log('🎯 Total Employees:', this.attendanceStats.totalEmployees);
          console.log('🎯 Avg Productive Hours:', this.attendanceStats.avgProductiveHours);
          console.log('🎯 Efficiency:', Math.round(this.attendanceStats.deskTimeTrend) + '%');
        },
        error: (error: any) => {
          console.error('❌ Failed to fetch July attendance data:', error);
          console.error('🔍 Error details:', error);

          // Set loading to false and show error state
          this.isLoadingData = false;
          this.loadingMessage = 'Failed to load attendance data. Please refresh the page.';

          // Fallback to empty data if API fails
          this.processData([]);
          console.error('📊 Showing empty state for attendance data');
        }
      });
  }

  private processData(data: any[]) {
    this.masterData = data;
    this.departments = [...new Set(data.map(d => d.dept).filter(Boolean))];
    this.updateStats(data);
    if (this.isBrowser) {
      this.updateCharts();
    }
    console.log('✅ Attendance data processing completed for March');
  }

  private updateStats(data: any[]) {
    if (data.length === 0) {
      console.log('⚠️ No data available for stats calculation');
      return;
    }

    console.log('📊 Calculating attendance stats from July data:', data.length, 'records');

    const uniqueEmployees = new Set(data.map(d => d.user_id || d.tbl_id || `${d.first_name}_${d.last_name}`)).size;
    console.log('👥 Unique employees found in July:', uniqueEmployees);

    // Calculate productive hours
    const totalProductiveHours = data.reduce((sum, d) => sum + (parseFloat(d.total_prod_time) || 0), 0);
    this.attendanceStats.avgProductiveHours = data.length > 0 ? Math.round((totalProductiveHours / data.length) * 10) / 10 : 0;
    console.log('🕒 Avg Productive Hours (July):', this.attendanceStats.avgProductiveHours);

    // Calculate desk time
    const totalDeskTime = data.reduce((sum, d) => sum + (parseFloat(d.total_desk_time) || 0), 0);
    this.attendanceStats.avgDeskTime = data.length > 0 ? Math.round((totalDeskTime / data.length) * 10) / 10 : 0;
    console.log('💼 Avg Desk Time (July):', this.attendanceStats.avgDeskTime);

    // Calculate idle time
    const totalIdleTime = data.reduce((sum, d) => sum + (parseFloat(d.total_idle_time) || 0), 0);
    this.attendanceStats.avgIdleTime = data.length > 0 ? Math.round((totalIdleTime / data.length) * 10) / 10 : 0;
    console.log('😴 Avg Idle Time (July):', this.attendanceStats.avgIdleTime);

    // Calculate efficiency (productive hours / desk time)
    this.attendanceStats.deskTimeTrend = this.attendanceStats.avgDeskTime > 0 ?
      Math.round((this.attendanceStats.avgProductiveHours / this.attendanceStats.avgDeskTime) * 100) : 0;
    console.log('📈 Efficiency Rate (July):', this.attendanceStats.deskTimeTrend + '%');

    // Calculate attendance rate
    const employeesWithDeskTime = data.filter(d => parseFloat(d.total_desk_time || 0) > 0).length;
    this.attendanceStats.attendanceRate = uniqueEmployees > 0 ?
      Math.round((employeesWithDeskTime / uniqueEmployees) * 100) : 0;
    console.log('📊 Attendance Rate (July):', this.attendanceStats.attendanceRate + '%');

    // Productivity trend
    const avgProductivity = data.reduce((sum, d) => sum + (parseFloat(d.prod_percentage) || 0), 0) / data.length;
    this.attendanceStats.productivityTrend = Math.round(avgProductivity || 85);

    // Set total employees
    this.attendanceStats.totalEmployees = uniqueEmployees;
    console.log('✅ July stats calculation completed');
  }

  private updateCharts() {
    console.log('📊 Updating charts with July data...');
    this.updateWeeklyTrendChart();
    this.updateTimeDistributionChart();
    console.log('✅ Charts updated with July data');
  }

  private updateWeeklyTrendChart() {
    console.log('📈 Updating weekly trend chart with March data...');
    // Simple implementation - show total productive hours by week
    const weeklyData = this.calculateWeeklyTrends(this.masterData, 'week');
    this.weeklyTrendData.labels = weeklyData.labels;
    this.weeklyTrendData.datasets[0].data = weeklyData.data;
  }

  private updateTimeDistributionChart() {
    console.log('📊 Updating time distribution chart with March data...');
    const productiveHours = this.masterData.reduce((sum, d) => sum + (parseFloat(d.total_prod_time) || 0), 0);
    const idleHours = this.masterData.reduce((sum, d) => sum + (parseFloat(d.total_idle_time) || 0), 0);

    this.timeDistributionData.datasets[0].data = [productiveHours, idleHours];
  }

  private calculateWeeklyTrends(data: any[], period: string): { labels: string[], data: number[] } {
    // Simple weekly calculation for March data
    const labels: string[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyData: number[] = [0, 0, 0, 0];

    data.forEach(record => {
      const weekNo = parseInt(record.week_no) || 1;
      if (weekNo >= 1 && weekNo <= 4) {
        weeklyData[weekNo - 1] += parseFloat(record.total_prod_time) || 0;
      }
    });

    return { labels, data: weeklyData };
  }

  // Filter change handler
  onFilterChange(chartType: string) {
    console.log('🔄 Filter changed for:', chartType);
    if (this.isBrowser) {
      this.updateCharts();
    }
  }

// ... (rest of the code remains the same)

  private calculateTeamProductivity(data: any[]): { labels: string[], data: number[] } {
    const teamStats = data.reduce((acc, record) => {
      const team = record.team || record.dept || 'Unknown';
      if (!acc[team]) acc[team] = { total: 0, productive: 0 };
      acc[team].total++;
      acc[team].productive += parseFloat(record.total_prod_time || 0);
      return acc;
    }, {});

    const teams = Object.keys(teamStats).sort((a,b) => teamStats[b].productive/teamStats[b].total - teamStats[a].productive/teamStats[a].total);
    const avgProd = teams.map(team => parseFloat((teamStats[team].productive / teamStats[team].total).toFixed(1)));
    return { labels: teams, data: avgProd };
  }

// ... (rest of the code remains the same)
  private calculateTimeDistribution(data: any[]): { data: number[] } {
    const totalProd = data.reduce((sum, d) => sum + parseFloat(d.total_prod_time || 0), 0);
    const totalIdle = data.reduce((sum, d) => sum + parseFloat(d.total_idle_time || 0), 0);
    const totalLeaves = data.reduce((sum, d) => sum + parseFloat(d.total_leave_time || 0), 0);
    return { data: [totalProd, totalIdle, totalLeaves] };
  }

  private calculateAttendanceSource(data: any[]): { data: number[] } {
    console.log('📊 Calculating attendance source data...');
    // Calculate present vs on leave
    const present = data.filter(d => parseFloat(d.total_desk_time || 0) > 0).length;
    const onLeave = data.filter(d => parseFloat(d.total_desk_time || 0) === 0 || d.lr_status === '1').length;

    console.log('✅ Present employees:', present);
    console.log('✅ On leave employees:', onLeave);

    return { data: [present, onLeave] };
  }

  private getTopPerformers(data: any[]) {
    const employeeStats = data.reduce((acc, d) => {
      const key = d.user_id || d.tbl_id || `${d.first_name}_${d.last_name}`;
      if (!acc[key]) {
        acc[key] = {
          name: d.first_name && d.last_name ? `${d.first_name} ${d.last_name}` : `User ${d.user_id || d.tbl_id}`,
          totalProd: 0,
          totalAttendance: 0,
          count: 0
        };
      }
      acc[key].totalProd += parseFloat(d.total_prod_time || 0);
      acc[key].totalAttendance += parseFloat(d.total_desk_time || 0) > 0 ? 1 : 0;
      acc[key].count++;
      return acc;
    }, {});

    this.topEmployees = Object.values(employeeStats)
      .map((emp: any) => ({
        name: emp.name,
        attendance: emp.count > 0 ? Math.round((emp.totalAttendance / emp.count) * 100) : 0,
        productiveHours: emp.count > 0 ? (emp.totalProd / emp.count).toFixed(1) : 0
      }))
      .sort((a, b) => b.attendance - a.attendance || parseFloat(String(b.productiveHours)) - parseFloat(String(a.productiveHours)))
      .slice(0, 5);
  }

  private generateInsights(data: any[]) {
     this.attendanceInsights = [
      {
        icon: '📈',
        title: 'Productivity Trend',
        message: `Average productivity is ${this.attendanceStats.avgProductiveHours}h per day with ${this.attendanceStats.deskTimeTrend}% efficiency.`
      },
      {
        icon: '🎯',
        title: 'Goal Status',
        message: `${this.attendanceStats.attendanceRate}% attendance rate meets company standards.`
      }
    ];
  }

  getEfficiencyClass(efficiency: number): string {
    if (efficiency >= 80) return 'high';
    if (efficiency >= 60) return 'medium';
    return 'low';
  }
}
