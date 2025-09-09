import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { PayrollService, PayrollData, PayrollEntry } from '../services/payroll.service';
import { finalize } from 'rxjs/operators';

// --- PAYROLL TYPES ---

@Component({
  selector: 'app-payroll-section',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './payroll-section.component.html',
  styleUrls: ['./payroll-section.component.scss']
})
export class PayrollSectionComponent implements OnInit {
  isLoading = false;
  error: string | null = null;
  
  // --- STATE MANAGEMENT ---
  payrollData: PayrollData | null = null;
  filteredData: PayrollEntry[] = [];
  
  filters = {
    period: '30', // Default to last 30 days
  };

  kpiData = {
    totalCost: '₹0',
    totalEmployees: '0',
    avgNetPay: '₹0',
    variablePay: '₹0',
  };

  topEarners: any[] = [];
  
  // --- CONSTANTS ---
  TIME_PERIODS = {
    'all': 'All Time',
    '90': 'Last 90 Days',
    '30': 'Last 30 Days',
    '7': 'Last 7 Days',
    '1': 'Last Week',
  };

  // --- CHART CONFIGURATIONS ---

  // 1. Payroll Trend (Line Chart)
  public payrollTrendData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Total Cost',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#3b82f6',
    }]
  };
  public payrollTrendOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Total Cost: ${this.formatCurrency(context.raw as number)}`
        }
      }
    },
    scales: {
      y: { ticks: { callback: (value) => `₹${Number(value) / 1000}k` } },
      x: { grid: { display: false } }
    }
  };

  // 2. Payroll Composition (Doughnut Chart)
  public payrollCompositionData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Base Salary', 'Bonuses', 'Overtime'],
    datasets: [{
      data: [],
      backgroundColor: ['#3b82f6', '#84cc16', '#f97316'],
      hoverBackgroundColor: ['#2563eb', '#65a30d', '#ea580c'],
      borderWidth: 0,
    }]
  };
  public payrollCompositionOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: 70,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${this.formatCurrency(context.raw as number)}`
        }
      }
    }
  };
  // For manual legend
  compositionLegend: { name: string, value: string, color: string }[] = [];


  // 3. Payroll Cost by Department (Horizontal Bar Chart)
  public payrollCostByDeptData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      label: 'Total Cost',
      data: [],
      backgroundColor: '#3b82f6',
      borderRadius: 4,
      barPercentage: 0.7
    }]
  };
  public payrollCostByDeptOptions: ChartOptions = {
    indexAxis: 'y', // <-- Makes the bar chart horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Total Cost: ${this.formatCurrency(context.raw as number)}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { callback: (value) => `₹${Number(value) / 1000}k` } 
      },
      y: { grid: { display: false } }
    }
  };

  isBrowser: boolean;

  constructor(
    private payrollService: PayrollService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadPayrollData();
  }

  onFilterChange(): void {
    this.processData();
  }
  
  private processData(): void {
    if (!this.payrollData) return;
    
    this.updateFilteredData();
    this.updateKPIs();
    this.updateCharts();
  }

  private loadPayrollData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.payrollService.getPayrollData(this.filters.period)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data: PayrollData) => {
          this.payrollData = data;
          this.processData();
        },
        error: (err: any) => {
          this.error = 'Failed to load payroll data. Please try again later.';
          console.error('Error loading payroll data:', err);
        }
      });
  }
  
  private updateCharts(): void {
    if (!this.payrollData) return;
    
    // Update payroll trend chart
    if (this.payrollTrendData?.labels && this.payrollTrendData?.datasets?.[0]) {
      this.payrollTrendData.labels = this.payrollData.trend.labels;
      this.payrollTrendData.datasets[0].data = this.payrollData.trend.data;
    }
    
    // Update payroll composition chart
    if (this.payrollCompositionData?.datasets?.[0]) {
      this.payrollCompositionData.datasets[0].data = [
        this.payrollData.composition.baseSalary,
        this.payrollData.composition.bonuses,
        this.payrollData.composition.overtime
      ] as number[];
    }
    
    // Update department breakdown
    if (this.payrollCostByDeptData?.labels && this.payrollCostByDeptData?.datasets?.[0]) {
      this.payrollCostByDeptData.labels = this.payrollData.departmentBreakdown.map((d: { name: string }) => d.name);
      this.payrollCostByDeptData.datasets[0].data = this.payrollData.departmentBreakdown.map((d: { value: number }) => d.value);
    }
    
    // Update top earners
    this.updateTopEarners();
  }

  private updateKPIs(): void {
    if (!this.payrollData) return;
    
    this.kpiData = {
      totalCost: this.formatCurrency(this.payrollData.summary.totalCost),
      totalEmployees: this.payrollData.summary.totalEmployees.toString(),
      avgNetPay: this.formatCurrency(this.payrollData.summary.avgNetPay),
      variablePay: this.formatCurrency(this.payrollData.summary.variablePay)
    };
  }

  private updateFilteredData(): void {
    if (!this.payrollData) return;
    
    this.filteredData = [...this.payrollData.data];
    const period = this.filters.period;

    if (period !== 'all') {
      const periodInDays = parseInt(period, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodInDays);
      this.filteredData = this.filteredData.filter((item: PayrollEntry) => {
        const itemDate = new Date(item.payDate);
        return itemDate >= startDate;
      });
    }
  }
  
  private updateTopEarners(): void {
    if (!this.payrollData) return;
    
    this.topEarners = this.payrollData.topEarners
      .slice(0, 5)
      .map((earner: { name: string; department: string; position: string; salary: number }) => ({
        name: earner.name,
        department: earner.department,
        position: earner.position,
        salary: this.formatCurrency(earner.salary)
      }));
  }

  private updatePayrollTrendChart(): void {
    if (!this.filteredData || this.filteredData.length === 0) {
       this.payrollTrendData.labels = [];
       this.payrollTrendData.datasets[0].data = [];
       return;
    }
    const costByDate = this.filteredData.reduce((acc, curr) => {
        const date = curr.payDate;
        if(!acc[date]) acc[date] = 0;
        acc[date] += curr.totalCost;
        return acc;
    }, {} as any);

    const sortedData = Object.keys(costByDate)
      .map(date => ({ date, 'Total Cost': costByDate[date] }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    this.payrollTrendData.labels = sortedData.map(d => new Date(d.date).toLocaleDateString('en-US', {month:'short', day:'numeric'}));
    this.payrollTrendData.datasets[0].data = sortedData.map(d => d['Total Cost']);
  }

  private updatePayrollCompositionChart(): void {
      if (!this.filteredData || this.filteredData.length === 0) {
        this.payrollCompositionData.datasets[0].data = [];
        this.compositionLegend = [];
        return;
      }
      const totals = this.filteredData.reduce((acc, curr) => {
          acc.baseSalary += curr.baseSalary;
          acc.bonus += curr.bonus;
          acc.overtimePay += curr.overtimePay;
          return acc;
      }, { baseSalary: 0, bonus: 0, overtimePay: 0 });

      const data = [totals.baseSalary, totals.bonus, totals.overtimePay];
      this.payrollCompositionData.datasets[0].data = data;

      // Update manual legend
      this.compositionLegend = [
        { name: 'Base Salary', value: this.formatCurrency(totals.baseSalary), color: '#3b82f6'},
        { name: 'Bonuses', value: this.formatCurrency(totals.bonus), color: '#84cc16'},
        { name: 'Overtime', value: this.formatCurrency(totals.overtimePay), color: '#f97316'},
      ].filter(item => parseFloat(item.value.replace(/[^0-9.-]+/g,"")) > 0);
  }

  private updatePayrollCostByDeptChart(): void {
    if (!this.filteredData || this.filteredData.length === 0) {
      this.payrollCostByDeptData.labels = [];
      this.payrollCostByDeptData.datasets[0].data = [];
      return;
    }
     const costByDept = this.filteredData.reduce((acc, curr) => {
        if (!acc[curr.department]) acc[curr.department] = 0;
        acc[curr.department] += curr.totalCost;
        return acc;
    }, {} as any);
    
    const sortedData = Object.entries(costByDept)
      .sort(([, a], [, b]) => (b as number) - (a as number));
      
    this.payrollCostByDeptData.labels = sortedData.map(([name]) => name);
    this.payrollCostByDeptData.datasets[0].data = sortedData.map(([, cost]) => cost as number);
  }

  // --- HELPER & DATA GENERATION ---
  // Format currency for display
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private generateMockData = (): PayrollEntry[] => {
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
    const jobTitles = ['Junior Developer', 'Senior Developer', 'Sales Rep', 'Marketing Specialist', 'Accountant'];
    const data: PayrollEntry[] = [];
    const today = new Date();
    let employeeId = 101;

    for (let i = 0; i < 180; i++) {
        const payDate = new Date(today);
        payDate.setDate(today.getDate() - (i % 26) * 7);

        const numEmployees = Math.floor(Math.random() * 15) + 35;
        for (let j = 0; j < numEmployees; j++) {
            const department = departments[Math.floor(Math.random() * departments.length)];
            const baseSalary = Math.floor(Math.random() * 2000) + 1000;
            const bonus = Math.random() > 0.8 ? Math.floor(Math.random() * 500) : 0;
            const overtimePay = Math.random() > 0.6 ? Math.floor(Math.random() * 300) : 0;
            const deductions = Math.floor(baseSalary * 0.15);
            
            data.push({
                employeeId: employeeId + j,
                name: `Employee ${employeeId + j}`,
                department,
                jobTitle: jobTitles[Math.floor(Math.random() * jobTitles.length)],
                baseSalary,
                bonus,
                overtimePay,
                deductions,
                netPay: baseSalary + bonus + overtimePay - deductions,
                totalCost: baseSalary + bonus + overtimePay,
                payDate: payDate.toISOString().split('T')[0],
            });
        }
        employeeId += numEmployees;
    }
    return data;
  };
}