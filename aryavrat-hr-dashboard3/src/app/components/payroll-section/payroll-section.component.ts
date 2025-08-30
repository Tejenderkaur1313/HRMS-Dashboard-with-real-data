import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-payroll-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="kpi-row">
        <div class="kpi-card total">
          <div class="kpi-value">₹{{ payrollStats.totalPayroll | number:'1.0-0' }}</div>
          <div class="kpi-label">Total Monthly Payroll</div>
          <div class="kpi-trend">{{ payrollStats.payrollGrowth }}% vs last month</div>
        </div>
        <div class="kpi-card avg">
          <div class="kpi-value">₹{{ payrollStats.avgSalary | number:'1.0-0' }}</div>
          <div class="kpi-label">Average Salary</div>
          <div class="kpi-trend">{{ payrollStats.salaryTrend }}% market rate</div>
        </div>
        <div class="kpi-card bonus">
          <div class="kpi-value">₹{{ payrollStats.totalBonus | number:'1.0-0' }}</div>
          <div class="kpi-label">Performance Bonus</div>
          <div class="kpi-trend">{{ payrollStats.bonusPercentage }}% of payroll</div>
        </div>
        <div class="kpi-card benefits">
          <div class="kpi-value">₹{{ payrollStats.totalBenefits | number:'1.0-0' }}</div>
          <div class="kpi-label">Employee Benefits</div>
          <div class="kpi-trend">{{ payrollStats.benefitsPercentage }}% of salary</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="chart-widget salary-chart">
          <div class="widget-header">
            <h3>Salary Distribution</h3>
            <span class="widget-actions">💰</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="salaryChartData" [options]="chartOptions" type="doughnut"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder">Salary Chart</div>
        </div>
        
        <div class="chart-widget dept-salary-chart">
          <div class="widget-header">
            <h3>Department-wise Payroll</h3>
            <span class="widget-actions">🏢</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="deptSalaryData" [options]="barOptions" type="bar"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder">Department Chart</div>
        </div>
        
        <div class="chart-widget cost-chart">
          <div class="widget-header">
            <h3>Cost Breakdown</h3>
            <span class="widget-actions">📊</span>
          </div>
          <canvas *ngIf="isBrowser" baseChart [data]="costBreakdownData" [options]="chartOptions" type="pie"></canvas>
          <div *ngIf="!isBrowser" class="chart-placeholder">Cost Chart</div>
        </div>
        
        <div class="table-widget salary-table">
          <div class="widget-header">
            <h3>Salary Summary</h3>
            <span class="widget-actions">📋</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Avg Salary</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let dept of departmentSalaries">
                  <td>{{ dept.name }}</td>
                  <td>{{ dept.count }}</td>
                  <td>₹{{ dept.avgSalary | number:'1.0-0' }}</td>
                  <td>₹{{ dept.totalCost | number:'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="insight-widget">
          <div class="widget-header">
            <h3>Payroll Insights</h3>
            <span class="widget-actions">💡</span>
          </div>
          <div class="insights-content">
            <div class="insight-item" *ngFor="let insight of payrollInsights">
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
    .kpi-card.total { border-left-color: var(--success); }
    .kpi-card.avg { border-left-color: var(--primary-accent); }
    .kpi-card.bonus { border-left-color: var(--warning); }
    .kpi-card.benefits { border-left-color: var(--purple); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr); gap: 1rem; height: calc(100vh - 180px); }
    .chart-widget, .table-widget, .insight-widget { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .chart-widget canvas { flex: 1; min-height: 0; width: 100% !important; height: auto !important; padding: 10px; }
    .salary-chart { grid-column: 1; grid-row: 1; }
    .dept-salary-chart { grid-column: 2; grid-row: 1; }
    .cost-chart { grid-column: 3; grid-row: 1; }
    .salary-table { grid-column: 1 / 3; grid-row: 2; }
    .insight-widget { grid-column: 3 / 5; grid-row: 2; }
    .widget-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
    .widget-header h3 { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .chart-placeholder { flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; background: var(--background); color: var(--muted); font-style: italic; }
    .table-container { flex: 1; overflow-y: auto; padding: 0 1rem 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.75rem 0.5rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: var(--background); font-weight: 600; color: var(--text-secondary); }
    .insights-content { padding: 1rem; flex: 1; }
    .insight-item { display: flex; align-items: flex-start; margin-bottom: 1rem; padding: 0.75rem; background: var(--background); border-radius: 8px; }
    .insight-icon { margin-right: 0.75rem; font-size: 1.2rem; }
    .insight-text { font-size: 0.85rem; line-height: 1.4; }
  `]
})
export class PayrollSectionComponent implements OnInit {
  payrollStats = { totalPayroll: 0, avgSalary: 0, totalBonus: 0, totalBenefits: 0, payrollGrowth: 0, salaryTrend: 0, bonusPercentage: 0, benefitsPercentage: 0 };
  departmentSalaries: any[] = [];
  payrollInsights: any[] = [];
  isBrowser: boolean;
  
  salaryChartData: ChartConfiguration['data'] = { labels: ['Junior (₹20-40K)', 'Mid (₹40-80K)', 'Senior (₹80K+)'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#2563EB', '#0D9488', '#7C3AED'] }] };
  deptSalaryData: ChartConfiguration['data'] = { labels: [], datasets: [{ label: 'Total Payroll', data: [], backgroundColor: '#2563EB' }] };
  costBreakdownData: ChartConfiguration['data'] = { labels: ['Base Salary', 'Bonus', 'Benefits', 'Taxes'], datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#16A34A', '#F59E0B', '#7C3AED', '#DC2626'] }] };
  
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
      this.calculatePayrollStats([]);
      if (this.isBrowser) this.updateCharts([]);
      this.generateInsights([]);
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

  private calculatePayrollStats(users: any[]) {
    const deptStats = users.reduce((acc, user) => {
      const dept = this.extractDepartment(user.last_name);
      const salary = this.estimateSalary(user.last_name);
      if (!acc[dept]) acc[dept] = { count: 0, totalSalary: 0 };
      acc[dept].count++;
      acc[dept].totalSalary += salary;
      return acc;
    }, {});

    this.departmentSalaries = Object.entries(deptStats).map(([name, stats]: any) => ({
      name, count: stats.count, avgSalary: stats.totalSalary / stats.count, totalCost: stats.totalSalary
    }));

    this.payrollStats.totalPayroll = this.departmentSalaries.reduce((sum, dept) => sum + dept.totalCost, 0);
    this.payrollStats.avgSalary = this.payrollStats.totalPayroll / users.length;
    this.payrollStats.totalBonus = this.payrollStats.totalPayroll * 0.12;
    this.payrollStats.totalBenefits = this.payrollStats.totalPayroll * 0.18;
    this.payrollStats.bonusPercentage = 12;
    this.payrollStats.benefitsPercentage = 18;
  }

  private updateCharts(users: any[]) {
    const salaryRanges = [0, 0, 0];
    users.forEach(user => {
      const salary = this.estimateSalary(user.last_name);
      if (salary < 40000) salaryRanges[0]++;
      else if (salary < 80000) salaryRanges[1]++;
      else salaryRanges[2]++;
    });
    this.salaryChartData.datasets[0].data = salaryRanges;
    
    this.deptSalaryData.labels = this.departmentSalaries.map(d => d.name);
    this.deptSalaryData.datasets[0].data = this.departmentSalaries.map(d => d.totalCost);
    
    // Update cost breakdown with actual percentages
    const baseSalaryPercent = 70;
    const bonusPercent = this.payrollStats.bonusPercentage;
    const benefitsPercent = this.payrollStats.benefitsPercentage;
    const taxesPercent = 100 - baseSalaryPercent - bonusPercent - benefitsPercent;
    this.costBreakdownData.datasets[0].data = [baseSalaryPercent, bonusPercent, benefitsPercent, taxesPercent];
  }

  private extractDepartment(lastName: string): string {
    if (lastName.includes('Development')) return 'Development';
    if (lastName.includes('QA')) return 'QA';
    if (lastName.includes('BDM') || lastName.includes('BPO')) return 'Business';
    if (lastName.includes('Support')) return 'Support';
    return 'General';
  }

  private estimateSalary(lastName: string): number {
    if (lastName.includes('Development')) return Math.random() * 40000 + 50000;
    if (lastName.includes('QA')) return Math.random() * 30000 + 35000;
    if (lastName.includes('BDM')) return Math.random() * 35000 + 45000;
    if (lastName.includes('Support')) return Math.random() * 25000 + 30000;
    return Math.random() * 30000 + 40000;
  }

  private generateInsights(users: any[]) {
    this.payrollInsights = [
      { icon: '💰', title: 'Cost Efficiency', message: `Total payroll: ₹${this.payrollStats.totalPayroll.toLocaleString()} for ${users.length} employees.` },
      { icon: '📈', title: 'Average Salary', message: `Average salary: ₹${this.payrollStats.avgSalary.toLocaleString()} per employee.` },
      { icon: '🎯', title: 'Benefits Cost', message: `Benefits represent ${this.payrollStats.benefitsPercentage}% of total payroll cost.` }
    ];
  }
}