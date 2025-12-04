# 📊 API de Estadísticas - Documentación para Frontend

## 🎯 Overview
Esta API proporciona endpoints para obtener estadísticas y métricas del sistema de créditos, clientes, agentes y tiendas. Los datos están optimizados para visualización en gráficas y dashboards.

**Base URL:** `/stats`

## 📍 Endpoints Disponibles

### 1. **GET /stats/clients** - Estadísticas de Clientes por Estado

Obtiene el conteo de clientes agrupados por su estado.

#### Query Parameters:
```typescript
{
  startDate?: string;      // ISO date (ej: "2025-01-01")
  endDate?: string;        // ISO date (ej: "2025-12-31")
  storeId?: string;        // UUID de la tienda
  clientStatus?: ClientStatus; // CREATED | INVITED | IN_PROGRESS | NO_CONTRACT_SENDED | CONTRACT_SENDED | COMPLETED
}
```

#### Respuesta:
```typescript
{
  total: number;
  statuses: Array<{
    status: ClientStatus;
    count: number;
  }>;
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    status: ClientStatus | null;
  };
}
```

#### Ejemplo de Uso:
```typescript
// GET /stats/clients?startDate=2025-01-01&endDate=2025-12-31&storeId=123e4567-e89b-12d3-a456-426614174000

// Respuesta ejemplo:
{
  "total": 150,
  "statuses": [
    { "status": "CREATED", "count": 20 },
    { "status": "IN_PROGRESS", "count": 45 },
    { "status": "COMPLETED", "count": 85 }
  ],
  "appliedFilters": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "storeId": "123e4567-e89b-12d3-a456-426614174000",
    "status": null
  }
}
```

#### 💡 Sugerencia de Gráfica:
- **Tipo:** Gráfica de Donut/Pie o Barras horizontales
- **Eje X:** Estado del cliente
- **Eje Y:** Cantidad
- **Colores:** Asignar color por estado (verde=COMPLETED, amarillo=IN_PROGRESS, etc.)

---

### 2. **GET /stats/credits** - Estadísticas de Créditos por Estado

Obtiene el conteo de créditos agrupados por su estado.

#### Query Parameters:
```typescript
{
  startDate?: string;        // ISO date
  endDate?: string;          // ISO date
  storeId?: string;          // UUID de la tienda
  status?: CreditStatus;     // ACTIVE | COMPLETED | CANCELED
  creditStatus?: CreditStatus; // Alias de status
}
```

#### Respuesta:
```typescript
{
  total: number;
  statuses: Array<{
    status: CreditStatus;
    count: number;
  }>;
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    status: CreditStatus | null;
    creditStatus: CreditStatus | null;
    effectiveStatus: CreditStatus | null;
  };
}
```

#### Ejemplo de Uso:
```typescript
// GET /stats/credits?storeId=123e4567-e89b-12d3-a456-426614174000

// Respuesta ejemplo:
{
  "total": 89,
  "statuses": [
    { "status": "ACTIVE", "count": 65 },
    { "status": "COMPLETED", "count": 20 },
    { "status": "CANCELED", "count": 4 }
  ],
  "appliedFilters": {
    "startDate": null,
    "endDate": null,
    "storeId": "123e4567-e89b-12d3-a456-426614174000",
    "status": null,
    "creditStatus": null,
    "effectiveStatus": null
  }
}
```

#### 💡 Sugerencia de Gráfica:
- **Tipo:** Gráfica de Donut/Pie
- **Colores:** Verde=COMPLETED, Azul=ACTIVE, Rojo=CANCELED

---

### 3. **GET /stats/stores** - Estadísticas por Tienda

Obtiene métricas detalladas de cada tienda (clientes, créditos, agentes).

#### Query Parameters:
```typescript
{
  startDate?: string;
  endDate?: string;
  storeId?: string;          // Filtrar tienda específica
  cityId?: string;           // Filtrar por ciudad
  clientStatus?: ClientStatus;
  creditStatus?: CreditStatus;
}
```

#### Respuesta:
```typescript
{
  totalStores: number;
  stores: Array<{
    id: string;
    name: string;
    city: {
      id: string;
      name: string;
    };
    clients: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
      }>;
    };
    credits: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
      }>;
    };
    agents: number;
  }>;
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    cityId: string | null;
    clientStatus: ClientStatus | null;
    creditStatus: CreditStatus | null;
  };
}
```

