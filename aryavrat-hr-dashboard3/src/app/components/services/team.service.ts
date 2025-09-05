import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, shareReplay, tap } from 'rxjs/operators';

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
 private apiUrl = 'http://192.168.10.148/desktop_track/kricel_for_live_manish/api/desktop_tracking/web/v1/index/index';
 //private apiUrl = 'https://stagingdesktrack.timentask.com'; 
 private cachedTeam: Observable<Team[]> | null = null;

  constructor(private http: HttpClient) {}

  getTeamData(companyId: number = 85): Observable<Team[]> {
    if (this.cachedTeam) {
      return this.cachedTeam;
    }
 
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new URLSearchParams();
    body.set('data', JSON.stringify({
      cmd: 'get_team',
      company_id: companyId,
      user_id: 0,
      user_type: 'c'
    }));

    this.cachedTeam = this.http.post<any>(this.apiUrl, body.toString(), { headers }).pipe(
      timeout(30000),
      tap(response => {
        console.log('🏢 TEAM SERVICE API RESPONSE:');
        console.log('📊 Team API Full Response:', JSON.stringify(response, null, 2));
        console.log('🗂️ Team Response Keys:', Object.keys(response || {}));
        console.log('📋 Team Data Structure:', response?.data ? Object.keys(response.data) : 'No data key');
        if (response?.data && Array.isArray(response.data)) {
          console.log('👥 Sample Team Data Item:', response.data[0]);
          console.log('🔢 Total Team Records:', response.data.length);
        }
      }),
      catchError(error => {
        console.error('❌ Team data API failed:', error);
        console.error('🌐 Request URL:', this.apiUrl);
        console.error('📤 Request Body:', body.toString());
        this.cachedTeam = null;
        return throwError(() => new Error(`Team data API failed: ${error.message}`));
      }),
      map(response => this.processTeamData(response)),
      shareReplay(1)
    );

    return this.cachedTeam;
  }

  getTeamMembers(): Observable<TeamMember[]> {
    // For now, return empty array as we don't have team member API endpoint
    // This can be implemented when team member API is available
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  private processTeamData(response: any): Team[] {
    console.log('🔄 Processing team data from get_team API...');
    
    // Handle server errors (PHP errors, etc.)
    if (response?.status === 'error' || response?.res_code === 2 || response?.server_msg) {
      console.warn('⚠️ Server error in team API:', response?.server_msg || response?.msg);
      console.log('🔍 No teams available due to server error');
      return [];
    }
    
    // Handle the API response structure
    if (response?.status !== 'success' || !response?.data) {
      console.warn('⚠️ Unexpected team response format:', response);
      console.log('🔍 Response status:', response?.status);
      console.log('🔍 Response data exists:', !!response?.data);
      console.log('🔍 No teams available due to API format issue');
      return [];
    }

    try {
      const teams = response.data
        .filter((team: any) => team.status === '1' || team.status === 1)
        .map((team: any) => ({
          id: parseInt(team.team_id || team.id, 10),
          name: (team.team_name || team.name || `Team ${team.team_id || team.id}`).replace(/^#/, ''),
          code: team.team_code || team.code || team.team_name?.substring(0, 3).toUpperCase()
        }));

      console.log('✅ Processed teams from get_team API:', teams);
      return teams;
    } catch (error) {
      console.error('❌ Error processing team data:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cachedTeam = null;
  }
}
