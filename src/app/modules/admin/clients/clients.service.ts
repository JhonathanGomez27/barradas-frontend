import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { BehaviorSubject, tap, Observable } from 'rxjs';

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

    getClients(params: HttpParams): Observable<any> {
        return this.httpClient.get<any[]>(`${this._url}/users`, { params }).pipe(
            tap((clients) => {
                this._clients.next(clients);
            })
        )
    }

    getClient(id: number): Observable<any> {
        return this.httpClient.get<any>(`${this._url}/users/${id}`).pipe(
            tap((client) => {
                this._client.next(client);
            })
        );
    }

    uploadFileToClient(client_id: string, file: File, document_type: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.httpClient.post(`${this._url}/documents/admin/clients/${client_id}/documents?docType=${document_type}`, formData);
    }

    inviteClient(data: any): Observable<any> {
        return this.httpClient.post(`${this._url}/invitations`, data);
    }
}
