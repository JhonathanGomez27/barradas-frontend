import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environment/environment';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CompleteProfileService {

    private _url: string = environment.url;

    private tokenInfo: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    public tokenInfo$ = this.tokenInfo.asObservable();

    constructor(private _httpClient: HttpClient, private _router: Router) {}

    validateToken(token: string): Observable<any> {
        return this._httpClient.get(`${this._url}/invitations/validate/${token}`).pipe(
            tap((response) => {
                this.tokenInfo.next(response);
            }), catchError((error) => {
                console.error('Error validating token:', error);

                this._router.navigate(['/invalid-token']);

                return of(null);
            })
        );
    }

    completeProfile(formData: FormData, token: string): Observable<any> {
        return this._httpClient.post(`${this._url}/public/invitations/${token}/complete`, formData);
    }
}
