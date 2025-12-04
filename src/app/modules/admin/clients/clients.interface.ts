export interface Client {
    id: string;
    name: string;
    last_name: string;
    email: string;
    phone: string;
    locationAddress?: string;
    storeId?: string;
    store?: {
        id: string;
        name: string;
        address?: string;
        cityId?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Credit {
    id: string;
    clientId: string;
    initalPayment: number | null;
    initialPaymentRate: string;
    totalAmount: string;
    paymentType: 'WEEKLY' | 'DAILY';
    selectedTerm: number;
    repaymentDay: string | null;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE' | 'CLOSED' | 'DEFAULTED';
    createdAt: string;
    updatedAt: string;
    documents?: CreditDocument[];
    signatures?: CreditSignature[];
}

export interface CreditDocument {
    id: string;
    clientId: string;
    docType: string;
    title: string;
    provider: string;
    key: string;
    originalName: string;
    storageUrl: string;
    mimeType: string;
    sizeBytes: string;
    uploadedAt: string;
    creditId: string;
}

export interface CreditSignature {
    id: string;
    creditId: string;
    status: string;
    signedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCreditDto {
    clientId: string;
    initialPayment?: number;
    initialPaymentRate: number;
    totalAmount: number;
    paymentType: 'WEEKLY' | 'DAILY';
    selectedTerm: number;
    repaymentDay?: string;
    status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
}

export interface UpdateCreditDto {
    initialPayment?: number;
    initialPaymentRate?: number;
    totalAmount?: number;
    paymentType?: 'WEEKLY' | 'DAILY';
    selectedTerm?: number;
    repaymentDay?: string;
    status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
}

export interface CreditTerms {
    weeklyTerms: number[];
    dailyTerms: number[];
}
