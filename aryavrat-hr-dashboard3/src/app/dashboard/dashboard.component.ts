import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { GlobalFiltersComponent } from '../components/global-filters/global-filters.component';
import { DashboardSectionComponent } from '../components/dashboard-section/dashboard-section.component';
import { LeaveManagementSectionComponent } from '../components/leave-management-section/leave-management-section.component';
import { AttendanceSectionComponent } from '../components/attendance-section/attendance-section.component';
import { DashboardService } from './service/dashboard.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    GlobalFiltersComponent,
    DashboardSectionComponent,
    LeaveManagementSectionComponent,
    AttendanceSectionComponent,
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  sessionToken: string | null = null;
  accessToken: string | null = null;
  dashboardData: any;

  companyReady = false; 

  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    // Set default company_id if not exists
    if (!localStorage.getItem('company_id')) {
      localStorage.setItem('company_id', '1');
    }
    
    // Set companyReady to true to bypass authentication
    this.companyReady = true;
    
    this.route.queryParams.subscribe((params) => {
      this.sessionToken =
        params['session_token'] || localStorage.getItem('session_token');
      this.accessToken =
        params['access_token'] || localStorage.getItem('access_token');

      // Optional: Still try to get dashboard data if tokens are available
      if (this.sessionToken && this.accessToken) {
        this.dashboardService
          .getDashboardData(this.sessionToken, this.accessToken)
          .subscribe({
            next: (res) => {
              this.dashboardData = res;
              if (res?.data?.company_id) {
                localStorage.setItem(
                  'company_id',
                  res.data.company_id.toString()
                );
              }
            },
            error: (err) => {
              console.error('API Error:', err);
              // Don't block the dashboard if authentication fails
            },
          });
      }
    });
  }
}
