import { Routes } from '@angular/router';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';

import { hasPermissionGuard } from 'app/core/auth/guards/has-permission.guard';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'roles'
    },
    {
        path: 'roles',
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin'],
            expectedPermission: ['admin:read:all:get:admin.rbac.roles']
        },
        component: RolesListComponent
    },
    {
        path: 'roles/:id',
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin'],
            expectedPermission: ['admin:read:all:get:admin.rbac.roles.roleId']
        },
        component: RolePermissionsComponent
    }
] as Routes;
