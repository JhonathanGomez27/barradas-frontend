# Plan de Implementación RBAC (Completado)

Este documento resume la implementación del módulo de Roles y Permisos (RBAC) en el frontend.

## 1. Modelos y Tipos
- Se creó `src/app/core/models/rbac.models.ts` con las interfaces `Role`, `Permission`, `PermissionGroup`, etc.
- Se actualizó `src/app/core/user/user.types.ts` para incluir `permissions: string[]` y `roleId: string` en la interfaz `User`.

## 2. Autenticación y Servicio de Usuario
- **AuthUtils**: Se hizo público el método `decodeToken` en `src/app/core/auth/auth.utils.ts`.
- **AuthService**: Se actualizó `src/app/core/auth/auth.service.ts` para extraer los permisos del JWT durante el login y refresh token, y almacenarlos en el `UserService`.
- **UserService**: Ahora propaga el objeto `User` con los permisos cargados.

## 3. Guards y Directivas
- **HasPermissionGuard**: Se actualizó `src/app/core/auth/guards/has-permission.guard.ts` para verificar permisos específicos (`expectedPermission`) además de roles.
- **ShowForPermissionsDirective**: Se actualizó `src/app/core/directives/show-for-roles.directive.ts` (renombrado internamente a `ShowForPermissionsDirective`) para soportar la verificación de permisos mediante `[appShowForPermissions]`. Mantiene compatibilidad con `[appShowForRoles]`.

## 4. Módulo RBAC (`src/app/modules/admin/rbac`)
Se creó un nuevo módulo para la gestión de roles y permisos:
- **RbacService**: Servicio para interactuar con la API de RBAC (`/admin/rbac`).
- **RolesListComponent**: Vista para listar roles, identificar roles de sistema y editar permisos.
- **RolePermissionsComponent**: Vista detallada para asignar permisos a un rol, agrupados por módulo en un acordeón.

## 5. Rutas y Navegación
- Se registraron las rutas del módulo en `src/app/modules/admin/rbac/rbac.routes.ts`.
- Se agregó la ruta `/rbac` en `src/app/app.routes.ts` protegida por `hasRoleGuard` (solo admin).
- Se agregó el ítem de menú "Roles y Permisos" en `src/app/mock-api/common/navigation/data.ts`.

## Próximos Pasos
1. **Verificación Backend**: Asegurarse de que el backend exponga los endpoints esperados en `/admin/rbac` y que el token JWT incluya el array `permissions`.
2. **Pruebas**:
   - Verificar que al hacer login como admin, se carguen los permisos.
   - Probar la creación y edición de roles.
   - Verificar que la directiva `*appShowForPermissions` oculte elementos correctamente.
   - Verificar que el guard `hasPermissionGuard` proteja rutas específicas si se configuran.