#### Ejemplo de Uso:
```typescript
// GET /stats/stores?cityId=456e7890-e89b-12d3-a456-426614174000

// Respuesta ejemplo:
{
  "totalStores": 3,
  "stores": [
    {
      "id": "store-1",
      "name": "Tienda Centro",
      "city": { "id": "city-1", "name": "Monterrey" },
      "clients": {
        "total": 45,
        "byStatus": [
          { "status": "COMPLETED", "count": 30 },
          { "status": "IN_PROGRESS", "count": 15 }
        ]
      },
      "credits": {
        "total": 35,
        "byStatus": [
          { "status": "ACTIVE", "count": 28 },
          { "status": "COMPLETED", "count": 7 }
        ]
      },
      "agents": 5
    }
  ],
  "appliedFilters": {
    "startDate": null,
    "endDate": null,
    "storeId": null,
    "cityId": "456e7890-e89b-12d3-a456-426614174000",
    "clientStatus": null,
    "creditStatus": null
  }
}
```

#### 💡 Sugerencia de Gráfica:
- **Tipo:** Gráfica de barras agrupadas
- **Eje X:** Nombre de tienda
- **Eje Y:** Cantidad
- **Series:** Clientes totales, Créditos totales, Agentes
- **Tabla complementaria:** Mostrar desglose por estado

---

### 4. **GET /stats/agents/credits** ⭐ NUEVO - Créditos por Agente

Obtiene todos los créditos creados por cada agente (a través de sus clientes asignados).

#### Query Parameters:
```typescript
{
  startDate?: string;
  endDate?: string;
  storeId?: string;          // Filtrar por tienda
  agentId?: string;          // Filtrar agente específico
  creditStatus?: CreditStatus;
}
```

#### Respuesta:
```typescript
{
  totalAgents: number;
  agents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    store: {
      id: string;
      name: string;
    };
    clients: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
      }>;
    };
    credits: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
      }>;
      totalAmount: number;
    };
  }>;
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    agentId: string | null;
    creditStatus: CreditStatus | null;
  };
}
```

#### Ejemplo de Uso:
```typescript
// GET /stats/agents/credits?storeId=123e4567-e89b-12d3-a456-426614174000&startDate=2025-01-01&endDate=2025-12-31

// Respuesta ejemplo:
{
  "totalAgents": 5,
  "agents": [
    {
      "id": "agent-1",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "store": {
        "id": "store-1",
        "name": "Tienda Centro"
      },
      "clients": {
        "total": 15,
        "byStatus": [
          { "status": "COMPLETED", "count": 10 },
          { "status": "IN_PROGRESS", "count": 5 }
        ]
      },
      "credits": {
        "total": 12,
        "byStatus": [
          { "status": "ACTIVE", "count": 9 },
          { "status": "COMPLETED", "count": 3 }
        ],
        "totalAmount": 250000.50
      }
    }
  ],
  "appliedFilters": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "storeId": "123e4567-e89b-12d3-a456-426614174000",
    "agentId": null,
    "creditStatus": null
  }
}
```

#### 💡 Sugerencia de Gráfica:
- **Tipo 1:** Gráfica de barras comparativas
  - Eje X: Nombre del agente (`firstName + " " + lastName`)
  - Eje Y: Cantidad de créditos
  - Series: Total créditos, Créditos activos, Créditos completados

- **Tipo 2:** Gráfica de columnas apiladas
  - Mostrar desglose de créditos por estado para cada agente
  
- **Tipo 3:** Ranking/Leaderboard
  - Ordenar agentes por `credits.total` o `credits.totalAmount`
  - Mostrar top 10 agentes

---

### 5. **GET /stats/agents/performance** ⭐ NUEVO - Rendimiento de Agentes

Obtiene métricas de desempeño de cada agente (tasas de conversión y completitud).

#### Query Parameters:
```typescript
{
  startDate?: string;
  endDate?: string;
  storeId?: string;
  agentId?: string;
}
```

#### Respuesta:
```typescript
{
  totalAgents: number;
  performance: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    store: {
      id: string;
      name: string;
    };
    metrics: {
      totalClients: number;
      completedClients: number;
      activeCreditsClients: number;
      conversionRate: number;    // % de clientes con créditos activos
      completionRate: number;    // % de clientes completados
    };
  }>;
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    agentId: string | null;
  };
}
```

