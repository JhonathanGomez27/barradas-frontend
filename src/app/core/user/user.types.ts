export interface User {
    id: string;
    name: string;
    email: string;
    rol?: string;
    storeName?: string;
    storeCity?: string;
    stores?: any[];
    avatar?: string;
    status?: string;
    permissions?: string[];
    roleId?: string;
}
