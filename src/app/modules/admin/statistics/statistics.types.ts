export type ClientStatus = 'CREATED' | 'INVITED' | 'IN_PROGRESS' | 'NO_CONTRACT_SENDED' | 'CONTRACT_SENDED' | 'COMPLETED';
export type CreditStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'DEFAULTED' | 'CANCELLED';

export interface ClientStatsQuery {
    storeId?: string;
    status?: ClientStatus;
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