#### Ejemplo de Uso:
```typescript
// GET /stats/agents/performance?storeId=123e4567-e89b-12d3-a456-426614174000

// Respuesta ejemplo:
{
  "totalAgents": 5,
  "performance": [
    {
      "id": "agent-1",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "store": {
        "id": "store-1",
        "name": "Tienda Centro"
      },
      "metrics": {
        "totalClients": 20,
        "completedClients": 15,
        "activeCreditsClients": 12,
        "conversionRate": 60.0,      // 12/20 * 100
        "completionRate": 75.0       // 15/20 * 100
      }
    }
  ],
  "appliedFilters": {
    "startDate": null,
    "endDate": null,
    "storeId": "123e4567-e89b-12d3-a456-426614174000",
    "agentId": null
  }
}
```

#### 💡 Sugerencia de Gráfica:
- **Tipo 1:** Gráfica de barras horizontales
  - Eje X: Tasa de conversión (%)
  - Eje Y: Nombre del agente
  - Ordenar de mayor a menor tasa

- **Tipo 2:** Scatter plot (Dispersión)
  - Eje X: Tasa de conversión
  - Eje Y: Tasa de completitud
  - Tamaño del punto: Total de clientes

- **Tipo 3:** Tabla de ranking
  - Mostrar todas las métricas
  - Resaltar mejores performers (badges/iconos)

---

### 6. **GET /stats/dashboard** ⭐ NUEVO - Estadísticas Generales del Dashboard

Obtiene una vista general del sistema con métricas consolidadas.

#### Query Parameters:
```typescript
{
  startDate?: string;
  endDate?: string;
  storeId?: string;
  agentId?: string;
}
```

#### Respuesta:
```typescript
{
  clients: {
    total: number;
    completed: number;
    inProgress: number;
  };
  credits: {
    total: number;
    active: number;
    completed: number;
    totalAmount: number;
    activeAmount: number;
  };
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    agentId: string | null;
  };
}
```

#### Ejemplo de Uso:
```typescript
// GET /stats/dashboard
// GET /stats/dashboard?agentId=123e4567-e89b-12d3-a456-426614174000
// GET /stats/dashboard?storeId=123e4567-e89b-12d3-a456-426614174000&startDate=2025-01-01

// Respuesta ejemplo:
{
  "clients": {
    "total": 150,
    "completed": 85,
    "inProgress": 45
  },
  "credits": {
    "total": 120,
    "active": 89,
    "completed": 28,
    "totalAmount": 3500000.00,
    "activeAmount": 2800000.00
  },
  "appliedFilters": {
    "startDate": null,
    "endDate": null,
    "storeId": null,
    "agentId": null
  }
}
```

#### 💡 Sugerencia de Visualización:
- **Cards/KPIs principales:**
  - Total de clientes
  - Total de créditos
  - Monto total activo
  - Tasa de clientes completados

- **Gráficas pequeñas (sparklines):**
  - Tendencia de clientes en el tiempo
  - Tendencia de créditos en el tiempo

- **Indicadores de progreso:**
  - Clientes completados / Total
  - Créditos activos / Total

---

## 🎨 Sugerencias para el Dashboard

### Layout Recomendado:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard Principal                           [Filtros]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Total    │  │ Créditos │  │ Monto    │  │ Tasa     │   │
│  │ Clientes │  │ Activos  │  │ Activo   │  │ Conversión│  │
│  │   150    │  │    89    │  │  $2.8M   │  │   60%    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │ Clientes por Estado        │  │ Créditos por Estado    │ │
│  │ (Donut Chart)              │  │ (Donut Chart)          │ │
│  │                            │  │                        │ │
│  └────────────────────────────┘  └────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Top 10 Agentes por Créditos Generados (Barras)          ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │ Performance de Agentes     │  │ Estadísticas por       │ │
│  │ (Scatter Plot)             │  │ Tienda (Tabla)         │ │
│  │                            │  │                        │ │
│  └────────────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Componentes de Filtro Global:
```typescript
interface DashboardFilters {
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  storeId: string | null;
  agentId: string | null;
}
```

---

## 🔧 Tipos TypeScript

