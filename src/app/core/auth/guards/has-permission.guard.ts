import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { map, tap } from 'rxjs';

export const hasRoleGuard: CanActivateFn = (route, state) => {

    const userService = inject(UserService);
    const router = inject(Router);

    const expectedRouteRoles = route.data['expectedRole'] ?? [];

    return userService.user$.pipe(
        map((user: User) => {
            if (!user || !user.rol) {
                return { hasPermission: false, role: null };
            }
            return {
                hasPermission: expectedRouteRoles.includes(user.rol),
                role: user.rol
            };
        }),
        tap(({ hasPermission, role }) => {
            if (!hasPermission) {
                if (role === 'admin') {
                    router.navigate(['/clients']);
                } else if (role === 'agent') {
                    router.navigate(['/clients-store']);
                } else {
                    router.navigate(['/sign-in']);
                }
            }
        }),
        map(({ hasPermission }) => hasPermission)
    );
};
