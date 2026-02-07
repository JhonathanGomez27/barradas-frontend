import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { SignBuilderComponent } from './sign-builder/sign-builder.component';
import { inject } from '@angular/core';
import { DocusealService } from './docuseal.service';
import { hasPermissionGuard } from 'app/core/auth/guards/has-permission.guard';

const SigantureBuilderResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _SigantureBuilderService = inject(DocusealService);
    return _SigantureBuilderService.getDocumentElectronicSignature(route.params.token);
}

const SigantureFormResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _SigantureBuilderService = inject(DocusealService);
    return _SigantureBuilderService.getDocumentSignatureForm(route.params.token);
}

export default [
    {
        path: '',
        component: SignBuilderComponent,
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin', 'agent'],
            expectedPermission: ['docuseal:create:all:post:docuseal.create-signed-token']
        }
    },
    {
        path: 'builder/:token',
        component: SignBuilderComponent,
        canActivate: [hasPermissionGuard],
        data: {
            expectedRole: ['admin', 'agent'],
            expectedPermission: ['docuseal:create:all:post:docuseal.create-signed-token']
        },
        resolve: {
            signatureBuilder: SigantureBuilderResolver
        }
    },
    // {
    //     path: 'form/:token',
    //     component: SignFormComponent,
    //     resolve: {
    //         signatureForm: SigantureFormResolver
    //     }
    // }
] as Routes;
