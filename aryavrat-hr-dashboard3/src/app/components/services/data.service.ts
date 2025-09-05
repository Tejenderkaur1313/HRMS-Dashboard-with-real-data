import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// --- Interfaces for Recruitment Data ---
export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TrendChartData {
  name: string;
  series: ChartDataPoint[];
}

export interface TopPerformer {
  name: string;
  rating: number;
}

export interface RecruitmentDashboardData {
  openPositions: number;
  totalApplicants: number;
  avgTimeToFill: number;
  acceptanceRate: string;
  newHires: number;
  hiresByDept: ChartDataPoint[];
  sourceOfHire: ChartDataPoint[];
  recruitmentFunnel: ChartDataPoint[];
  timeToFillTrend: TrendChartData[];
  rolesByExperience: ChartDataPoint[];
}

export interface PerformanceKpis {
  overallScore: number;
  topDept: string;
  lowDept: string;
  targetMetPercent: number;
}
export interface PerformanceDashboardData {
  kpis: PerformanceKpis;
  performanceTrend: TrendChartData[];
  performanceDistribution: ChartDataPoint[];
  departmentComparison: ChartDataPoint[];
  topPerformers: TopPerformer[];
}


@Injectable({ providedIn: 'root' })
export class DataService {

  // Chart color schemes
  // Translations for mock data
  private translations = {
    departments: { tech: "Technology", sales: "Sales", marketing: "Marketing", hr: "HR", finance: "Finance" },
    sources: { referrals: "Referrals", jobPortals: "Job Portals", socialMedia: "Social Media", campus: "Campus Hire" },
    funnelStages: { applied: "Applied", screened: "Screened", interview: "Interview", offer: "Offered", hired: "Hired" },
    experienceLevels: { entry: "Entry Level", mid: "Mid-Level", senior: "Senior", lead: "Leadership" }
  };

  constructor(private http: HttpClient) { }

  // *******************************************************************
  // --- RECRUITMENT & PERFORMANCE MOCK DATA SECTION (NEW) ---
  // *******************************************************************

