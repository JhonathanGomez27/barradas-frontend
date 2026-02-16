import { animate, style, transition, trigger } from '@angular/animations';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Agent, AgentsService } from 'app/modules/admin/stores/agents.service';
import { Store, StoresService } from 'app/modules/admin/stores/stores.service';
import { DocusealService } from 'app/modules/docuseal/docuseal.service';
import { AlertsService } from 'app/shared/services/alerts.service';
import { environment } from 'environment/environment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { forkJoin, of, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs';
import { Credit, CreditInstallment, InstallmentStatus } from '../../clients.interface';
import { ClientsService } from '../../clients.service';
import { InstallmentPaymentsDialogComponent } from '../installment-payments/installment-payments-dialog.component';
import { RegisterPaymentDialogComponent } from '../register-payment/register-payment-dialog.component';

interface FileUpload {
    file: File | null;
    preview: string | null;
    name: string;
    label: string;
    required: boolean;
}

import { PermissionService } from 'app/shared/services/permission.service';

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
        MatPaginatorModule,
        MatProgressSpinnerModule,
        CdkScrollable,
        NgxMatSelectSearchModule,
        MatSelectModule,
        MatButtonToggleModule,
    ],
    templateUrl: './client-details.component.html',
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ height: '0', opacity: '0', overflow: 'hidden' }),
                animate('300ms ease-out', style({ height: '*', opacity: '1' })),
            ]),
            transition(':leave', [
                style({ height: '*', opacity: '1', overflow: 'hidden' }),
                animate('300ms ease-in', style({ height: '0', opacity: '0' })),
            ]),
        ]),
    ],
})
export class ClientDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    clientDetails: any = null;

    // Mapeo de estados
    statusMapper: { [key: string]: string } = {
        CREATED: 'Creado',
        INVITED: 'Invitación enviada',
        IN_PROGRESS: 'Pendiente de completar Documentación',
        COMPLETED: 'Finalizado con contrato',
        NO_CONTRACT_SENDED: 'Gestionado sin contrato',
        CONTRACT_SENDED: 'Gestionado con contrato sin firmar',
    };

    // Mapeo de tipos de documento
    docTypeMapper: { [key: string]: string } = {
        INTERIOR_1: 'Interior 1',
        INTERIOR_2: 'Interior 2',
        INE_FRONT: 'INE (Frente)',
        INE_BACK: 'INE (Reverso)',
        PROOF_ADDRESS: 'Comprobante de domicilio',
        PROOF_ADDRESS_OWNER: 'Comprobante del propietario',
        FACADE: 'Fachada',
        CONTRACT_SIGNED: 'Contrato firmado',
        QUOTE: 'Cotización',
        INITIAL_PAYMENT: 'Pago inicial',
        CONTRACT_ORIGINAL: 'Contrato original',
        AUDIT_LOG: 'Registro de auditoría de firma',
        OTHER: 'Otro',
    };

    // Status electronic signature
    statusMapperSignature: { [key: string]: string } = {
        CREATED: 'Creado',
        PENDING: 'Pendiente',
        SIGNED: 'Firmado',
        CANCELLED: 'Cancelado',
        EXPIRED: 'Expirado',
    };

    // Status credit mapper
    statusMapperCredit: { [key: string]: string } = {
        PENDING: 'Pendiente',
        ACTIVE: 'Activo',
        CLOSED: 'Pagado',
        DEFAULTED: 'En Mora',
        CANCELLED: 'Cancelado',
    };

    statusMapperInstallment: { [key: string]: string } = {
        PENDING: 'Pendiente',
        PAID: 'Pagado',
        OVERDUE: 'Vencido',
        PARTIAL: 'Parcial',
    };

    weekDayCtrl: UntypedFormControl = new UntypedFormControl('');

    // Días de la semana para el selector
    weekDays = [
        { value: 'MONDAY', label: 'L', short: 'Lun', fullName: 'Lunes' },
        { value: 'TUESDAY', label: 'M', short: 'Mar', fullName: 'Martes' },
        { value: 'WEDNESDAY', label: 'X', short: 'Mié', fullName: 'Miércoles' },
        { value: 'THURSDAY', label: 'J', short: 'Jue', fullName: 'Jueves' },
        { value: 'FRIDAY', label: 'V', short: 'Vie', fullName: 'Viernes' },
        { value: 'SATURDAY', label: 'S', short: 'Sáb', fullName: 'Sábado' },
        { value: 'SUNDAY', label: 'D', short: 'Dom', fullName: 'Domingo' },
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
        INITIAL_PAYMENT: { file: null, preview: null, name: 'INITIAL_PAYMENT', label: 'Pago inicial', required: true },
    };

    contractElectronicSignature: any = null;

    credits: Credit[] = [];
    creditsTotal: number = 0;
    creditsPageIndex: number = 0;
    creditsPageSize: number = Number(environment.pagination) || 10;
    readonly creditsPageSizeOptions: number[] = [5, 10, 20, 50];
    selectedCredit: Credit | null = null;
    creditActive: Credit | null = null;
    expandedCreditId: string | null = null;
    installments: CreditInstallment[] = [];
    installmentsLoading: boolean = false;
    installmentsTotal: number = 0;
    installmentsPageIndex: number = 0;
    installmentsPageSize: number = 20;
    readonly installmentsPageSizeOptions: number[] = [10, 20, 50, 100];
    installmentsStatusFilter: InstallmentStatus | '' = '';
    installmentsOrderBy: 'asc' | 'desc' = 'asc';

    showElectronicSignatureDetails: boolean = false;

    // Términos de crédito disponibles
    creditTerms: any = {
        weeklyTerms: [],
        dailyTerms: [],
    };
    availableTerms: number[] = [];

    // Formulario para crear nuevo crédito
    newCreditForm: FormGroup;
    showCreateCreditForm: boolean = false;
    newCreditQuoteFile: File | null = null;
    newCreditInitialPaymentFile: File | null = null;

    // Archivos de contrato por crédito (creditId -> File)
    contractFilesByCreditId: { [creditId: string]: File } = {};

    stores: Store[] = [];
    storeFilterCtrl: FormControl = new FormControl('');
    filteredStores: ReplaySubject<Store[]> = new ReplaySubject<Store[]>(1);

    agents: Agent[] = [];
    agentFilterCtrl: FormControl = new FormControl('');
    filteredAgents: ReplaySubject<Agent[]> = new ReplaySubject<Agent[]>(1);

    constructor(
        private clientesService: ClientsService,
        private dialog: MatDialog,
        private fb: FormBuilder,
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _alertsService: AlertsService,
        private _docusealService: DocusealService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _storesService: StoresService,
        private _agentsService: AgentsService,
        private _permissionService: PermissionService
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
            storeId: [''],
            agentId: new FormControl({ value: null, disabled: true }),
        });

        this.newCreditForm = this.fb.group({
            totalAmount: [null, [Validators.required, Validators.min(1)]],
            initialPayment: [null, [Validators.required, Validators.min(0)]],
            initialPaymentRate: [{ value: null, disabled: true }],
            paymentType: ['WEEKLY', [Validators.required]],
            selectedTerm: [null, [Validators.required, Validators.min(1)]],
            repaymentDay: ['MONDAY', [Validators.required]],
        });
    }

    hasPermission(permission: string): boolean {
        return this._permissionService.hasPermission(permission);
    }

    ngOnInit(): void {
        // Obtener el ID del cliente desde los parámetros de la ruta
        const clientId = this._activatedRoute.snapshot.params['id'];

        if (clientId) {
            this.loadClientDetails(clientId);
        } else {
            this._router.navigate(['/clients']);
        }

        // Los créditos ya vienen del resolver
        this.clientesService.credits$.pipe(takeUntil(this._unsubscribeAll)).subscribe((response: any) => {
            this.credits = response.data || [];
            this.creditsTotal = response.total || 0;

            if (this.selectedCredit && !this.credits.some((credit) => credit.id === this.selectedCredit.id)) {
                this.selectedCredit = null;
                this.expandedCreditId = null;
                this.installments = [];
                this.installmentsTotal = 0;
            }

            if (this.credits.length > 0 && !this.selectedCredit) {
                this.creditActive = this.credits.find((credit) => credit.status === 'ACTIVE' || credit.status === 'PENDING') || this.credits[0];

                this.selectedCredit = this.creditActive;
                this.expandedCreditId = this.creditActive.id;
                this.installmentsPageIndex = 0;
                this.loadCreditInstallments();
            }

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

        this.agentFilterCtrl.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            this.filterAgents();
            this._changeDetectorRef.markForCheck();
        });

        this.editClientForm
            .get('storeId')
            ?.valueChanges.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((storeId) => {
                if (storeId === null || storeId === '') {
                    this.editClientForm.get('agentId')?.disable({ emitEvent: false });
                    return;
                }

                this.editClientForm.get('agentId')?.reset(null, { emitEvent: false });
                this.loadAgentsByStore(storeId);
            });

        // Obtener términos de crédito
        this.getCreditTerms();
        this.setupNewCreditFormListeners();
    }

    ngAfterViewInit(): void {
        if (this.hasPermission('stores:read:store:get:stores.all')) {
            this._storesService.getAllStoresNoPagination().pipe(takeUntil(this._unsubscribeAll)).subscribe();
        }
    }

    loadClientDetails(clientId: string): void {
        this.isLoading = true;
        this.clientesService
            .getClient(clientId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    this.clientDetails = response;

                    // Los créditos ya no vienen en la respuesta del cliente
                    // Se obtienen del resolver a través de credits$
                    this.editClientForm.patchValue({
                        ...this.clientDetails,
                        storeId: this.clientDetails.store?.id || '',
                        agentId: this.clientDetails.agent?.id || '',
                    });

                    // Cargar agentes de la tienda asociada
                    // if( this.clientDetails.store?.id ) {
                    //     this.loadAgentsByStore(this.clientDetails.store?.id);
                    // }

                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error al cargar detalles del cliente:', error);
                    this._alertsService.showAlertMessage({
                        type: 'error',
                        text: 'Error al cargar los detalles del cliente',
                        title: 'Error',
                    });
                    this.isLoading = false;
                    this._router.navigate(['/clients']);
                },
            });
    }

    onCreditSelect(credit: Credit): void {
        this.expandedCreditId = credit.id;
        this.selectedCredit = credit;
        this.creditActive = credit;
        this.installmentsPageIndex = 0;
        this.loadCreditInstallments();
        this._changeDetectorRef.markForCheck();
    }

    isCreditExpanded(creditId: string): boolean {
        return this.expandedCreditId === creditId;
    }

    getCreditSignature(credit: Credit): any {
        return credit.signatures && credit.signatures.length > 0 ? credit.signatures[0] : null;
    }

    hasContractDocuments(credit: Credit): boolean {
        // Verificar si el crédito tiene documentos en su array de documents
        if (!credit.documents || credit.documents.length === 0) {
            return false;
        }

        return credit.documents.some((doc: any) => doc.docType === 'CONTRACT_ORIGINAL' || doc.docType === 'QUOTE');
    }

    getCreditDocuments(credit: Credit): any[] {
        return credit.documents || [];
    }

    getCreditInstallments(credit: Credit): CreditInstallment[] {
        return this.selectedCredit?.id === credit.id ? this.installments : [];
    }

    onInstallmentsPageChange(event: PageEvent): void {
        this.installmentsPageIndex = event.pageIndex;
        this.installmentsPageSize = event.pageSize;
        this.loadCreditInstallments();
    }

    onInstallmentsStatusFilterChange(status: InstallmentStatus | ''): void {
        this.installmentsStatusFilter = status;
        this.installmentsPageIndex = 0;
        this.loadCreditInstallments();
    }

    onInstallmentsOrderChange(order: 'asc' | 'desc'): void {
        this.installmentsOrderBy = order;
        this.installmentsPageIndex = 0;
        this.loadCreditInstallments();
    }

    openPaymentDialog(credit: Credit, installment: CreditInstallment): void {
        const dialogRef = this.dialog.open(RegisterPaymentDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: {
                clientId: this.clientDetails.id,
                credit,
                installment,
            },
        });

        dialogRef
            .afterClosed()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((result) => {
                if (result) {
                    this.reloadClientCredits();
                }
            });
    }

    openInstallmentPaymentsDialog(installment: CreditInstallment): void {
        this.dialog.open(InstallmentPaymentsDialogComponent, {
            width: '760px',
            maxWidth: '96vw',
            data: {
                installment,
            },
        });
    }

    hasCreditSignatures(credit: Credit): boolean {
        return credit.signatures && credit.signatures.length > 0;
    }

    getCreditSignatures(credit: Credit): any[] {
        return credit.signatures || [];
    }

    createSignatureProcessForCredit(credit: Credit): void {
        if (!this.contractFilesByCreditId[credit.id]) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'Por favor, sube el contrato original para este crédito.',
                title: 'Error al subir el contrato',
            });
            return;
        }

        this.selectedCredit = credit;
        this.creditActive = credit;
        this.uploadFileToClient(credit.id);
    }

    updateCreditStatusForCredit(credit: Credit, newStatus: 'CLOSED' | 'CANCELLED'): void {
        const dialog = this._fuseConfirmationService.open({
            title: 'Confirmar actualización de estado',
            message: `¿Estás seguro de que deseas cambiar el estado del crédito a ${this.statusMapperCredit[newStatus]}?`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'info',
            },
            actions: {
                confirm: { show: true, label: 'Sí', color: 'primary' },
                cancel: { show: true, label: 'No' },
            },
        });

        dialog
            .afterClosed()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((result) => {
                if (result === 'confirmed') {
                    this.clientesService
                        .updateCreditStatus(credit.id, newStatus)
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe({
                            next: (response) => {
                                this._alertsService.showAlertMessage({
                                    type: 'success',
                                    text: 'Estado del crédito actualizado correctamente',
                                    title: 'Éxito',
                                });
                                this.reloadClientCredits();
                            },
                            error: (error) => {
                                console.error('Error al actualizar el estado del crédito:', error);
                                this._alertsService.showAlertMessage({
                                    type: 'error',
                                    text: 'Error al actualizar el estado del crédito',
                                    title: 'Error',
                                });
                            },
                        });
                }
            });
    }

    deleteElectronicSignatureProcessForCredit(credit: Credit): void {
        const signature = this.getCreditSignature(credit);
        if (!signature) return;

        const dialog = this._fuseConfirmationService.open({
            title: '¿Estás seguro?',
            message: 'Esta acción eliminará el proceso de firma electrónica. No podrás revertir esta acción.',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Sí, eliminar', color: 'warn' },
                cancel: { show: true, label: 'Cancelar' },
            },
        });

        dialog
            .afterClosed()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((result) => {
                if (result === 'confirmed') {
                    this._docusealService
                        .deleteElectronicSignature(signature.id)
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe({
                            next: (response) => {
                                this._alertsService.showAlertMessage({
                                    type: 'success',
                                    text: 'Proceso de firma electrónica eliminado correctamente',
                                    title: 'Éxito',
                                });
                                this.reloadClientCredits();
                            },
                            error: (error) => {
                                console.error('Error al eliminar el proceso de firma electrónica:', error);
                                this._alertsService.showAlertMessage({
                                    type: 'error',
                                    text: 'Error al eliminar el proceso de firma electrónica',
                                    title: 'Error',
                                });
                            },
                        });
                }
            });
    }

    initiateSignatureProcessForCredit(credit: Credit): void {
        const signature = this.getCreditSignature(credit);
        if (!signature) return;

        // Navegar al constructor de Docuseal con el ID de la firma
        window.open(`/docuseal/builder/${signature.id}`, '_blank');
    }

    copySignatureUrlForCredit(url: string): void {
        navigator.clipboard
            .writeText(url)
            .then(() => {
                this._alertsService.showAlertMessage({
                    type: 'success',
                    text: 'URL copiada al portapapeles',
                    title: 'Éxito',
                });
            })
            .catch((error) => {
                console.error('Error al copiar al portapapeles:', error);
                this._alertsService.showAlertMessage({
                    type: 'error',
                    text: 'Error al copiar la URL',
                    title: 'Error',
                });
            });
    }

    onFileSelectedForCredit(event: any, docType: string, credit: Credit): void {
        const file = event.target.files[0];
        if (file) {
            if (docType === 'CONTRACT_ORIGINAL') {
                this.contractFilesByCreditId[credit.id] = file;
            } else {
                this.documentFiles[docType] = file;
            }
            this.selectedCredit = credit;
        }
    }

    getContractFileForCredit(creditId: string): File | null {
        return this.contractFilesByCreditId[creditId] || null;
    }

    getContractFileNameForCredit(creditId: string): string {
        const file = this.contractFilesByCreditId[creditId];
        return file ? file.name : '';
    }

    formatCurrency(value: string | number): string {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(numValue);
    }

    getPaymentTypeLabel(paymentType: string): string {
        return paymentType === 'WEEKLY' ? 'Semanal' : 'Diario';
    }

    getTermLabel(term: number, paymentType: string): string {
        return `${term} ${paymentType === 'WEEKLY' ? 'semanas' : 'días'}`;
    }

    getCreditTerms(): void {
        this.clientesService
            .getCreditTerms()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (terms) => {
                    this.creditTerms = terms;
                    this.updateAvailableTerms('WEEKLY');
                },
                error: (error) => {
                    console.error('Error al obtener los términos de crédito:', error);
                },
            });
    }

    setupNewCreditFormListeners(): void {
        // Calcular el porcentaje del pago inicial y validar
        this.newCreditForm.get('initialPayment')?.valueChanges.subscribe(() => {
            this.calculateNewCreditInitialPaymentRate();
            this.validateNewCreditInitialPayment();
        });

        this.newCreditForm.get('totalAmount')?.valueChanges.subscribe(() => {
            this.calculateNewCreditInitialPaymentRate();
            this.validateNewCreditInitialPayment();
        });

        // Actualizar términos disponibles cuando cambia el tipo de pago
        this.newCreditForm.get('paymentType')?.valueChanges.subscribe((paymentType) => {
            this.updateAvailableTerms(paymentType);
            this.newCreditForm.patchValue({ selectedTerm: null });
        });
    }

    calculateNewCreditInitialPaymentRate(): void {
        const totalAmount = this.newCreditForm.get('totalAmount')?.value || 0;
        const initialPayment = this.newCreditForm.get('initialPayment')?.value || 0;

        if (totalAmount > 0) {
            const rate = (initialPayment / totalAmount) * 100;
            this.newCreditForm.get('initialPaymentRate')?.setValue(rate.toFixed(2), { emitEvent: false });
        } else {
            this.newCreditForm.get('initialPaymentRate')?.setValue(0, { emitEvent: false });
        }
    }

    validateNewCreditInitialPayment(): void {
        const totalAmount = this.newCreditForm.get('totalAmount')?.value || 0;
        const initialPayment = this.newCreditForm.get('initialPayment')?.value || 0;
        const initialPaymentControl = this.newCreditForm.get('initialPayment');

        if (initialPayment > totalAmount) {
            initialPaymentControl?.setErrors({ exceedsTotal: true });
        } else {
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

    toggleCreateCreditForm(): void {
        this.showCreateCreditForm = !this.showCreateCreditForm;
        if (!this.showCreateCreditForm) {
            this.newCreditForm.reset({
                paymentType: 'WEEKLY',
                repaymentDay: 'MONDAY',
            });
            this.newCreditQuoteFile = null;
        }
    }

    onQuoteFileSelectedForNewCredit(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.newCreditQuoteFile = file;
        }
    }

    onInitialPaymentFileSelectedForNewCredit(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.newCreditInitialPaymentFile = file;
        }
    }

    createNewCredit(): void {
        if (!this.newCreditForm.valid) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'Por favor completa todos los campos requeridos.',
                title: 'Error',
            });
            return;
        }

        if (!this.newCreditQuoteFile) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'Por favor sube el archivo de cotización (QUOTE).',
                title: 'Error',
            });
            return;
        }

        const formValue = this.newCreditForm.getRawValue();
        const creditData = {
            clientId: this.clientDetails.id,
            initialPayment: formValue.initialPayment,
            initialPaymentRate: parseFloat(formValue.initialPaymentRate),
            totalAmount: formValue.totalAmount,
            paymentType: formValue.paymentType,
            selectedTerm: formValue.selectedTerm,
            repaymentDay: formValue.paymentType === 'WEEKLY' ? formValue.repaymentDay : null,
            status: 'PENDING',
        };

        this.clientesService
            .createCredit(creditData)
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap((response) => {
                    const creditId = response.id;
                    const quoteUpload$ = this.clientesService.uploadFileToClient(this.clientDetails.id, this.newCreditQuoteFile!, 'QUOTE', creditId);
                    const initialPaymentUpload$ = this.newCreditInitialPaymentFile
                        ? this.clientesService.uploadFileToClient(
                              this.clientDetails.id,
                              this.newCreditInitialPaymentFile,
                              'INITIAL_PAYMENT',
                              creditId
                          )
                        : of(null);

                    return forkJoin({
                        quote: quoteUpload$,
                        initialPayment: initialPaymentUpload$,
                    });
                })
            )
            .subscribe({
                next: () => {
                    const message = this.newCreditInitialPaymentFile
                        ? 'Crédito creado exitosamente con cotización y pago inicial.'
                        : 'Crédito creado exitosamente con su cotización.';
                    this._alertsService.showAlertMessage({
                        type: 'success',
                        text: message,
                        title: 'Éxito',
                    });
                    this.reloadClientCredits();
                    this.toggleCreateCreditForm();
                },
                error: (error) => {
                    console.error('Error al crear el crédito o subir archivos:', error);
                    this._alertsService.showAlertMessage({
                        type: 'error',
                        text: error?.error?.message || 'Error al crear el crédito o subir los archivos.',
                        title: 'Error',
                    });
                },
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
            minute: '2-digit',
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
        this.clientesService
            .getFileUrlClient(file_id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
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
                mimeType: mimeType,
            },
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

    getFile(file_id: string, doc_title: string) {
        this.clientesService.getFileClient(file_id, doc_title);
    }

    // Obtener icono según el estado del cliente
    getStatusIcon(status: string): string {
        switch (status) {
            case 'COMPLETED':
                return 'check_circle';
            case 'INVITED':
                return 'mail_outline';
            case 'IN_PROGRESS':
                return 'hourglass_empty';
            case 'CREATED':
                return 'fiber_new';
            default:
                return 'help_outline';
        }
    }

    // Obtener icono según el tipo de documento
    getDocumentIcon(docType: string): string {
        switch (docType) {
            case 'INTERIOR_1':
            case 'INTERIOR_2':
            case 'FACADE':
                return 'photo_camera';
            case 'INE_FRONT':
            case 'INE_BACK':
                return 'badge';
            case 'PROOF_ADDRESS':
            case 'PROOF_ADDRESS_OWNER':
                return 'home';
            case 'CONTRACT_SIGNED':
                return 'description';
            case 'QUOTE':
                return 'receipt';
            case 'INITIAL_PAYMENT':
                return 'payment';
            default:
                return 'insert_drive_file';
        }
    }

    // Obtener el nombre completo del día de la semana
    getWeekDayName(value: string): string {
        const day = this.weekDays.find((d) => d.value === value);
        return day ? day.fullName : '';
    } // Obtener icono según el estado del crédito
    getCreditStatusIcon(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'check_circle';
            case 'PENDING':
                return 'schedule';
            case 'CLOSED':
                return 'paid';
            case 'DEFAULTED':
                return 'warning';
            case 'CANCELLED':
                return 'cancel';
            default:
                return 'help_outline';
        }
    }

    // Actualizar estado del crédito
    updateCreditStatus(newStatus: 'CLOSED' | 'CANCELLED'): void {
        if (!this.creditActive) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'No hay un crédito activo para actualizar.',
                title: 'Error',
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
                color: 'info',
            },
            actions: {
                confirm: { show: true, label: 'Sí', color: 'primary' },
                cancel: { show: true, label: 'No' },
            },
        });

        dialog
            .afterClosed()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((result) => {
                if (result === 'confirmed') {
                    this.clientesService
                        .updateCreditStatus(this.creditActive.id, newStatus)
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe({
                            next: (response) => {
                                this._alertsService.showAlertMessage({
                                    type: 'success',
                                    text: `Crédito actualizado a ${statusText} correctamente.`,
                                    title: 'Éxito',
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
                                    title: 'Error',
                                });
                            },
                        });
                }
            });
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
                storeId: this.clientDetails.store?.id || '',
                agentId: this.clientDetails.agent?.id || '',
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
        Object.keys(this.editClientForm.value).forEach((key) => {
            const value = this.editClientForm.get(key)?.value;
            if (value) {
                formData.append(key, value);
            }

            if (key === 'agentId' && (value === null || value === '')) {
                formData.append(key, null);
            }
        });

        // Append files
        Object.keys(this.documentFiles).forEach((docType) => {
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
                    title: 'Éxito',
                });
                this.loadClientDetails(this.clientDetails.id);
                this.isEditMode = false;
            },
            error: () => {
                this.isLoading = false;
                this._alertsService.showAlertMessage({
                    type: 'error',
                    text: 'Error al actualizar el cliente',
                    title: 'Error',
                });
            },
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
        if (!this.documentFiles['CONTRACT_ORIGINAL']) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'Por favor, sube el contrato original.',
                title: 'Error al subir el contrato',
            });
            return;
        }

        if (!this.weekDayCtrl.value) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'Por favor, selecciona el día de pago semanal.',
                title: 'Error al seleccionar día de pago',
            });
            return;
        }

        this.clientesService
            .createCredit({ clientId: this.clientDetails.id, repaymentDay: this.weekDayCtrl.value })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    this.creditActive = response;
                    this.uploadFileToClient(response.id);
                },
                error: (error) => {
                    this._alertsService.showAlertMessage({ type: 'error', text: 'Error al crear el crédito para el cliente.', title: 'Error' });
                },
            });
    }

    uploadFileToClient(creditId?: string): void {
        // Obtener el archivo del crédito específico
        const contractFile = creditId ? this.contractFilesByCreditId[creditId] : this.documentFiles['CONTRACT_ORIGINAL'];

        if (!contractFile) {
            this._alertsService.showAlertMessage({
                type: 'error',
                text: 'No se encontró el archivo de contrato.',
                title: 'Error',
            });
            return;
        }

        this.clientesService
            .uploadFileToClient(this.clientDetails.id, contractFile, 'CONTRACT_ORIGINAL', creditId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    const docUploaded = response;

                    const payloadElectronicSignature = {
                        clientId: this.clientDetails.id,
                        documentId: docUploaded.id,
                        // document_url: `https://www.confiabarradas.com/api/documents/66d28ef0-055f-429b-80c3-3ecbcdd4cd05/download`,
                        document_url: `${environment.url}/documents/${docUploaded.id}/download`,
                        creditId: creditId,
                    };

                    this.docusealCreateSignatureProcess(payloadElectronicSignature);

                    // Limpiar el archivo después de subirlo exitosamente
                    if (creditId) {
                        delete this.contractFilesByCreditId[creditId];
                    }
                },
                error: (error) => {
                    console.error('Error al crear el proceso de firma electrónica:', error);
                    this._alertsService.showAlertMessage({
                        type: 'error',
                        text: 'Error al subir el contrato.',
                        title: 'Error',
                    });
                },
            });
    }

    docusealCreateSignatureProcess(payload: { clientId: string; documentId: string; document_url: string; creditId?: string }): void {
        this._docusealService
            .createDocumentToken(payload)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this._alertsService.showAlertMessage({
                        type: 'success',
                        text: 'Proceso de firma electrónica creado correctamente.',
                        title: 'Éxito',
                    });

                    // Recargar los créditos del cliente
                    this.reloadClientCredits();
                },
                error: (error) => {
                    console.error('Error al crear el proceso de firma electrónica:', error);
                    this._alertsService.showAlertMessage({
                        type: 'error',
                        text: 'Error al crear el proceso de firma electrónica.',
                        title: 'Error',
                    });
                },
            });
    }

    reloadClientCredits(): void {
        const params = new HttpParams().set('limit', String(this.creditsPageSize)).set('page', String(this.creditsPageIndex + 1));

        this.clientesService.getClientCredits(this.clientDetails.id, params).subscribe();
        this.loadCreditInstallments();
    }

    onCreditsPageChange(event: PageEvent): void {
        this.creditsPageIndex = event.pageIndex;
        this.creditsPageSize = event.pageSize;
        this.reloadClientCredits();
    }

    private loadCreditInstallments(): void {
        if (!this.selectedCredit?.id) {
            this.installments = [];
            this.installmentsTotal = 0;
            return;
        }

        let params = new HttpParams().set('page', String(this.installmentsPageIndex + 1)).set('limit', String(this.installmentsPageSize));

        if (this.installmentsStatusFilter) {
            params = params.set('status', this.installmentsStatusFilter);
        }

        params = params.set('orderBy', this.installmentsOrderBy);

        this.installmentsLoading = true;

        this.clientesService
            .getCreditInstallmentsPaginated(this.selectedCredit.id, params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.installments = response.data || [];
                    this.installmentsTotal = response.total || 0;
                    this.installmentsPageIndex = Math.max((response.page || 1) - 1, 0);
                    this.installmentsPageSize = response.limit || this.installmentsPageSize;
                    this.installmentsLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error al cargar cuotas paginadas del crédito:', error);
                    this.installments = [];
                    this.installmentsTotal = 0;
                    this.installmentsLoading = false;
                    this._alertsService.showAlertMessage({
                        type: 'error',
                        text: 'Error al cargar las cuotas del crédito',
                        title: 'Error',
                    });
                    this._changeDetectorRef.markForCheck();
                },
            });
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
        this.filteredStores.next(this.stores.filter((store) => store.name.toLowerCase().indexOf(search) > -1));
    }

    back(): void {
        this._router.navigate(['/clients']);
    }

    updateClientData(): void {
        // Lógica para actualizar los datos del cliente
        this.loadClientDetails(this.clientDetails.id);
        this.reloadClientCredits();
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
            this.agents.filter(
                (agent) =>
                    agent.firstName.toLowerCase().indexOf(search) > -1 ||
                    agent.lastName.toLowerCase().indexOf(search) > -1 ||
                    agent.email.toLowerCase().indexOf(search) > -1
            )
        );
    }

    loadAgentsByStore(storeId: string): void {
        if (!this.hasPermission('agents:read:all:get:agents')) {
            return;
        }

        if (storeId === null || storeId === '') {
            this.editClientForm.get('agentId')?.disable({ emitEvent: false });
            return;
        }

        this._agentsService
            .getAgents({ storeId })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (agents) => {
                    // Manejar los agentes obtenidos
                    this.agents = agents.data;
                    this.filteredAgents.next(this.agents.slice());
                    this.editClientForm.get('agentId')?.enable({ emitEvent: false });
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error al cargar los agentes de la tienda:', error);
                },
            });
    }
}

