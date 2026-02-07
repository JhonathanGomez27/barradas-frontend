# Especificación de Implementación Frontend - Módulo RBAC

## 1. Flujo de Autenticación y Autorización

El sistema utiliza **RBAC (Role-Based Access Control)** basado en JWT.
- Los permisos **NO** se consultan al backend en cada navegación.
- Los permisos viajan dentro del `accessToken` (JWT).
- El frontend debe decodificar el token y almacenar los permisos en un `AuthService` o `Store`.

### Estructura del JWT Payload
Al hacer login o refresh, el token contiene:

```typescript
interface JwtPayload {
  sub: string;            // User ID
  email: string;
  role: 'admin' | 'agent';
  roleId?: string;        // ID del Rol asignado
  permissions: string[];  // Array de strings: "module:action:scope:method:route"
  // ... exp, iat
}
```

---

## 2. Interfaces (Modelos TypeScript)

Crea un archivo `src/app/core/models/rbac.models.ts`:

```typescript
// Modelo de Permiso (Backend: Permission)
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

// Agrupación de permisos por módulo (para la UI de asignación)
export interface PermissionGroup {
  [moduleName: string]: Permission[];
}

// Modelo de Rol (Backend: Role)
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean; // Si es true, no permitir editar nombre ni borrar
  createdAt: string;
  updatedAt: string;
  permissions?: { permission: Permission }[]; // Vienen anidados desde Prisma
}

// DTOs para Formularios
export interface CreateRoleRequest {
  name: string;        // snake_case recomendado
  displayName: string; // Nombre legible
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
```

---

## 3. Endpoints API

Base URL: `${environment.apiUrl}/admin/rbac`
Header requerido: `Authorization: Bearer <token>`

### 3.1 Gestión de Roles

| Acción | Método | Endpoint | Body (JSON) | Respuesta |
|:-------|:-------|:---------|:------------|:----------|
| **Listar Roles** | `GET` | `/roles` | N/A | `Role[]` |
| **Obtener Rol** | `GET` | `/roles/:id` | N/A | `Role` (incluye permisos) |
| **Crear Rol** | `POST` | `/roles` | `CreateRoleRequest` | `Role` |
| **Asignar Permisos** | `PUT` | `/roles/:id/permissions` | `AssignPermissionsRequest` | `{ message: string, added: number }` |

### 3.2 Gestión de Permisos

| Acción | Método | Endpoint | Body (JSON) | Respuesta |
|:-------|:-------|:---------|:------------|:----------|
| **Listar Permisos** | `GET` | `/permissions` | N/A | `PermissionGroup` (Map por módulo) |
| **Sincronizar** | `POST` | `/permissions/sync` | N/A | `{ scanned: number, synced: number }` |
| **Hacer Público** | `PATCH`| `/permissions/:id/public` | `TogglePublicPermissionRequest` | `Permission` |

### 3.3 Asignación a Usuarios

| Acción | Método | Endpoint | Body (JSON) | Respuesta |
|:-------|:-------|:---------|:------------|:----------|
| **Asignar a Admin** | `PUT` | `/admins/:adminId/role` | `AssignRoleToUserRequest` | `AdminUser` |
| **Asignar a Agent** | `PUT` | `/agents/:agentId/role` | `AssignRoleToUserRequest` | `Agent` |

---

## 4. Guía de UI con Angular Material & Tailwind

### 4.1 Vista: Lista de Roles (`RolesListComponent`)
- **Componentes sugeridos**:
  - `mat-table`: Para listar ID, DisplayName, Description, Actions.
  - `mat-chip`: Para mostrar si es `System Role` (color warn/accent).
  - `button (mat-icon-button)`: Editar permisos.

### 4.2 Vista: Editor de Permisos (`RolePermissionsComponent`)
Debido a la gran cantidad de permisos (60+), se recomienda agruparlos.

**Estructura sugerida (Accordion):**
Usar `mat-accordion` donde cada `mat-expansion-panel` es un **Módulo**.

```html
<!-- Ejemplo conceptual -->
<mat-accordion multi>
  <mat-expansion-panel *ngFor="let module of permissionGroups | keyvalue">
    <mat-expansion-panel-header>
      <mat-panel-title>
        {{ module.key | uppercase }}
      </mat-panel-title>
    </mat-expansion-panel-header>

    <!-- Lista de checkboxes con Tailwind -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div *ngFor="let perm of module.value" class="flex items-center space-x-2">
        <mat-checkbox 
          [checked]="hasPermission(perm.id)"
          (change)="togglePermission(perm.id)">
          
          <span class="text-sm font-medium">
            {{ perm.action | titlecase }} 
          </span>
          <span class="text-xs text-gray-500 ml-2">
            ({{ perm.method }} {{ perm.route }})
          </span>
          
        </mat-checkbox>
      </div>
    </div>

  </mat-expansion-panel>
</mat-accordion>
```

### 4.3 Directiva para Ocultar Elementos (`HasPermissionDirective`)
Crea una directiva estructural para ocultar botones/menús en la UI si el usuario no tiene permiso.

**Uso:**
```html
<button mat-button *appHasPermission="'users:create'">
  Crear Usuario
</button>
```

**Lógica (Pseudocódigo):**
1. Recibe el string del permiso (o array de posibles permisos).
2. Obtiene los permisos del usuario actual desde `AuthService`.
3. Si `userPermissions` incluye el permiso requerido -> `viewContainer.createEmbeddedView`.
4. Si no -> `viewContainer.clear()`.

---

## 5. Manejo de Errores

El interceptor HTTP debe manejar los siguientes códigos:

- **401 Unauthorized**: Token expirado o inválido -> Redirigir a Login.
- **403 Forbidden**: El usuario tiene sesión válida pero **NO tiene permiso** para esa acción específica -> Mostrar `MatSnackBar` o redirigir a página "Acceso Denegado".
