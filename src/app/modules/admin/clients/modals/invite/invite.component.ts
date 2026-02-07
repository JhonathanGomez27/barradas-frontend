import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { forkJoin, Observable, ReplaySubject, Subject, takeUntil } from 'rxjs';
import { ClientsService } from '../../clients.service';
import Swal from 'sweetalert2';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Store, StoresService } from 'app/modules/admin/stores/stores.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Agent, AgentsService } from 'app/modules/admin/stores/agents.service';
import { HttpParams } from '@angular/common/http';
import { PermissionService } from 'app/shared/services/permission.service';

interface FileUpload {
    file: File | null;
    name: string;
    label: string;
    required: boolean;
}

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
        MatSelectModule,
        MatRadioModule,
        MatButtonToggleModule,
        NgxMatSelectSearchModule,
        ClipboardModule
    ],
    templateUrl: './invite.component.html',
})
export class InviteComponent implements OnInit {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    inviteForm: FormGroup;
    contractFile: File | null = null;
    isLoading: boolean = false;

    // Archivos para subir
    documentFiles: { [key: string]: File | null } = {};
    fileUploads: { [key: string]: FileUpload } = {
        INE_FRONT: { file: null, name: 'INE_FRONT', label: 'INE (Frente)', required: true },
        INE_BACK: { file: null, name: 'INE_BACK', label: 'INE (Reverso)', required: true },
        QUOTE: { file: null, name: 'QUOTE', label: 'Cotización', required: true }
    };

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

    Toast: any;
    creditTerms: any = {
        weeklyTerms: [],
        dailyTerms: []
    };

    // Términos disponibles según el tipo de pago
    availableTerms: number[] = [];

    stores: Store[] = [];
    storeFilterCtrl: FormControl = new FormControl('');
    filteredStores: ReplaySubject<Store[]> = new ReplaySubject<Store[]>(1);

    storeId: string = '';
    rol: string = '';
    selectedStore: Store | null = null;

    agents: Agent[] = [];
    agentFilterCtrl: FormControl = new FormControl('');
    filteredAgents: ReplaySubject<Agent[]> = new ReplaySubject<Agent[]>(1);

