import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DocusealBuilderComponent } from '@docuseal/angular'
import { Subject, takeUntil } from 'rxjs';
import { DocusealService } from '../docuseal.service';
import { AlertsService } from 'app/shared/services/alerts.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sign-builder',
  imports: [
    DocusealBuilderComponent,
    MatButtonModule, MatIconModule
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

    emailMessage: any = {}

    template_info: any = null;

    constructor(
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _alertsService: AlertsService
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

            this.emailMessage = {
                subject: 'Firma de Contrato - ' + this.signatureData.signerName,
                body: 'Link de firma {{submitter.link}}'
            };

            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    //-----------------------------------
    // Public methods
    //-----------------------------------

    handleLoad(event: any): void {
        this.template_info = event;
        console.log(event);
    }

    handleSave(event: any): void {
        this.template_info = event;
    }

    sendTemplateToSigners(): void {

        if(this.template_info == null || this.signatureData == null){
            this._alertsService.showAlertMessage({type: 'error', title: 'Error', text: 'No se pudo enviar la solicitud de firma. Falta información del template o de la firma.'});
            return;
        }

        const hasSignatureField  = this.template_info.fields.some((field: any) => field.type === 'signature');

        if(!hasSignatureField){
            this._alertsService.showAlertMessage({type: 'error', title: 'Error', text: 'No se pudo enviar la solicitud de firma. El documento no contiene un campo de firma.'});
            return;
        }


        const payload = {
            signatureId: this.signatureData.id,
            template_id: this.template_info.id,
        }

        this._docusealService.sendSignatureRequest(payload).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response:any) => {
                this._alertsService.showAlertMessage({type: 'success', title: 'Solicitud enviada', text: 'La solicitud de firma ha sido enviada exitosamente.'});
            },error: (error) => {
                this._alertsService.showAlertMessage({type: 'error', title: 'Error', text: 'No se pudo enviar la solicitud de firma.'});
            }
        });
    }
}
