import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

    private _url: string = `${environment.url}`

    private _clients: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    private _client: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    public clients$ = this._clients.asObservable();
    public client$ = this._client.asObservable();

    constructor(
        private httpClient: HttpClient
    ) { }

    getClients(params: HttpParams): void {
        this.httpClient.get<any[]>(`${this._url}/users`, { params }).subscribe((clients) => {
            this._clients.next(clients);
        });
    }

    getClient(id: number): void {
        this.httpClient.get<any>(`${this._url}/users/${id}`).subscribe((client) => {
            this._client.next(client);
        });
    }
}
