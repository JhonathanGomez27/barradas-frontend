export type ClientStatus = 'CREATED' | 'INVITED' | 'IN_PROGRESS' | 'NO_CONTRACT_SENDED' | 'CONTRACT_SENDED' | 'COMPLETED';
export type CreditStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
export type PaymentType = 'WEEKLY' | 'DAILY';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'HIGH_DELINQUENCY' | 'STALLED_CLIENT' | 'AGENT_HIGH_DELINQUENCY';

export interface ClientStatsQuery {
    storeId?: string;
    status?: ClientStatus;
    clientStatus?: ClientStatus;
    startDate?: string;
    endDate?: string;
}

export interface ClientStatusEntry {
    status: ClientStatus;
    count: number;
    percentOfTotal: number;
    avgDaysInStatus: number;
    accumulatedValue: number;
}

export interface ClientStatsResponse {
    total: number;
    statuses: ClientStatusEntry[];
    appliedFilters: ClientStatsQuery;
}

// ── Module 1: Summary & Trend ─────────────────────────────────────────────────
export interface SummaryStatsQuery {
    storeId?: string;
    agentId?: string;
    paymentType?: PaymentType;
    creditStatus?: CreditStatus;
}

export interface SummaryStatsResponse {
    salesToday: {
        count: number;
        amount: number;
        deltaCount: number | null;
        deltaAmount: number | null;
    };
    collectionToday: {
        amount: number;
        delta: number | null;
    };
    portfolio: {
        total: number;
        overdueAmount: number;
        delinquencyRate: number;
    };
}

export interface TrendStatsQuery {
    storeId?: string;
    agentId?: string;
}

export interface TrendDay {
    date: string;
    dayName: string;
    sales: { count: number; amount: number };
    collection: { amount: number };
}

export interface TrendStatsResponse {
    period: { startDate: string; endDate: string };
    days: TrendDay[];
}

// ── Module 2: Commercial ──────────────────────────────────────────────────────
export interface CommercialStatsQuery {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    agentId?: string;
}

export interface StoreCommercialEntry {
    storeId: string;
    storeName: string;
    creditCount: number;
    totalAmount: number;
    averageTicket: number;
}

export interface AgentCommercialEntry {
    agentId: string;
    agentName: string;
    creditCount: number;
    totalAmount: number;
    averageTicket: number;
    approvalRate: number;
}

export interface CommercialStatsResponse {
    salesByStore: StoreCommercialEntry[];
    salesByAgent: AgentCommercialEntry[];
}

// ── Module 3: Portfolio & Collection ─────────────────────────────────────────
export interface PortfolioStatsQuery {
    storeId?: string;
    agentId?: string;
}

export interface PortfolioStatsResponse {
    totalPortfolio: number;
    current: { amount: number; rate: number };
    overdue: { amount: number; rate: number };
    critical: { amount: number; rate: number };
}

export interface CollectionStatsQuery {
    storeId?: string;
    agentId?: string;
}

export interface CollectionDay {
    date: string;
    dayName: string;
    expected: number;
    actual: number;
    efficiency: number;
}

export interface CollectionStatsResponse {
    weekPeriod: { startDate: string; endDate: string };
    days: CollectionDay[];
    totals: { expected: number; actual: number; efficiency: number };
}

// ── Module 6: Alerts ─────────────────────────────────────────────────────────
export interface AlertsStatsQuery {
    storeId?: string;
    agentId?: string;
}

export interface AlertItem {
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    details: Record<string, any>;
}

export interface AlertsStatsResponse {
    totalAlerts: number;
    alerts: AlertItem[];
    thresholds: {
        delinquencyThreshold: string;
        stalledDaysThreshold: number;
    };
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
