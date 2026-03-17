
## 1) `clients.interface.ts`

Reemplaza/ajusta estas partes:

```ts
// Agrega MISSED
export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'MISSED';

// DTO nuevo sin installmentId
export interface RegisterPaymentDto {
  creditId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  evidenceDocumentId: string; // ahora obligatorio
}

// Payment response nuevo
export interface PaymentResponse {
  id: string;
  creditId?: string;
  paymentScheduleEventId: string | null;
  amount: string;
  paidAt: string;
  method: PaymentMethod;
  reference?: string;
  appliedToPrincipal: string;
  appliedToLateFee: string;
  createdAt: string;
  updatedAt: string;
  document?: CreditDocument;
}

// opcional: para schedule proyectado
export interface CreditProjectedInstallment {
  date: string;
  amount: string;
  isLast: boolean;
}

export interface CreditProjectedScheduleResponse {
  creditId: string;
  remainingInstallments: number;
  installments: CreditProjectedInstallment[];
}

// diálogo de pago por crédito, no por cuota
export interface PaymentDialogData {
  clientId: string;
  credit: Credit;
}
```

---

## 2) `clients.service.ts`

Agrega y cambia métodos:

```ts
import { CreditProjectedScheduleResponse } from './clients.interface';

// ...

getCreditSchedule(creditId: string): Observable<CreditProjectedScheduleResponse> {
  return this.httpClient.get<CreditProjectedScheduleResponse>(`${this._url}/credits/${creditId}/schedule`);
}

// cambia endpoint viejo
getInstallmentPayments(paymentScheduleEventId: string): Observable<PaymentResponse[]> {
  return this.httpClient.get<PaymentResponse[]>(`${this._url}/payments/schedule-event/${paymentScheduleEventId}`);
}
```

> `registerPayment(...)` ya queda bien con el DTO nuevo, solo asegúrate de no enviar `installmentId`.

---

## 3) `register-payment-dialog.component.ts`

### Cambios clave:
- Quitar dependencia de `installment`.
- Evidencia obligatoria.
- Quitar `Validators.max(pendingAmount)`.
- No enviar `installmentId`.

### Reemplaza constructor + `onSubmit()` + encabezado:

```ts
// Título (template)
<h2 class="text-lg font-semibold">Registrar Pago de Crédito</h2>
```

```ts
constructor(
  private fb: FormBuilder,
  public dialogRef: MatDialogRef<RegisterPaymentDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
  private _clientsService: ClientsService,
  private _alertsService: AlertsService
) {
  this.paymentForm = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    method: ['CASH', Validators.required],
    reference: [''],
    paidAt: [new Date(), Validators.required],
  });
}
```

```ts
onSubmit(): void {
  if (this.paymentForm.invalid || this.isSubmitting) return;

  if (!this.evidenceFile) {
    this._alertsService.showAlertMessage({
      title: 'Evidencia requerida',
      text: 'Debes subir comprobante de pago.',
      type: 'error',
    });
    return;
  }

  this.isSubmitting = true;
  const formValue = this.paymentForm.value;

  this._clientsService
    .uploadFileToClient(this.data.clientId, this.evidenceFile, 'PAYMENT_EVIDENCE', this.data.credit.id)
    .pipe(
      switchMap((uploadResponse: any) => {
        const payload: RegisterPaymentDto = {
          creditId: this.data.credit.id,
          amount: this.parseMoney(formValue.amount),
          method: formValue.method,
          reference: formValue.reference?.trim() || undefined,
          paidAt: new Date(formValue.paidAt).toISOString(),
          evidenceDocumentId: uploadResponse.id,
        };
        return this._clientsService.registerPayment(payload);
      })
    )
    .subscribe({
      next: () => {
        this._alertsService.showAlertMessage({ title: 'Éxito', text: 'Pago registrado exitosamente', type: 'success' });
        this.dialogRef.close(true);
      },
      error: () => {
        this._alertsService.showAlertMessage({ title: 'Error', text: 'Error al registrar el pago', type: 'error' });
        this.isSubmitting = false;
      },
    });
}
```

> También elimina del template toda la tarjeta de “Monto esperado / Saldo pendiente”, porque ya no aplica por cuota.

---

## 4) `client-details.component.ts`

### A) mapper de estados
```ts
statusMapperInstallment: { [key: string]: string } = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  MISSED: 'No pagado',
};
```

### B) abrir pago por crédito (sin cuota)
```ts
openPaymentDialog(credit: Credit): void {
  const dialogRef = this.dialog.open(RegisterPaymentDialogComponent, {
    width: '600px',
    maxWidth: '95vw',
    data: {
      clientId: this.clientDetails.id,
      credit,
    },
  });

  dialogRef.afterClosed().pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
    if (result) this.reloadClientCredits();
  });
}
```

---

## 5) `client-details.component.html`

### A) En la tabla de eventos, agrega filtro MISSED
```html
<mat-option value="MISSED">No pagado</mat-option>
```

### B) botón registrar pago (ya no depende de `inst`)
Reemplaza:
```html
(click)="$event.stopPropagation(); openPaymentDialog(credit, inst)"
```
por:
```html
(click)="$event.stopPropagation(); openPaymentDialog(credit)"
```

### C) etiqueta visual (opcional recomendado)
- Cambia título `Cuotas` por `Eventos de pago`.
- Cambia texto de vacío `No hay cuotas...` por `No hay eventos...`.

---

## 6) Bonus recomendado (UI)
En resumen del crédito muestra:
- `remainingInstallments`
- `lastInstallmentAmount`
- y en una sección “Próximos pagos” consume `getCreditSchedule(credit.id)`.

---

