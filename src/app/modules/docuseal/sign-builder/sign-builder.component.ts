import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DocusealBuilderComponent } from '@docuseal/angular'
import { Subject, takeUntil } from 'rxjs';
import { DocusealService } from '../docuseal.service';

@Component({
  selector: 'app-sign-builder',
  imports: [
    DocusealBuilderComponent
  ],
  templateUrl: './sign-builder.component.html',
  styleUrl: './sign-builder.component.scss'
})
export class SignBuilderComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    signatureData: any = null;

    token: string = '';
    roles: string[] = ['Cliente'];
    fieldTypes: string[] = [
        'signature'
    ]

    submitters: any[] = [];

    customCss = `
        .docuseal-builder-container {
            border: none;
            box-shadow: none;
        }

        .send-button {
            border-color: #30509b;
            color: #30509b;
        }

        .send-button:hover {
            background-color: #20376f;
            border: 0;
        }

        .recipients-modal {
            box-shadow: none;
            background-color: #ffffff;
        }

        .recipients-modal-send-button {
            background-color: #30509b;
        }

        .recipients-modal-send-button:hover {
            background-color: #20376f;
        }
    `;

    constructor(
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this._docusealService.signatureBuilder$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.signatureData = response;
            this.token = response.token;

            this.submitters = [
                {
                    email: this.signatureData.signerEmail,
                    name: this.signatureData.signerName,
                    role: 'Cliente'
                }
            ]

            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