    constructor(
        private _formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<InviteComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { storeId: string, rol: string , agentId: string | null},
        private _clientsService: ClientsService,
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _agentsService: AgentsService,
        private _permissionService: PermissionService
    ) {
        this.inviteForm = this._formBuilder.group({
            // Información personal
            name: ['', [Validators.required]],
            last_name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            locationAddress: ['', [Validators.required]],
            storeId: [null, [Validators.required]],
            agentId: new FormControl({ value: this.data.agentId, disabled: true }),
            // Información del crédito
            totalAmount: [null, [Validators.required, Validators.min(1)]],
            initialPayment: [null, [Validators.required, Validators.min(0)]],
            initialPaymentRate: [{ value: null, disabled: true }],
            paymentType: ['WEEKLY', [Validators.required]],
            selectedTerm: [null, [Validators.required, Validators.min(1)]],
            repaymentDay: ['MONDAY', [Validators.required]],
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

        this._storesService.allStores$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: Store[]) => {
            this.storeId = this.data.storeId;
            this.rol = this.data.rol;

            this.stores = response;
            this.selectedStore = this.stores.find(store => store.id === this.storeId);

            if (this.storeId) {
                this.inviteForm.patchValue({
                    storeId: this.storeId
                });
            }

            this.filteredStores.next(this.stores.slice());
            this._changeDetectorRef.markForCheck();
        });

        // Listen for search field value changes
        this.storeFilterCtrl.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            this.filterStores();
            this._changeDetectorRef.markForCheck();
        });

        this.agentFilterCtrl.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            this.filterAgents();
            this._changeDetectorRef.markForCheck();
        });

        this.inviteForm.get('storeId')?.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((storeId) => {
            if (storeId === null || storeId === '') {
                this.inviteForm.get('agentId')?.disable({ emitEvent: false });
                return;
            }

            if(this.rol === 'admin'){
                this.loadAgentsByStore(storeId);
            }
        });

        this.getCreditTerms();
        this.setupFormListeners();
    }

    setupFormListeners(): void {
        // Calcular el porcentaje del pago inicial y validar
        this.inviteForm.get('initialPayment')?.valueChanges.subscribe(() => {
            this.calculateInitialPaymentRate();
            this.validateInitialPayment();
        });

        this.inviteForm.get('totalAmount')?.valueChanges.subscribe(() => {
            this.calculateInitialPaymentRate();
            this.validateInitialPayment();
        });

        // Actualizar términos disponibles cuando cambia el tipo de pago
        this.inviteForm.get('paymentType')?.valueChanges.subscribe((paymentType) => {
            this.updateAvailableTerms(paymentType);
            // Resetear el término seleccionado
            this.inviteForm.patchValue({ selectedTerm: 0 });
        });
    }

    calculateInitialPaymentRate(): void {
        const totalAmount = this.inviteForm.get('totalAmount')?.value || 0;
        const initialPayment = this.inviteForm.get('initialPayment')?.value || 0;

        if (totalAmount > 0) {
            const rate = (initialPayment / totalAmount) * 100;
            this.inviteForm.get('initialPaymentRate')?.setValue(rate.toFixed(2), { emitEvent: false });
        } else {
            this.inviteForm.get('initialPaymentRate')?.setValue(0, { emitEvent: false });
        }
    }

    validateInitialPayment(): void {
        const totalAmount = this.inviteForm.get('totalAmount')?.value || 0;
        const initialPayment = this.inviteForm.get('initialPayment')?.value || 0;
        const initialPaymentControl = this.inviteForm.get('initialPayment');

        if (initialPayment > totalAmount) {
            initialPaymentControl?.setErrors({ exceedsTotal: true });
        } else {
            // Limpiar el error personalizado si existe, pero mantener otros errores
            const errors = initialPaymentControl?.errors;
            if (errors && errors['exceedsTotal']) {
                delete errors['exceedsTotal'];
                initialPaymentControl?.setErrors(Object.keys(errors).length > 0 ? errors : null);
            }
        }
    }

    updateAvailableTerms(paymentType: string): void {
        if (paymentType === 'WEEKLY') {
            this.availableTerms = this.creditTerms.weeklyTerms || [];
        } else if (paymentType === 'DAILY') {
            this.availableTerms = this.creditTerms.dailyTerms || [];
        } else {
            this.availableTerms = [];
        }
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(value);
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        this.contractFile = file || null;

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                // Puedes usar esto para mostrar una vista previa si es necesario
            };
            reader.readAsDataURL(file);
        }
    }

    onDocumentFileSelected(event: any, docType: string): void {
        const file = event.target.files[0];
        if (file) {
            this.documentFiles[docType] = file;
            this.fileUploads[docType].file = file;
        }
    }

    removeDocumentFile(docType: string): void {
        this.documentFiles[docType] = null;
        this.fileUploads[docType].file = null;
    }

    getFileName(docType: string): string {
        return this.fileUploads[docType]?.file?.name || '';
    }

    getFileSize(docType: string): string {
        const file = this.fileUploads[docType]?.file;
        if (!file) return '';
        const sizeInKB = (file.size / 1024).toFixed(1);
        return `${sizeInKB} KB`;
    }

    onSubmit(): void {
        if (!this.inviteForm.valid) {
            this.Toast.fire({
                icon: 'error',
                title: 'Por favor completa todos los campos requeridos.'
            });
            return;
        }

        // Validar archivos requeridos
        const missingFiles = Object.keys(this.fileUploads).filter(
            key => this.fileUploads[key].required && !this.fileUploads[key].file
        );

        if (missingFiles.length > 0) {
            const fileLabels = missingFiles.map(key => this.fileUploads[key].label).join(', ');
            this.Toast.fire({
                icon: 'error',
                title: 'Archivos requeridos',
                text: `Por favor sube los siguientes archivos: ${fileLabels}`
            });
            return;
        }

        if (this.inviteForm.valid) {
            this.inviteForm.disable({ emitEvent: false });
            this.isLoading = true;

            const formValue = this.inviteForm.getRawValue();
            const clientData = {
                name: formValue.name,
                last_name: formValue.last_name,
                email: formValue.email,
                phone: formValue.phone,
                locationAddress: formValue.locationAddress,
                storeId: formValue.storeId,
                agentId: formValue.agentId
            };

            const creditData = {
                initialPayment: formValue.initialPayment,
                initialPaymentRate: parseFloat(formValue.initialPaymentRate),
                totalAmount: formValue.totalAmount,
                paymentType: formValue.paymentType,
                selectedTerm: formValue.selectedTerm,
                repaymentDay: formValue.paymentType === 'WEEKLY' ? formValue.repaymentDay : null,
                status: 'PENDING'
            }

            console.log(creditData);

            // return;

            this._clientsService.inviteClient(clientData).pipe(takeUntil(this._unsubscribeAll)).subscribe({
                next: (response: any) => {
                    console.log('Cliente invitado exitosamente:', response);
                    if (response.link) {
                        this.copyToClipboard(response.link);
                    }
                    this.createCreditForClient(response.clientId, creditData);
                },
                error: (error) => {
                    console.error('Error al invitar al cliente:', error);
                    this.Toast.fire({
                        icon: 'error',
                        title: 'Error al invitar al cliente.'
                    });
                    this.inviteForm.enable({ emitEvent: false });
                    this.isLoading = false;
                },
            });
        }
    }

    createCreditForClient(clientId: string, creditData: any) {
        this._clientsService.createCredit({ clientId: clientId, ...creditData }).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response: any) => {
                console.log('Crédito creado exitosamente:', response);

                this.uploadDocumentsToClient(clientId, response.id);
            }, error: (error) => {

            }
        });
    }

    uploadDocumentsToClient(client_id: string, creditId: string | null = null): void {
        const uploadObservables: Observable<unknown>[] = [];

        Object.keys(this.fileUploads).forEach(docType => {
            const fileUpload = this.fileUploads[docType];
            if (fileUpload.file) {
                if (docType === 'QUOTE' && creditId) {
                    uploadObservables.push(
                        this._clientsService.uploadFileToClient(
                            client_id,
                            fileUpload.file,
                            docType,
                            creditId
                        )
                    );
                } else {
                    uploadObservables.push(
                        this._clientsService.uploadFileToClient(
                            client_id,
                            fileUpload.file,
                            docType
                        )
                    );
                }

            }
        });

        if (uploadObservables.length > 0) {
            const handleUploadSuccess = (responses: unknown[]) => {
                console.log('Archivos subidos exitosamente:', responses);
                this.isLoading = false;
                this.Toast.fire({
                    icon: 'success',
                    title: 'Cliente invitado exitosamente',
                    text: 'Se han subido todos los documentos correctamente.'
                });
                this.dialogRef.close({
                    success: true,
                    clientId: client_id
                });
            };

            const handleUploadError = (error: unknown) => {
                console.error('Error al subir los archivos:', error);
                this.isLoading = false;
                this.Toast.fire({
                    icon: 'error',
                    title: 'Error al subir los archivos',
                    text: 'El cliente fue creado pero hubo un error al subir los documentos.'
                });
                this.inviteForm.enable();
            };

            forkJoin(uploadObservables)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: handleUploadSuccess,
                    error: handleUploadError
                });
        } else {
            this.isLoading = false;
            this.dialogRef.close({
                success: true,
                clientId: client_id
            });
        }
    }

    getCreditTerms(): void {

        if(!this._permissionService.hasPermission('credits:read:all:get:credits.payment-terms')) return;

        this._clientsService.getCreditTerms()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (terms) => {
                    this.creditTerms = terms;
                    // Inicializar términos disponibles con WEEKLY por defecto
                    this.updateAvailableTerms('WEEKLY');
                },
                error: (error) => {
                    console.error('Error al obtener los términos de crédito:', error);
                }
            });
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(
            () => {
                this.Toast.fire({
                    icon: 'success',
                    title: 'Enlace copiado al portapapeles'
                });
            },
            (err) => {
                console.error('Error al copiar al portapapeles:', err);
            }
        );
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

    private filterAgents(): void {
        if (!this.agents) {
            return;
        }
        // Get the search keyword
        let search = this.agentFilterCtrl.value;
        if (!search) {
            this.filteredAgents.next(this.agents.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        // Filter the agents
        this.filteredAgents.next(
            this.agents.filter(agent => agent.firstName.toLowerCase().indexOf(search) > -1 ||
                agent.lastName.toLowerCase().indexOf(search) > -1 ||
                agent.email.toLowerCase().indexOf(search) > -1)
        );
    }

    loadAgentsByStore(storeId: string): void {
        if (storeId === null || storeId === '') {
            this.inviteForm.get('agentId')?.disable({ emitEvent: false });
            return;
        }

        this._agentsService.getAgents({storeId}).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (agents) => {
                // Manejar los agentes obtenidos
                this.agents = agents.data;
                this.filteredAgents.next(this.agents.slice());
                this.inviteForm.get('agentId')?.enable({ emitEvent: false });
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error al cargar los agentes de la tienda:', error);
            }
        });
    }
}
