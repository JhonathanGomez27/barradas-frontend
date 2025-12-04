import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { Observable } from 'rxjs';
import { AgentCreditStatsQuery, AgentCreditStatsResponse, AgentPerformanceQuery, AgentPerformanceResponse, ClientStatsQuery, ClientStatsResponse, CreditStatsQuery, CreditStatsResponse, DashboardStatsQuery, DashboardStatsResponse, StoreStatsQuery, StoreStatsResponse } from './statistics.types';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private url: string = environment.url;

  constructor(private _httpClient: HttpClient) { }

  getClientsStatistics(params?: ClientStatsQuery): Observable<ClientStatsResponse> {
    return this._httpClient.get<ClientStatsResponse>(`${this.url}/stats/clients`, { params: this.clean(params) });
  }

  getCreditsStatistics(params?: CreditStatsQuery): Observable<CreditStatsResponse> {
    return this._httpClient.get<CreditStatsResponse>(`${this.url}/stats/credits`, { params: this.clean(params) });
  }

  getStoresStatistics(params?: StoreStatsQuery): Observable<StoreStatsResponse> {
    return this._httpClient.get<StoreStatsResponse>(`${this.url}/stats/stores`, { params: this.clean(params) });
  }

  getDashboardStatistics(params?: DashboardStatsQuery): Observable<DashboardStatsResponse> {
    return this._httpClient.get<DashboardStatsResponse>(`${this.url}/stats/dashboard`, { params: this.clean(params) });
  }

  getAgentCreditsStatistics(params?: AgentCreditStatsQuery): Observable<AgentCreditStatsResponse> {
    return this._httpClient.get<AgentCreditStatsResponse>(`${this.url}/stats/agents/credits`, { params: this.clean(params) });
  }

  getAgentPerformanceStatistics(params?: AgentPerformanceQuery): Observable<AgentPerformanceResponse> {
    return this._httpClient.get<AgentPerformanceResponse>(`${this.url}/stats/agents/performance`, { params: this.clean(params) });
  }

  private clean<T>(params?: T): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value as string);
      }
    });
    return httpParams;
  }
}
