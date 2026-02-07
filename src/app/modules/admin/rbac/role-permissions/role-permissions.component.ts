import { Component, OnInit, inject, OnDestroy } from '@angular/core';
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
import { forkJoin, of, switchMap, Subject, takeUntil } from 'rxjs';

import { PermissionService } from 'app/shared/services/permission.service';

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
export class RolePermissionsComponent implements OnInit, OnDestroy {
    roleId: string = '';
    role?: Role;
    permissionGroups: PermissionGroup = {};
    selectedPermissions: Set<string> = new Set();
    isLoading = false;
    roleForm: FormGroup;
    mode: 'create' | 'edit' = 'create';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    private _rbacService = inject(RbacService);
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _snackBar = inject(MatSnackBar);
    private _fb = inject(FormBuilder);
    private _permissionService = inject(PermissionService);

    constructor() {
        this.roleForm = this._fb.group({
            name: ['', [Validators.required]],
            displayName: ['', Validators.required],
            description: ['']
        });
    }

    ngOnInit(): void {
        this.roleId = this._route.snapshot.paramMap.get('id') || '';

        // Auto-generate snake_case name from displayName in create mode
        this.roleForm.get('displayName')?.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(value => {
                if (this.mode === 'create' && value) {
                    const snakeCaseName = this.toSnakeCase(value);
                    this.roleForm.get('name')?.setValue(snakeCaseName, { emitEvent: false });
                }
            });

        if (this.roleId === 'new') {
            if (!this.hasPermissionViaService('admin:create:all:post:admin.rbac.roles')) {
                this.goBack();
                return;
            }
            this.mode = 'create';
            this.loadPermissionsOnly();
        } else {
            if (!this.hasPermissionViaService('admin:read:all:get:admin.rbac.roles.roleId')) {
                this.goBack();
                return;
            }
            this.mode = 'edit';
            // In edit mode, name is fixed
            this.roleForm.get('name')?.disable();
            this.loadData();
        }
    }

    hasPermissionViaService(permission: string): boolean {
        return this._permissionService.hasPermission(permission);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toSnakeCase(str: string): string {
        return str
            .toLowerCase()
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '_') // Replace spaces with underscore
            .replace(/-+/g, '_'); // Replace hyphens with underscore
    }

    loadPermissionsOnly(): void {
        this.isLoading = true;
        this._rbacService.getPermissions().subscribe({
            next: (permissions) => {
                this.permissionGroups = permissions;

                // Transform permissionGroups to use moduleTag as key and sort by moduleTag
                const groupedByTag: PermissionGroup = {};
                const sortedModules = Object.keys(this.permissionGroups).sort((a, b) => {
                    // Get representative permissions for each module
                    const permA = this.permissionGroups[a][0];
                    const permB = this.permissionGroups[b][0];

                    // Use moduleTag if available, otherwise use module name
                    const tagA = permA?.moduleTag || a;
                    const tagB = permB?.moduleTag || b;

                    // Case insensitive comparison for proper sorting
                    return tagA.toLowerCase().localeCompare(tagB.toLowerCase());
                });

                // Rebuild the permission groups with moduleTag keys
                sortedModules.forEach(key => {
                    const perms = this.permissionGroups[key];
                    const representativePerm = perms[0];
                    const moduleTag = representativePerm?.moduleTag || key;

                    // If moduleTag exists and is different from key, use moduleTag as key
                    if (representativePerm?.moduleTag && representativePerm.moduleTag !== key) {
                        groupedByTag[representativePerm.moduleTag] = perms;
                    } else {
                        groupedByTag[key] = perms;
                    }
                });

                this.permissionGroups = groupedByTag;
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

                // Apply same transformation as in loadPermissionsOnly
                const groupedByTag: PermissionGroup = {};
                const sortedModules = Object.keys(this.permissionGroups).sort((a, b) => {
                    // Get representative permissions for each module
                    const permA = this.permissionGroups[a][0];
                    const permB = this.permissionGroups[b][0];

                    // Use moduleTag if available, otherwise use module name
                    const tagA = permA?.moduleTag || a;
                    const tagB = permB?.moduleTag || b;

                    // Case insensitive comparison for proper sorting
                    return tagA.toLowerCase().localeCompare(tagB.toLowerCase());
                });

                // Rebuild the permission groups with moduleTag keys
                sortedModules.forEach(key => {
                    const perms = this.permissionGroups[key];
                    const representativePerm = perms[0];
                    const moduleTag = representativePerm?.moduleTag || key;

                    // If moduleTag exists and is different from key, show both names
                    if (representativePerm?.moduleTag && representativePerm.moduleTag !== key) {
                        groupedByTag[representativePerm.moduleTag] = perms;
                    } else {
                        groupedByTag[key] = perms;
                    }
                });

                this.permissionGroups = groupedByTag;

                // Patch form
                this.roleForm.patchValue({
                    name: this.role.name,
                    displayName: this.role.displayName,
                    description: this.role.description
                });

                // Disable displayName if isSystem is true
                if (this.role.isSystem) {
                    this.roleForm.get('displayName')?.disable();
                }

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
                next: (newRole) => {
                    this._snackBar.open('Rol creado correctamente', 'Cerrar', { duration: 3000 });
                    this.roleId = newRole.id;
                    this.mode = 'edit';
                    this.role = newRole;
                    this.roleForm.get('name')?.disable();
                    this._router.navigate(['../', newRole.id], { relativeTo: this._route, replaceUrl: true });
                    this.isLoading = false;
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
