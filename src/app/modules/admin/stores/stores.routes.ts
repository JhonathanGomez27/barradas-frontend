import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { StoresComponent } from './stores.component';
import { StoresService } from './stores.service';
import { inject } from '@angular/core';
import { environment } from 'environment/environment';
import { StoreDetailsComponent } from './store-details/store-details.component';

const StoresResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _storesService = inject(StoresService);
    return _storesService.getStores({page: 1, limit: environment.pagination});
}

const StoreResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _storeService = inject(StoresService);
    const storeId = route.paramMap.get('id');
    return _storeService.getStoreById(storeId);
}

const CitiesResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _citiesService = inject(StoresService);
    return _citiesService.getCities();
}

export default [
    {
        path: '',
        component: StoresComponent,
        resolve: {
            stores: StoresResolver,
            cities: CitiesResolver
        }
    },
    {
        path: ':id',
        component: StoreDetailsComponent,
        resolve: {
            cities: CitiesResolver
        }
    }
] as Routes;
