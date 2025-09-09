import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Department {
  id: number;
  name: string;
  code?: string;
}

@Injectable({ providedIn: 'root' })
// 👈 use env variable
export class DepartmentService {
  private apiUrl = environment.php_base_url;
  private cachedDepartments: Observable<Department[]> | null = null;

  constructor(private http: HttpClient) {}

  getDepartments(
    companyId: any = localStorage.getItem('company_id')
  ): Observable<Department[]> {
    if (this.cachedDepartments) {
      return this.cachedDepartments;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    body.set(
      'data',
      JSON.stringify({
        cmd: 'get_department',
        company_id: companyId,
        user_id: 0,
        user_type: 'c',
      })
    );

    this.cachedDepartments = this.http
      .post<any>(this.apiUrl, body.toString(), { headers })
      .pipe(
        timeout(30000),
        catchError((error) => {
          this.cachedDepartments = null;
          return throwError(
            () => new Error(`Department data API failed: ${error.message}`)
          );
        }),
        map((response) => this.processDepartmentData(response)),
        shareReplay(1)
      );

    return this.cachedDepartments;
  }

  private processDepartmentData(response: any): Department[] {
    // Handle server errors (PHP errors, etc.)
    if (
      response?.status === 'error' ||
      response?.res_code === 2 ||
      response?.server_msg
    ) {
      return [];
    }

    // Handle the API response structure
    if (response?.status !== 'success' || !response?.data) {
      return [];
    }

    try {
      const departments = response.data
        .filter((dept: any) => dept.status === '1' || dept.status === 1)
        .map((dept: any) => ({
          id: parseInt(dept.department_id || dept.id, 10),
          name: (
            dept.department_name ||
            dept.name ||
            `Department ${dept.department_id || dept.id}`
          ).replace(/^#/, ''),
          code:
            dept.department_code ||
            dept.code ||
            dept.department_name?.substring(0, 3).toUpperCase(),
        }));

      return departments;
    } catch (error) {
      return [];
    }
  }

  clearCache(): void {
    this.cachedDepartments = null;
  }
}
