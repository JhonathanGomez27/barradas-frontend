import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-invite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './invite.component.html'
})
export class InviteComponent {
  inviteForm: FormGroup;
  contractFile: File | null = null;

  constructor(
    private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<InviteComponent>
  ) {
    this.inviteForm = this._formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]]
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    this.contractFile = file || null;
  }

  onSubmit(): void {
    if (this.inviteForm.valid) {
      const clientData = {
        ...this.inviteForm.value,
        contractFile: this.contractFile
      };
      this.dialogRef.close(clientData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
