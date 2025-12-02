import { ResolveFn, Routes } from '@angular/router';
import { StatisticsComponent } from './statistics.component';
import { StoresService } from 'app/modules/admin/stores/stores.service';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const StoresAllResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _StoresAllService = inject(StoresService);
    return _StoresAllService.getAllStoresNoPagination();
}

export default [
    {
        path: '',
        component: StatisticsComponent,
        resolve: {
            stores: StoresAllResolver
        }
    },
] as Routes;