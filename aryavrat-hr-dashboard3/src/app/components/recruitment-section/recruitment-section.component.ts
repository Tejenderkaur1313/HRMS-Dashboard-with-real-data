import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-recruitment-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="kpi-row">
        <div class="kpi-card applications">
          <div class="kpi-value">{{ recruitmentStats.totalApplications }}</div>
          <div class="kpi-label">Total Applications</div>
          <div class="kpi-trend">+{{ recruitmentStats.applicationGrowth }}% this month</div>
        </div>
        <div class="kpi-card hired">
          <div class="kpi-value">{{ recruitmentStats.totalHired }}</div>
          <div class="kpi-label">Hired This Month</div>
          <div class="kpi-trend">{{ recruitmentStats.hireRate }}% success rate</div>
        </div>
        <div class="kpi-card pipeline">
          <div class="kpi-value">{{ recruitmentStats.activePipeline }}</div>
          <div class="kpi-label">Active Pipeline</div>
          <div class="kpi-trend">{{ recruitmentStats.avgTimeToHire }} days avg hire time</div>
        </div>
        <div class="kpi-card positions">
          <div class="kpi-value">{{ recruitmentStats.openPositions }}</div>
          <div class="kpi-label">Open Positions</div>
          <div class="kpi-trend">{{ recruitmentStats.urgentPositions }} urgent</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="chart-widget funnel-chart">
          <div class="widget-header">
            <h3>Recruitment Funnel</h3>
            <span class="widget-actions">🎯</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="funnelChartData" [options]="barOptions" type="bar"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="chart-widget source-chart">
          <div class="widget-header">
            <h3>Application Sources</h3>
            <span class="widget-actions">📊</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="sourceChartData" [options]="chartOptions" type="doughnut"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="chart-widget dept-hiring-chart">
          <div class="widget-header">
            <h3>Department Hiring</h3>
            <span class="widget-actions">🏢</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="deptHiringData" [options]="barOptions" type="bar"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder"></div>
        </div>
        
        <div class="table-widget candidates-table">
          <div class="widget-header">
            <h3>Recent Hires</h3>
            <span class="widget-actions">👥</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let hire of recentHires">
                  <td>{{ hire.name }}</td>
                  <td>{{ hire.position }}</td>
                  <td>{{ hire.department }}</td>
                  <td>{{ hire.joinDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="insight-widget">
          <div class="widget-header">
            <h3>Recruitment Insights</h3>
            <span class="widget-actions">💡</span>
          </div>
          <div class="insights-content">
            <div class="insight-item" *ngFor="let insight of recruitmentInsights">
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
    .kpi-card.applications { border-left-color: #2196F3; }
    .kpi-card.hired { border-left-color: #4CAF50; }
    .kpi-card.pipeline { border-left-color: #FF9800; }
    .kpi-card.positions { border-left-color: #F44336; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); gap: 1rem; height: calc(100vh - 180px); }
    .chart-widget, .table-widget, .insight-widget { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .chart-widget canvas { flex: 1; min-height: 0; width: 100% !important; height: auto !important; padding: 10px; }
    .funnel-chart { grid-column: 1; grid-row: 1; }
    .source-chart { grid-column: 2; grid-row: 1; }
    .dept-hiring-chart { grid-column: 3; grid-row: 1; }
    .candidates-table { grid-column: 1 / 3; grid-row: 2; }
    .insight-widget { grid-column: 3 / 5; grid-row: 2; }
    .widget-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
    .widget-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #333; }
    .chart-placeholder { flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; background: #f8f9fa; color: #666; font-style: italic; }
    .table-container { flex: 1; overflow-y: auto; padding: 0 1rem 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.75rem 0.5rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; color: #555; }
    .insights-content { padding: 1rem; flex: 1; }
    .insight-item { display: flex; align-items: flex-start; margin-bottom: 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; }
    .insight-icon { margin-right: 0.75rem; font-size: 1.2rem; }
    .insight-text { font-size: 0.85rem; line-height: 1.4; }
  `]
})
export class RecruitmentSectionComponent implements OnInit {
  recruitmentStats = { totalApplications: 0, totalHired: 0, activePipeline: 0, openPositions: 0, applicationGrowth: 0, hireRate: 0, avgTimeToHire: 0, urgentPositions: 0 };
  recentHires: any[] = [];
  recruitmentInsights: any[] = [];
  isBrowser: boolean;
  
  funnelChartData: ChartConfiguration['data'] = { labels: ['Applications', 'Screening', 'Interview', 'Final', 'Hired'], datasets: [{ label: 'Candidates', data: [0, 0, 0, 0, 0], backgroundColor: '#2196F3' }] };
  sourceChartData: ChartConfiguration['data'] = { labels: ['Job Portals', 'Referrals', 'LinkedIn', 'Campus', 'Direct'], datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }] };
  deptHiringData: ChartConfiguration['data'] = { labels: [], datasets: [{ label: 'Hired', data: [], backgroundColor: '#4CAF50' }] };
  
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
    plugins: { legend: { display: false } }, 
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

  constructor(private dataService: DataService, private filterService: FilterService, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // No data available - waiting for API response
    this.filterService.globalFilters.subscribe(filters => {
      // Data will be loaded when API is available
      this.calculateRecruitmentStats([]);
      this.generateRecentHires([]);
      this.generateInsights();
    });
  }

  private applyFilters(data: any[], filters: any): any[] { return data; }

  private generateRecentHires(users: any[]) {
    this.recentHires = users.slice(0, 8).map(user => ({
      name: `${user.first_name} ${user.last_name.split('(')[0]}`,
      position: this.extractPosition(user.last_name),
      department: this.extractDepartment(user.last_name),
      joinDate: this.generateJoinDate()
    }));
  }

  private extractPosition(lastName: string): string {
    if (lastName.includes('Development')) return 'Developer';
    if (lastName.includes('QA')) return 'QA Engineer';
    if (lastName.includes('BDM')) return 'Business Manager';
    if (lastName.includes('Support')) return 'Support Executive';
    return 'Associate';
  }

  private extractDepartment(lastName: string): string {
    if (lastName.includes('Development')) return 'Development';
    if (lastName.includes('QA')) return 'QA';
    if (lastName.includes('BDM') || lastName.includes('BPO')) return 'Business';
    if (lastName.includes('Support')) return 'Support';
    return 'General';
  }

  private generateJoinDate(): string {
    const today = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const joinDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return joinDate.toISOString().split('T')[0];
  }

  private calculateRecruitmentStats(users: any[]) {
    this.recruitmentStats.totalHired = users.length;
    this.recruitmentStats.totalApplications = Math.round(users.length * 5);
    this.recruitmentStats.activePipeline = Math.round(users.length * 0.6);
    this.recruitmentStats.openPositions = Math.round(users.length * 0.3);
    this.recruitmentStats.hireRate = Math.round((this.recruitmentStats.totalHired / this.recruitmentStats.totalApplications) * 100);
    this.recruitmentStats.avgTimeToHire = 21;
    this.recruitmentStats.urgentPositions = Math.round(this.recruitmentStats.openPositions * 0.25);
    
    // Update funnel data
    const applications = this.recruitmentStats.totalApplications;
    this.funnelChartData.datasets[0].data = [
      applications,
      Math.round(applications * 0.6),
      Math.round(applications * 0.3),
      Math.round(applications * 0.15),
      this.recruitmentStats.totalHired
    ];
  }

  private generateInsights() {
    this.recruitmentInsights = [
      { icon: '🎯', title: 'Conversion Rate', message: `${this.recruitmentStats.hireRate}% application-to-hire rate from ${this.recruitmentStats.totalApplications} applications.` },
      { icon: '⏱️', title: 'Time to Hire', message: `Average ${this.recruitmentStats.avgTimeToHire} days hiring time for ${this.recruitmentStats.totalHired} hires.` },
      { icon: '📈', title: 'Pipeline Status', message: `${this.recruitmentStats.activePipeline} candidates in pipeline, ${this.recruitmentStats.openPositions} positions open.` }
    ];
  }
}