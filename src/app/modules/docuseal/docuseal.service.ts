import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DocusealService {

    private _url: string = environment.url;

    private _signatureBuilder: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    public signatureBuilder$ = this._signatureBuilder.asObservable();

    constructor(
        private httpClient: HttpClient
    ) {}

    createDocumentToken(clientId: string, documentId: string): Observable<any> {
        return this.httpClient.post(`${this._url}/docuseal/create-signed-token`, { clientId, documentId });
    }

    getDocumentElectronicSignature(electronicSignatureId: string): Observable<any> {
        return this.httpClient.get(`${this._url}/docuseal/electronic-signatures/${electronicSignatureId}`).pipe(
            tap((signatureBuilder) => {
                this._signatureBuilder.next(signatureBuilder);
            })
        );
    }
}
