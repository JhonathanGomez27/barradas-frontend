import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { RbacService } from '../rbac.service';
import { Role } from 'app/core/models/rbac.models';
import Swal from 'sweetalert2';

import { PermissionService } from 'app/shared/services/permission.service';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [
        CommonModule, 
        MatTableModule, 
        MatButtonModule, 
        MatIconModule, 
        MatChipsModule, 
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './roles-list.component.html'
})
export class RolesListComponent implements OnInit {
    roles: Role[] = [];
    displayedColumns: string[] = ['name', 'displayName', 'description', 'isSystem', 'actions'];
    
    private _rbacService = inject(RbacService);
    private _router = inject(Router);
    private _route = inject(ActivatedRoute);
    private _snackBar = inject(MatSnackBar);
    private _permissionService = inject(PermissionService);

    ngOnInit(): void {
        this.loadRoles();
    }

    hasPermission(permission: string): boolean {
        return this._permissionService.hasPermission(permission);
    }

    loadRoles(): void {
        this._rbacService.getRoles().subscribe(roles => {
            this.roles = roles;
        });
    }

    createRole(): void {
        this._router.navigate(['new'], { relativeTo: this._route });
    }

    editRole(role: Role): void {
        this._router.navigate([role.id], { relativeTo: this._route });
    }

    deleteRole(role: Role): void {
        if (role.isSystem) {
            return;
        }
        
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el rol "${role.displayName}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this._rbacService.deleteRole(role.id).subscribe({
                    next: () => {
                        this.loadRoles();
                        Swal.fire('Eliminado', 'El rol ha sido eliminado.', 'success');
                    },
                    error: (err) => {
                        console.error(err);
                        Swal.fire('Error', 'No se pudo eliminar el rol.', 'error');
                    }
                });
            }
        });
    }
}
