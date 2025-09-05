import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { DataService, RecruitmentDashboardData, ChartDataPoint } from '../services/data.service';
import { GlobalFilterService } from '../services/global-filter.service';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-recruitment-section',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule
  ],
  templateUrl: './recruitment-section.component.html',
  styleUrls: ['./recruitment-section.component.scss']
})
export class RecruitmentSectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  public dashboardData$: Observable<RecruitmentDashboardData> = of({
    openPositions: 0,
    totalApplicants: 0,
    avgTimeToFill: 0,
    acceptanceRate: '0%',
    newHires: 0,
    hiresByDept: [],
    sourceOfHire: [],
    recruitmentFunnel: [],
    timeToFillTrend: [],
    rolesByExperience: []
  });
  
  public barColorScheme: Color = {
    name: 'barColors',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#ffc658', '#8884d8']
  };

  public pieColors: Color = {
    name: 'pieColors',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
  };
  
  public funnelColors: Color = {
    name: 'funnelColors',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6'].reverse()
  };
  
  public legendPosition: LegendPosition = LegendPosition.Right;
  public LegendPosition = LegendPosition;

  // Translations object remains the same
  translations = {
    dashboardTitle: "Recruitment Dashboard",
    dashboardSubtitle: "A quick overview of your key recruitment metrics.",
    kpi: {
      openPositions: "Open Positions",
      timeToFill: "Avg. Time to Fill (Days)",
      newHires: "New Hires (This Month)",
      applicants: "Total Applicants",
      acceptanceRate: "Offer Acceptance Rate (%)"
    },
    charts: {
      hiresByDept: "Hires by Department",
      sourceOfHire: "Source of Hire",
      recruitmentPipeline: "Recruitment Pipeline",
      timeToFillTrend: "Time to Fill Trend (Monthly)",
      rolesByExperience: "Open Roles by Experience Level",
    },
  };

  constructor(
    private dataService: DataService,
    private globalFilterService: GlobalFilterService
  ) { }

  ngOnInit(): void {
    // Subscribe to global filter changes
    this.dashboardData$ = this.globalFilterService.filters$.pipe(
      takeUntil(this.destroy$),
      switchMap(filters => {
        // For now, still using mock data but will be replaced with real API
        const month = this.getMonthName(filters.fromDate);
        return this.dataService.getRecruitmentData(month);
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getMonthName(dateString: string): string {
    const date = new Date(dateString);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[date.getMonth()];
  }
}