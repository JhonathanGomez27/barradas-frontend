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

import { hasPermissionGuard } from 'app/core/auth/guards/has-permission.guard';
import { of } from 'rxjs';
import { PermissionService } from 'app/shared/services/permission.service';

const limit: number = environment.pagination;


const ClientsResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _ClientsService = inject(ClientsService);
const _permissionService = inject(PermissionService);

    let params = new HttpParams();
    params = params.set('page', 1);
    params = params.set('limit', limit);

    if (!_permissionService.hasPermission('agents:read:own:get:agents.me.users')) {
        return of(null);
    }

    return _ClientsService.getClients(params);
}

const CreditsResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _CreditsService = inject(ClientsService);
const _permissionService = inject(PermissionService);

    if (!_permissionService.hasPermission('credits:read:all:get:credits.list.clientId')) {
        return of(null);
    }
    return _CreditsService.getClientCredits(route.params.id, new HttpParams().set('limit', environment.pagination).set('page', '1'));
}

export default [
    {
        path: '',
        component: ClientsComponent,
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['agent'],
            expectedPermission: ['agents:read:own:get:agents.me.users']
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
            expectedRole: ['agent'],
            expectedPermission: ['users:read:all:get:users.id']
        },
        resolve: {
            credits: CreditsResolver
        }
    }
] as Routes;
