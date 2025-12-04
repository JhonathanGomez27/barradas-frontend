export type ClientStatus = 'CREATED' | 'INVITED' | 'IN_PROGRESS' | 'NO_CONTRACT_SENDED' | 'CONTRACT_SENDED' | 'COMPLETED';
export type CreditStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';

export interface ClientStatsQuery {
    storeId?: string;
    status?: ClientStatus;
    clientStatus?: ClientStatus;
    startDate?: string;
    endDate?: string;
}

export interface ClientStatsResponse {
    total: number;
    statuses: { status: ClientStatus; count: number }[];
    appliedFilters: ClientStatsQuery;
}

export interface CreditStatsQuery {
    storeId?: string;
    status?: CreditStatus;
    creditStatus?: CreditStatus;
    startDate?: string;
    endDate?: string;
}

export interface CreditStatsResponse {
    total: number;
    statuses: { status: CreditStatus; count: number }[];
    appliedFilters: CreditStatsQuery;
}

export interface StoreStatsQuery {
    storeId?: string;
    cityId?: string;
    clientStatus?: ClientStatus;
    creditStatus?: CreditStatus;
    startDate?: string;
    endDate?: string;
}

export interface StoreStatsResponse {
    totalStores: number;
    stores: {
        id: string;
        name: string;
        city: { id: string; name: string };
        clients: {
            total: number;
            byStatus: { status: ClientStatus; count: number }[];
        };
        credits: {
            total: number;
            byStatus: { status: CreditStatus; count: number }[];
        };
        agents: number;
    }[];
    appliedFilters: StoreStatsQuery;
}

export interface DashboardStatsQuery {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
}

export interface DashboardStatsResponse {
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
    appliedFilters: DashboardStatsQuery;
}

export interface AgentCreditStatsQuery {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
    creditStatus?: CreditStatus;
}

export interface AgentCreditStatsResponse {
    totalAgents: number;
    agents: AgentCreditEntry[];
    appliedFilters: AgentCreditStatsQuery;
}

export interface AgentCreditEntry {
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
        byStatus: { status: ClientStatus; count: number }[];
    };
    credits: {
        total: number;
        byStatus: { status: CreditStatus; count: number }[];
        totalAmount: number;
    };
}

export interface AgentPerformanceQuery {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
}

export interface AgentPerformanceResponse {
    totalAgents: number;
    performance: AgentPerformanceEntry[];
    appliedFilters: AgentPerformanceQuery;
}

export interface AgentPerformanceEntry {
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
        conversionRate: number;
        completionRate: number;
    };
}