```typescript
// Enums
enum ClientStatus {
  CREATED = "CREATED",
  INVITED = "INVITED",
  IN_PROGRESS = "IN_PROGRESS",
  NO_CONTRACT_SENDED = "NO_CONTRACT_SENDED",
  CONTRACT_SENDED = "CONTRACT_SENDED",
  COMPLETED = "COMPLETED"
}

enum CreditStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED"
}

// Interfaces para las respuestas
interface StatusCount {
  status: string;
  count: number;
}

interface ClientStatsResponse {
  total: number;
  statuses: StatusCount[];
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    status: ClientStatus | null;
  };
}

interface AgentCreditStats {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  store: {
    id: string;
    name: string;
  };
  clients: {
    total: number;
    byStatus: StatusCount[];
  };
  credits: {
    total: number;
    byStatus: StatusCount[];
    totalAmount: number;
  };
}

interface AgentPerformanceMetrics {
  totalClients: number;
  completedClients: number;
  activeCreditsClients: number;
  conversionRate: number;
  completionRate: number;
}

interface DashboardStatsResponse {
  clients: {
    total: number;
    completed: number;
    inProgress: number;
  };
  credits: {
    total: number;
    active: number;
    completed: number;
    totalAmount: number;
    activeAmount: number;
  };
  appliedFilters: {
    startDate: string | null;
    endDate: string | null;
    storeId: string | null;
    agentId: string | null;
  };
}
```

---

## 📝 Ejemplo de Servicio en Frontend (React/TypeScript)

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://tu-api.com/stats';

class StatsService {
  private getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async getClientStats(filters: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    clientStatus?: ClientStatus;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await axios.get(
      `${API_BASE_URL}/clients?${params.toString()}`,
      this.getHeaders()
    );
    return response.data as ClientStatsResponse;
  }

  async getAgentCreditStats(filters: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
    creditStatus?: CreditStatus;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await axios.get(
      `${API_BASE_URL}/agents/credits?${params.toString()}`,
      this.getHeaders()
    );
    return response.data;
  }

  async getAgentPerformance(filters: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await axios.get(
      `${API_BASE_URL}/agents/performance?${params.toString()}`,
      this.getHeaders()
    );
    return response.data;
  }

  async getDashboardStats(filters: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await axios.get(
      `${API_BASE_URL}/dashboard?${params.toString()}`,
      this.getHeaders()
    );
    return response.data as DashboardStatsResponse;
  }

  async getStoreStats(filters: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    cityId?: string;
    clientStatus?: ClientStatus;
    creditStatus?: CreditStatus;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await axios.get(
      `${API_BASE_URL}/stores?${params.toString()}`,
      this.getHeaders()
    );
    return response.data;
  }
}

export default new StatsService();
```

---

## 🚀 Casos de Uso Principales

### 1. **Dashboard Ejecutivo**
```typescript
// Obtener métricas generales
const dashboardData = await StatsService.getDashboardStats({
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});

// Mostrar en cards KPI
```

### 2. **Vista de Rendimiento de Agentes**
```typescript
// Obtener performance de agentes de una tienda
const performance = await StatsService.getAgentPerformance({
  storeId: selectedStoreId
});

// Crear ranking/leaderboard
const sortedAgents = performance.performance.sort(
  (a, b) => b.metrics.conversionRate - a.metrics.conversionRate
);
```

### 3. **Análisis de Créditos por Agente**
```typescript
// Obtener créditos de todos los agentes en un período
const creditStats = await StatsService.getAgentCreditStats({
  startDate: '2025-01-01',
  endDate: '2025-03-31',
  storeId: selectedStoreId
});

// Crear gráfica de barras comparativa
const chartData = creditStats.agents.map(agent => ({
  name: `${agent.firstName} ${agent.lastName}`,
  creditsTotal: agent.credits.total,
  creditsActive: agent.credits.byStatus.find(s => s.status === 'ACTIVE')?.count || 0,
  amount: agent.credits.totalAmount
}));
```

### 4. **Comparación entre Tiendas**
```typescript
const storeStats = await StatsService.getStoreStats({
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});

// Crear tabla comparativa
```

---

## 🎯 Recomendaciones Adicionales

1. **Caching:** Implementar cache en frontend para no hacer llamadas repetidas
2. **Loading States:** Mostrar skeletons/loaders mientras cargan los datos
3. **Error Handling:** Manejar errores de red y mostrar mensajes apropiados
4. **Refresh:** Botón para refrescar datos manualmente
5. **Export:** Permitir exportar datos a CSV/Excel
6. **Responsive:** Adaptar gráficas para mobile
7. **Real-time:** Considerar WebSockets para datos en tiempo real (opcional)

---

## 📞 Soporte

Para dudas sobre la implementación, contactar al equipo de backend.
