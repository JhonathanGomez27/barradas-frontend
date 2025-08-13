import { Component, OnDestroy, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { CompleteProfileService } from './complete-profile.service';

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
    MatStepperModule,
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
    currentStep = 0;

    // Archivos para subir
    fileUploads: { [key: string]: FileUpload } = {
      INTERIOR_1: { file: null, preview: null, name: 'INTERIOR_1', label: 'Interior 1', required: true },
      INTERIOR_2: { file: null, preview: null, name: 'INTERIOR_2', label: 'Interior 2', required: true },
      INE_FRONT: { file: null, preview: null, name: 'INE_FRONT', label: 'INE (Frente)', required: true },
      INE_BACK: { file: null, preview: null, name: 'INE_BACK', label: 'INE (Reverso)', required: true },
      PROOF_ADDRESS: { file: null, preview: null, name: 'PROOF_ADDRESS', label: 'Comprobante de domicilio', required: true },
      PROOF_ADDRESS_OWNER: { file: null, preview: null, name: 'PROOF_ADDRESS_OWNER', label: 'Comprobante del propietario', required: false },
      FACADE: { file: null, preview: null, name: 'FACADE', label: 'Fachada', required: true },
      CONTRACT_SIGNED: { file: null, preview: null, name: 'CONTRACT_SIGNED', label: 'Contrato firmado', required: true }
    };

    constructor(
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute,
        private _router: Router,
        private _completeProfileService: CompleteProfileService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.profileForm = this._formBuilder.group({
            locationAddress: ['', Validators.required],
            locationLat: ['', Validators.required],
            locationLng: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        // Obtener token de la URL
        this._route.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
            this.token = params.get('token');
            this.tokenValid = true;
        });

        // Inicializar mapa si estamos en un navegador
        if (isPlatformBrowser(this.platformId)) {
            this.initMap();
        }
    }

    validateToken(): void {
        if (!this.token) return;

        this.loading = true;
        this._completeProfileService.validateToken(this.token)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.clientInfo = response;
                    this.tokenValid = true;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Token inválido', error);
                    this.tokenValid = false;
                    this.loading = false;
                    // Redirigir a página de error o mostrar mensaje
                }
            });
    }

    initMap(): void {
        // Aquí implementarías la inicialización del mapa usando Google Maps o similar
        // Por ahora lo dejamos como un placeholder
        console.log('Inicializando mapa...');
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

    nextStep(): void {
        this.currentStep++;
    }

    prevStep(): void {
        this.currentStep--;
    }

    onSubmit(): void {
        if (this.profileForm.invalid) {
            return;
        }

        this.submitted = true;
        this.loading = true;

        // Crear FormData con los datos del formulario
        const formData = new FormData();
        formData.append('locationAddress', this.profileForm.get('locationAddress')?.value);
        formData.append('locationLat', this.profileForm.get('locationLat')?.value);
        formData.append('locationLng', this.profileForm.get('locationLng')?.value);

        // Agregar todos los archivos
        Object.keys(this.fileUploads).forEach(key => {
            if (this.fileUploads[key].file) {
                formData.append(key, this.fileUploads[key].file as File);
            }
        });

        if (!this.token) {
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
                    console.log('Perfil completado exitosamente', response);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error al completar perfil', error);
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