Actualizacion de register-payment-dialog.component.ts:

```ts
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AlertsService } from 'app/shared/services/alerts.service';
import { switchMap } from 'rxjs';
import { PaymentDialogData, PaymentMethod, RegisterPaymentDto } from '../../clients.interface';
import { ClientsService } from '../../clients.service';

@Component({
  selector: 'app-register-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
  ],
  template: `
    <div mat-dialog-title class="flex bg-gradient-to-r from-barradas-900 to-barradas-700 shadow-lg">
      <div class="flex w-full items-center justify-between px-4 py-3 text-white">
        <div class="flex items-center">
          <div class="mr-3 rounded-full bg-white/20 p-2">
            <mat-icon class="text-white">payments</mat-icon>
          </div>
          <h2 class="text-lg font-semibold">Registrar Pago de Crédito</h2>
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
            <span class="font-medium">Crédito:</span>
            <span class="ml-1">{{ data.credit.id }}</span>
          </div>
          <div>
            <span class="font-medium">Saldo actual:</span>
            <span class="ml-1">{{ formatCurrency(data.credit.outstandingPrincipal || 0) }}</span>
          </div>
        </div>
      </div>

      <form [formGroup]="paymentForm" class="space-y-4" autocomplete="off">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label>Monto a pagar</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="0.00" min="0.01" step="0.01" />
            <mat-icon matPrefix class="text-gray-400">attach_money</mat-icon>
            <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">El monto es requerido</mat-error>
            <mat-error *ngIf="paymentForm.get('amount')?.hasError('min')">El monto debe ser mayor a 0</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label>Método de pago</mat-label>
            <mat-select formControlName="method">
              <mat-option *ngFor="let method of paymentMethods" [value]="method.value">
                {{ method.label }}
              </mat-option>
            </mat-select>
            <mat-icon matPrefix class="text-gray-400">credit_card</mat-icon>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label>Referencia / Nota</mat-label>
            <input matInput formControlName="reference" placeholder="Ej. Transferencia #1234" />
            <mat-icon matPrefix class="text-gray-400">description</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label>Fecha de pago</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="paidAt" placeholder="DD/MM/AAAA" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="paymentForm.get('paidAt')?.hasError('required')">La fecha es requerida</mat-error>
          </mat-form-field>
        </div>

        <div class="mt-2">
          <label class="mb-2 block text-sm font-medium text-gray-700">
            Comprobante de Pago <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center">
            <input
              type="file"
              (change)="onFileSelected($event)"
              class="hover:file:bg-barradas-100 block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-barradas-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-barradas-700"
              accept="image/*,.pdf"
            />
          </div>
          <div *ngIf="evidenceFile" class="mt-2 flex items-center text-sm text-green-600">
            <mat-icon class="mr-1 icon-size-4">check_circle</mat-icon>
            Archivo seleccionado: {{ evidenceFile.name }}
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="justify-end border-t bg-barradas-50 px-4 py-3">
      <button mat-stroked-button (click)="onCancel()" class="mr-2" [disabled]="isSubmitting">Cancelar</button>
      <button
        mat-raised-button
        class="bg-barradas-900 text-white"
        [disabled]="paymentForm.invalid || isSubmitting"
        (click)="onSubmit()"
      >
        <mat-icon *ngIf="!isSubmitting" class="mr-1">save</mat-icon>
        <mat-progress-spinner *ngIf="isSubmitting" mode="indeterminate" diameter="20" class="mr-2"></mat-progress-spinner>
        {{ isSubmitting ? 'Registrando...' : 'Registrar Pago' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class RegisterPaymentDialogComponent {
  paymentForm: FormGroup;
  isSubmitting = false;
  evidenceFile: File | null = null;

  readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'TRANSFER', label: 'Transferencia' },
    { value: 'CARD', label: 'Tarjeta' },
    { value: 'OTHER', label: 'Otro' },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RegisterPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private _clientsService: ClientsService,
    private _alertsService: AlertsService,
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      method: ['CASH', Validators.required],
      reference: [''],
      paidAt: [new Date(), Validators.required],
    });
  }

  parseMoney(value: string | number): number {
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.evidenceFile = input.files[0];
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || this.isSubmitting) {
      return;
    }

    if (!this.evidenceFile) {
      this._alertsService.showAlertMessage({
        title: 'Evidencia requerida',
        text: 'Debes subir comprobante de pago.',
        type: 'error',
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.paymentForm.value;

    this._clientsService
      .uploadFileToClient(this.data.clientId, this.evidenceFile, 'PAYMENT_EVIDENCE', this.data.credit.id)
      .pipe(
        switchMap((uploadResponse: any) => {
          const payload: RegisterPaymentDto = {
            creditId: this.data.credit.id,
            amount: this.parseMoney(formValue.amount),
            method: formValue.method,
            reference: formValue.reference?.trim() || undefined,
            paidAt: new Date(formValue.paidAt).toISOString(),
            evidenceDocumentId: uploadResponse.id,
          };

          return this._clientsService.registerPayment(payload);
        }),
      )
      .subscribe({
        next: () => {
          this._alertsService.showAlertMessage({
            title: 'Éxito',
            text: 'Pago registrado exitosamente',
            type: 'success',
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error registering payment:', err);
          this._alertsService.showAlertMessage({
            title: 'Error',
            text: 'Error al registrar el pago',
            type: 'error',
          });
          this.isSubmitting = false;
        },
      });
  }
}
```

Y no olvides este ajuste en `client-details.component.ts`:

```ts
openPaymentDialog(credit: Credit): void { ... }
```

y en el HTML cambiar el click a:

```html
(click)="$event.stopPropagation(); openPaymentDialog(credit)"
```
