import { ChangeDetectorRef, Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientsService } from '../../clients.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertsService } from 'app/shared/services/alerts.service';
import { environment } from 'environment/environment';
import { DocusealService } from 'app/modules/docuseal/docuseal.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatSelectModule } from '@angular/material/select';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Store, StoresService } from 'app/modules/admin/stores/stores.service';
import { Credit } from '../../clients.interface';

interface FileUpload {
  file: File | null;
  preview: string | null;
  name: string;
  label: string;
  required: boolean;
}

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CdkScrollable,
    NgxMatSelectSearchModule,
    MatSelectModule
  ],
  templateUrl: './client-details.component.html'
})
export class ClientDetailsComponent implements OnInit, OnDestroy{

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    clientDetails: any = null;

    // Mapeo de estados
    statusMapper: { [key: string]: string } = {
        'CREATED': 'Creado',
        'INVITED': 'Invitación enviada',
        'IN_PROGRESS': 'Pendiente de completar Documentación',
        'COMPLETED': 'Finalizado con contrato',
        'NO_CONTRACT_SENDED': 'Gestionado sin contrato',
        'CONTRACT_SENDED': 'Gestionado con contrato sin firmar'
    };

    // Mapeo de tipos de documento
    docTypeMapper: { [key: string]: string } = {
        'INTERIOR_1': 'Interior 1',
        'INTERIOR_2': 'Interior 2',
        'INE_FRONT': 'INE (Frente)',
        'INE_BACK': 'INE (Reverso)',
        'PROOF_ADDRESS': 'Comprobante de domicilio',
        'PROOF_ADDRESS_OWNER': 'Comprobante del propietario',
        'FACADE': 'Fachada',
        'CONTRACT_SIGNED': 'Contrato firmado',
        'QUOTE': 'Cotización',
        'INITIAL_PAYMENT': 'Pago inicial',
        'CONTRACT_ORIGINAL': 'Contrato original',
        'OTHER': 'Otro'
    };

    // Status electronic signature
    statusMapperSignature: { [key: string]: string } = {
        'CREATED': 'Creado',
        'PENDING': 'Pendiente',
        'SIGNED': 'Firmado',
        'CANCELLED' : 'Cancelado',
        'EXPIRED' : 'Expirado'
    }

    // Status credit mapper
    statusMapperCredit: { [key: string]: string } = {
        'PENDING': 'Pendiente',
        'ACTIVE': 'Activo',
        'CLOSED': 'Pagado',
        'DEFAULTED': 'En Mora',
        'CANCELLED': 'Cancelado'
    }

    weekDayCtrl: UntypedFormControl = new UntypedFormControl('');

    // Días de la semana para el selector
    weekDays = [
        { value: 'MONDAY', label: 'L', short: 'Lun', fullName: 'Lunes' },
        { value: 'TUESDAY', label: 'M', short: 'Mar', fullName: 'Martes' },
        { value: 'WEDNESDAY', label: 'X', short: 'Mié', fullName: 'Miércoles' },
        { value: 'THURSDAY', label: 'J', short: 'Jue', fullName: 'Jueves' },
        { value: 'FRIDAY', label: 'V', short: 'Vie', fullName: 'Viernes' },
        { value: 'SATURDAY', label: 'S', short: 'Sáb', fullName: 'Sábado' },
        { value: 'SUNDAY', label: 'D', short: 'Dom', fullName: 'Domingo' }
    ];

    editClientForm: FormGroup;
    isLoading: boolean = false;
    isEditMode: boolean = false;
    documentFiles: { [key: string]: File | null } = {};

    // Archivos para subir
    fileUploads: { [key: string]: FileUpload } = {
        INTERIOR_1: { file: null, preview: null, name: 'INTERIOR_1', label: 'Interior 1', required: true },
        INTERIOR_2: { file: null, preview: null, name: 'INTERIOR_2', label: 'Interior 2', required: true },
        INE_FRONT: { file: null, preview: null, name: 'INE_FRONT', label: 'INE (Frente)', required: true },
        INE_BACK: { file: null, preview: null, name: 'INE_BACK', label: 'INE (Reverso)', required: true },
        PROOF_ADDRESS: { file: null, preview: null, name: 'PROOF_ADDRESS', label: 'Comprobante de domicilio', required: true },
        PROOF_ADDRESS_OWNER: { file: null, preview: null, name: 'PROOF_ADDRESS_OWNER', label: 'Comprobante del propietario', required: false },
        FACADE: { file: null, preview: null, name: 'FACADE', label: 'Fachada', required: true },
        // CONTRACT_SIGNED: { file: null, preview: null, name: 'CONTRACT_SIGNED', label: 'Contrato firmado', required: true },
        QUOTE: { file: null, preview: null, name: 'QUOTE', label: 'Cotización', required: true },
        INITIAL_PAYMENT: { file: null, preview: null, name: 'INITIAL_PAYMENT', label: 'Pago inicial', required: true }
    };

