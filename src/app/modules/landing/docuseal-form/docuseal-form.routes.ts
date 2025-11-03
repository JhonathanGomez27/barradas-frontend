import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { DocusealFormSignComponent } from './docuseal-form.component';
import { inject } from '@angular/core';
import { DocusealService } from 'app/modules/docuseal/docuseal.service';

const SigantureFormResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const _SigantureBuilderService = inject(DocusealService);
    return _SigantureBuilderService.getDocumentSignatureForm(route.params.token);
}

export default [
    {
        path: ':token',
        component: DocusealFormSignComponent,
        resolve: {
            signatureForm: SigantureFormResolver
        }
    },
] as Routes;
