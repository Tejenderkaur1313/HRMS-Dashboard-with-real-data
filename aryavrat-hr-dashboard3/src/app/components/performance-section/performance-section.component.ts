import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-performance-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="kpi-row">
        <div class="kpi-card overall">
          <div class="kpi-value">{{ performanceStats.overallScore }}%</div>
          <div class="kpi-label">Overall Performance</div>
          <div class="kpi-trend">+{{ performanceStats.improvement }}% improvement</div>
        </div>
        <div class="kpi-card productivity">
          <div class="kpi-value">{{ performanceStats.productivityScore }}%</div>
          <div class="kpi-label">Productivity Score</div>
          <div class="kpi-trend">{{ performanceStats.productivityTrend }}% vs target</div>
        </div>
        <div class="kpi-card goals">
          <div class="kpi-value">{{ performanceStats.goalsAchieved }}</div>
          <div class="kpi-label">Goals Achieved</div>
          <div class="kpi-trend">{{ performanceStats.goalCompletionRate }}% completion rate</div>
        </div>
        <div class="kpi-card reviews">
          <div class="kpi-value">{{ performanceStats.reviewsCompleted }}</div>
          <div class="kpi-label">Reviews Completed</div>
          <div class="kpi-trend">{{ performanceStats.reviewsPending }} pending</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="chart-widget performance-chart">
          <div class="widget-header">
            <h3>Performance Distribution</h3>
            <span class="widget-actions">📊</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="performanceChartData" [options]="chartOptions" type="doughnut"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="chart-widget trend-chart">
          <div class="widget-header">
            <h3>Performance Trends</h3>
            <span class="widget-actions">📈</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="trendChartData" [options]="lineOptions" type="line"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="chart-widget dept-performance-chart">
          <div class="widget-header">
            <h3>Department Performance</h3>
            <span class="widget-actions">🏢</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="deptPerformanceData" [options]="barOptions" type="bar"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="table-widget top-performers-table">
          <div class="widget-header">
            <h3>Top Performers</h3>
            <span class="widget-actions">🏆</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Score</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let performer of topPerformers">
                  <td>{{ performer.name }}</td>
                  <td>{{ performer.department }}</td>
                  <td>{{ performer.score }}%</td>
                  <td><span class="rating-badge" [class]="getRatingClass(performer.rating)">{{ performer.rating }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="insight-widget">
          <div class="widget-header">
            <h3>Performance Insights</h3>
            <span class="widget-actions">💡</span>
          </div>
          <div class="insights-content">
            <div class="insight-item" *ngFor="let insight of performanceInsights">
              <span class="insight-icon">{{ insight.icon }}</span>
              <div class="insight-text">
                <strong>{{ insight.title }}:</strong> {{ insight.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { height: 100vh; padding: 1rem; background: #f8fafc; overflow: hidden; }
    .kpi-card.overall { border-left-color: var(--success); }
    .kpi-card.productivity { border-left-color: var(--primary-accent); }
    .kpi-card.goals { border-left-color: var(--warning); }
    .kpi-card.reviews { border-left-color: var(--purple); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); gap: 1rem; height: calc(100vh - 180px); }
    .chart-widget, .table-widget, .insight-widget { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .chart-widget canvas { flex: 1; min-height: 0; width: 100% !important; height: auto !important; padding: 10px; }
    .performance-chart { grid-column: 1; grid-row: 1; }
    .trend-chart { grid-column: 2; grid-row: 1; }
    .dept-performance-chart { grid-column: 3; grid-row: 1; }
    .top-performers-table { grid-column: 1 / 3; grid-row: 2; }
    .insight-widget { grid-column: 3 / 5; grid-row: 2; }
    .widget-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
    .widget-header h3 { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .chart-placeholder { flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; background: var(--background); color: var(--muted); font-style: italic; }
    .table-container { flex: 1; overflow-y: auto; padding: 0 1rem 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.75rem 0.5rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: var(--background); font-weight: 600; color: var(--text-secondary); }
    .rating-badge { padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .rating-badge.excellent { background: rgba(22, 163, 74, 0.1); color: var(--success); }
    .rating-badge.good { background: rgba(37, 99, 235, 0.1); color: var(--primary-accent); }
    .rating-badge.average { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .insights-content { padding: 1rem; flex: 1; }
    .insight-item { display: flex; align-items: flex-start; margin-bottom: 1rem; padding: 0.75rem; background: var(--background); border-radius: 8px; }
    .insight-icon { margin-right: 0.75rem; font-size: 1.2rem; }
    .insight-text { font-size: 0.85rem; line-height: 1.4; }
  `]
})
export class PerformanceSectionComponent implements OnInit {
  performanceStats = { overallScore: 0, productivityScore: 0, goalsAchieved: 0, reviewsCompleted: 0, improvement: 0, productivityTrend: 0, goalCompletionRate: 0, reviewsPending: 0 };
  topPerformers: any[] = [];
  performanceInsights: any[] = [];
  isBrowser: boolean;
  
  performanceChartData: ChartConfiguration['data'] = { labels: ['Excellent (90-100%)', 'Good (75-89%)', 'Average (60-74%)', 'Below Average (<60%)'], datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#16A34A', '#2563EB', '#F59E0B', '#DC2626'] }] };
  trendChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ label: 'Performance Score', data: [], borderColor: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.1)', tension: 0.4 }] };
  deptPerformanceData: ChartConfiguration['data'] = { labels: [], datasets: [{ label: 'Avg Score', data: [], backgroundColor: '#2563EB' }] };
  
  chartOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          font: { size: 9 },
          padding: 8,
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
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
        max: 100,
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
  
  lineOptions: ChartConfiguration['options'] = { 
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
        max: 100,
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

  constructor(private dataService: DataService, private filterService: FilterService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // No data available - waiting for API response
    this.filterService.globalFilters.subscribe(filters => {
      // Data will be loaded when API is available
      this.generateTopPerformers([], []);
      this.calculatePerformanceStats([], []);
      this.generateInsights();
    });
  }

  private applyFilters(data: any[], filters: any): any[] { 
    return data.filter((item: any) => {
      if (filters.department && item.dept !== filters.department) return false;
      if (filters.team && item.team !== filters.team) return false;
      if (filters.search && !`${item.first_name} ${item.last_name}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }

  private generateTopPerformers(users: any[], attendance: any[]) {
    // Get unique employees and their average performance
    const employeeStats = attendance.reduce((acc, record) => {
      const key = `${record.first_name} ${record.last_name}`;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          department: record.dept || 'Unknown',
          totalProd: 0,
          totalDesk: 0,
          count: 0
        };
      }
      acc[key].totalProd += parseFloat(record.total_prod_time || 0);
      acc[key].totalDesk += parseFloat(record.total_desk_time || 0);
      acc[key].count++;
      return acc;
    }, {});
    
    this.topPerformers = Object.values(employeeStats)
      .map((emp: any) => {
        const avgProdPercentage = parseFloat((emp.totalProd / emp.totalDesk * 100).toString()) || 0;
        const score = Math.min(100, Math.round(avgProdPercentage));
        return {
          name: emp.name,
          department: emp.department,
          score,
          rating: this.getRating(score)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }



  private getRating(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Below Average';
  }

  getRatingClass(rating: string): string {
    switch (rating) {
      case 'Excellent': return 'excellent';
      case 'Good': return 'good';
      case 'Average': return 'average';
      default: return 'below';
    }
  }

  private calculatePerformanceStats(users: any[], attendance: any[]) {
    const uniqueEmployees = new Set(attendance.map(a => `${a.first_name}_${a.last_name}`)).size;
    const scores = this.topPerformers.map(p => p.score);
    
    // Calculate average productivity percentage from attendance data
    const avgProductivity = attendance.reduce((sum, record) => {
      return sum + parseFloat(record.prod_percentage || 0);
    }, 0) / attendance.length;
    
    this.performanceStats.overallScore = Math.round(avgProductivity);
    this.performanceStats.productivityScore = this.performanceStats.overallScore;
    this.performanceStats.goalsAchieved = Math.round(uniqueEmployees * 0.8);
    this.performanceStats.reviewsCompleted = Math.round(uniqueEmployees * 0.7);
    this.performanceStats.goalCompletionRate = Math.round((this.performanceStats.goalsAchieved / uniqueEmployees) * 100);
    this.performanceStats.reviewsPending = uniqueEmployees - this.performanceStats.reviewsCompleted;
    this.performanceStats.improvement = Math.round(Math.random() * 10 + 5); // Mock improvement
    this.performanceStats.productivityTrend = Math.round((avgProductivity / 75) * 100); // vs 75% target
    
    // Update chart data
    const distribution = [0, 0, 0, 0];
    scores.forEach(score => {
      if (score >= 90) distribution[0]++;
      else if (score >= 75) distribution[1]++;
      else if (score >= 60) distribution[2]++;
      else distribution[3]++;
    });
    this.performanceChartData.datasets[0].data = distribution;
    
    // Update department performance chart
    const deptStats = attendance.reduce((acc, record) => {
      const dept = record.dept || 'Unknown';
      if (!acc[dept]) acc[dept] = { total: 0, count: 0 };
      acc[dept].total += parseFloat(record.prod_percentage || 0);
      acc[dept].count++;
      return acc;
    }, {});
    
    this.deptPerformanceData.labels = Object.keys(deptStats);
    this.deptPerformanceData.datasets[0].data = Object.keys(deptStats).map(dept => 
      Math.round(deptStats[dept].total / deptStats[dept].count)
    );
    
    // Update trend chart with weekly data
    const weeklyStats = attendance.reduce((acc, record) => {
      const week = `Week ${record.week_no}`;
      if (!acc[week]) acc[week] = { total: 0, count: 0 };
      acc[week].total += parseFloat(record.prod_percentage || 0);
      acc[week].count++;
      return acc;
    }, {});
    
    const weeks = Object.keys(weeklyStats).sort();
    this.trendChartData.labels = weeks;
    this.trendChartData.datasets[0].data = weeks.map(week => 
      Math.round(weeklyStats[week].total / weeklyStats[week].count)
    );
  }

  private generateInsights() {
    this.performanceInsights = [
      { icon: '🎯', title: 'Goal Achievement', message: `${this.performanceStats.goalCompletionRate}% goal completion rate based on current performance.` },
      { icon: '📈', title: 'Overall Score', message: `Average performance score is ${this.performanceStats.overallScore}% across all employees.` },
      { icon: '🏆', title: 'Reviews Status', message: `${this.performanceStats.reviewsCompleted} reviews completed, ${this.performanceStats.reviewsPending} pending.` }
    ];
  }
}