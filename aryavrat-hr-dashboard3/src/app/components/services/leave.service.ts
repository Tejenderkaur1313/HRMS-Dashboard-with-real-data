import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';

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
  private apiUrl = 'http://192.168.10.148/desktop_track/kricel_for_live_manish/api/desktop_tracking/web/v1/index/index';
  //private apiUrl = 'https://stagingdesktrack.timentask.com';
  private cachedData: Observable<LeaveData> | null = null;
  private lastFilters: string = '';

  constructor(private http: HttpClient) {}

  getLeaveData(fromDate: string, toDate: string, companyId: number = 85): Observable<LeaveData> {
    const filterKey = `${fromDate}-${toDate}-${companyId}`;
    
    if (this.cachedData && this.lastFilters === filterKey) {
      return this.cachedData;
    }

    this.lastFilters = filterKey;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new URLSearchParams();
    body.set('data', JSON.stringify({
      cmd: 'ai_leave_data',
      company_id: companyId,
      from_date: fromDate,
      to_date: toDate,
      filter_type: 'user'
    }));

    this.cachedData = this.http.post<any>(this.apiUrl, body.toString(), { headers }).pipe(
      timeout(30000),
      tap(response => {
        console.log('🏖️ LEAVE SERVICE API RESPONSE:');
        console.log('📊 Leave API Full Response:', JSON.stringify(response, null, 2));
        console.log('🗂️ Leave Response Keys:', Object.keys(response || {}));
        console.log('📋 Leave Data Structure:', response?.data ? Object.keys(response.data) : 'No data key');
        if (response?.data && Array.isArray(response.data)) {
          console.log('🏖️ Sample Leave Data Item:', response.data[0]);
          console.log('🔢 Total Leave Records:', response.data.length);
        }
      }),
      catchError(error => {
        console.error('❌ Leave data API failed:', error);
        console.error('🌐 Request URL:', this.apiUrl);
        console.error('📤 Request Body:', body.toString());
        this.cachedData = null;
        return throwError(() => new Error(`Leave data API failed: ${error.message}`));
      }),
      map(response => this.processLeaveData(response)),
      shareReplay(1)
    );

    return this.cachedData;
  }

  private getDepartmentName(departmentId: string): string {
    const departmentMap: { [key: string]: string } = {
      '4749': 'Development',
      '4750': 'Frontend', 
      '4751': 'Backend',
      '4752': 'Sales',
      '4753': 'QA',
      '4754': 'Support',
      '4755': 'BPO',
      '4756': 'Android',
      '4757': 'Marketing',
      '4758': 'Design'
    };
    
    return departmentMap[departmentId] || `Department ${departmentId}`;
  }

  private getLeaveTypeName(typeId: string): string {
    const leaveTypeMap: { [key: string]: string } = {
      '1': 'Sick Leave',
      '2': 'Casual Leave',
      '3': 'Paid Leave',
      '4': 'Unpaid Leave',
      '5': 'Emergency Leave',
      '6': 'Maternity Leave',
      '7': 'Paternity Leave'
    };
    
    return leaveTypeMap[typeId] || `Leave Type ${typeId}`;
  }

  private processLeaveData(response: any): LeaveData {
    console.log('🔄 Processing leave response:', response);
    
    // Handle server errors
    if (response?.status === 'error' || response?.res_code === 2 || response?.server_msg) {
      console.warn('⚠️ Server error in leave API:', response?.server_msg || response?.msg);
      return this.getEmptyLeaveData();
    }
    
    if (response?.status !== 'success' || !response?.data) {
      console.warn('⚠️ Unexpected leave response format:', response);
      return this.getEmptyLeaveData();
    }

    const data = response.data;
    
    if (!Array.isArray(data)) {
      console.warn('⚠️ Leave data is not an array:', data);
      return this.getEmptyLeaveData();
    }

    // Process leave data using actual column names from your API
    const totalLeaves = data.length;
    const approvedLeaves = data.filter((leave: any) => leave.lr_status === '1').length;
    const pendingLeaves = data.filter((leave: any) => leave.lr_status === '0').length;
    const rejectedLeaves = data.filter((leave: any) => leave.lr_status === '2').length;

    // Group by leave type using leave_name directly from API
    const leaveTypeGroups: { [key: string]: number } = {};
    data.forEach((leave: any) => {
      const leaveName = leave.leave_name || leave.lr_leave_type || 'Unknown Leave';
      leaveTypeGroups[leaveName] = (leaveTypeGroups[leaveName] || 0) + 1;
    });
    
    const leavesByType = Object.entries(leaveTypeGroups).map(([leaveName, count]) => ({
      name: leaveName,
      value: count
    }));

    // Group by month from lr_from_date
    const monthGroups: { [key: string]: number } = {};
    data.forEach((leave: any) => {
      if (leave.lr_from_date) {
        const month = new Date(leave.lr_from_date).toLocaleString('default', { month: 'short' });
        monthGroups[month] = (monthGroups[month] || 0) + 1;
      }
    });
    
    const leaveTrend = [{
      name: 'Leave Requests',
      series: Object.entries(monthGroups).map(([month, count]) => ({
        name: month,
        value: count
      }))
    }];

    // Group by department using department_tag_id from user data
    const deptGroups: { [key: string]: number } = {};
    data.forEach((leave: any) => {
      const deptId = leave.department_tag_id || leave.dept_id || 'Unknown';
      deptGroups[deptId] = (deptGroups[deptId] || 0) + 1;
    });
    
    const leavesByDepartment = Object.entries(deptGroups).map(([deptId, count]) => ({
      name: this.getDepartmentName(deptId),
      value: count
    }));

    return {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      leavesByDepartment,
      leavesByType,
      leaveTrend,
      recentLeaves: data.slice(0, 10).map((leave: any) => ({
        employee_name: leave.name || leave.first_name || `User ${leave.lr_user_id}`,
        leave_type: leave.leave_name || leave.lr_leave_type || 'Unknown Leave',
        from_date: leave.lr_from_date,
        duration: leave.lr_leave_duration,
        reason: leave.lr_reason || 'No reason provided',
        status: leave.lr_status === '1' ? 'Approved' : leave.lr_status === '0' ? 'Pending' : 'Rejected'
      }))
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
      recentLeaves: []
    };
  }

  clearCache(): void {
    this.cachedData = null;
    this.lastFilters = '';
  }
}
