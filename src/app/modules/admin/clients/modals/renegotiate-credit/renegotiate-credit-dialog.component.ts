import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertsService } from 'app/shared/services/alerts.service';
import { RenegotiateCreditDto } from '../../clients.interface';
import { ClientsService } from '../../clients.service';

interface RenegotiateCreditDialogData {
    creditId: string;
    currentTotalAmount: string | number;
    currentOutstandingPrincipal: string | number;
    suggestedMinimumTotal: number | null;
}

@Component({
    selector: 'app-renegotiate-credit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <div mat-dialog-title class="flex bg-gradient-to-r from-barradas-900 to-barradas-700 shadow-lg">
            <div class="flex w-full items-center justify-between px-4 py-3 text-white">
                <div class="flex items-center">
                    <div class="mr-3 rounded-full bg-white/20 p-2">
                        <mat-icon class="text-white">sync_alt</mat-icon>
                    </div>
                    <h2 class="text-lg font-semibold">Renegociar credito</h2>
                </div>
                <button mat-icon-button (click)="onCancel()" class="hover:bg-white/20" [disabled]="isSubmitting">
                    <mat-icon class="text-white">close</mat-icon>
                </button>
            </div>
        </div>

        <mat-dialog-content class="px-4 py-6">
            <div class="mb-4 rounded-lg border border-barradas-300 bg-barradas-50 p-4">
                <div class="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <div>
                        <span class="font-medium">Total actual:</span>
                        <span class="ml-1">{{ formatCurrency(data.currentTotalAmount) }}</span>
                    </div>
                    <div>
                        <span class="font-medium">Saldo actual:</span>
                        <span class="ml-1">{{ formatCurrency(data.currentOutstandingPrincipal) }}</span>
                    </div>
                </div>
                <p *ngIf="data.suggestedMinimumTotal !== null" class="mt-3 text-xs text-gray-600">
                    Monto minimo sugerido: <strong>{{ formatCurrency(data.suggestedMinimumTotal) }}</strong>
                </p>
            </div>

            <form [formGroup]="renegotiateForm" class="space-y-4" autocomplete="off">
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                    <mat-label>Nuevo total del credito</mat-label>
                    <input matInput type="number" formControlName="newTotalAmount" placeholder="0.00" min="0.01" step="0.01" />
                    <mat-icon matPrefix class="text-gray-400">attach_money</mat-icon>
                    <mat-error *ngIf="renegotiateForm.get('newTotalAmount')?.hasError('required')">El monto es requerido</mat-error>
                    <mat-error *ngIf="renegotiateForm.get('newTotalAmount')?.hasError('min')">El monto debe ser mayor a 0</mat-error>
                    <mat-error *ngIf="renegotiateForm.get('newTotalAmount')?.hasError('pattern')">
                        Usa maximo 2 decimales
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                    <mat-label>Motivo de renegociacion</mat-label>
                    <textarea matInput formControlName="reason" rows="4" maxlength="500" placeholder="Describe el motivo"></textarea>
                    <mat-hint align="end">{{ renegotiateForm.get('reason')?.value?.length || 0 }}/500</mat-hint>
                    <mat-error *ngIf="renegotiateForm.get('reason')?.hasError('required')">El motivo es requerido</mat-error>
                    <mat-error *ngIf="renegotiateForm.get('reason')?.hasError('maxlength')">Maximo 500 caracteres</mat-error>
                </mat-form-field>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions class="justify-end border-t bg-barradas-50 px-4 py-3">
            <button mat-stroked-button (click)="onCancel()" class="mr-2" [disabled]="isSubmitting">Cancelar</button>
            <button mat-raised-button class="bg-barradas-900 text-white" [disabled]="renegotiateForm.invalid || isSubmitting" (click)="onSubmit()">
                <mat-icon *ngIf="!isSubmitting" class="mr-1">save</mat-icon>
                <mat-progress-spinner *ngIf="isSubmitting" mode="indeterminate" diameter="20" class="mr-2"></mat-progress-spinner>
                {{ isSubmitting ? 'Renegociando...' : 'Guardar renegociacion' }}
            </button>
        </mat-dialog-actions>
    `,
})
export class RenegotiateCreditDialogComponent {
    readonly data = inject<RenegotiateCreditDialogData>(MAT_DIALOG_DATA);
    renegotiateForm: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<RenegotiateCreditDialogComponent>,
        private _clientsService: ClientsService,
        private _alertsService: AlertsService,
    ) {
        this.renegotiateForm = this.fb.group({
            newTotalAmount: [null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
            reason: ['', [Validators.required, Validators.maxLength(500)]],
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    private parseMoney(value: string | number): number {
        const numericValue = typeof value === 'string' ? Number(value) : value;
        if (!Number.isFinite(numericValue)) {
            return 0;
        }
        return Math.round((numericValue + Number.EPSILON) * 100) / 100;
    }

    formatCurrency(value: string | number): string {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const safeValue = Number.isFinite(numValue) ? numValue : 0;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(safeValue);
    }

    private getErrorMessage(err: any): string {
        const message = err?.error?.message || '';

        if (message === 'Cannot renegotiate cancelled or closed credits') {
            return 'No se puede renegociar un credito cancelado o pagado.';
        }

        if (message === 'newTotalAmount cannot be lower than initial payment plus paid principal') {
            return 'El nuevo total no puede ser menor al pago inicial mas el capital ya abonado.';
        }

        if (message === 'Credit not found') {
            return 'No se encontro el credito.';
        }

        return 'No se pudo completar la renegociacion del credito.';
    }

    onSubmit(): void {
        if (this.renegotiateForm.invalid || this.isSubmitting) {
            return;
        }

        const formValue = this.renegotiateForm.value;
        const payload: RenegotiateCreditDto = {
            newTotalAmount: this.parseMoney(formValue.newTotalAmount),
            reason: String(formValue.reason || '').trim(),
        };

        this.isSubmitting = true;

        this._clientsService.renegotiateCredit(this.data.creditId, payload).subscribe({
            next: () => {
                this._alertsService.showAlertMessage({
                    title: 'Exito',
                    text: 'Credito renegociado exitosamente',
                    type: 'success',
                });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this._alertsService.showAlertMessage({
                    title: 'Error',
                    text: this.getErrorMessage(err),
                    type: 'error',
                });
                this.isSubmitting = false;
            },
        });
    }
}