  private getMockRecruitmentData(month: string): RecruitmentDashboardData {
    const isJuly = month.toLowerCase() === 'july';
    const funnel = {
        applied: isJuly ? 1258 : 1100,
        screened: isJuly ? 600 : 550,
        interview: isJuly ? 250 : 220,
        offer: isJuly ? 80 : 75,
        hired: isJuly ? 74 : 68
    };
    const timeToFillDays = isJuly ? [41, 45, 42, 44, 40, 39] : [48, 45, 52, 46, 50, 47];

    return {
      openPositions: isJuly ? 12 : 15,
      totalApplicants: funnel.applied,
      newHires: funnel.hired,
      acceptanceRate: `${Math.round((funnel.hired / funnel.offer) * 100)}%`,
      avgTimeToFill: Math.round(timeToFillDays.reduce((a, b) => a + b, 0) / timeToFillDays.length),
      hiresByDept: [
        { name: 'development', value: isJuly ? 12 : 10 },
        { name: 'frontend', value: isJuly ? 8 : 7 },
        { name: 'backend', value: isJuly ? 10 : 9 },
        { name: 'sales', value: isJuly ? 15 : 12 },
        { name: 'QA', value: isJuly ? 6 : 5 },
        { name: 'support', value: isJuly ? 4 : 6 },
        { name: 'BPO', value: isJuly ? 8 : 10 },
        { name: 'android', value: isJuly ? 5 : 4 },
        { name: 'marketing', value: isJuly ? 7 : 8 },
        { name: 'design', value: isJuly ? 6 : 5 }
      ],
      sourceOfHire: [
        { name: this.translations.sources.referrals, value: isJuly ? 400 : 350 },
        { name: this.translations.sources.jobPortals, value: isJuly ? 300 : 320 },
        { name: this.translations.sources.socialMedia, value: isJuly ? 200 : 180 },
      ],
      recruitmentFunnel: Object.entries(this.translations.funnelStages).map(([key, name]) => ({
          name: name,
          value: funnel[key as keyof typeof funnel]
      })),
      timeToFillTrend: [{
          name: 'Avg. Time To Fill',
          series: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => ({ name: m, value: timeToFillDays[i] }))
      }],
      rolesByExperience: [
        { name: this.translations.experienceLevels.entry, value: isJuly ? 5 : 6 },
        { name: this.translations.experienceLevels.mid, value: isJuly ? 4 : 5 },
        { name: this.translations.experienceLevels.senior, value: isJuly ? 2 : 3 },
      ]
    };
  }

  private getMockPerformanceData(month: string): PerformanceDashboardData {
      const baseRandom = month.toLowerCase() === 'july' ? 0.8 : 0.6;
      const rawData = this.generateMockPerfRawData(baseRandom);
      const totalRating = rawData.reduce((sum, d) => sum + d.rating, 0);
      const targetMetCount = rawData.filter(d => d.targetMet).length;
      const departments = [...new Set(rawData.map(d => d.department))];
      const deptScores = departments.map(dept => {
          const deptData = rawData.filter(d => d.department === dept);
          const deptTotal = deptData.reduce((sum, d) => sum + d.rating, 0);
          return { name: dept, value: parseFloat((deptTotal / deptData.length).toFixed(2)) };
      }).sort((a, b) => b.value - a.value);

      const ratingGroups = { 'Excellent (4.5+)': 0, 'Good (3.5-4.4)': 0, 'Needs Improvement (<3.5)': 0 };
      rawData.forEach(d => {
          if (d.rating >= 4.5) ratingGroups['Excellent (4.5+)']++;
          else if (d.rating >= 3.5) ratingGroups['Good (3.5-4.4)']++;
          else ratingGroups['Needs Improvement (<3.5)']++;
      });
      
      return {
          kpis: {
              overallScore: parseFloat((totalRating / rawData.length).toFixed(1)),
              targetMetPercent: Math.round((targetMetCount / rawData.length) * 100),
              topDept: deptScores[0]?.name || 'N/A',
              lowDept: deptScores[deptScores.length - 1]?.name || 'N/A',
          },
          performanceTrend: [{ name: 'Avg. Performance', series: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(label => {
                const periodData = rawData.filter(d => d.period === label);
                return { name: label, value: periodData.length > 0 ? parseFloat((periodData.reduce((s, i) => s + i.rating, 0) / periodData.length).toFixed(1)) : 0 };
          })}],
          performanceDistribution: Object.entries(ratingGroups).map(([key, value]) => ({ name: key, value })),
          departmentComparison: deptScores,
          topPerformers: [...rawData].sort((a, b) => b.rating - a.rating).slice(0, 5).map(p => ({ name: p.name, rating: p.rating }))
      };
  }
  
  private generateMockPerfRawData(baseRandom: number) {
    const data: any[] = [];
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Support'];
    for (let i = 0; i < 50; i++) {
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].forEach(label => {
        const rating = parseFloat((Math.random() * 2 + 2.5 * baseRandom + 1.5).toFixed(1));
        data.push({
          name: `Employee ${i + 1}`,
          department: departments[i % departments.length],
          period: label,
          rating: rating,
          targetMet: rating > 3.8
        });
      });
    }
    return data;
  }

  /**
   * Gets mock recruitment data for a specific month.
   * TODO: Replace with real API calls
   */
  getRecruitmentData(month: string): Observable<RecruitmentDashboardData> {
    console.log(`📦 Getting MOCK recruitment data for ${month}`);
    const data = this.getMockRecruitmentData(month);
    return of(data).pipe(delay(200));
  }

  /**
   * Gets mock performance data for a specific month.
   * TODO: Replace with real API calls
   */
  getPerformanceData(month: string): Observable<PerformanceDashboardData> {
    console.log(`📦 Getting MOCK performance data for ${month}`);
    const data = this.getMockPerformanceData(month);
    return of(data).pipe(delay(200));
  }
}