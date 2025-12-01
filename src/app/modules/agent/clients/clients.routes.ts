import { Routes } from '@angular/router';
import { ClientsComponent } from './clients.component';
import { environment } from 'environment/environment';
import { HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { ClientsService } from './clients.service';
import { ResolveFn } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StoresService } from 'app/modules/admin/stores/stores.service';
import { ClientDetailsComponent } from './client-details/client-details.component';

const limit: number = environment.pagination;

const ClientsResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _ClientsService = inject(ClientsService);

    let params = new HttpParams();
    params = params.set('page', 1);
    params = params.set('limit', limit);

    return _ClientsService.getClients(params);
}

const StoresAllResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _StoresAllService = inject(StoresService);
    return _StoresAllService.getAllStoresNoPagination();
}

const CreditsResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _CreditsService = inject(ClientsService);
    return _CreditsService.getClientCredits(route.params.id, new HttpParams().set('limit', environment.pagination).set('page', '1'));
}

export default [
    {
        path: '',
        component: ClientsComponent,
        resolve: {
            clients: ClientsResolver,
            stores: StoresAllResolver
        }
    },
    {
        path: ':id',
        component: ClientDetailsComponent,
        resolve: {
            stores: StoresAllResolver,
            credits: CreditsResolver
        }
    }
] as Routes;