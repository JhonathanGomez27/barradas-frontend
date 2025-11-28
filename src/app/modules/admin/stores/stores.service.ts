import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface City {
    id: string;
    name: string;
}

export interface Store {
    id?: string;
    name: string;
    address: string;
    cityId: string;
    city?: City;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateStoreDto {
    name: string;
    address: string;
    cityId: string;
}

export interface UpdateStoreDto {
    name: string;
    address: string;
    cityId: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface StoreQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoresService {

    private readonly url: string = environment.url;

    private _allStores: BehaviorSubject<Store[]> = new BehaviorSubject<Store[]>([]);
    public readonly allStores$ = this._allStores.asObservable();

    private _stores: BehaviorSubject<Store[]> = new BehaviorSubject<Store[]>([]);
    public readonly stores$ = this._stores.asObservable();

    private _store: BehaviorSubject<Store | null> = new BehaviorSubject<Store | null>(null);
    public readonly store$ = this._store.asObservable();

    private _cities: BehaviorSubject<City[]> = new BehaviorSubject<City[]>([]);
    public readonly cities$ = this._cities.asObservable();

    private _pagination: BehaviorSubject<{ total: number; page: number; limit: number; }> =
        new BehaviorSubject({ total: 0, page: 1, limit: 10, totalPages: 0 });
    public readonly pagination$ = this._pagination.asObservable();

    constructor(
        private httpClient: HttpClient
    ) { }

    /**
     * Get all cities
     */
    getCities(): Observable<City[]> {
        return this.httpClient.get<City[]>(`${this.url}/cities`).pipe(
            tap(cities => this._cities.next(cities))
        );
    }

    /**
     * Get all stores
     */
    getStores(params?: StoreQueryParams): Observable<PaginatedResponse<Store>> {
        let queryParams = '';
        if (params) {
            const queryArray = [];
            if (params.page) queryArray.push(`page=${params.page}`);
            if (params.limit) queryArray.push(`limit=${params.limit}`);
            if (params.search) queryArray.push(`search=${encodeURIComponent(params.search)}`);
            if (queryArray.length > 0) {
                queryParams = '?' + queryArray.join('&');
            }
        }

        return this.httpClient.get<PaginatedResponse<Store>>(`${this.url}/stores${queryParams}`).pipe(
            tap(response => {
                this._stores.next(response.data);
                this._pagination.next({
                    total: response.total,
                    page: params.page,
                    limit: params.limit
                });
            })
        );
    }

    getAllStoresNoPagination(): Observable<Store[]> {
        return this.httpClient.get<Store[]>(`${this.url}/stores/all`).pipe(
            tap((stores) => {
                this._allStores.next(stores);
            })
        );
    }

    /**
     * Get store by ID
     */
    getStoreById(id: string): Observable<Store> {
        return this.httpClient.get<Store>(`${this.url}/stores/${id}`).pipe(
            tap(store => this._store.next(store))
        );
    }

    /**
     * Create new store
     */
    createStore(data: CreateStoreDto): Observable<Store> {
        return this.httpClient.post<Store>(`${this.url}/stores`, data).pipe(
            tap(store => {
                const currentStores = this._stores.value;
                this._stores.next([...currentStores, store]);
            })
        );
    }

    /**
     * Update store
     */
    updateStore(id: string, data: UpdateStoreDto): Observable<Store> {
        return this.httpClient.put<Store>(`${this.url}/stores/${id}`, data).pipe(
            tap(updatedStore => {
                const currentStores = this._stores.value;
                const index = currentStores.findIndex(s => s.id === id);
                if (index !== -1) {
                    currentStores[index] = updatedStore;
                    this._stores.next([...currentStores]);
                }
                this._store.next(updatedStore);
            })
        );
    }

    /**
     * Delete store (if needed in the future)
     */
    deleteStore(id: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.url}/stores/${id}`).pipe(
            tap(() => {
                const currentStores = this._stores.value.filter(s => s.id !== id);
                this._stores.next(currentStores);
            })
        );
    }
}
