import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertsService } from 'app/shared/services/alerts.service';
import { InstallmentPaymentsDialogData, PaymentResponse } from '../../clients.interface';
import { ClientsService } from '../../clients.service';

@Component({
    selector: 'app-installment-payments-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
    template: `
        <div mat-dialog-title class="flex bg-gradient-to-r from-barradas-900 to-barradas-700 shadow-lg">
            <div class="flex w-full items-center justify-between px-4 py-3 text-white">
                <div class="flex items-center">
                    <div class="mr-3 rounded-full bg-white/20 p-2">
                        <mat-icon class="text-white">receipt_long</mat-icon>
                    </div>
                    <h2 class="text-lg font-semibold">Pagos de cuota #{{ data.installment.number }}</h2>
                </div>
                <button mat-icon-button (click)="dialogRef.close()" class="hover:bg-white/20">
                    <mat-icon class="text-white">close</mat-icon>
                </button>
            </div>
        </div>

        <mat-dialog-content class="px-4 py-6">
            <div class="mb-4 rounded-lg border border-barradas-300 bg-barradas-50 p-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Monto esperado</div>
                        <div class="text-lg font-bold text-gray-800">{{ formatCurrency(data.installment.expectedAmount) }}</div>
                    </div>
                    <div>
                        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Pagado</div>
                        <div class="text-lg font-bold text-green-600">{{ formatCurrency(data.installment.paidAmount) }}</div>
                    </div>
                    <div>
                        <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</div>
                        <div class="text-barradas-800 text-sm font-bold">{{ data.installment.status }}</div>
                    </div>
                </div>
            </div>

            <div *ngIf="isLoading" class="flex items-center justify-center py-10">
                <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
            </div>

            <div *ngIf="!isLoading && payments.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                <mat-icon class="text-4xl text-gray-400">info</mat-icon>
                <p class="mt-2 text-sm text-gray-600">No hay pagos registrados para esta cuota.</p>
            </div>

            <div *ngIf="!isLoading && payments.length > 0" class="space-y-3">
                <div *ngFor="let payment of payments" class="border-barradas-100 rounded-lg border bg-white p-4">
                    <div class="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <p class="text-sm font-semibold text-gray-800">{{ formatCurrency(payment.amount) }}</p>
                            <p class="text-xs text-gray-500">{{ payment.paidAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <span class="rounded-full bg-barradas-50 px-2 py-1 text-xs font-medium text-barradas-700">{{ payment.method }}</span>
                    </div>

                    <div class="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                        <p>
                            Referencia: <span class="font-medium">{{ payment.reference || 'Sin referencia' }}</span>
                        </p>
                        <p>
                            Aplicado a capital: <span class="font-medium">{{ formatCurrency(payment.appliedToPrincipal) }}</span>
                        </p>
                        <p>
                            Aplicado a mora: <span class="font-medium">{{ formatCurrency(payment.appliedToLateFee) }}</span>
                        </p>
                        <p>
                            Registrado: <span class="font-medium">{{ payment.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                        </p>
                    </div>

                    <div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3" *ngIf="payment.document">
                        <div class="mb-2 flex items-center justify-between">
                            <div class="min-w-0">
                                <p class="truncate text-xs font-semibold text-gray-700">
                                    Evidencia: {{ payment.document.title || payment.document.originalName }}
                                </p>
                                <p class="text-xs text-gray-500">{{ payment.document.mimeType }} · {{ formatSize(payment.document.sizeBytes) }}</p>
                            </div>
                            <div class="ml-2 flex gap-1">
                                <button
                                    mat-icon-button
                                    class="text-barradas-600 hover:bg-barradas-50"
                                    (click)="previewEvidence(payment.document.id)"
                                    matTooltip="Ver evidencia"
                                >
                                    <mat-icon style="font-size: 20px">visibility</mat-icon>
                                </button>
                                <button
                                    mat-icon-button
                                    class="text-barradas-600 hover:bg-barradas-50"
                                    (click)="
                                        downloadEvidence(payment.document.id, payment.document.title || payment.document.originalName || 'evidencia')
                                    "
                                    matTooltip="Descargar evidencia"
                                >
                                    <mat-icon style="font-size: 20px">download</mat-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </mat-dialog-content>

        <mat-dialog-actions class="justify-end border-t bg-barradas-50 px-4 py-3">
            <button mat-stroked-button (click)="dialogRef.close()">Cerrar</button>
        </mat-dialog-actions>
    `,
})
export class InstallmentPaymentsDialogComponent implements OnInit {
    isLoading = false;
    payments: PaymentResponse[] = [];

    constructor(
        public dialogRef: MatDialogRef<InstallmentPaymentsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: InstallmentPaymentsDialogData,
        private _clientsService: ClientsService,
        private _alertsService: AlertsService
    ) {}

    ngOnInit(): void {
        this.loadPayments();
    }

    loadPayments(): void {
        this.isLoading = true;
        this._clientsService.getInstallmentPayments(this.data.installment.id).subscribe({
            next: (response) => {
                this.payments = response || [];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar pagos por cuota:', error);
                this.payments = [];
                this.isLoading = false;
                this._alertsService.showAlertMessage({
                    type: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los pagos de la cuota',
                });
            },
        });
    }

    previewEvidence(documentId: string): void {
        this._clientsService.getFileUrlClient(documentId).subscribe({
            next: ({ blob, mimeType }) => {
                const objectUrl = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
                window.open(objectUrl, '_blank');
                setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
            },
            error: (error) => {
                console.error('Error al visualizar evidencia:', error);
                this._alertsService.showAlertMessage({
                    type: 'error',
                    title: 'Error',
                    text: 'No se pudo abrir la evidencia',
                });
            },
        });
    }

    downloadEvidence(documentId: string, title: string): void {
        this._clientsService.getFileClient(documentId, title);
    }

    formatCurrency(value: string | number): string {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number.isFinite(numValue) ? numValue : 0);
    }

    formatSize(sizeBytes?: string): string {
        const bytes = Number(sizeBytes || 0);
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return '0 B';
        }
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
