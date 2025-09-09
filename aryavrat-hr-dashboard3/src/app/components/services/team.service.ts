import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Team {
  id: number;
  name: string;
  code?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  team: string;
  department?: string;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private apiUrl = environment.php_base_url;
  //private apiUrl = 'https://stagingdesktrack.timentask.com';
  private cachedTeam: Observable<Team[]> | null = null;

  constructor(private http: HttpClient) {}

  getTeamData(companyId: any = localStorage.getItem('company_id')): Observable<Team[]> {
    if (this.cachedTeam) {
      return this.cachedTeam;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    body.set(
      'data',
      JSON.stringify({
        cmd: 'get_team',
        company_id: companyId,
        user_id: 0,
        user_type: 'c',
      })
    );

    this.cachedTeam = this.http
      .post<any>(this.apiUrl, body.toString(), { headers })
      .pipe(
        timeout(30000),
        tap((response) => {
          if (response?.data && Array.isArray(response.data)) {
          }
        }),
        catchError((error) => {
          this.cachedTeam = null;
          return throwError(
            () => new Error(`Team data API failed: ${error.message}`)
          );
        }),
        map((response) => this.processTeamData(response)),
        shareReplay(1)
      );

    return this.cachedTeam;
  }

  getTeamMembers(): Observable<TeamMember[]> {
    // For now, return empty array as we don't have team member API endpoint
    // This can be implemented when team member API is available
    return new Observable((observer) => {
      observer.next([]);
      observer.complete();
    });
  }

  private processTeamData(response: any): Team[] {
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
      const teams = response.data
        .filter((team: any) => team.status === '1' || team.status === 1)
        .map((team: any) => ({
          id: parseInt(team.team_id || team.id, 10),
          name: (
            team.team_name ||
            team.name ||
            `Team ${team.team_id || team.id}`
          ).replace(/^#/, ''),
          code:
            team.team_code ||
            team.code ||
            team.team_name?.substring(0, 3).toUpperCase(),
        }));

      return teams;
    } catch (error) {
      return [];
    }
  }

  clearCache(): void {
    this.cachedTeam = null;
  }
}
