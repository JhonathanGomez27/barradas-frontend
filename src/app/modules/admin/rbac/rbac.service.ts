import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { Observable } from 'rxjs';
import { 
    Role, PermissionGroup, CreateRoleRequest, 
    AssignPermissionsRequest, AssignRoleToUserRequest, 
    TogglePublicPermissionRequest, Permission 
} from 'app/core/models/rbac.models';

@Injectable({ providedIn: 'root' })
export class RbacService {
    private _httpClient = inject(HttpClient);
    private _url = `${environment.url}/admin/rbac`;

    // Roles
    getRoles(): Observable<Role[]> {
        return this._httpClient.get<Role[]>(`${this._url}/roles`);
    }

    getRole(id: string): Observable<Role> {
        return this._httpClient.get<Role>(`${this._url}/roles/${id}`);
    }

    createRole(data: CreateRoleRequest): Observable<Role> {
        return this._httpClient.post<Role>(`${this._url}/roles`, data);
    }

    updateRole(id: string, data: CreateRoleRequest): Observable<Role> {
        return this._httpClient.put<Role>(`${this._url}/roles/${id}`, data);
    }

    deleteRole(id: string): Observable<void> {
        return this._httpClient.delete<void>(`${this._url}/roles/${id}`);
    }

    assignPermissions(roleId: string, data: AssignPermissionsRequest): Observable<any> {
        return this._httpClient.put(`${this._url}/roles/${roleId}/permissions`, data);
    }

    // Permissions
    getPermissions(): Observable<PermissionGroup> {
        return this._httpClient.get<PermissionGroup>(`${this._url}/permissions`);
    }

    syncPermissions(): Observable<any> {
        return this._httpClient.post(`${this._url}/permissions/sync`, {});
    }

    togglePublicPermission(id: string, data: TogglePublicPermissionRequest): Observable<Permission> {
        return this._httpClient.patch<Permission>(`${this._url}/permissions/${id}/public`, data);
    }

    // Assignments
    assignRoleToAdmin(adminId: string, data: AssignRoleToUserRequest): Observable<any> {
        return this._httpClient.put(`${this._url}/admins/${adminId}/role`, data);
    }

    assignRoleToAgent(agentId: string, data: AssignRoleToUserRequest): Observable<any> {
        return this._httpClient.put(`${this._url}/agents/${agentId}/role`, data);
    }
}
