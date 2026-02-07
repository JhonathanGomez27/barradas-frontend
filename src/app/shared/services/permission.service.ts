import { Injectable, inject } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private _currentUser: User | null = null;
    private _userService = inject(UserService);

    constructor() {
        this._userService.user$.subscribe((user) => {
            this._currentUser = user;
        });
    }

    /**
     * Verifica si el usuario actual tiene un permiso específico
     * @param permission Código del permiso (ej. 'stats:read:all:get:stats.dashboard')
     * @returns true si tiene el permiso o es admin
     */
    hasPermission(permission: string): boolean {
        if (!this._currentUser) {
            return false;
        }

        // Admin siempre tiene acceso (Superusuario)
        if (this._currentUser.rol === 'admin') {
            return true;
        }

        if (!this._currentUser.permissions) {
            return false;
        }

        return this._currentUser.permissions.includes(permission);
    }

    /**
     * Verifica si el usuario tiene al menos uno de los permisos proporcionados
     * @param permissions Array de códigos de permiso
     */
    hasAnyPermission(permissions: string[]): boolean {
        if (!this._currentUser) {
            return false;
        }

        if (this._currentUser.rol === 'admin') {
            return true;
        }

        if (!this._currentUser.permissions) {
            return false;
        }

        return permissions.some(p => this._currentUser!.permissions!.includes(p));
    }

    /**
     * Verifica si el usuario tiene todos los permisos proporcionados
     * @param permissions Array de códigos de permiso
     */
    hasAllPermissions(permissions: string[]): boolean {
        if (!this._currentUser) {
            return false;
        }

        if (this._currentUser.rol === 'admin') {
            return true;
        }

        if (!this._currentUser.permissions) {
            return false;
        }

        return permissions.every(p => this._currentUser!.permissions!.includes(p));
    }
}
