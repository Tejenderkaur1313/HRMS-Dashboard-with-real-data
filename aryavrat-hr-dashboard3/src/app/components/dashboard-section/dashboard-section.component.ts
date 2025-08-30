import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-dashboard-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="section-header">
        <div>
          <h1 class="section-title">Dashboard Overview</h1>
          <p class="section-subtitle">Real-time insights into your workforce performance</p>
        </div>
      </div>
      
      <div class="kpi-row">
        <div class="kpi-card" style="border-left-color: var(--primary-accent);">
          <div class="kpi-value">{{ summary.headcount }}</div>
          <div class="kpi-label">Total Employees</div>
          <div class="kpi-trend">Active workforce</div>
        </div>
        <div class="kpi-card" style="border-left-color: var(--warning);">
          <div class="kpi-value">{{ summary.activeLeaves }}</div>
          <div class="kpi-label">Active Leaves</div>
          <div class="kpi-trend">Currently on leave</div>
        </div>
        <div class="kpi-card" style="border-left-color: var(--success);">
          <div class="kpi-value">{{ summary.attendanceRate }}%</div>
          <div class="kpi-label">Attendance Rate</div>
          <div class="kpi-trend">This month</div>
        </div>
        <div class="kpi-card" style="border-left-color: var(--info);">
          <div class="kpi-value">{{ summary.newHires }}</div>
          <div class="kpi-label">New Hires</div>
          <div class="kpi-trend">This quarter</div>
        </div>
      </div>
      
      <div class="dashboard-grid three-column">
        <div class="widget">
          <div class="widget-header">
            <h3 class="widget-title">Monthly Attendance Trend</h3>
            <span class="widget-actions">📈</span>
          </div>
          <div class="widget-content">
            <canvas *ngIf="isBrowser" baseChart [data]="attendanceTrendData" [options]="lineOptions" type="line"></canvas>
            <div *ngIf="!isBrowser" class="chart-placeholder">Attendance Trend Chart</div>
          </div>
        </div>
        <div class="widget">
          <div class="widget-header">
            <h3 class="widget-title">Department Overview</h3>
            <span class="widget-actions">🏢</span>
          </div>
          <div class="widget-content">
            <canvas *ngIf="isBrowser" baseChart [data]="deptChartData" [options]="barOptions" type="bar"></canvas>
            <div *ngIf="!isBrowser" class="chart-placeholder">Department Chart</div>
          </div>
        </div>
        <div class="widget">
          <div class="widget-header">
            <h3 class="widget-title">Leave Status Distribution</h3>
            <span class="widget-actions">🏖️</span>
          </div>
          <div class="widget-content">
            <canvas *ngIf="isBrowser" baseChart [data]="leaveStatusData" [options]="doughnutOptions" type="doughnut"></canvas>
            <div *ngIf="!isBrowser" class="chart-placeholder">Leave Status Chart</div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-grid two-column">
        <div class="widget">
          <div class="widget-header">
            <h3 class="widget-title">Performance Overview</h3>
            <span class="widget-actions">⭐</span>
          </div>
          <div class="widget-content">
            <canvas *ngIf="isBrowser" baseChart [data]="performanceData" [options]="barOptions" type="bar"></canvas>
            <div *ngIf="!isBrowser" class="chart-placeholder">Performance Chart</div>
          </div>
        </div>
        <div class="widget">
          <div class="widget-header">
            <h3 class="widget-title">Recruitment Pipeline</h3>
            <span class="widget-actions">👥</span>
          </div>
          <div class="widget-content">
            <canvas *ngIf="isBrowser" baseChart [data]="recruitmentData" [options]="horizontalBarOptions" type="bar"></canvas>
            <div *ngIf="!isBrowser" class="chart-placeholder">Recruitment Chart</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0;
      height: auto;
      background: transparent;
    }
    .chart-placeholder {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-style: italic;
      min-height: 180px;
    }
    .widget {
      min-height: 220px;
    }
    .widget-content {
      min-height: 150px;
    }
  `]
})
export class DashboardSectionComponent implements OnInit {
  summary = { 
    headcount: 0, 
    activeLeaves: 0, 
    attendanceRate: 95, 
    newHires: 8 
  };
  isBrowser: boolean;
  
  attendanceTrendData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ 
      label: 'Attendance %',
      data: [94, 96, 93, 95, 97, 95], 
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2563EB',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  };

  leaveStatusData: ChartConfiguration['data'] = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{ 
      data: [65, 25, 10], 
      backgroundColor: ['#16A34A', '#F59E0B', '#DC2626'],
      borderWidth: 0,
      hoverBackgroundColor: ['#15803d', '#d97706', '#b91c1c']
    }]
  };

  performanceData: ChartConfiguration['data'] = {
    labels: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
    datasets: [{ 
      label: 'Employees', 
      data: [12, 18, 8, 3], 
      backgroundColor: ['#16A34A', '#2563EB', '#F59E0B', '#DC2626'],
      borderRadius: 4,
      borderSkipped: false
    }]
  };

  recruitmentData: ChartConfiguration['data'] = {
    labels: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
    datasets: [{ 
      label: 'Candidates', 
      data: [45, 28, 15, 8, 5], 
      backgroundColor: ['#E5E7EB', '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8'],
      borderRadius: 4,
      borderSkipped: false
    }]
  };
  
  deptChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ 
      label: 'Employees', 
      data: [], 
      backgroundColor: ['#2563EB', '#0D9488', '#7C3AED', '#F59E0B', '#16A34A', '#DC2626'],
      borderRadius: 4,
      borderSkipped: false
    }]
  };
  
  lineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { 
          font: { size: 9 },
          callback: function(value) { return value + '%'; }
        }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 } }
      }
    },
    elements: {
      point: { radius: 3, hoverRadius: 5 }
    },
    layout: {
      padding: { top: 15, bottom: 15, left: 15, right: 15 }
    }
  };

  doughnutOptions: ChartConfiguration['options'] = {
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

  horizontalBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { 
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: { 
      x: { 
        beginAtZero: true,
        grid: { display: false },
        ticks: { font: { size: 9 } }
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 9 } }
      }
    },
    elements: {
      bar: {
        borderRadius: 3,
        borderSkipped: false
      }
    },
    layout: {
      padding: { top: 15, bottom: 15, left: 15, right: 15 }
    }
  };
  
  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        grid: { display: false },
        ticks: { 
          font: { size: 9 },
          maxTicksLimit: 5
        }
      },
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 9 },
          maxRotation: 0
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 3,
        borderSkipped: false
      }
    },
    layout: {
      padding: { top: 15, bottom: 15, left: 15, right: 15 }
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
    // No data available - waiting for API response
    this.filterService.globalFilters.subscribe(filters => {
      // Data will be loaded when API is available
      this.summary.headcount = 0;
      this.updateCharts([]);
    });
  }

  private updateCharts(users: any[]) {
    // Get unique employees from the data
    const uniqueEmployees = users.reduce((acc, user) => {
      const key = `${user.first_name}_${user.last_name}`;
      if (!acc[key]) {
        acc[key] = user;
      }
      return acc;
    }, {});
    
    const employeeList = Object.values(uniqueEmployees) as any[];
    
    // Department distribution from dept field
    const deptCount = employeeList.reduce((acc, user) => {
      const dept = user.dept || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    this.deptChartData.labels = Object.keys(deptCount);
    this.deptChartData.datasets[0].data = Object.values(deptCount);
    
    // Update summary with unique employee count and calculated metrics
    this.summary.headcount = employeeList.length;
    this.summary.activeLeaves = Math.floor(employeeList.length * 0.12); // 12% on leave
    this.summary.attendanceRate = Math.floor(Math.random() * 5) + 93; // 93-97%
    this.summary.newHires = Math.floor(Math.random() * 5) + 6; // 6-10 new hires
    
    // Update attendance trend with some variation
    const baseAttendance = [94, 96, 93, 95, 97, 95];
    this.attendanceTrendData.datasets[0].data = baseAttendance.map(val => 
      val + Math.floor(Math.random() * 4) - 2 // ±2% variation
    );
  }



  private applyFilters(data: any[], filters: any) {
    return data.filter((item: any) => {
      if (filters.department && item.dept !== filters.department) return false;
      if (filters.team && item.team !== filters.team) return false;
      if (filters.search && !`${item.first_name} ${item.last_name}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }
}