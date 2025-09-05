import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';

export interface Department {
  id: number;
  name: string;
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private apiUrl = 'http://192.168.10.148/desktop_track/kricel_for_live_manish/api/desktop_tracking/web/v1/index/index';
  //private apiUrl = 'https://stagingdesktrack.timentask.com';
      
  private cachedDepartments: Observable<Department[]> | null = null;

  constructor(private http: HttpClient) {}

  getDepartments(companyId: number = 85): Observable<Department[]> {
    if (this.cachedDepartments) {
      return this.cachedDepartments;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new URLSearchParams();
    body.set('data', JSON.stringify({
      cmd: 'get_department',
      company_id: companyId,
      user_id: 0,
      user_type: 'c'
    }));

    console.log('📤 Department API Request:', {
      url: this.apiUrl,
      body: body.toString(),
      headers: headers
    });

    this.cachedDepartments = this.http.post<any>(this.apiUrl, body.toString(), { headers }).pipe(
      timeout(30000),
      tap(response => {
        console.log('🏢 DEPARTMENT SERVICE API RESPONSE:');
        console.log('📊 Department API Full Response:', JSON.stringify(response, null, 2));
        console.log('🗂️ Department Response Keys:', Object.keys(response || {}));
        console.log('📋 Department Data Structure:', response?.data ? Object.keys(response.data) : 'No data key');
        if (response?.data && Array.isArray(response.data)) {
          console.log('🏢 Sample Department Data Item:', response.data[0]);
          console.log('🔢 Total Department Records:', response.data.length);
        }
      }),
      catchError(error => {
        console.error('❌ Department data API failed:', error);
        console.error('🌐 Request URL:', this.apiUrl);
        console.error('📤 Request Body:', body.toString());
        this.cachedDepartments = null;
        return throwError(() => new Error(`Department data API failed: ${error.message}`));
      }),
      map(response => this.processDepartmentData(response)),
      shareReplay(1)
    );

    return this.cachedDepartments;
  }

  private processDepartmentData(response: any): Department[] {
    console.log('🔄 Processing department data from get_department API...');
    
    // Handle server errors (PHP errors, etc.)
    if (response?.status === 'error' || response?.res_code === 2 || response?.server_msg) {
      console.warn('⚠️ Server error in department API:', response?.server_msg || response?.msg);
      console.log('🔍 No departments available due to server error');
      return [];
    }
    
    // Handle the API response structure
    if (response?.status !== 'success' || !response?.data) {
      console.warn('⚠️ Unexpected department response format:', response);
      console.log('🔍 Response status:', response?.status);
      console.log('🔍 Response data exists:', !!response?.data);
      console.log('🔍 No departments available due to API format issue');
      return [];
    }

    try {
      const departments = response.data
        .filter((dept: any) => dept.status === '1' || dept.status === 1)
        .map((dept: any) => ({
          id: parseInt(dept.department_id || dept.id, 10),
          name: (dept.department_name || dept.name || `Department ${dept.department_id || dept.id}`).replace(/^#/, ''),
          code: dept.department_code || dept.code || dept.department_name?.substring(0, 3).toUpperCase()
        }));

      console.log('✅ Processed departments from get_department API:', departments);
      return departments;
    } catch (error) {
      console.error('❌ Error processing department data:', error);
      return [];
    }
  }

  private getDepartmentName(deptId: string): string {
    const deptMap: { [key: string]: string } = {
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
    return deptMap[deptId] || `Department ${deptId}`;
  }

  clearCache(): void {
    this.cachedDepartments = null;
  }
}
