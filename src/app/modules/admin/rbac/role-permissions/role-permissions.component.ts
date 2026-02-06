import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RbacService } from '../rbac.service';
import { Permission, PermissionGroup, Role } from 'app/core/models/rbac.models';
import { forkJoin, of, switchMap } from 'rxjs';

@Component({
    selector: 'app-role-permissions',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule
    ],
    templateUrl: './role-permissions.component.html'
})
export class RolePermissionsComponent implements OnInit {
    roleId: string = '';
    role?: Role;
    permissionGroups: PermissionGroup = {};
    selectedPermissions: Set<string> = new Set();
    isLoading = false;
    roleForm: FormGroup;
    mode: 'create' | 'edit' = 'create';

    private _rbacService = inject(RbacService);
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _snackBar = inject(MatSnackBar);
    private _fb = inject(FormBuilder);

    constructor() {
        this.roleForm = this._fb.group({
            name: ['', [Validators.required, Validators.pattern('^[a-z0-9_]+$')]],
            displayName: ['', Validators.required],
            description: ['']
        });
    }

    ngOnInit(): void {
        this.roleId = this._route.snapshot.paramMap.get('id') || '';

        if (this.roleId === 'new') {
            this.mode = 'create';
            this.loadPermissionsOnly();
        } else {
            this.mode = 'edit';
            this.roleForm.get('name')?.disable();
            this.loadData();
        }
    }

    loadPermissionsOnly(): void {
        this.isLoading = true;
        this._rbacService.getPermissions().subscribe({
            next: (permissions) => {
                this.permissionGroups = permissions;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    loadData(): void {
        this.isLoading = true;
        forkJoin({
            role: this._rbacService.getRole(this.roleId),
            permissions: this._rbacService.getPermissions()
        }).subscribe({
            next: (result) => {
                this.role = result.role;
                this.permissionGroups = result.permissions;

                // Patch form
                this.roleForm.patchValue({
                    name: this.role.name,
                    displayName: this.role.displayName,
                    description: this.role.description
                });

                // Initialize selected permissions from role
                this.selectedPermissions.clear();
                if (result.role.permissions) {
                    result.role.permissions.forEach(p => {
                        this.selectedPermissions.add(p.permission.id);
                    });
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this._snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
            }
        });
    }

    hasPermission(permissionId: string): boolean {
        return this.selectedPermissions.has(permissionId);
    }

    togglePermission(permissionId: string): void {
        if (this.selectedPermissions.has(permissionId)) {
            this.selectedPermissions.delete(permissionId);
        } else {
            this.selectedPermissions.add(permissionId);
        }
    }

    save(): void {
        if (this.roleForm.invalid) {
            return;
        }

        this.isLoading = true;
        const formData = this.roleForm.getRawValue();
        const permissionIds = Array.from(this.selectedPermissions);

        if (this.mode === 'create') {
            this._rbacService.createRole(formData).pipe(
                switchMap((newRole) => {
                    return this._rbacService.assignPermissions(newRole.id, { permissionIds });
                })
            ).subscribe({
                next: () => {
                    this._snackBar.open('Rol creado correctamente', 'Cerrar', { duration: 3000 });
                    this.goBack();
                },
                error: (err) => {
                    console.error(err);
                    this._snackBar.open('Error al crear rol', 'Cerrar', { duration: 3000 });
                    this.isLoading = false;
                }
            });
        } else {
            // Edit mode
            forkJoin([
                this._rbacService.updateRole(this.roleId, formData),
                this._rbacService.assignPermissions(this.roleId, { permissionIds })
            ]).subscribe({
                next: () => {
                    this._snackBar.open('Rol actualizado correctamente', 'Cerrar', { duration: 3000 });
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error(err);
                    this._snackBar.open('Error al actualizar rol', 'Cerrar', { duration: 3000 });
                    this.isLoading = false;
                }
            });
        }
    }

    goBack(): void {
        this._router.navigate(['/rbac/roles']);
    }
}
