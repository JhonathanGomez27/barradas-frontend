import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { map, tap } from 'rxjs';

export const hasPermissionGuard: CanActivateFn = (route, state) => {

    const userService = inject(UserService);
    const router = inject(Router);

    const expectedRouteRoles = route.data['expectedRole'] ?? [];
    const expectedPermissions = route.data['expectedPermission'] ?? [];

    return userService.user$.pipe(
        map((user: User) => {
            if (!user) {
                return { hasAccess: false, role: null };
            }

            // Check for permissions if defined
            if (expectedPermissions.length > 0) {
                const userPermissions = user.permissions || [];
                const hasPermission = expectedPermissions.some((perm: string) => userPermissions.includes(perm));
                if (hasPermission) {
                    return { hasAccess: true, role: user.rol };
                }
                // If permissions are checked and failed, we might still check roles if permissions are not exclusive?
                // Usually permissions are more granular. If expectedPermission is set, we expect one of them.
                // If NO permissions matched, we return false unless roles are also checked and matched?
                // Let's assume strict check: if expectedPermission is present, user MUST have it.
                return { hasAccess: false, role: user.rol };
            }

            // Fallback to role check if no permissions defined
            if (expectedRouteRoles.length > 0) {
                 if (!user.rol) {
                    return { hasAccess: false, role: null };
                }
                return {
                    hasAccess: expectedRouteRoles.includes(user.rol),
                    role: user.rol
                };
            }

            // If no checks defined, allow access (or deny? usually allow if no guard data)
            return { hasAccess: true, role: user.rol };
        }),
        tap(({ hasAccess, role }) => {
            if (!hasAccess) {
                if (role === 'admin') {
                    router.navigate(['/clients']);
                } else if (role === 'agent') {
                    router.navigate(['/clients-store']);
                } else {
                    router.navigate(['/sign-in']);
                }
            }
        }),
        map(({ hasAccess }) => hasAccess)
    );
};
