import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { map, tap } from 'rxjs';

export const hasRoleGuard: CanActivateFn = (route, state) => {

    const _user = inject(UserService).user$;
    const router = inject(Router)

    const expectedRouteRoles = route.data.expectedRole;

    const redirectRoute = '/signed-in-redirect';

    return _user.pipe(
        map((user:any) => Boolean(user && expectedRouteRoles.includes(user.rol))),
        tap((hasRole) => {
            if(!hasRole){
                alert('No tienes permisos para acceder a esta ruta');
                router.navigate([redirectRoute]);
            }
        })
    );
};
