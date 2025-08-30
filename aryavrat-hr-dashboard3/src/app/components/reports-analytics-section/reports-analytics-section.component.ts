import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-reports-analytics-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="kpi-row">
        <div class="kpi-card reports">
          <div class="kpi-value">{{ analyticsStats.totalReports }}</div>
          <div class="kpi-label">Reports Generated</div>
          <div class="kpi-trend">{{ analyticsStats.reportsThisMonth }} this month</div>
        </div>
        <div class="kpi-card insights">
          <div class="kpi-value">{{ analyticsStats.keyInsights }}</div>
          <div class="kpi-label">Key Insights</div>
          <div class="kpi-trend">{{ analyticsStats.actionableInsights }} actionable</div>
        </div>
        <div class="kpi-card efficiency">
          <div class="kpi-value">{{ analyticsStats.dataAccuracy }}%</div>
          <div class="kpi-label">Data Accuracy</div>
          <div class="kpi-trend">{{ analyticsStats.processingTime }}s avg processing</div>
        </div>
        <div class="kpi-card automation">
          <div class="kpi-value">{{ analyticsStats.automationRate }}%</div>
          <div class="kpi-label">Automation Rate</div>
          <div class="kpi-trend">{{ analyticsStats.timeSaved }}h saved/week</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="chart-widget usage-chart">
          <div class="widget-header">
            <h3>Report Usage</h3>
            <span class="widget-actions">📊</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="usageChartData" [options]="chartOptions" type="doughnut"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="chart-widget trend-chart">
          <div class="widget-header">
            <h3>Analytics Trends</h3>
            <span class="widget-actions">📈</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="trendChartData" [options]="lineOptions" type="line"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="chart-widget performance-chart">
          <div class="widget-header">
            <h3>System Performance</h3>
            <span class="widget-actions">⚡</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="performanceChartData" [options]="barOptions" type="bar"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="table-widget reports-table">
          <div class="widget-header">
            <h3>Recent Reports</h3>
            <span class="widget-actions">📋</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Generated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let report of recentReports">
                  <td>{{ report.name }}</td>
                  <td>{{ report.type }}</td>
                  <td>{{ report.generated }}</td>
                  <td><span class="status-badge" [class]="report.status.toLowerCase()">{{ report.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="insight-widget">
          <div class="widget-header">
            <h3>Analytics Insights</h3>
            <span class="widget-actions">🔍</span>
          </div>
          <div class="insights-content">
            <div class="insight-item" *ngFor="let insight of analyticsInsights">
              <span class="insight-icon">{{ insight.icon }}</span>
              <div class="insight-text">
                <strong>{{ insight.title }}:</strong> {{ insight.message }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="summary-widget">
          <div class="widget-header">
            <h3>Executive Summary</h3>
            <span class="widget-actions">📄</span>
          </div>
          <div class="summary-content">
            <div class="summary-section">
              <h4>Workforce Overview</h4>
              <p>{{ executiveSummary.workforce }}</p>
            </div>
            <div class="summary-section">
              <h4>Performance Highlights</h4>
              <p>{{ executiveSummary.performance }}</p>
            </div>
            <div class="summary-section">
              <h4>Key Recommendations</h4>
              <p>{{ executiveSummary.recommendations }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { height: 100vh; padding: 1rem; background: #f8fafc; overflow: hidden; }
    .kpi-card.reports { border-left-color: var(--primary-accent); }
    .kpi-card.insights { border-left-color: var(--success); }
    .kpi-card.efficiency { border-left-color: var(--warning); }
    .kpi-card.automation { border-left-color: var(--purple); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); gap: 1rem; height: calc(100vh - 180px); }
    .chart-widget, .table-widget, .insight-widget, .summary-widget { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .chart-widget canvas { flex: 1; min-height: 0; width: 100% !important; height: auto !important; padding: 10px; }
    .usage-chart { grid-column: 1; grid-row: 1; }
    .trend-chart { grid-column: 2; grid-row: 1; }
    .performance-chart { grid-column: 3; grid-row: 1; }
    .reports-table { grid-column: 1; grid-row: 2; }
    .insight-widget { grid-column: 2; grid-row: 2; }
    .summary-widget { grid-column: 3 / 5; grid-row: 2; }
    .widget-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
    .widget-header h3 { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .chart-placeholder { flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; background: var(--background); color: var(--muted); font-style: italic; }
    .table-container { flex: 1; overflow-y: auto; padding: 0 1rem 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.75rem 0.5rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: var(--background); font-weight: 600; color: var(--text-secondary); }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .status-badge.completed { background: rgba(22, 163, 74, 0.1); color: var(--success); }
    .status-badge.processing { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .insights-content, .summary-content { padding: 1rem; flex: 1; }
    .insight-item { display: flex; align-items: flex-start; margin-bottom: 1rem; padding: 0.75rem; background: var(--background); border-radius: 8px; }
    .insight-icon { margin-right: 0.75rem; font-size: 1.2rem; }
    .insight-text { font-size: 0.85rem; line-height: 1.4; }
    .summary-section { margin-bottom: 1.5rem; }
    .summary-section h4 { margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 0.9rem; }
    .summary-section p { font-size: 0.8rem; line-height: 1.4; color: var(--text-secondary); }
  `]
})
export class ReportsAnalyticsSectionComponent implements OnInit {
  analyticsStats = { totalReports: 247, keyInsights: 18, dataAccuracy: 98, automationRate: 85, reportsThisMonth: 23, actionableInsights: 12, processingTime: 2.3, timeSaved: 15 };
  recentReports: any[] = [];
  analyticsInsights: any[] = [];
  executiveSummary: any = {};
  isBrowser: boolean;
  
  usageChartData: ChartConfiguration['data'] = { labels: ['Attendance Reports', 'Leave Reports', 'Performance Reports', 'Payroll Reports', 'Custom Reports'], datasets: [{ data: [35, 28, 22, 18, 12], backgroundColor: ['#2563EB', '#16A34A', '#F59E0B', '#7C3AED', '#DC2626'] }] };
  trendChartData: ChartConfiguration['data'] = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Reports Generated', data: [32, 28, 35, 42, 38, 45], borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.1)', tension: 0.4 }, { label: 'Insights Generated', data: [8, 12, 15, 18, 16, 22], borderColor: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.1)', tension: 0.4 }] };
  performanceChartData: ChartConfiguration['data'] = { labels: ['Query Speed', 'Data Processing', 'Report Generation', 'Export Time'], datasets: [{ label: 'Performance (ms)', data: [150, 2300, 1800, 450], backgroundColor: '#F59E0B' }] };
  
  chartOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          font: { size: 7 },
          padding: 4,
          usePointStyle: true,
          boxWidth: 8
        }
      }
    },
    layout: {
      padding: { top: 5, bottom: 5, left: 5, right: 5 }
    }
  };
  
  barOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { display: false }
    }, 
    scales: { 
      y: { 
        beginAtZero: true,
        grid: { display: true, color: '#f1f5f9' },
        ticks: {
          font: { size: 7 },
          maxTicksLimit: 3
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 7 },
          maxRotation: 0
        }
      }
    },
    layout: {
      padding: { top: 5, bottom: 5, left: 5, right: 5 }
    }
  };
  
  lineOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        position: 'top',
        labels: {
          font: { size: 7 },
          padding: 4,
          usePointStyle: true,
          boxWidth: 8
        }
      }
    }, 
    scales: { 
      y: { 
        beginAtZero: true,
        grid: { display: true, color: '#f1f5f9' },
        ticks: {
          font: { size: 7 },
          maxTicksLimit: 3
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 7 },
          maxRotation: 0
        }
      }
    },
    layout: {
      padding: { top: 5, bottom: 5, left: 5, right: 5 }
    }
  };

  constructor(private dataService: DataService, private filterService: FilterService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // No data available - waiting for API response
    this.filterService.globalFilters.subscribe(filters => {
      // Data will be loaded when API is available
      const emptyData = { users: [], leaves: [], attendance: [], filters };
      this.generateReports();
      this.generateInsights(emptyData);
      this.generateExecutiveSummary(emptyData);
    });
  }

  private generateReports() {
    this.recentReports = [
      { name: 'June 2025 Productivity Report', type: 'Attendance', generated: '2025-06-30', status: 'Completed' },
      { name: 'Development Team Analysis', type: 'Performance', generated: '2025-06-29', status: 'Completed' },
      { name: 'Weekly Productivity Trends', type: 'Analytics', generated: '2025-06-28', status: 'Processing' },
      { name: 'Time Utilization Summary', type: 'Efficiency', generated: '2025-06-27', status: 'Completed' },
      { name: 'Employee Engagement Metrics', type: 'HR', generated: '2025-06-26', status: 'Completed' },
      { name: 'Monthly Performance Dashboard', type: 'Dashboard', generated: '2025-06-25', status: 'Completed' }
    ];
  }

  private generateInsights(data: any) {
    // Calculate insights from actual data
    const totalRecords = data.attendance.length;
    const avgProductivity = data.attendance.reduce((sum: number, record: any) => {
      return sum + parseFloat(record.prod_percentage || 0);
    }, 0) / totalRecords;
    
    const highProductivityDays = data.attendance.filter((record: any) => 
      parseFloat(record.prod_percentage || 0) > 60
    ).length;
    
    this.analyticsInsights = [
      { icon: '📊', title: 'Data Coverage', message: `${totalRecords} daily records analyzed with comprehensive time tracking across June 2025.` },
      { icon: '⚡', title: 'Productivity Insights', message: `${Math.round((highProductivityDays/totalRecords)*100)}% of days showed above-average productivity (>60%).` },
      { icon: '🎯', title: 'Performance Trends', message: `Average productivity of ${Math.round(avgProductivity)}% with consistent development team engagement patterns.` }
    ];
  }

  private generateExecutiveSummary(data: any) {
    // Get unique employees count
    const uniqueEmployees = new Set(data.users.map((u: any) => `${u.first_name}_${u.last_name}`)).size;
    
    // Calculate average productivity from actual data
    const avgProductivity = data.attendance.reduce((sum: number, record: any) => {
      return sum + parseFloat(record.prod_percentage || 0);
    }, 0) / data.attendance.length;
    
    // Get department count
    const departments = new Set(data.users.map((u: any) => u.dept)).size;
    
    // Calculate leave statistics
    const totalLeaves = data.leaves.length;
    const approvedLeaves = data.leaves.filter((l: any) => l.lr_status === '1').length;
    const approvalRate = Math.round((approvedLeaves / totalLeaves) * 100);
    
    this.executiveSummary = {
      workforce: `Current workforce of ${uniqueEmployees} employees across ${departments} departments including development, marketing, support, design, and BPO teams.`,
      performance: `${approvalRate}% leave approval rate with ${totalLeaves} total leave requests processed. Strong cross-departmental engagement and balanced work-life policies.`,
      recommendations: `Focus on maintaining current approval efficiency, monitor department-wise leave patterns, and continue supporting employee wellness initiatives.`
    };
  }
}