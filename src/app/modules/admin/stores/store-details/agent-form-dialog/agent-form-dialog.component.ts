import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Agent } from '../../agents.service';
import { RbacService } from 'app/modules/admin/rbac/rbac.service';
import { Role } from 'app/core/models/rbac.models';
import { PermissionService } from 'app/shared/services/permission.service';

export interface AgentDialogData {
    agent: Agent | null;
    storeId: string;
}

@Component({
    selector: 'app-agent-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule
    ],
    template: `
    <div mat-dialog-title class="flex bg-gradient-to-r from-barradas-900 to-barradas-700 shadow-lg">
      <div class="flex items-center justify-between w-full text-white py-3 px-4">
        <div class="flex items-center">
          <div class="bg-white/20 p-2 rounded-full mr-3">
            <mat-icon class="text-white">{{ data.agent ? 'edit' : 'person_add' }}</mat-icon>
          </div>
          <h2 class="text-lg font-semibold">{{ data.agent ? 'Editar Agente' : 'Nuevo Agente' }}</h2>
        </div>
        <button mat-icon-button (click)="onCancel()" class="hover:bg-white/20">
          <mat-icon class="text-white">close</mat-icon>
        </button>
      </div>
    </div>

    <mat-dialog-content class="py-6 px-4">
      <form [formGroup]="agentForm" class="space-y-4" autocomplete="off">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Nombre -->
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="firstName" placeholder="Ej. Juan">
            <mat-icon matPrefix class="text-gray-400">person</mat-icon>
            <mat-error *ngIf="agentForm.get('firstName')?.hasError('required')">
              El nombre es requerido
            </mat-error>
            <mat-error *ngIf="agentForm.get('firstName')?.hasError('minlength')">
              Debe tener al menos 2 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Apellido -->
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="lastName" placeholder="Ej. Pérez">
            <mat-icon matPrefix class="text-gray-400">person_outline</mat-icon>
            <mat-error *ngIf="agentForm.get('lastName')?.hasError('required')">
              El apellido es requerido
            </mat-error>
            <mat-error *ngIf="agentForm.get('lastName')?.hasError('minlength')">
              Debe tener al menos 2 caracteres
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Email -->
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
          <mat-label>Correo Electrónico</mat-label>
          <input matInput formControlName="email" type="email" placeholder="ejemplo@correo.com">
          <mat-icon matPrefix class="text-gray-400">email</mat-icon>
          <mat-error *ngIf="agentForm.get('email')?.hasError('required')">
            El correo es requerido
          </mat-error>
          <mat-error *ngIf="agentForm.get('email')?.hasError('email')">
            Ingrese un correo válido
          </mat-error>
        </mat-form-field>

        <!-- Teléfono -->
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" placeholder="3331234567" autocomplete="off">
          <mat-icon matPrefix class="text-gray-400">phone</mat-icon>
          <mat-error *ngIf="agentForm.get('phone')?.hasError('required')">
            El teléfono es requerido
          </mat-error>
          <mat-error *ngIf="agentForm.get('phone')?.hasError('pattern')">
            Ingrese un teléfono válido (10 dígitos)
          </mat-error>
        </mat-form-field>

        <!-- Rol -->
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="roleId" placeholder="Seleccionar rol">
            <mat-option [value]="null">
              <span class="flex items-center">
                <mat-icon class="mr-2 text-gray-400 scale-75">remove_circle_outline</mat-icon>
                Sin rol asignado
              </span>
            </mat-option>
            <mat-option *ngFor="let role of roles" [value]="role.id">
              <span class="flex items-center">
                <!-- <mat-icon class="mr-2 text-barradas-500 scale-75"></mat-icon> -->
                {{ role.displayName }}
              </span>
            </mat-option>
          </mat-select>
          <mat-icon matPrefix class="text-gray-400">admin_panel_settings</mat-icon>
          <mat-hint>Asigna un rol para definir los permisos del agente</mat-hint>
        </mat-form-field>

        <!-- Contraseña -->
        <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
          <mat-label>{{ data.agent ? 'Nueva Contraseña (opcional)' : 'Contraseña' }}</mat-label>
          <input matInput formControlName="password" type="password" placeholder="••••••••" autocomplete="new-password" #passwordField>
          <mat-icon matPrefix class="text-gray-400">lock</mat-icon>
          <button mat-icon-button type="button" (click)="
                passwordField.type === 'password'
                    ? (passwordField.type = 'text')
                    : (passwordField.type = 'password')
            " matSuffix>
            @if (passwordField.type === 'password') {
            <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:eye'"></mat-icon>
            }
            @if (passwordField.type === 'text') {
            <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:eye-slash'"></mat-icon>
            }
        </button>
          <mat-error *ngIf="agentForm.get('password')?.hasError('required')">
            La contraseña es requerida
          </mat-error>
          <mat-error *ngIf="agentForm.get('password')?.hasError('minlength')">
            Debe tener al menos 6 caracteres
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="justify-end py-3 px-4 bg-barradas-50 border-t">
      <button mat-stroked-button (click)="onCancel()" class="mr-2">
        Cancelar
      </button>
      <button mat-raised-button class="bg-barradas-900 text-white"
              [disabled]="agentForm.invalid || isLoading"
              (click)="onSubmit()">
        <mat-icon class="mr-1">{{ data.agent ? 'save' : 'add' }}</mat-icon>
        {{ data.agent ? 'Actualizar' : 'Crear Agente' }}
      </button>
    </mat-dialog-actions>
  `
})
export class AgentFormDialogComponent implements OnInit {
    agentForm: FormGroup;
    roles: Role[] = [];
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AgentFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AgentDialogData,
        private _rbacService: RbacService,
        private _permissionService: PermissionService
    ) {
        this.agentForm = this.fb.group({
            firstName: [data.agent?.firstName || '', [Validators.required, Validators.minLength(2)]],
            lastName: [data.agent?.lastName || '', [Validators.required, Validators.minLength(2)]],
            email: [data.agent?.email || '', [Validators.required, Validators.email]],
            phone: [data.agent?.phone || '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
            roleId: [data.agent?.roleId || null],
            password: [
                '',
                data.agent ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]
            ]
        });
    }

    ngOnInit(): void {
        // Solo cargar roles si tiene permiso
        if (this._permissionService.hasPermission('admin:read:all:get:admin.rbac.roles')) {
            this.loadRoles();
        }
    }

    loadRoles(): void {
        this.isLoading = true;
        this._rbacService.getRoles().subscribe({
            next: (roles) => {
                this.roles = roles;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading roles:', err);
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.agentForm.valid) {
            const formValue = this.agentForm.value;

            // Si es edición y no se cambió la contraseña, no la enviamos
            if (this.data.agent && !formValue.password) {
                delete formValue.password;
            }

            // Si roleId es null o vacío, no lo enviamos
            if (!formValue.roleId) {
                delete formValue.roleId;
            }

            this.dialogRef.close({
                ...formValue,
                storeId: this.data.storeId
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
