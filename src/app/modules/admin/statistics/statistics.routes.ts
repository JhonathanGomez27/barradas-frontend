import { ResolveFn, Routes } from '@angular/router';
import { StatisticsComponent } from './statistics.component';
import { StoresService } from 'app/modules/admin/stores/stores.service';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { hasPermissionGuard } from 'app/core/auth/guards/has-permission.guard';

const StoresAllResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _StoresAllService = inject(StoresService);
    return _StoresAllService.getAllStoresNoPagination();
}

export default [
    {
        path: '',
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin'],
            expectedPermission: ['stats:read:all:get:stats.dashboard']
        },
        component: StatisticsComponent,
        resolve: {
            stores: StoresAllResolver
        }
    },
] as Routes;