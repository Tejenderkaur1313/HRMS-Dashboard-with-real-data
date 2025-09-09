// dashboard-section.component.ts

import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ChartData, ChartDataset } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { DepartmentService, Department } from '../services/department.service';
import { ProductivityService, ProductivityData } from '../services/productivity.service';
import { LeaveService, LeaveData } from '../services/leave.service';
import { GlobalFilterService, GlobalFilters } from '../services/global-filter.service';
import { Holiday } from '../services/holiday.service';
import { forkJoin, Subscription } from 'rxjs';

interface LeaveRequest {
  id: number;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DashboardData {
  kpiData: {
    avgAttendance: number;
    employees: number;
    leaves: number;
    performance: number;
  };
  attendanceData: {
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    total: number;
    presentPercentage: number;
  };
  upcomingHolidays: Holiday[];
  recentLeaveRequests: LeaveRequest[];
}

@Component({
  selector: 'app-dashboard-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss']
})
export class DashboardSectionComponent implements OnInit, OnDestroy {
  isBrowser: boolean = false;
  departments: Department[] = [];
  isLoading = true;
  error: string | null = null;
  currentDateDisplay: string = '';
  private filterSubscription: Subscription = new Subscription();
  
  // KPI Data
  kpiData = {
    avgAttendance: 0,
    employees: 0,
    leaves: 0,
    performance: 0
  };

  // Upcoming Holidays
  upcomingHolidays: Holiday[] = [];

  // Recent Leave Requests
  recentLeaveRequests: LeaveRequest[] = [];
  
  // Attendance Data
  attendanceData: any = undefined;

