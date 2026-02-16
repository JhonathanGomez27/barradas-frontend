import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { ClientsService } from '../../clients.service';
import {
    CreateInvitationFiles,
    CreateInvitationPayload,
    CreateInvitationResponse,
} from '../../invitation.types';
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
    readonly data = inject<{ storeId: string; rol: string; agentId: string | null }>(MAT_DIALOG_DATA);

    inviteForm: FormGroup;
    isLoading: boolean = false;

    // Archivos para subir
    documentFiles: { [key: string]: File | null } = {};
    fileUploads: { [key: string]: FileUpload } = {
        INE_FRONT: { file: null, name: 'INE_FRONT', label: 'INE (Frente)', required: false },
        INE_BACK: { file: null, name: 'INE_BACK', label: 'INE (Reverso)', required: false },
        QUOTE: { file: null, name: 'QUOTE', label: 'Cotización', required: false },
        INITIAL_PAYMENT: { file: null, name: 'INITIAL_PAYMENT', label: 'Pago inicial', required: false }
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
            agentId: new FormControl({ value: this.data.agentId, disabled: true }, [Validators.required]),
            // Información del crédito
            totalAmount: [null, [Validators.min(1)]],
            initialPayment: [null, [Validators.min(0)]],
            initialPaymentRate: [{ value: null, disabled: true }],
            paymentType: ['WEEKLY'],
            selectedTerm: [null, [Validators.min(1)]],
            repaymentDay: ['MONDAY'],
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
            if (this.rol === 'admin') {
                this.inviteForm.get('agentId')?.setValue(null, { emitEvent: false });
            }

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
            this.inviteForm.patchValue({ selectedTerm: null });
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

        if (totalAmount > 0 && initialPayment > totalAmount) {
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

        const formValue = this.inviteForm.getRawValue();
        if (!formValue.agentId) {
            this.Toast.fire({
                icon: 'error',
                title: 'El agente es obligatorio.'
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

        this.inviteForm.disable({ emitEvent: false });
        this.isLoading = true;

        const hasCreditData =
            formValue.totalAmount != null &&
            formValue.selectedTerm != null;

        const payload: CreateInvitationPayload = {
            email: formValue.email,
            name: formValue.name,
            last_name: formValue.last_name,
            phone: formValue.phone,
            locationAddress: formValue.locationAddress,
            storeId: formValue.storeId ?? undefined,
            agentId: formValue.agentId,
            initialPayment: hasCreditData ? formValue.initialPayment ?? undefined : undefined,
            initialPaymentRate:
                hasCreditData && formValue.initialPaymentRate != null
                    ? parseFloat(formValue.initialPaymentRate)
                    : undefined,
            totalAmount: hasCreditData ? formValue.totalAmount ?? undefined : undefined,
            paymentType: hasCreditData ? formValue.paymentType : undefined,
            selectedTerm: hasCreditData ? formValue.selectedTerm ?? undefined : undefined,
            repaymentDay:
                hasCreditData && formValue.paymentType === 'WEEKLY'
                    ? formValue.repaymentDay
                    : undefined,
        };

        const files: CreateInvitationFiles = {};
        if (this.fileUploads['INE_FRONT'].file) files.INE_FRONT = this.fileUploads['INE_FRONT'].file;
        if (this.fileUploads['INE_BACK'].file) files.INE_BACK = this.fileUploads['INE_BACK'].file;
        if (this.fileUploads['QUOTE'].file) files.QUOTE = this.fileUploads['QUOTE'].file;
        if (this.fileUploads['INITIAL_PAYMENT'].file) files.INITIAL_PAYMENT = this.fileUploads['INITIAL_PAYMENT'].file;

        this._clientsService
            .createInvitation(payload, files)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: CreateInvitationResponse) => {
                    if (response.link) {
                        this.copyToClipboard(response.link);
                    }
                    this.isLoading = false;
                    this.Toast.fire({
                        icon: 'success',
                        title: 'Cliente invitado exitosamente',
                        text: 'Invitación creada con cliente, crédito y documentos.',
                    });
                    this.dialogRef.close({
                        success: true,
                        clientId: response.clientId,
                        creditId: response.creditId,
                    });
                },
                error: (error) => {
                    console.error('Error al crear la invitación:', error);
                    this.Toast.fire({
                        icon: 'error',
                        title: 'Error al invitar al cliente.',
                    });
                    this.inviteForm.enable({ emitEvent: false });
                    this.isLoading = false;
                },
            });
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
