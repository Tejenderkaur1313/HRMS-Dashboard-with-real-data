// dashboard-section.component.ts

import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { DepartmentService, Department } from '../services/department.service';
import { map, combineLatest } from 'rxjs';

interface Holiday {
  name: string;
  date: Date;
  day: string;
  month: string;
  type: string;
}

interface LeaveRequest {
  id: number;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  avatar: string;
}

@Component({
  selector: 'app-dashboard-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss']
})
export class DashboardSectionComponent implements OnInit {
  isBrowser: boolean = false;
  departments: Department[] = [];
  
  
  // KPI Data
  kpiData = {
    avgAttendance: 92.5,
    employees: 1248,
    leaves: 28,
    performance: 4.2
  };

  // Upcoming Holidays
  upcomingHolidays: Holiday[] = [
    { name: 'New Year\'s Day', date: new Date(2024, 0, 1), day: '01', month: 'JAN', type: 'Public Holiday' },
    { name: 'Republic Day', date: new Date(2024, 0, 26), day: '26', month: 'JAN', type: 'Public Holiday' },
    { name: 'Holi', date: new Date(2024, 2, 8), day: '08', month: 'MAR', type: 'Festival' },
    { name: 'Good Friday', date: new Date(2024, 3, 29), day: '29', month: 'MAR', type: 'Public Holiday' },
    { name: 'Eid al-Fitr', date: new Date(2024, 4, 10), day: '10', month: 'APR', type: 'Public Holiday' }
  ];

  // Recent Leave Requests
  recentLeaveRequests: LeaveRequest[] = [
    { id: 1, employee: 'John Doe', type: 'Sick Leave', startDate: '15 Mar 2024', endDate: '17 Mar 2024', status: 'approved', avatar: 'JD' },
    { id: 2, employee: 'Jane Smith', type: 'Casual Leave', startDate: '18 Mar 2024', endDate: '19 Mar 2024', status: 'pending', avatar: 'JS' },
    { id: 3, employee: 'Robert Johnson', type: 'Annual Leave', startDate: '20 Mar 2024', endDate: '25 Mar 2024', status: 'approved', avatar: 'RJ' },
    { id: 4, employee: 'Emily Davis', type: 'Work From Home', startDate: '16 Mar 2024', endDate: '16 Mar 2024', status: 'approved', avatar: 'ED' },
    { id: 5, employee: 'Michael Brown', type: 'Sick Leave', startDate: '14 Mar 2024', endDate: '15 Mar 2024', status: 'rejected', avatar: 'MB' }
  ];
  
  // Attendance Data
  attendanceData = {
    present: 52,
    late: 10,
    absent: 15,
    halfDay: 4,
    get total() {
      return this.present + this.late + this.absent + this.halfDay;
    },
    get presentPercentage() {
      return Math.round((this.present / this.total) * 100);
    }
  };

  // Donut Chart Configuration
  donutChartData = {
    labels: ['Present', 'Late', 'Absent', 'Half Day'],
    datasets: [{
      data: [52, 10, 15, 4],
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

  // Chart Data
  attendanceChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Present',
        data: [92, 95, 90, 88, 94, 65, 30],
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
        data: [8, 5, 10, 12, 6, 35, 70],
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

  departmentChartData = {
    labels: ['Development', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'],
    datasets: [{
      label: 'Employees',
      data: [320, 85, 65, 92, 45, 38, 52],
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(129, 140, 248, 0.8)',
        'rgba(165, 180, 252, 0.8)',
        'rgba(199, 210, 254, 0.8)',
        'rgba(219, 234, 254, 0.8)',
        'rgba(224, 242, 254, 0.8)'
      ],
      borderColor: [
        'rgba(79, 70, 229, 1)',
        'rgba(99, 102, 241, 1)',
        'rgba(129, 140, 248, 1)',
        'rgba(165, 180, 252, 1)',
        'rgba(199, 210, 254, 1)',
        'rgba(219, 234, 254, 1)',
        'rgba(224, 242, 254, 1)'
      ],
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
    private dataService: DataService, 
    private filterService: FilterService,
    private departmentService: DepartmentService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.departmentService.getDepartments().subscribe({
      next: (departments: Department[]) => {
        this.departments = departments;
        this.updateDepartmentChart();
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  private updateDepartmentChart() {
    if (this.departments.length > 0) {
      const employeeCounts = this.departments.map(() => Math.floor(Math.random() * 50) + 10);
      this.departmentChartData.labels = this.departments.map(dept => dept.name);
      this.departmentChartData.datasets[0].data = employeeCounts;
    }
  }
}