    contractElectronicSignature: any = null;

    credits: Credit[] = [];

    creditActive: any = null;

    showElectronicSignatureDetails: boolean = false;

    stores: Store[] = [];
    storeFilterCtrl: FormControl = new FormControl('');
    filteredStores: ReplaySubject<Store[]> = new ReplaySubject<Store[]>(1);

    constructor(
        private clientesService : ClientsService,
        private dialog: MatDialog,
        private fb: FormBuilder,
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _alertsService: AlertsService,
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _storesService: StoresService
    ) {
        this.editClientForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: [''],
            extra: [''],
            locationAddress: [''],
            locationLat: ['', Validators.pattern(/^-?\d+(\.\d+)?$/)],
            locationLng: ['', Validators.pattern(/^-?\d+(\.\d+)?$/)],
            storeId: ['']
        });
    }

    ngOnInit(): void {
        // Obtener el ID del cliente desde los parámetros de la ruta
        const clientId = this._activatedRoute.snapshot.params['id'];

        if (clientId) {
            this.loadClientDetails(clientId);
        } else {
            this._router.navigate(['/clients']);
        }

        this.clientesService.credits$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.credits = response.data;
            this._changeDetectorRef.markForCheck();
        });

        this._storesService.allStores$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: Store[]) => {
            this.stores = response;
            this.filteredStores.next(this.stores.slice());
            this._changeDetectorRef.markForCheck();
        });

        // Listen for search field value changes
        this.storeFilterCtrl.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            this.filterStores();
            this._changeDetectorRef.markForCheck();
        });
    }

    loadClientDetails(clientId: string): void {
        this.isLoading = true;
        this.clientesService.getClient(clientId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    this.clientDetails = response;
                    this.contractElectronicSignature = response.electronicSignContract || null;
                    this.editClientForm.patchValue({
                        ...this.clientDetails,
                        storeId: this.clientDetails.store?.id || ''
                    });
                    // this.creditActive = response.credits.length > 0 ? response.credits[0] : null;

                    if(this.clientDetails.status === 'NO_CONTRACT_SENDED' ||
                       this.clientDetails.status === 'CONTRACT_SENDED' ||
                       this.clientDetails.status === 'COMPLETED'){
                        this.showElectronicSignatureDetails = true;
                    }
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error al cargar detalles del cliente:', error);
                    this._alertsService.showAlertMessage({
                        type: 'error',
                        text: 'Error al cargar los detalles del cliente',
                        title: 'Error'
                    });
                    this.isLoading = false;
                    this._router.navigate(['/clients']);
                }
            });
    }

    // Formatear fecha
    formatDate(dateString: string): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Obtener tamaño de archivo en formato legible
    getFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Abrir documento para previsualizar o descargar
    openDocument(file_id: string, doc_title: string, mimeType: string): void {
        if (this.canPreview(mimeType)) {
            this.previewFile(file_id, doc_title, mimeType);
        } else {
            this.downloadFile(file_id, doc_title);
        }
    }

    // Comprobar si el tipo de archivo puede ser previsualizado
    canPreview(mimeType: string): boolean {
        if (!mimeType) return false;
        return mimeType.includes('pdf') || mimeType.includes('image');
    }

    // Previsualizar archivo
    previewFile(file_id: string, doc_title: string, mimeType: string): void {
        this.clientesService.getFileUrlClient(file_id).pipe(takeUntil(this._unsubscribeAll)).subscribe(response => {
            if (response && response.blob) {
                // Abrir diálogo de previsualización para el blob
                this.openPreviewDialog(response.blob, doc_title, response.mimeType || mimeType);
            }
        });
    }

    // Descargar archivo
    downloadFile(file_id: string, doc_title: string): void {
        this.clientesService.getFileClient(file_id, doc_title);
    }

    // Abrir diálogo para previsualizar imagen
    openPreviewDialog(fileBlob: Blob, title: string, mimeType: string): void {
        // Crear una URL de objeto para el blob
        const objectUrl = URL.createObjectURL(fileBlob);

        const dialogRef = this.dialog.open(PreviewDialogComponent, {
            width: '80%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            data: {
                objectUrl: objectUrl,
                blob: fileBlob,
                title: title,
                mimeType: mimeType
            }
        });

        // Limpiar la URL del objeto cuando se cierre el diálogo
        dialogRef.afterClosed().subscribe(() => {
            URL.revokeObjectURL(objectUrl);
        });
    }

    // Obtener tipo de icono basado en el tipo MIME
    getFileIcon(mimeType: string): string {
        if (mimeType?.includes('pdf')) {
            return 'picture_as_pdf';
        } else if (mimeType?.includes('image')) {
            return 'image';
        } else {
            return 'insert_drive_file';
        }
    }

    getFile(file_id: string, doc_title: string){
        this.clientesService.getFileClient(file_id, doc_title);
    }

    // Obtener icono según el estado del cliente
    getStatusIcon(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'check_circle';
            case 'INVITED': return 'mail_outline';
            case 'IN_PROGRESS': return 'hourglass_empty';
            case 'CREATED': return 'fiber_new';
            default: return 'help_outline';
        }
    }

    // Obtener icono según el tipo de documento
    getDocumentIcon(docType: string): string {
        switch (docType) {
            case 'INTERIOR_1':
            case 'INTERIOR_2':
            case 'FACADE': return 'photo_camera';
            case 'INE_FRONT':
            case 'INE_BACK': return 'badge';
            case 'PROOF_ADDRESS':
            case 'PROOF_ADDRESS_OWNER': return 'home';
            case 'CONTRACT_SIGNED': return 'description';
            case 'QUOTE': return 'receipt';
            case 'INITIAL_PAYMENT': return 'payment';
            default: return 'insert_drive_file';
        }
    }

    // Obtener el nombre completo del día de la semana
    getWeekDayName(value: string): string {
        const day = this.weekDays.find(d => d.value === value);
        return day ? day.fullName : '';
    }    // Obtener icono según el estado del crédito
    getCreditStatusIcon(status: string): string {
        switch (status) {
            case 'ACTIVE': return 'check_circle';
            case 'PENDING': return 'schedule';
            case 'CLOSED': return 'paid';
            case 'DEFAULTED': return 'warning';
            case 'CANCELLED': return 'cancel';
            default: return 'help_outline';
        }
    }

    // Actualizar estado del crédito
    updateCreditStatus(newStatus: 'CLOSED' | 'CANCELLED'): void {
        if (!this.creditActive) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'No hay un crédito activo para actualizar.',
                title: 'Error'
            });
            return;
        }

        const statusText = newStatus === 'CLOSED' ? 'Pagado' : 'Cancelado';

        const dialog = this._fuseConfirmationService.open({
            title: 'Confirmar actualización de estado',
            message: `¿Estás seguro de que deseas marcar el crédito como "${statusText}"?`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'info'
            },
            actions: {
                confirm: { show: true, label: 'Sí', color: 'primary' },
                cancel: { show: true, label: 'No' }
            }
        });

        dialog.afterClosed().pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
            if (result === 'confirmed') {
                this.clientesService.updateCreditStatus(this.creditActive.id, newStatus)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: (response) => {
                        this._alertsService.showAlertMessage({
                            type: 'success',
                            text: `Crédito actualizado a ${statusText} correctamente.`,
                            title: 'Éxito'
                        });

                        // Actualizar los datos del crédito
                        this.creditActive = response;
                        this._changeDetectorRef.markForCheck();
                    },
                    error: (error) => {
                        console.error('Error al actualizar el estado del crédito:', error);
                        this._alertsService.showAlertMessage({
                            type: 'error',
                            text: 'Error al actualizar el estado del crédito.',
                            title: 'Error'
                        });
                    }
                });
            }
        })
    }

    toggleEditMode(): void {
        this.isEditMode = !this.isEditMode;
        if (this.isEditMode) {
            // Cuando entramos en modo edición, actualizamos el formulario con los datos actuales
            this.editClientForm.patchValue({
                email: this.clientDetails.email,
                firstName: this.clientDetails.firstName,
                lastName: this.clientDetails.lastName,
                phone: this.clientDetails.phone,
                locationAddress: this.clientDetails.locationAddress,
                storeId: this.clientDetails.store?.id || ''
            });
        } else {
            // Cuando salimos del modo edición, limpiamos los archivos seleccionados
            this.documentFiles = {};
        }
    }

    onFileSelected(event: any, docType: string): void {
        const file = event.target.files[0];
        if (file) {
            this.documentFiles[docType] = file;
        }
    }

    updateClient(): void {
        if (this.editClientForm.invalid) {
            return;
        }

        this.isLoading = true;
        const formData = new FormData();

        // Append form fields
        Object.keys(this.editClientForm.value).forEach(key => {
            const value = this.editClientForm.get(key)?.value;
            if (value) {
                formData.append(key, value);
            }
        });

        // Append files
        Object.keys(this.documentFiles).forEach(docType => {
            const file = this.documentFiles[docType];
            if (file) {
                formData.append(docType, file);
            }
        });

        this.clientesService.updateClient(this.clientDetails.id, formData).subscribe({
            next: () => {
                this.isLoading = false;
                this._alertsService.showAlertMessage({
                    type: 'success',
                    text: 'Cliente actualizado correctamente',
                    title: 'Éxito'
                });
                this.loadClientDetails(this.clientDetails.id);
                this.isEditMode = false;
            },
            error: () => {
                this.isLoading = false;
                this._alertsService.showAlertMessage({
                    type: 'error',
                    text: 'Error al actualizar el cliente',
                    title: 'Error'
                });
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    initiateSignatureProcess(): void {
        // Lógica para iniciar el proceso de firma electrónica
        //Navigate to the Docuseal builder with the contractElectronicSignature id in _blank
        window.open(`/docuseal/builder/${this.contractElectronicSignature.id}`, '_blank');
    }

    copySignatureUrl(url: string): void {
        navigator.clipboard.writeText(url).then(() => {
            alert('Enlace de firma copiado al portapapeles');
        });
    }

    createSignatureProcess(): void {
        if(!this.documentFiles['CONTRACT_ORIGINAL']){
            this._alertsService.showAlertMessage({ type: 'error', text: 'Por favor, sube el contrato original.', title: 'Error al subir el contrato' });
            return;
        }

        if(!this.weekDayCtrl.value){
            this._alertsService.showAlertMessage({ type: 'error', text: 'Por favor, selecciona el día de pago semanal.', title: 'Error al seleccionar día de pago' });
            return;
        }

        this.clientesService.createCredit({ clientId: this.clientDetails.id, repaymentDay: this.weekDayCtrl.value }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response:any) => {
                this.creditActive = response;
                this.uploadFileToClient(response.id);
            },error: (error) => {
                this._alertsService.showAlertMessage({ type: 'error', text: 'Error al crear el crédito para el cliente.', title: 'Error' });
            }
        });
    }

    uploadFileToClient(creditId?: string): void {
        this.clientesService.uploadFileToClient(this.clientDetails.id, this.documentFiles['CONTRACT_ORIGINAL'], 'CONTRACT_ORIGINAL', creditId).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response) => {
                const docUploaded = response;

                const payloadElectronicSignature = {
                    clientId: this.clientDetails.id,
                    documentId: docUploaded.id,
                    document_url: `https://www.confiabarradas.com/api/documents/66d28ef0-055f-429b-80c3-3ecbcdd4cd05/download`,
                    // document_url: `${environment.url}/documents/${docUploaded.id}/download`,
                    creditId: creditId
                }

                this.docusealCreateSignatureProcess(payloadElectronicSignature);
            },
            error: (error) => {
                console.error('Error al crear el proceso de firma electrónica:', error);
                this._alertsService.showAlertMessage({ type: 'error', text: 'Error al crear el proceso de firma electrónica.', title: 'Error' });
            }
        });
    }

    docusealCreateSignatureProcess(payload: {clientId: string, documentId: string, document_url: string, creditId?: string}): void {
        this._docusealService.createDocumentToken(payload).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response) => {
                this._alertsService.showAlertMessage({ type: 'success', text: 'Proceso de firma electrónica creado correctamente.', title: 'Éxito' });

                this.updateClientData();
            },
            error: (error) => {
                console.error('Error al crear el proceso de firma electrónica:', error);
                this._alertsService.showAlertMessage({ type: 'error', text: 'Error al crear el proceso de firma electrónica.', title: 'Error' });
            }
        });
    }

    updateClientData(): void {
        this.clientesService.getClient(this.clientDetails.id).pipe(takeUntil(this._unsubscribeAll)).subscribe(
            (updatedClient) => {
                this.clientDetails = updatedClient;
                this.contractElectronicSignature = updatedClient.electronicSignContract || null
                this._changeDetectorRef.markForCheck();
            }
        );
    }


    deleteElctronicSignatureProcess(): void {
        if(!this.contractElectronicSignature){
            this._alertsService.showAlertMessage({ type: 'error', text: 'No hay un proceso de firma electrónica para eliminar.', title: 'Error' });
            return;
        }

        const dialog = this._fuseConfirmationService.open({
            title: 'Confirmar eliminación del proceso de firma electrónica',
            message: `¿Estás seguro de que deseas eliminar el proceso de firma electrónica? Esta acción no se puede deshacer.`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn'
            },
            actions: {
                confirm: { show: true, label: 'Sí, eliminar', color: 'warn' },
                cancel: { show: true, label: 'Cancelar' }
            }
        });

        dialog.afterClosed().pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
            if (result === 'confirmed') {
                this._docusealService.deleteElectronicSignature(this.contractElectronicSignature.id).pipe(takeUntil(this._unsubscribeAll)).subscribe({
                    next: (response) => {
                        this._alertsService.showAlertMessage({ type: 'success', text: 'Proceso de firma electrónica eliminado correctamente.', title: 'Éxito' });
                        this.creditActive = null;
                        this.contractElectronicSignature = null;
                        this.updateClientData();
                    },
                    error: (error) => {
                        console.error('Error al eliminar el proceso de firma electrónica:', error);
                        this._alertsService.showAlertMessage({ type: 'error', text: 'Error al eliminar el proceso de firma electrónica.', title: 'Error' });
                    }
                });
            }
        });

    }

    goBack(): void {
        this._router.navigate(['/clients']);
    }

    // Método para filtrar tiendas en el select con búsqueda
    private filterStores(): void {
        if (!this.stores) {
            return;
        }
        // Get the search keyword
        let search = this.storeFilterCtrl.value;
        if (!search) {
            this.filteredStores.next(this.stores.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        // Filter the stores
        this.filteredStores.next(
            this.stores.filter(store => store.name.toLowerCase().indexOf(search) > -1)
        );
    }

}

// Componente de diálogo para previsualizar archivos
@Component({
    selector: 'app-preview-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
        <div mat-dialog-title class="flex bg-primary">
            <div class="flex items-center justify-between w-full text-on-primary mt-3">
                <div class="text-lg font-medium flex items-center">
                    <mat-icon class="mr-2 text-current">{{ data.mimeType.includes('pdf') ? 'picture_as_pdf' : 'image' }}</mat-icon>
                    {{ data.title }}
                </div>
                <button mat-icon-button (click)="closeDialog()" [tabIndex]="-1">
                    <mat-icon class="text-current" [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
                </button>
            </div>
        </div>
        <mat-dialog-content class="flex flex-col items-center justify-center p-4 min-h-[50vh]">
            <img *ngIf="data.mimeType.includes('image')" [src]="data.objectUrl" class="max-w-full max-h-[70vh] object-contain" alt="{{ data.title }}">
            <iframe *ngIf="data.mimeType.includes('pdf')" [src]="safeUrl" width="100%" height="500" frameborder="0"></iframe>

            <!-- Mensaje para tipos de archivo no previsualizable -->
            <div *ngIf="!data.mimeType.includes('image') && !data.mimeType.includes('pdf')" class="text-center py-8">
                <mat-icon class="text-6xl text-gray-400">insert_drive_file</mat-icon>
                <p class="mt-4 text-gray-600">Este tipo de archivo no se puede previsualizar</p>
                <p class="text-sm text-gray-500">{{ data.mimeType }}</p>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions class="justify-end py-3 px-4 bg-gray-50 border-t border-gray-200">
            <button mat-stroked-button color="accent" (click)="downloadFile()">
                <mat-icon class="mr-2">download</mat-icon>
                Descargar
            </button>
            <button mat-stroked-button class="bg-card ml-2" (click)="closeDialog()" [tabIndex]="-1">Cerrar</button>
        </mat-dialog-actions>
    `
})
export class PreviewDialogComponent {
    safeUrl: SafeResourceUrl;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public matDialogRef: MatDialogRef<PreviewDialogComponent>,
        private sanitizer: DomSanitizer
    ) {
        // Sanitizar la URL del objeto para iframe (PDFs)
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.objectUrl);
    }

    downloadFile(): void {
        // Crear enlace de descarga y simular clic
        const a = document.createElement('a');
        a.href = this.data.objectUrl;
        a.download = this.data.title || 'documento';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    closeDialog(): void {
        this.matDialogRef.close();
    }
}
