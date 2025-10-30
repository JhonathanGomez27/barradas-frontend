import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { SignBuilderComponent } from './sign-builder/sign-builder.component';
import { inject } from '@angular/core';
import { DocusealService } from './docuseal.service';

const SigantureBuilderResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _SigantureBuilderService = inject(DocusealService);
    return _SigantureBuilderService.getDocumentElectronicSignature(route.params.token);
}

export default [
    {
        path: '',
        component: SignBuilderComponent
    },
    {
        path: 'builder/:token',
        component: SignBuilderComponent,
        resolve: {
            signatureBuilder: SigantureBuilderResolver
        }
    },
] as Routes;
