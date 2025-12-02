import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { Observable } from 'rxjs';
import { ClientStatsQuery, ClientStatsResponse, CreditStatsQuery, CreditStatsResponse, StoreStatsQuery, StoreStatsResponse } from './statistics.types';

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
