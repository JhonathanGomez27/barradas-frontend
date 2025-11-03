import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DocusealFormComponent } from '@docuseal/angular';
import { DocusealService } from 'app/modules/docuseal/docuseal.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-docuseal-form',
  imports: [
    DocusealFormComponent
  ],
  standalone: true,
  templateUrl: './docuseal-form.component.html',
  styleUrl: './docuseal-form.component.scss'
})
export class DocusealFormSignComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    signatureRequest: any = null;
    slugUrl: string = '';

    customCss: string = `
        .form-container {
            background-color: #ffffff;
            border-radius: 0.25rem;
            border: 1px solid #30509b;
        }

        .type-text-button,
        .upload-image-button,
        .clear-canvas-button,
        .set-current-date-button,
        .decline-button,
        .reupload-button {
            background-color: #30509b;
            border: 0;
            border-radius: 0.25rem;
            color: #ffffff;
        }

        .type-text-button:hover,
        .upload-image-button:hover,
        .clear-canvas-button:hover,
        .set-current-date-button:hover,
        .decline-button:hover,
        .reupload-button:hover {
            background-color: #30509b;
        }

        .submit-form-button {
            background-color: #30509b;
            color: #ffffff;
        }

        .submit-form-button:disabled {
          background-color: #364153;
          color: #ffffff;
        }

        .expand-form-button {
            background-color: #30509b;
            color: #ffffff;
        }

        .expand-form-button:hover {
            background-color: #364153;
        }
    `;

    constructor(
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this._docusealService.signatureForm$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.signatureRequest = response;
            this.slugUrl = response.signatureDocusealUrl;
            this._changeDetectorRef.markForCheck();
        });

        console.log("object");
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
