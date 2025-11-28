import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { ClientsComponent } from './clients.component';
import { inject } from '@angular/core';
import { ClientsService } from './clients.service';
import { HttpParams } from '@angular/common/http';
import { environment } from 'environment/environment';
import { ClientDetailsComponent } from './modals/client-details/client-details.component';

const limit: number = environment.pagination;

const ClientsResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _ClientsService = inject(ClientsService);

    let params = new HttpParams();
    params = params.set('page', 1);
    params = params.set('limit', limit);

    return _ClientsService.getClients(params);
}

export default [
    {
        path: '',
        component: ClientsComponent,
        resolve: {
            clients: ClientsResolver
        }
    },
    {
        path: ':id',
        component: ClientDetailsComponent
    }
] as Routes;
