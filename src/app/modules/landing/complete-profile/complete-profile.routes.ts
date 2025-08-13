import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { CompleteProfileComponent } from './complete-profile.component';
import { inject } from '@angular/core';
import { CompleteProfileService } from './complete-profile.service';

const invitationResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _invitationService = inject(CompleteProfileService);
    //query param token
    const token = route.queryParamMap.get('token');

    return _invitationService.validateToken(token);
}

export default [
    {
        path: '',
        component: CompleteProfileComponent,
        resolve: {
            invitation: invitationResolver
        }
    },
] as Routes;
