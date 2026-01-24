import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  private _url: string = `${environment.url}`

  private _clients: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _client: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private _credits: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  public clients$ = this._clients.asObservable();
  public client$ = this._client.asObservable();
  public credits$ = this._credits.asObservable();

  constructor(
    private httpClient: HttpClient
  ) { }

  getClients(params: HttpParams): Observable<any> {
    return this.httpClient.get<any[]>(`${this._url}/agents/me/users`, { params }).pipe(
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

  uploadFileToClient(client_id: string, file: File, document_type: string, creditId?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = creditId ? `&creditId=${creditId}` : '';

    return this.httpClient.post(`${this._url}/documents/admin/clients/${client_id}/documents?docType=${document_type}${queryParams}`, formData);
  }


  /**
   * Obtener archivo para visualizar
   * @param fileId El ID del archivo
   * @returns Observable con el blob y su tipo MIME
   */
  getFileUrlClient(fileId: string): Observable<{ blob: Blob, mimeType: string }> {
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

  getFileClient(file_id: string, doc_title: string): void {
    this.httpClient.get(`${this._url}/documents/${file_id}/download`, { responseType: 'blob' }).subscribe(blob => {
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

  createCredit(data: { clientId: string, repaymentDay: string, initialPayment?: number, initialPaymentRate?: number, termWeeks?: number, termDays?: number, status?: string }): Observable<any> {
    return this.httpClient.post(`${this._url}/credits`, data);
  }

  getClientCredits(clientId: string, params: HttpParams): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this._url}/credits/list/${clientId}`, { params }).pipe(
      tap((credits) => {
        this._credits.next(credits);
      })
    );
  }

  updateCreditStatus(creditId: string, status: 'CLOSED' | 'CANCELLED'): Observable<any> {
    return this.httpClient.patch(`${this._url}/credits/${creditId}/status`, { status });
  }

  getCreditTerms(): Observable<any> {
    return this.httpClient.get(`${this._url}/credits/payment-terms`);
  }

  // Video Rooms
  createVideoRoom(agentId: string, clientId: string): Observable<any> {
    return this.httpClient.post(`${this._url}/video-rooms`, { agentId, clientId });
  }

  getVideoRoomsByClient(clientId: string): Observable<any> {
    return this.httpClient.get(`${this._url}/video-rooms/client/${clientId}`);
  }

  endVideoRoom(roomId: string): Observable<any> {
    return this.httpClient.patch(`${this._url}/video-rooms/${roomId}/end`, {});
  }

  removeVideoRoom(roomId: string): Observable<any> {
    return this.httpClient.delete(`${this._url}/video-rooms/${roomId}`);
  }
}
