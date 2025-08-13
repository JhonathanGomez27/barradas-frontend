import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import { ClientsService } from '../../clients.service';

@Component({
    selector: 'app-invite',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
    ],
    templateUrl: './invite.component.html',
})
export class InviteComponent {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    inviteForm: FormGroup;
    contractFile: File | null = null;

    constructor(
        private _formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<InviteComponent>,
        private _clientsService: ClientsService
    ) {
        this.inviteForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            last_name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
        });
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        this.contractFile = file || null;

        // Para actualizar la vista después de seleccionar un archivo
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                // Puedes usar esto para mostrar una vista previa si es necesario
            };
            reader.readAsDataURL(file);
        }
    }

    onSubmit(): void {
        if (this.inviteForm.valid) {
            const clientData = {
                ...this.inviteForm.value,
            };

            this._clientsService
                .inviteClient(clientData)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: (response: any) => {
                        console.log('Cliente invitado exitosamente:', response);
                        this.uploadFileToClient(response.clientId);
                    },
                    error: (error) => {
                        console.error('Error al invitar al cliente:', error);
                    },
                });
        }
    }

    uploadFileToClient(client_id: string): void {
        if (this.contractFile) {
            this._clientsService
                .uploadFileToClient(
                    client_id,
                    this.contractFile,
                    'CONTRACT_ORIGINAL'
                )
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: (response: any) => {
                        console.log(
                            'Archivo de contrato subido exitosamente:',
                            response
                        );
                        this.dialogRef.close(client_id);
                    },
                    error: (error) => {
                        console.error(
                            'Error al subir el archivo de contrato:',
                            error
                        );
                    },
                });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
