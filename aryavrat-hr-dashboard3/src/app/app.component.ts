import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { GlobalFiltersComponent } from './components/global-filters/global-filters.component';
import { DashboardSectionComponent } from './components/dashboard-section/dashboard-section.component';
import { LeaveManagementSectionComponent } from './components/leave-management-section/leave-management-section.component';
import { AttendanceSectionComponent } from './components/attendance-section/attendance-section.component';
import { PayrollSectionComponent } from './components/payroll-section/payroll-section.component';
import { RecruitmentSectionComponent } from './components/recruitment-section/recruitment-section.component';
import { ReportsAnalyticsSectionComponent } from './components/reports-analytics-section/reports-analytics-section.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    GlobalFiltersComponent,
    DashboardSectionComponent,
    LeaveManagementSectionComponent,
    AttendanceSectionComponent,
    PayrollSectionComponent,
    RecruitmentSectionComponent,
    ReportsAnalyticsSectionComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Aryavrat – HR Dashboard';
}
