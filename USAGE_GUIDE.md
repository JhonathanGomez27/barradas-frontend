# Guía de Uso del Módulo de Videollamadas

## Resumen

El módulo de videollamadas permite gestionar salas de video entre agentes y clientes. Cada sala tiene:
- Un ID único (UUID)
- Enlaces a un agente y un cliente específicos
- Una URL única para acceder a la videollamada
- Un estado (ACTIVE, ENDED, CANCELLED)
- Timestamps de creación, inicio y fin

## Flujo de Trabajo

### 1. Crear una sala de videollamada

Cuando un administrador o el sistema necesita iniciar una videollamada:

```bash
POST /video-rooms
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "agentId": "123e4567-e89b-12d3-a456-426614174000",
  "clientId": "987fcdeb-51a2-43d7-9876-543210fedcba"
}
```

El sistema:
- Verifica que ambos (agente y cliente) existan
- Verifica que no haya una sala activa entre ellos
- Crea la sala con estado ACTIVE
- Genera una URL única: `http://tu-frontend.com/video-call/{roomId}`
- Retorna todos los datos de la sala

### 2. Compartir el enlace

La URL generada (`roomUrl`) se puede:
- Enviar por email al agente y cliente
- Mostrar en la aplicación web
- Enviar por WhatsApp o SMS
- Cualquier otro método de comunicación

Ejemplo de URL: `http://localhost:4200/video-call/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 3. Consultar información de la sala

Cualquier persona con el ID de la sala puede consultar su información:

```bash
GET /video-rooms/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Este endpoint NO requiere autenticación para que los clientes puedan acceder.

### 4. Listar salas

**Listar todas las salas activas:**
```bash
GET /video-rooms?status=ACTIVE
Authorization: Bearer {JWT_TOKEN}
```

**Listar salas de un agente específico:**
```bash
GET /video-rooms/agent/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {JWT_TOKEN}
```

**Listar mis salas (como agente autenticado):**
```bash
GET /video-rooms/me/rooms
Authorization: Bearer {AGENT_JWT_TOKEN}
```

**Buscar salas por nombre:**
```bash
GET /video-rooms?search=María
Authorization: Bearer {JWT_TOKEN}
```

### 5. Finalizar una sala

Cuando la videollamada termina:

```bash
PATCH /video-rooms/a1b2c3d4-e5f6-7890-abcd-ef1234567890/end
Authorization: Bearer {JWT_TOKEN}
```

Esto actualiza:
- `status` → ENDED
- `endedAt` → fecha y hora actual

### 6. Cancelar una sala

Si la sala no se va a usar:

```bash
DELETE /video-rooms/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer {JWT_TOKEN}
```

Esto actualiza:
- `status` → CANCELLED

## Integración con el Frontend

### Contexto: Tu aplicación de videollamadas

Según mencionaste, tienes una aplicación de videollamadas separada. El flujo sería:

1. **Backend** crea la sala y genera la URL
2. **Frontend** recibe la URL y redirige a los usuarios
3. **Aplicación de videollamadas** usa el `roomId` de la URL para conectar a los usuarios
4. Cuando finaliza, el **Frontend** notifica al **Backend** para actualizar el estado

### Ejemplo de integración

#### En tu aplicación Angular/React/Vue:

```typescript
// Crear una sala
async createVideoRoom(agentId: string, clientId: string) {
  const response = await fetch('http://localhost:3000/video-rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({ agentId, clientId })
  });
  
  const room = await response.json();
  
  // Abrir la sala en una nueva ventana
  window.open(room.roomUrl, '_blank');
  
  return room;
}

// Consultar información de una sala
async getRoomInfo(roomId: string) {
  const response = await fetch(`http://localhost:3000/video-rooms/${roomId}`);
  return await response.json();
}

// Finalizar la sala
async endRoom(roomId: string) {
  await fetch(`http://localhost:3000/video-rooms/${roomId}/end`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
}
```

#### En tu página de videollamadas:

```typescript
// Obtener el roomId de la URL
const roomId = window.location.pathname.split('/').pop();

// Consultar información de la sala
const roomInfo = await getRoomInfo(roomId);

console.log('Agente:', roomInfo.agent);
console.log('Cliente:', roomInfo.client);

// Usar roomId como identificador en tu sistema de videollamadas
// Por ejemplo, si usas WebRTC, Socket.io, Jitsi, etc.
connectToVideoCall(roomId, {
  agentName: `${roomInfo.agent.firstName} ${roomInfo.agent.lastName}`,
  clientName: `${roomInfo.client.firstName} ${roomInfo.client.lastName}`
});
```

## Casos de Uso

### Caso 1: Dashboard de agentes

Un agente ve su lista de clientes y quiere iniciar una videollamada:

```typescript
// Obtener el ID del agente autenticado
const agentId = getCurrentUser().id;

// Seleccionar un cliente
const clientId = selectedClient.id;

// Crear la sala
const room = await createVideoRoom(agentId, clientId);

// Abrir la videollamada
window.open(room.roomUrl, 'videollamada', 'width=1280,height=720');
```

### Caso 2: Historial de videollamadas

Listar todas las videollamadas de un cliente:

```typescript
const rooms = await fetch(
  `http://localhost:3000/video-rooms/client/${clientId}?page=1&limit=50`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
).then(r => r.json());

// Mostrar en una tabla
rooms.data.forEach(room => {
  console.log({
    fecha: room.startedAt,
    duracion: calculateDuration(room.startedAt, room.endedAt),
    agente: room.agent.firstName,
    estado: room.status
  });
});
```

### Caso 3: Notificaciones en tiempo real

Usar WebSockets para notificar cuando se crea una sala:

```typescript
// En el backend (agregarías esto al servicio)
this.eventEmitter.emit('room.created', { room, agentId, clientId });

// En el frontend
socket.on('room.created', (data) => {
  if (data.agentId === currentUser.id || data.clientId === currentUser.id) {
    showNotification(`Nueva videollamada: ${data.room.roomUrl}`);
  }
});
```

## Variables de Entorno

Asegúrate de tener configurada la URL de tu frontend en `.env`:

```env
APP_BASE_URL=http://localhost:4200
```

En producción:
```env
APP_BASE_URL=https://tu-dominio.com
```

## Seguridad

- ✅ Las rutas de creación, listado y actualización requieren autenticación JWT
- ✅ Los agentes autenticados solo pueden ver sus propias salas en `/me/rooms`
- ✅ El endpoint público `GET /video-rooms/:id` permite acceso sin token para que los clientes puedan unirse
- ⚠️ Si necesitas más seguridad en el endpoint público, considera agregar tokens de un solo uso o verificación adicional

## Extensiones Futuras

Ideas para mejorar el módulo:

1. **Grabaciones**: Agregar campo para almacenar URLs de grabaciones
2. **Duración**: Calcular duración automáticamente
3. **Calidad**: Agregar métricas de calidad de la llamada
4. **Notificaciones**: Integrar con el módulo de mail para enviar invitaciones
5. **Calendario**: Programar videollamadas para el futuro
6. **Chat**: Agregar mensajes relacionados a cada sala
7. **Archivos**: Permitir compartir documentos durante la llamada

## Soporte

Para problemas o preguntas:
1. Revisa los logs del servidor
2. Verifica que la migración se haya aplicado correctamente
3. Asegúrate de que el cliente de Prisma esté actualizado
4. Consulta el archivo `test/video-rooms.http` para ejemplos de peticiones
