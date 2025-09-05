// src/app/performance-dashboard/performance-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Observable } from 'rxjs';
import { DataService, PerformanceDashboardData } from '../services/data.service';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [ CommonModule, NgxChartsModule ],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.css']
})
export class PerformanceDashboardComponent implements OnInit {

  public dashboardData$: Observable<PerformanceDashboardData>;

  // Chart color schemes
  lineChartColorScheme = { domain: ['#4f46e5'] };
  barChartColorScheme = { domain: ['#3b82f6'] };
  pieChartColorScheme = { domain: ['#16a34a', '#0ea5e9', '#ef4444'] };

  constructor(private dataService: DataService) {
    this.dashboardData$ = this.dataService.getPerformanceData('July');
  }

  ngOnInit(): void {
    // Trigger initial data load for July
    this.dashboardData$ = this.dataService.getPerformanceData('July');
  }

  onMonthFilterChange(event: Event): void {
    const selectedMonth = (event.target as HTMLSelectElement).value;
    this.dashboardData$ = this.dataService.getPerformanceData(selectedMonth);
  }
}