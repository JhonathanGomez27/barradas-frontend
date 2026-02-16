import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { ClientsComponent } from './clients.component';
import { inject } from '@angular/core';
import { ClientsService } from './clients.service';
import { HttpParams } from '@angular/common/http';
import { environment } from 'environment/environment';
import { ClientDetailsComponent } from './modals/client-details/client-details.component';
import { StoresService } from '../stores/stores.service';
import { hasPermissionGuard } from 'app/core/auth/guards/has-permission.guard';
import { AgentsService } from '../stores/agents.service';

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
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin'],
            expectedPermission: ['users:read:all:get:users']
        },
        resolve: {
            clients: ClientsResolver
        }
    },
    {
        path: ':id',
        component: ClientDetailsComponent,
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin', 'agent'],
            expectedPermission: ['users:read:all:get:users.id']
        },
        resolve: {
            credits: CreditsResolver
        }
    }
] as Routes;
