import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DocusealBuilderComponent } from '@docuseal/angular'
import { Subject, takeUntil } from 'rxjs';
import { DocusealService } from '../docuseal.service';
import { AlertsService } from 'app/shared/services/alerts.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';

@Component({
    selector: 'app-sign-builder',
    imports: [
        DocusealBuilderComponent,
        MatButtonModule, MatIconModule, MatTooltipModule
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
        'signature', 'text', 'number'
    ]

    submitters: any[] = [];

    customCss = `
        /* Contenedor principal del builder */
        .docuseal-builder-container {
            border: none;
            box-shadow: none;
            border-radius: 0.75rem;
            background-color: #ffffff;
        }

        /* Área de campos del documento */
        .field-area {
            border-radius: 0.5rem;
            transition: all 0.3s ease;
        }

        .field-area:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Scrollbox y contenedor del formulario */
        .scrollbox {
            border-radius: 0.75rem;
            background-color: #fafafa;
        }

        .form-container {
            border-radius: 0.75rem;
            padding: 1.5rem;
        }

        /* Botón de envío principal */
        .send-button {
            border-color: #30509b;
            color: #30509b;
            border-radius: 0.5rem;
            padding: 0.625rem 1.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .send-button:hover {
            background-color: #30509b;
            color: white;
            border-color: #30509b;
            box-shadow: 0 4px 6px -1px rgba(48, 80, 155, 0.3);
            transform: translateY(-1px);
        }

        /* Botón de envío del formulario */
        .submit-form-button {
            background: linear-gradient(135deg, #30509b 0%, #20376f 100%);
            border-radius: 0.5rem;
            padding: 0.75rem 2rem;
            font-weight: 600;
            box-shadow: 0 4px 6px -1px rgba(48, 80, 155, 0.3);
            transition: all 0.3s ease;
        }

        .submit-form-button:hover {
            box-shadow: 0 10px 15px -3px rgba(48, 80, 155, 0.4);
            transform: translateY(-2px);
        }

        /* Modal de destinatarios */
        .recipients-modal {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            background-color: #ffffff;
            border-radius: 1rem;
        }

        .recipients-modal-send-button {
            background: linear-gradient(135deg, #30509b 0%, #20376f 100%);
            border-radius: 0.5rem;
            padding: 0.75rem 2rem;
            font-weight: 600;
            box-shadow: 0 4px 6px -1px rgba(48, 80, 155, 0.3);
            transition: all 0.3s ease;
        }

        .recipients-modal-send-button:hover {
            box-shadow: 0 10px 15px -3px rgba(48, 80, 155, 0.4);
            transform: translateY(-2px);
        }

        /* Canvas de dibujo para firmas */
        .draw-canvas {
            border-radius: 0.5rem;
            border: 2px dashed #d1d5db;
            transition: border-color 0.3s ease;
        }

        .draw-canvas:hover {
            border-color: #30509b;
        }

        /* Campos de entrada */
        input[type="text"],
        input[type="email"],
        input[type="number"],
        textarea {
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            padding: 0.625rem 0.875rem;
            transition: all 0.3s ease;
        }

        input:focus,
        textarea:focus {
            border-color: #30509b;
            box-shadow: 0 0 0 3px rgba(48, 80, 155, 0.1);
            outline: none;
        }

        /* Botones secundarios */
        button:not(.send-button):not(.submit-form-button):not(.recipients-modal-send-button) {
            border-radius: 0.5rem;
            transition: all 0.3s ease;
        }

        /* Mensajes de completado */
        .completed-form {
            border-radius: 1rem;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 2rem;
        }

        /* Estilos para modo oscuro (opcional) */
        @media (prefers-color-scheme: dark) {
            .scrollbox {
                background-color: #1f2937;
            }

            .form-container {
                background-color: #111827;
            }

            input[type="text"],
            input[type="email"],
            input[type="number"],
            textarea {
                background-color: #374151;
                border-color: #4b5563;
                color: #f9fafb;
            }
        }
    `;

    emailMessage: any = {}

    template_info: any = null;

    sendedSignatureRequest: boolean = false;

    loading: boolean = true;

    loadingRequest: boolean = false;

    userRol: string = '';

    constructor(
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _alertsService: AlertsService,
        private _confirmationService: FuseConfirmationService,
        private _location: Location,
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _usersService: UserService
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

            this._usersService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
                this.userRol = response.role;
            });

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
        this.loading = false;
    }

    handleSave(event: any): void {
        this.template_info = event;
    }

    sendTemplateToSigners(): void {

        this.loadingRequest = true;

        if (this.template_info == null || this.signatureData == null) {
            this._alertsService.showAlertMessage({ type: 'error', title: 'Error', text: 'No se pudo enviar la solicitud de firma. Falta información del template o de la firma.' });
            return;
        }

        const hasSignatureField = this.template_info.fields.some((field: any) => field.type === 'signature');

        if (!hasSignatureField) {
            this._alertsService.showAlertMessage({ type: 'error', title: 'Error', text: 'No se pudo enviar la solicitud de firma. El documento no contiene un campo de firma.' });
            return;
        }


        const payload = {
            signatureId: this.signatureData.id,
            template_id: this.template_info.id,
        }

        this._docusealService.sendSignatureRequest(payload).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response: any) => {
                this.sendedSignatureRequest = true;
                this._alertsService.showAlertMessage({ type: 'success', title: 'Solicitud enviada', text: 'La solicitud de firma ha sido enviada exitosamente.' });
                this._changeDetectorRef.markForCheck();
            }, error: (error) => {
                this._alertsService.showAlertMessage({ type: 'error', title: 'Error', text: 'No se pudo enviar la solicitud de firma.' });
                this.sendedSignatureRequest = false;
                this.loadingRequest = false;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    confirmSignatureRequest(): void {
        const dialog = this._confirmationService.open({
            title: 'Confirmar envío de solicitud de firma',
            message: `¿Estás seguro de que deseas enviar la solicitud de firma al destinatario: <span class="font-semibold">${this.signatureData.signerEmail}</span>?`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warning'
            },
            actions: {
                confirm: {
                    label: 'Enviar',
                    color: 'primary'
                },
                cancel: {
                    label: 'Cancelar'
                }
            }
        });

        dialog.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.sendTemplateToSigners();
            }
        });

        this._changeDetectorRef.markForCheck();
    }

    goBack(): void {

        const route = this.userRol === 'admin' ? '/clients' : '/clients-store';

        this._router.navigate([route], { queryParams: { clientId: this.signatureData.clientId } });
    }
}
