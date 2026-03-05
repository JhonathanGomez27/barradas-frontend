export type PaymentType = 'WEEKLY' | 'DAILY';

export type Weekday =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';

export interface CreateInvitationPayload {
    email: string;
    name: string;
    last_name: string;
    phone: string;
    storeId?: string;
    locationAddress?: string;
    agentId?: string;
    initialPayment?: number;
    initialPaymentRate?: number;
    totalAmount?: number;
    paymentType?: PaymentType;
    selectedTerm?: number;
    repaymentDay?: Weekday;
}

export interface CreateInvitationFiles {
    INE_FRONT?: File;
    INE_BACK?: File;
    QUOTE?: File;
    INITIAL_PAYMENT?: File;
}

export interface CreateInvitationResponse {
    id: string;
    email: string | null;
    token: string;
    status: 'pending' | 'completed' | 'cancelled' | 'expired';
    expiresAt: string;
    createdBy: string | null;
    clientId: string;
    completedAt: string | null;
    createdAt: string;
    link: string;
    creditId: string;
}
