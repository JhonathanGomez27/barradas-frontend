import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store, City } from '../stores.service';

export interface StoreDialogData {
  store: Store | null;
  cities: City[];
}

@Component({
  selector: 'app-store-form-dialog',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './store-form-dialog.component.html'
})
export class StoreFormDialogComponent implements OnInit {
  storeForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StoreFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreDialogData
  ) {
    this.storeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: [''],
      cityId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.store) {
      this.storeForm.patchValue({
        name: this.data.store.name,
        address: this.data.store.address,
        cityId: this.data.store.cityId
      });
    }
  }

  onSubmit(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.storeForm.value);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get isEditing(): boolean {
    return !!this.data.store;
  }
}
