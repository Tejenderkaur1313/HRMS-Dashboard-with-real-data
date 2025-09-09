import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';
import { DepartmentService, Department } from './department.service';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

export interface LeaveData {
  totalLeaves: number;
  approvedLeaves: number;
  pendingLeaves: number;
  rejectedLeaves: number;
  leavesByDepartment: { name: string; value: number }[];
  leavesByType: { name: string; value: number }[];
  leaveTrend: { name: string; series: { name: string; value: number }[] }[];
  recentLeaves: any[];
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private apiUrl = environment.php_base_url;
  //private apiUrl = 'https://stagingdesktrack.timentask.com';
  private cachedData: Observable<LeaveData> | null = null;
  private lastFilters: string = '';

  constructor(
    private http: HttpClient,
    private departmentService: DepartmentService,
    private userService: UserService
  ) {}

  getLeaveData(
    fromDate: string,
    toDate: string,
    companyId: any = localStorage.getItem('company_id')
  ): Observable<LeaveData> {
    const filterKey = `${fromDate}-${toDate}-${companyId}`;

    // Always clear cache and fetch new data when filters change
    if (this.lastFilters !== filterKey) {
      this.cachedData = null;
    }

    if (this.cachedData && this.lastFilters === filterKey) {
      return this.cachedData;
    }

    this.lastFilters = filterKey;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    body.set(
      'data',
      JSON.stringify({
        cmd: 'ai_leave_data',
        company_id: companyId,
        from_date: fromDate,
        to_date: toDate,
        filter_type: 'user',
      })
    );

    const leaveRequest$ = this.http.post<any>(this.apiUrl, body.toString(), { headers });
    const departmentsRequest$ = this.departmentService.getDepartments(companyId);
    const userDepartmentMap$ = this.userService.getUserDepartmentMap(companyId);

    this.cachedData = forkJoin([leaveRequest$, departmentsRequest$, userDepartmentMap$]).pipe(
      timeout(30000),
      map(([leaveResponse, departments, userDepartmentMap]) => {
        const departmentMap = new Map<string, string>();
        departments.forEach(dept => departmentMap.set(String(dept.id), dept.name));
        return this.processLeaveData(leaveResponse, departmentMap, userDepartmentMap);
      }),
      catchError((error) => {
        this.cachedData = null;
        return throwError(() => new Error(`Leave data API failed: ${error.message}`));
      }),
      shareReplay(1)
    );

    return this.cachedData;
  }

  private getLeaveTypeName(typeId: string): string {
    const leaveTypeMap: { [key: string]: string } = {
      '1': 'Sick Leave',
      '2': 'Casual Leave',
      '3': 'Paid Leave',
      '4': 'Unpaid Leave',
      '5': 'Emergency Leave',
      '6': 'Maternity Leave',
      '7': 'Paternity Leave',
    };

    return leaveTypeMap[typeId] || `Leave Type ${typeId}`;
  }

  private processLeaveData(response: any, departmentMap: Map<string, string>, userDepartmentMap: Map<string, string>): LeaveData {
    // Handle server errors
    if (
      response?.status === 'error' ||
      response?.res_code === 2 ||
      response?.server_msg
    ) {
      return this.getEmptyLeaveData();
    }

    if (response?.status !== 'success' || !response?.data) {
      return this.getEmptyLeaveData();
    }

    const data = response.data;

    if (!Array.isArray(data)) {
      return this.getEmptyLeaveData();
    }

    // Process leave data using actual column names from your API
    const totalLeaves = data.length;
    const approvedLeaves = data.filter(
      (leave: any) => leave.lr_status === '1'
    ).length;
    const pendingLeaves = data.filter(
      (leave: any) => leave.lr_status === '0'
    ).length;
    const rejectedLeaves = data.filter(
      (leave: any) => leave.lr_status === '2'
    ).length;

    // Group by leave type using leave_name directly from API
    const leaveTypeGroups: { [key: string]: number } = {};
    data.forEach((leave: any) => {
      const leaveName =
        leave.leave_name || leave.lr_leave_type || 'Unknown Leave';
      leaveTypeGroups[leaveName] = (leaveTypeGroups[leaveName] || 0) + 1;
    });

    const leavesByType = Object.entries(leaveTypeGroups).map(
      ([leaveName, count]) => ({
        name: leaveName,
        value: count,
      })
    );

    // Group by month from lr_from_date
    const monthGroups: { [key: string]: number } = {};
    data.forEach((leave: any) => {
      if (leave.lr_from_date) {
        const month = new Date(leave.lr_from_date).toLocaleString('default', {
          month: 'short',
        });
        monthGroups[month] = (monthGroups[month] || 0) + 1;
      }
    });

    const leaveTrend = [
      {
        name: 'Leave Requests',
        series: Object.entries(monthGroups).map(([month, count]) => ({
          name: month,
          value: count,
        })),
      },
    ];

    // Initialize all departments with 0 leaves from the department map
    const deptGroups: { [key: string]: number } = {};
    departmentMap.forEach((_, deptId) => {
      deptGroups[deptId] = 0;
    });

    // Group by department using the user-department map
    data.forEach((leave: any) => {
      const deptId = userDepartmentMap.get(String(leave.lr_user_id));
      if (deptId && deptGroups.hasOwnProperty(deptId)) {
        deptGroups[deptId]++;
      } else {
        // Handle leaves where the department is not in the map, if necessary
        deptGroups['Unknown'] = (deptGroups['Unknown'] || 0) + 1;
      }
    });

    const leavesByDepartment = Object.entries(deptGroups).map(
      ([deptId, count]) => ({
        name: departmentMap.get(deptId) || `Department ${deptId}`,
        value: count,
      })
    );

    // Add department_name to each leave record for use in the component
    const processedRecentLeaves = data.slice(0, 10).map((leave: any) => {
      const deptId = userDepartmentMap.get(String(leave.lr_user_id)) || 'Unknown';
      const department_name = departmentMap.get(deptId) || `Department ${deptId}`;
      return {
        ...leave,
        department_name,
        employee_name:
          leave.name || leave.first_name || `User ${leave.lr_user_id}`,
        leave_type: leave.leave_name || leave.lr_leave_type || 'Unknown Leave',
        from_date: leave.lr_from_date,
        duration: leave.lr_leave_duration,
        reason: leave.lr_reason || 'No reason provided',
        status:
          leave.lr_status === '1'
            ? 'Approved'
            : leave.lr_status === '0'
            ? 'Pending'
            : 'Rejected',
      };
    });

    return {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      leavesByDepartment,
      leavesByType,
      leaveTrend,
      recentLeaves: processedRecentLeaves,
    };
  }

  private getEmptyLeaveData(): LeaveData {
    return {
      totalLeaves: 0,
      approvedLeaves: 0,
      pendingLeaves: 0,
      rejectedLeaves: 0,
      leavesByDepartment: [],
      leavesByType: [],
      leaveTrend: [],
      recentLeaves: [],
    };
  }

  clearCache(): void {
    this.cachedData = null;
    this.lastFilters = '';
  }
}
