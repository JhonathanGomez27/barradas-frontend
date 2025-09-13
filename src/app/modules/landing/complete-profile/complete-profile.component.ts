import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { CompleteProfileService } from './complete-profile.service';
import Swal from 'sweetalert2';

interface FileUpload {
  file: File | null;
  preview: string | null;
  name: string;
  label: string;
  required: boolean;
}

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatSelectModule
  ],
  templateUrl: './complete-profile.component.html'
})
export class CompleteProfileComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    profileForm: FormGroup;
    token: string | null = null;
    loading = false;
    submitted = false;
    tokenValid = false;
    clientInfo: any = null;

    tokenInfo: any = null;
    // Archivos para subir
    fileUploads: { [key: string]: FileUpload } = {
        INTERIOR_1: { file: null, preview: null, name: 'INTERIOR_1', label: 'Interior 1', required: true },
        INTERIOR_2: { file: null, preview: null, name: 'INTERIOR_2', label: 'Interior 2', required: true },
        INE_FRONT: { file: null, preview: null, name: 'INE_FRONT', label: 'INE (Frente)', required: true },
        INE_BACK: { file: null, preview: null, name: 'INE_BACK', label: 'INE (Reverso)', required: true },
        PROOF_ADDRESS: { file: null, preview: null, name: 'PROOF_ADDRESS', label: 'Comprobante de domicilio', required: true },
        PROOF_ADDRESS_OWNER: { file: null, preview: null, name: 'PROOF_ADDRESS_OWNER', label: 'Comprobante del propietario', required: false },
        FACADE: { file: null, preview: null, name: 'FACADE', label: 'Fachada', required: true },
        CONTRACT_SIGNED: { file: null, preview: null, name: 'CONTRACT_SIGNED', label: 'Contrato firmado', required: true },
        QUOTE: { file: null, preview: null, name: 'QUOTE', label: 'Cotización', required: true },
        INITIAL_PAYMENT: { file: null, preview: null, name: 'INITIAL_PAYMENT', label: 'Pago inicial', required: true }
    };

    profileCompleted: boolean = false;

    Toast: any;

    constructor(
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute,
        private _router: Router,
        private _completeProfileService: CompleteProfileService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.profileForm = this._formBuilder.group({
            locationAddress: ['', Validators.required],
            // locationLat: ['', Validators.required],
            // locationLng: ['', Validators.required]
        });

        this.Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
        });
    }

    ngOnInit(): void {
        // Obtener token de la URL
        this._route.queryParamMap.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
            this.token = params.get('token');
            this.tokenValid = true;
        });

        this._completeProfileService.tokenInfo$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.tokenInfo = response;
            this.clientInfo = this.tokenInfo?.client || null;
            this._changeDetectorRef.markForCheck();
        });
    }

    onFileChange(event: any, fileType: string): void {
        if (event.target.files && event.target.files.length) {
            const file = event.target.files[0];
            this.fileUploads[fileType].file = file;

            // Crear vista previa
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.fileUploads[fileType].preview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }



    onSubmit(): void {

        if (this.profileForm.invalid) {
            this.Toast.fire({
                icon: 'error',
                title: 'Por favor, complete todos los campos requeridos.'
            });
            return;
        }

        this.loading = true;

        // Crear FormData con los datos del formulario
        const formData = new FormData();
        formData.append('locationAddress', this.profileForm.get('locationAddress')?.value);

        //validate fileUploads
        for (const key in this.fileUploads) {
            if (this.fileUploads[key].required && !this.fileUploads[key].file) {
                this.Toast.fire({
                    icon: 'error',
                    title: `Por favor, suba el archivo requerido: ${this.fileUploads[key].label}`
                });
                return;
            }
        }

        // Agregar todos los archivos
        Object.keys(this.fileUploads).forEach(key => {
            if (this.fileUploads[key].file) {
                formData.append(key, this.fileUploads[key].file as File);
            }
        });

        // Object.keys(this.fileUploads).forEach(key => {
        //     if (this.fileUploads[key].file) {
        //         formData.append('files', this.fileUploads[key].file as File);
        //     }
        // });

        if (!this.token) {
            this.Toast.fire({
                icon: 'error',
                title: 'Token no válido'
            });
            this.loading = false;
            return;
        }

        // Enviar datos al servidor
        this._completeProfileService.completeProfile(formData, this.token)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    // Mostrar mensaje de éxito y redireccionar
                    this.submitted = true;
                    this.profileCompleted = true;
                },
                error: (error) => {
                    this.loading = false;
                    this.Toast.fire({
                        icon: 'error',
                        title: 'Ha ocurrido un error',
                        text: 'Por favor, inténtelo de nuevo más tarde.'
                    });
                    // Mostrar mensaje de error
                }
            });
    }

    isFileValid(fileType: string): boolean {
        return this.fileUploads[fileType].file !== null || !this.fileUploads[fileType].required;
    }

    areFilesValid(): boolean {
        return Object.keys(this.fileUploads).every(key => this.isFileValid(key));
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
