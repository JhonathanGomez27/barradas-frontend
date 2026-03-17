import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { hasPermissionGuard } from './core/auth/guards/has-permission.guard';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [

    // Redirect empty path to '/clients'
    { path: '', pathMatch: 'full', redirectTo: 'clients' },

    // Redirect signed-in user to the '/clients'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'clients' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            // {path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes')},
            // {path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes')},
            // {path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes')},
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes') },
            // {path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes')}
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') },
            // {path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.routes')}
        ]
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'complete', loadChildren: () => import('app/modules/landing/complete-profile/complete-profile.routes') },
            { path: 'docuseal-form', loadChildren: () => import('app/modules/landing/docuseal-form/docuseal-form.routes') },
            { path: 'invalid-token', loadChildren: () => import('app/modules/landing/invalid-token/invalid-token.routes') },
            { path: 'web-rtc', loadChildren: () => import('app/modules/landing/web-rtc/web-rtc.routes') },
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver
        },
        children: [
            // {path: 'example', loadChildren: () => import('app/modules/admin/example/example.routes')},
            {
                path: 'statistics',
                canActivate: [hasPermissionGuard],
                data: {
                    expectedPermission: ['stats:read:all:get:stats.dashboard']
                },
                loadChildren: () => import('app/modules/admin/statistics/statistics.routes')
            },
            {
                path: 'clients',
                canActivate: [hasPermissionGuard],
                data: {
                    // expectedRole: ['admin'],
                    expectedPermission: ['users:read:all:get:users']
                },
                loadChildren: () => import('app/modules/admin/clients/clients.routes')
            },
            {
                path: 'docuseal',
                canActivate: [hasPermissionGuard],
                data: {
                    // expectedRole: ['admin', 'agent'],
                    expectedPermission: ['docuseal:create:all:post:docuseal.create-signed-token']
                },
                loadChildren: () => import('app/modules/docuseal/docuseal.routes')
            },
            {
                path: 'stores',
                canActivate: [hasPermissionGuard],
                data: {
                    // expectedRole: ['admin'],
                    expectedPermission: ['stores:read:store:get:stores']
                },
                loadChildren: () => import('app/modules/admin/stores/stores.routes')
            },
            {
                path: 'rbac',
                canActivate: [hasPermissionGuard],
                data: {
                    // expectedRole: ['admin'],
                    expectedPermission: ['admin:read:all:get:admin.rbac.roles']
                },
                loadChildren: () => import('app/modules/admin/rbac/rbac.routes')
            }
        ]
    },
    // Agent routes
    // {
    //     path: '',
    //     canActivate: [AuthGuard],
    //     canActivateChild: [AuthGuard],
    //     component: LayoutComponent,
    //     resolve: {
    //         initialData: initialDataResolver
    //     },
    //     children: [
    //         {
    //             path: 'clients-store',
    //             canActivate: [hasPermissionGuard],
    //             data: {
    //                 expectedRole: ['agent']
    //             },
    //             loadChildren: () => import('app/modules/agent/clients/clients.routes')
    //         },
    //     ]
    // }
];
