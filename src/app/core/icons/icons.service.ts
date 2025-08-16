import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconsService {
    /**
     * Constructor
     */
    constructor() {
        const domSanitizer = inject(DomSanitizer);
        const matIconRegistry = inject(MatIconRegistry);

        // Register icon sets
        matIconRegistry.addSvgIconSet(
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons-files/material-twotone.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mat_outline',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons-files/material-outline.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mat_solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons-files/material-solid.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'feather',
            domSanitizer.bypassSecurityTrustResourceUrl('icons-files/feather.svg')
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_outline',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons-files/heroicons-outline.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons-files/heroicons-solid.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_mini',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons-files/heroicons-mini.svg'
            )
        );
    }
}