  // Donut Chart Configuration
  donutChartData = {
    labels: ['Present', 'Late', 'Absent', 'Half Day'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#10B981', '#EF4444', '#9CA3AF', '#F59E0B'],
      borderWidth: 0,
      cutout: '70%',
      spacing: 3,
      borderRadius: 8
    }]
  };

  donutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    layout: {
      padding: 20
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  // Chart Configurations (for other charts)
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'white',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          padding: 8
        },
        max: 100
      }
    }
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'white',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Chart Data with proper typing
  attendanceChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Present',
        data: [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5'
      },
      {
        label: 'Absent',
        data: [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ef4444'
      }
    ]
  };

  departmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Employees',
      data: [],
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(129, 140, 248, 0.8)',
        'rgba(165, 180, 252, 0.8)',
        'rgba(199, 210, 254, 0.8)',
        'rgba(219, 234, 254, 0.8)',
        'rgba(224, 242, 254, 0.8)'
      ] as any[],
      borderColor: [
        'rgba(79, 70, 229, 1)',
        'rgba(99, 102, 241, 1)',
        'rgba(129, 140, 248, 1)',
        'rgba(165, 180, 252, 1)',
        'rgba(199, 210, 254, 1)',
        'rgba(219, 234, 254, 1)',
        'rgba(224, 242, 254, 1)'
      ] as any[],
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  // Doughnut chart options
  doughnutOptions: ChartOptions<'doughnut'> = {
    cutout: '70%',
    plugins: { 
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true
      }
    }
  };

  // Horizontal bar chart options
  horizontalBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { 
      legend: { display: false },
    },
    scales: { 
      x: { beginAtZero: true, grid: { display: false } },
      y: { grid: { display: false } }
    }
  };
  
  barOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
    },
    scales: { 
      y: { beginAtZero: true, grid: { display: true } },
      x: { grid: { display: false } }
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private filterService: FilterService,
    private departmentService: DepartmentService,
    private productivityService: ProductivityService,
    private leaveService: LeaveService,
    private globalFilterService: GlobalFilterService
  ) { 
    // Initialize department chart data with empty arrays
    this.departmentChartData = {
      labels: [],
      datasets: [{
        label: 'Employees',
        data: [],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(129, 140, 248, 0.8)',
          'rgba(165, 180, 252, 0.8)'
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(129, 140, 248, 1)',
          'rgba(165, 180, 252, 1)'
        ],
        borderWidth: 1,
        borderRadius: 4
      }]
    };
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.setCurrentDate();
    
    // Subscribe to global filter changes
    this.filterSubscription = this.globalFilterService.filters$.subscribe(
      (filters: GlobalFilters) => {
        this.loadDashboardData(filters);
      }
    );
  }

  ngOnDestroy(): void {
    this.filterSubscription.unsubscribe();
  }

  private loadDashboardData(filters?: GlobalFilters): void {
    this.isLoading = true;
    this.error = null;

    // Use filters if provided, otherwise get current filters
    const currentFilters = filters || this.globalFilterService.getCurrentFilters();
    const fromDate = currentFilters.fromDate;
    const toDate = currentFilters.toDate;

    // Fetch data from multiple sources
    forkJoin([
      this.productivityService.getProductivityData(fromDate, toDate),
      this.departmentService.getDepartments(),
      this.leaveService.getLeaveData(fromDate, toDate)
    ]).subscribe({
      next: ([productivityData, departments, leaveData]) => {
        this.departments = departments || [];
        this.updateDashboardData(productivityData);
        this.updateLeaveRequestsData(leaveData);
        // Holiday API call disabled
        this.upcomingHolidays = []; // Clear holidays
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private updateDashboardData(data: ProductivityData): void {
    try {
      // Update KPI data
      this.kpiData = {
        avgAttendance: data.avgAttendance || 0,
        employees: data.totalEmployees || 0,
        leaves: data.leaveCount || 0,
        performance: this.calculatePerformanceScore(data)
      };

      // Update attendance data
      const presentCount = Math.round((data.avgAttendance || 0) * (data.totalEmployees || 0) / 100);
      this.attendanceData = {
        present: presentCount,
        late: data.lateCount || 0,
        absent: (data.totalEmployees || 0) - presentCount,
        halfDay: data.halfDayCount || 0,
        get total() {
          return this.present + this.late + this.absent + this.halfDay;
        },
        get presentPercentage() {
          return this.total > 0 ? Math.round((this.present / this.total) * 100) : 0;
        }
      };

      // Update donut chart data
      this.donutChartData = {
        ...this.donutChartData,
        datasets: [{
          ...this.donutChartData.datasets[0],
          data: [
            this.attendanceData.present,
            this.attendanceData.late,
            this.attendanceData.absent,
            this.attendanceData.halfDay
          ]
        }]
      };

      // Update department chart
      this.updateDepartmentChart(data);

      // Update attendance trend chart if weekly data is available
      if (data.weeklyTrends?.length) {
        this.attendanceChartData = {
          ...this.attendanceChartData,
          labels: data.weeklyTrends.map(week => `Week ${week.weekNo}`),
          datasets: [
            {
              ...this.attendanceChartData.datasets[0],
              data: data.weeklyTrends.map(week => week.avgAttendance || 0)
            },
            {
              ...this.attendanceChartData.datasets[1],
              data: data.weeklyTrends.map(week => 100 - (week.avgAttendance || 0))
            }
          ]
        };
      }

    } catch (error) {
      console.error('Error updating dashboard data:', error);
      this.error = 'Failed to update dashboard data. Please try again later.';
    }
  }

  private updateLeaveRequestsData(leaveData: LeaveData): void {
    try {
      // Get current date and selected filter dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentFilters = this.globalFilterService.getCurrentFilters();
      const selectedFromDate = new Date(currentFilters.fromDate);
      const selectedToDate = new Date(currentFilters.toDate);
      
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const selectedMonth = selectedFromDate.getMonth();
      const selectedYear = selectedFromDate.getFullYear();
      
      // Determine if we're viewing current month or a previous month
      const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
      
      // Filter leave data based on whether it's current month or previous month
      this.recentLeaveRequests = (leaveData.recentLeaves || [])
        .filter((leave: any) => {
          const leaveStartDate = new Date(leave.from_date || leave.start_date);
          leaveStartDate.setHours(0, 0, 0, 0);
          
          if (isCurrentMonth) {
            // For current month: show only upcoming leaves (today or future)
            return leaveStartDate >= today && 
                   leaveStartDate.getMonth() === currentMonth && 
                   leaveStartDate.getFullYear() === currentYear;
          } else {
            // For previous months: show all leaves within the selected date range
            selectedFromDate.setHours(0, 0, 0, 0);
            selectedToDate.setHours(23, 59, 59, 999);
            return leaveStartDate >= selectedFromDate && leaveStartDate <= selectedToDate;
          }
        })
        .map((leave: any) => ({
          id: leave.id || Math.random(),
          employee: leave.employee_name || leave.name || 'Unknown Employee',
          type: leave.leave_type || leave.type || 'General Leave',
          startDate: this.formatDisplayDate(leave.from_date || leave.start_date),
          endDate: this.formatDisplayDate(leave.to_date || leave.end_date),
          status: leave.status || 'pending'
        }))
        .sort((a, b) => {
          // Sort by start date (earliest first)
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5); // Show only first 5 requests

      console.log(`Updated leave requests for ${isCurrentMonth ? 'current month (upcoming)' : 'selected period (all)'}:`, this.recentLeaveRequests);
    } catch (error) {
      console.error('Error updating leave requests data:', error);
      // Clear requests on error instead of showing fallback data
      this.recentLeaveRequests = [];
    }
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch {
      return dateStr;
    }
  }

  private calculatePerformanceScore(data: ProductivityData): number {
    // Calculate a performance score based on productivity and attendance (0-5 scale)
    const productivityScore = Math.min((data.avgProductiveHours / 8) * 5, 5); // 8 hours = 5.0 rating
    const attendanceScore = Math.min((data.attendanceRate / 100) * 5, 5); // 100% = 5.0 rating
    const deskTimeScore = Math.min((data.avgDeskTime / 8) * 5, 5); // 8 hours = 5.0 rating
    
    // Weighted average of different metrics (0-5 scale)
    const finalScore = (productivityScore * 0.5) + (attendanceScore * 0.3) + (deskTimeScore * 0.2);
    return Number(Math.min(finalScore, 5).toFixed(1));
  }

  private updateDepartmentChart(data: ProductivityData): void {
    try {
      if (data.departmentStats?.length) {
        this.departmentChartData = {
          ...this.departmentChartData,
          labels: data.departmentStats.map((dept: any) => dept.name),
          datasets: [{
            ...this.departmentChartData.datasets[0],
            data: data.departmentStats.map((dept: any) => dept.employeeCount || 0)
          }]
        };
      } else if (this.departments?.length) {
        // Fallback to department data if productivity data is not available
        this.departmentChartData = {
          ...this.departmentChartData,
          labels: this.departments.map(dept => dept.name),
          datasets: [{
            ...this.departmentChartData.datasets[0],
            data: this.departments.map(() => Math.floor(Math.random() * 50) + 10)
          }]
        };
      }
    } catch (error) {
      console.error('Error updating department chart:', error);
    }
  }



  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private setCurrentDate(): void {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'short' });
    const year = today.getFullYear();
    this.currentDateDisplay = `Today, ${day} ${month} ${year}`;
  }

  private updateHolidayData(holidayData: any): void {
    try {
      // Update holidays from API data
      this.upcomingHolidays = holidayData.holidays || [];
      console.log('Updated holidays:', this.upcomingHolidays);
    } catch (error) {
      console.error('Error updating holiday data:', error);
      // Keep existing holidays or set empty array
      this.upcomingHolidays = [];
    }
  }
}