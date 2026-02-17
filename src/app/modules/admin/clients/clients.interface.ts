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

export interface CreditInstallment {
    id: string;
    creditId: string;
    number: number;
    dueDate: string;
    expectedAmount: string;
    paidAmount: string;
    lateFeeAccrued: string;
    daysOverdue?: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'MISSED';

export interface PaginatedInstallmentsResponse {
    data: CreditInstallment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Credit {
    id: string;
    clientId: string;
    /** @deprecated use initialPaymentAmount */
    initalPayment?: number | null;
    initialPaymentAmount?: string;
    initialPaymentRate?: string;
    totalAmount: string;
    financedAmount?: string;
    outstandingPrincipal?: string;
    lateFeeRate?: string;
    paymentType: 'WEEKLY' | 'DAILY';
    selectedTerm: number;
    repaymentDay: string | null;
    startDate?: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE' | 'CLOSED' | 'DEFAULTED';
    createdAt: string;
    updatedAt: string;
    documents?: CreditDocument[];
    signatures?: CreditSignature[];
    installments?: CreditInstallment[];
}

export interface CreditDocument {
    id: string;
    clientId: string;
    docType: string;
    title: string;
    provider?: string;
    key?: string;
    originalName?: string;
    storageUrl?: string;
    mimeType: string;
    sizeBytes?: string;
    uploadedAt: string;
    creditId: string;
    paymentId?: string | null;
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

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';

export interface RegisterPaymentDto {
    creditId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    paidAt: string;
    evidenceDocumentId: string;
}

export interface PaymentResponse {
    id: string;
    creditId?: string;
    paymentScheduleEventId: string | null;
    amount: string;
    paidAt: string;
    method: PaymentMethod;
    reference?: string;
    appliedToPrincipal: string;
    appliedToLateFee: string;
    createdAt: string;
    updatedAt: string;
    document?: CreditDocument;
}

export interface InstallmentPaymentsDialogData {
    installment: CreditInstallment;
}

export interface PaymentDialogData {
    clientId: string;
    credit: Credit;
}

export interface CreditProjectedInstallment {
    date: string;
    amount: string;
    isLast: boolean;
}

export interface CreditProjectedScheduleResponse {
    creditId: string;
    remainingInstallments: number;
    installments: CreditProjectedInstallment[];
}

export type CreditLedgerItemType = 'PAYMENT' | 'SCHEDULE_EVENT';

export interface CreditLedgerPaymentItem {
    id: string;
    paymentScheduleEventId: string | null;
    amount: string;
    paidAt: string;
    method: PaymentMethod;
    reference?: string | null;
    appliedToPrincipal: string;
    appliedToLateFee: string;
    arrearsCountAfterPayment?: number | null;
    createdAt: string;
    updatedAt: string;
    document?: {
        id: string;
        docType: string;
        title?: string | null;
        provider?: string | null;
        originalName?: string | null;
        mimeType?: string | null;
        sizeBytes?: string | null;
        uploadedAt: string;
    } | null;
}

export interface CreditLedgerScheduleEventItem {
    id: string;
    number: number;
    dueDate: string;
    expectedAmount: string;
    paidAmount: string;
    lateFeeAccrued: string;
    status: InstallmentStatus;
    createdAt: string;
    updatedAt: string;
}

export type CreditLedgerRow =
    | {
          type: 'PAYMENT';
          date: string;
          id: string;
          payment: CreditLedgerPaymentItem;
      }
    | {
          type: 'SCHEDULE_EVENT';
          date: string;
          id: string;
          event: CreditLedgerScheduleEventItem;
      };

export interface CreditLedgerCursor {
    cursorDate: string;
    cursorType: CreditLedgerItemType;
    cursorId: string;
}

export interface CreditLedgerResponse {
    data: CreditLedgerRow[];
    hasMore: boolean;
    nextCursor: CreditLedgerCursor | null;
}
