import { Routes } from '@angular/router';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'roles'
    },
    {
        path: 'roles',
        component: RolesListComponent
    },
    {
        path: 'roles/:id',
        component: RolePermissionsComponent
    }
] as Routes;