// Componente de diálogo para previsualizar archivos
@Component({
    selector: 'app-preview-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
        <div mat-dialog-title class="flex bg-primary">
            <div class="mt-3 flex w-full items-center justify-between text-on-primary">
                <div class="flex items-center text-lg font-medium">
                    <mat-icon class="mr-2 text-current">{{ data.mimeType.includes('pdf') ? 'picture_as_pdf' : 'image' }}</mat-icon>
                    {{ data.title }}
                </div>
                <button mat-icon-button (click)="closeDialog()" [tabIndex]="-1">
                    <mat-icon class="text-current" [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
                </button>
            </div>
        </div>
        <mat-dialog-content class="flex min-h-[50vh] flex-col items-center justify-center p-4">
            <img
                *ngIf="data.mimeType.includes('image')"
                [src]="data.objectUrl"
                class="max-h-[70vh] max-w-full object-contain"
                alt="{{ data.title }}"
            />
            <iframe *ngIf="data.mimeType.includes('pdf')" [src]="safeUrl" width="100%" height="500" frameborder="0"></iframe>

            <!-- Mensaje para tipos de archivo no previsualizable -->
            <div *ngIf="!data.mimeType.includes('image') && !data.mimeType.includes('pdf')" class="py-8 text-center">
                <mat-icon class="text-6xl text-gray-400">insert_drive_file</mat-icon>
                <p class="mt-4 text-gray-600">Este tipo de archivo no se puede previsualizar</p>
                <p class="text-sm text-gray-500">{{ data.mimeType }}</p>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions class="justify-end border-t border-gray-200 bg-gray-50 px-4 py-3">
            <button mat-stroked-button color="accent" (click)="downloadFile()">
                <mat-icon class="mr-2">download</mat-icon>
                Descargar
            </button>
            <button mat-stroked-button class="bg-card ml-2" (click)="closeDialog()" [tabIndex]="-1">Cerrar</button>
        </mat-dialog-actions>
    `,
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
