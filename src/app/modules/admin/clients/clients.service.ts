import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { BehaviorSubject, tap, Observable, catchError, throwError, map } from 'rxjs';

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

    getClient(id: string): Observable<any> {
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

    /**
     * Obtener archivo para visualizar
     * @param fileId El ID del archivo
     * @returns Observable con el blob y su tipo MIME
     */
    getFileUrlClient(fileId: string): Observable<{blob: Blob, mimeType: string}> {
        return this.httpClient.get(`${this._url}/documents/${fileId}/download`, {
            responseType: 'blob',
            observe: 'response'
        }).pipe(
            map(response => {
                const blob = response.body;
                // Obtener el tipo MIME del Content-Type header o del blob
                const contentType = response.headers.get('Content-Type') || blob.type || 'application/octet-stream';
                return { blob: blob, mimeType: contentType };
            }),
            catchError(error => {
                console.error('Error obteniendo el archivo:', error);
                return throwError(() => error);
            })
        );
    }

    getFileClient(file_id: string, doc_title: string): void{
        this.httpClient.get(`${this._url}/documents/${file_id}/download`, {responseType: 'blob'}).subscribe(blob => {
            // Crear URL objeto y simular click en enlace de descarga
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc_title || 'documento'; // Nombre por defecto, se sobreescribirá con el del Content-Disposition
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        });
    }

    inviteClient(data: any): Observable<any> {
        return this.httpClient.post(`${this._url}/invitations`, data);
    }

    deleteClient(id: string): Observable<any> {
        return this.httpClient.delete(`${this._url}/users/${id}`);
    }

    updateClient(id: string, data: any): Observable<any> {
        return this.httpClient.patch(`${this._url}/users/${id}`, data);
    }

    getTokenSign(clientId: string, documentId: string): Observable<any> {
        return this.httpClient.post(`${this._url}/users/${clientId}/documents/${documentId}/sign`, {});
    }
}
