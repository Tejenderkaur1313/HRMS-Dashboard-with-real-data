import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment.php_base_url;
  private userDepartmentMap$: Observable<Map<string, string>> | null = null;

  constructor(private http: HttpClient) {}

  getUserDepartmentMap(companyId: any = localStorage.getItem('company_id')) {
    if (this.userDepartmentMap$) {
      return this.userDepartmentMap$;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const today = new Date();
    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    const requestData = {
      cmd: 'ai_productivity_data',
      company_id: companyId,
      from_date: fromDate,
      to_date: toDate,
      filter_type: 'user',
    };

    const body = new URLSearchParams();
    body.set('data', JSON.stringify(requestData));

    this.userDepartmentMap$ = this.http.post<any>(this.apiUrl, body.toString(), { headers }).pipe(
      map(response => {
        const userMap = new Map<string, string>();
        if (response?.data && Array.isArray(response.data)) {
          response.data.forEach((user: any) => {
            if (user.user_id && user.department_tag_id) {
              userMap.set(String(user.user_id), String(user.department_tag_id));
            }
          });
        }
        return userMap;
      }),
      catchError(() => of(new Map<string, string>())),
      shareReplay(1)
    );

    return this.userDepartmentMap$;
  }
}
