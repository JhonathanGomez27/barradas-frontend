import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { Observable } from 'rxjs';
import {
  AgentCreditStatsQuery, AgentCreditStatsResponse,
  AgentPerformanceQuery, AgentPerformanceResponse,
  AlertsStatsQuery, AlertsStatsResponse,
  ClientStatsQuery, ClientStatsResponse,
  CollectionStatsQuery, CollectionStatsResponse,
  CommercialStatsQuery, CommercialStatsResponse,
  CreditStatsQuery, CreditStatsResponse,
  DashboardStatsQuery, DashboardStatsResponse,
  PortfolioStatsQuery, PortfolioStatsResponse,
  StoreStatsQuery, StoreStatsResponse,
  SummaryStatsQuery, SummaryStatsResponse,
  TrendStatsQuery, TrendStatsResponse
} from './statistics.types';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private url: string = environment.url;

  constructor(private _httpClient: HttpClient) { }

  // ── Existing endpoints ────────────────────────────────────────────────────
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

  // ── New endpoints (Dashboard Guide) ──────────────────────────────────────
  getSummaryStatistics(params?: SummaryStatsQuery): Observable<SummaryStatsResponse> {
    return this._httpClient.get<SummaryStatsResponse>(`${this.url}/stats/summary`, { params: this.clean(params) });
  }

  getTrendStatistics(params?: TrendStatsQuery): Observable<TrendStatsResponse> {
    return this._httpClient.get<TrendStatsResponse>(`${this.url}/stats/trend`, { params: this.clean(params) });
  }

  getCommercialStatistics(params?: CommercialStatsQuery): Observable<CommercialStatsResponse> {
    return this._httpClient.get<CommercialStatsResponse>(`${this.url}/stats/commercial`, { params: this.clean(params) });
  }

  getPortfolioStatistics(params?: PortfolioStatsQuery): Observable<PortfolioStatsResponse> {
    return this._httpClient.get<PortfolioStatsResponse>(`${this.url}/stats/portfolio`, { params: this.clean(params) });
  }

  getCollectionStatistics(params?: CollectionStatsQuery): Observable<CollectionStatsResponse> {
    return this._httpClient.get<CollectionStatsResponse>(`${this.url}/stats/collection`, { params: this.clean(params) });
  }

  getAlertsStatistics(params?: AlertsStatsQuery): Observable<AlertsStatsResponse> {
    return this._httpClient.get<AlertsStatsResponse>(`${this.url}/stats/alerts`, { params: this.clean(params) });
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
