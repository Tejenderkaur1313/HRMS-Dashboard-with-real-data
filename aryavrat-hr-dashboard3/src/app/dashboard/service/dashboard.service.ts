import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // API call with tokens inside body
  getDashboardData(sessionToken: string, accessToken: string): Observable<any> {
    const body = {
      data: {
        access_token: accessToken,
        session_token: sessionToken,
        cmd: 'authentication_user',
      },
    };

    return this.http.post(this.apiUrl, body);
  }
}
