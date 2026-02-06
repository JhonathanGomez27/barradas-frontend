export interface Permission {
    id: string;
    code: string;       // Ej: "users:read:all:get:/users"
    module: string;     // Ej: "users", "stores", "agents"
    action: string;     // Ej: "read", "create", "update"
    scope: 'OWN' | 'STORE' | 'ALL';
    route: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    isPublic: boolean;
    isSystem: boolean;
}

export interface PermissionGroup {
    [moduleName: string]: Permission[];
}

export interface Role {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    permissions?: { permission: Permission }[];
}

export interface CreateRoleRequest {
    name: string;
    displayName: string;
    description?: string;
}

export interface AssignPermissionsRequest {
    permissionIds: string[];
}

export interface AssignRoleToUserRequest {
    roleId: string;
}

export interface TogglePublicPermissionRequest {
    isPublic: boolean;
}
