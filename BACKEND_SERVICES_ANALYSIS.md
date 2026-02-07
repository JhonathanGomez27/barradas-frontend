# Análisis de Servicios Backend por Módulo

Este documento detalla los endpoints consumidos por el frontend, organizados por módulo y servicio.

## 1. Módulo Admin (`src/app/modules/admin`)

### RBAC Service (`rbac/rbac.service.ts`)
Gestión de roles y permisos.
- `GET /admin/rbac/roles` - Listar roles
- `GET /admin/rbac/roles/:id` - Obtener rol por ID
- `POST /admin/rbac/roles` - Crear rol
- `PUT /admin/rbac/roles/:id` - Actualizar rol
- `DELETE /admin/rbac/roles/:id` - Eliminar rol
- `PUT /admin/rbac/roles/:roleId/permissions` - Asignar permisos a rol
- `GET /admin/rbac/permissions` - Listar permisos
- `POST /admin/rbac/permissions/sync` - Sincronizar permisos
- `PATCH /admin/rbac/permissions/:id/public` - Alternar estado público de permiso
- `PUT /admin/rbac/admins/:adminId/role` - Asignar rol a admin
- `PUT /admin/rbac/agents/:agentId/role` - Asignar rol a agente

### Stores Service (`stores/stores.service.ts`)
Gestión de tiendas y ciudades.
- `GET /cities` - Listar ciudades
- `GET /stores` - Listar tiendas (paginado, búsqueda)
- `GET /stores/all` - Listar todas las tiendas (sin paginación)
- `GET /stores/:id` - Obtener tienda por ID
- `POST /stores` - Crear tienda
- `PUT /stores/:id` - Actualizar tienda
- `DELETE /stores/:id` - Eliminar tienda
- `GET /users` - Listar usuarios de tienda (paginado)

### Agents Service (`stores/agents.service.ts`)
Gestión de agentes.
- `GET /agents` - Listar agentes (paginado, búsqueda, filtro por tienda)
- `GET /agents/:id` - Obtener agente por ID
- `POST /agents` - Crear agente
- `PUT /agents/:id` - Actualizar agente
- `DELETE /agents/:id` - Eliminar agente

### Clients Service (`clients/clients.service.ts`)
Gestión de clientes (vista admin).
- `GET /users` - Listar clientes (paginado)
- `GET /users/:id` - Obtener cliente por ID
- `POST /documents/admin/clients/:client_id/documents` - Subir documento a cliente
- `GET /documents/:fileId/download` - Descargar documento
- `POST /invitations` - Invitar cliente
- `DELETE /users/:id` - Eliminar cliente
- `PATCH /users/:id` - Actualizar cliente
- `POST /users/:clientId/documents/:documentId/sign` - Obtener token de firma
- `POST /credits` - Crear crédito
- `GET /credits/list/:clientId` - Listar créditos de cliente
- `PATCH /credits/:creditId/status` - Actualizar estado de crédito
- `GET /credits/payment-terms` - Obtener plazos de pago
- `POST /video-rooms` - Crear sala de video
- `GET /video-rooms/client/:clientId` - Obtener salas de video por cliente
- `PATCH /video-rooms/:roomId/end` - Finalizar sala de video
- `DELETE /video-rooms/:roomId` - Eliminar sala de video

### Statistics Service (`statistics/statistics.service.ts`)
Dashboard y reportes.
- `GET /stats/clients` - Estadísticas de clientes
- `GET /stats/credits` - Estadísticas de créditos
- `GET /stats/stores` - Estadísticas de tiendas
- `GET /stats/dashboard` - Estadísticas generales del dashboard
- `GET /stats/agents/credits` - Estadísticas de créditos por agente
- `GET /stats/agents/performance` - Estadísticas de rendimiento de agentes

## 2. Módulo Agent (`src/app/modules/agent`)

### Clients Service (`clients/clients.service.ts`)
Gestión de clientes (vista agente).
- `GET /agents/me/users` - Listar clientes asignados al agente actual
- `GET /users/:id` - Obtener cliente por ID
- `POST /documents/admin/clients/:client_id/documents` - Subir documento
- `GET /documents/:fileId/download` - Descargar documento
- `POST /invitations` - Invitar cliente
- `DELETE /users/:id` - Eliminar cliente
- `PATCH /users/:id` - Actualizar cliente
- `POST /users/:clientId/documents/:documentId/sign` - Obtener token de firma
- `POST /credits` - Crear crédito
- `GET /credits/list/:clientId` - Listar créditos
- `PATCH /credits/:creditId/status` - Actualizar estado crédito
- `GET /credits/payment-terms` - Obtener plazos
- `POST /video-rooms` - Crear sala de video
- `GET /video-rooms/client/:clientId` - Obtener salas
- `PATCH /video-rooms/:roomId/end` - Finalizar sala
- `DELETE /video-rooms/:roomId` - Eliminar sala

## 3. Módulo Landing (`src/app/modules/landing`)

### Complete Profile Service (`complete-profile/complete-profile.service.ts`)
Proceso de completado de perfil para invitados.
- `GET /invitations/validate/:token` - Validar token de invitación
- `POST /public/invitations/:token/complete` - Completar perfil (subida de datos y archivos)

### WebRTC Service (`web-rtc/web-rtc.service.ts`)
Servicio de videollamadas.
- `POST /web-rtc/create-room` - Crear sala WebRTC
- (Socket.IO events: `joinRoom`, `offer`, `answer`, `iceCandidate`)

## 4. Módulo DocuSeal (`src/app/modules/docuseal`)

### Docuseal Service (`docuseal.service.ts`)
Integración con firma electrónica.
- `POST /docuseal/create-signed-token` - Crear token de firma
- `GET /docuseal/electronic-signatures/:id` - Obtener firma electrónica
- `POST /docuseal/send-submission-email` - Enviar solicitud de firma por email
- `DELETE /docuseal/electronic-signatures/:id` - Eliminar firma electrónica

## Sugerencias de Mejora

1.  **Centralización de URLs**: Muchos servicios construyen las URLs manualmente (`${this.url}/endpoint`). Sería beneficioso centralizar los paths en constantes o un archivo de configuración de API para facilitar el mantenimiento.
2.  **Tipado de Respuestas**: Algunos métodos retornan `Observable<any>`. Se recomienda definir interfaces estrictas para todas las respuestas del backend (DTOs) para aprovechar al máximo TypeScript y evitar errores en tiempo de ejecución.
3.  **Manejo de Errores Global**: Asegurar que existe un interceptor global (`HttpInterceptor`) para manejar errores comunes (401, 403, 500) de manera uniforme en toda la aplicación, en lugar de capturarlos individualmente en cada servicio (salvo excepciones específicas).
4.  **Reutilización de Servicios**: El servicio `ClientsService` parece estar duplicado o muy similar en `admin` y `agent`. Considerar mover la lógica común a un servicio compartido en `src/app/core/` o `src/app/shared/` y extenderlo o configurarlo según el contexto.
