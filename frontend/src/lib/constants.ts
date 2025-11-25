// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REGISTER: '/api/auth/register',
        REFRESH: '/api/auth/refresh',
        ME: '/api/auth/me',
    },

    // Projects
    PROJECTS: {
        LIST: '/api/projects',
        CREATE: '/api/projects',
        GET: (id: string) => `/api/projects/${id}`,
        UPDATE: (id: string) => `/api/projects/${id}`,
        DELETE: (id: string) => `/api/projects/${id}`,
        BY_CUSTOMER: (customerId: string) => `/api/projects/customer/${customerId}`,
        STATUSES: '/api/projects/statuses',
    },

    // Customers
    CUSTOMERS: {
        LIST: '/api/customers',
        CREATE: '/api/customers',
        GET: (id: string) => `/api/customers/${id}`,
        UPDATE: (id: string) => `/api/customers/${id}`,
        DELETE: (id: string) => `/api/customers/${id}`,
    },

    // Employees
    EMPLOYEES: {
        LIST: '/api/employees',
        CREATE: '/api/employees',
        GET: (id: string) => `/api/employees/${id}`,
        UPDATE: (id: string) => `/api/employees/${id}`,
        DELETE: (id: string) => `/api/employees/${id}`,
    },

    // Expenses
    EXPENSES: {
        LIST: '/api/expenses',
        CREATE: '/api/expenses',
        GET: (id: string) => `/api/expenses/${id}`,
        UPDATE: (id: string) => `/api/expenses/${id}`,
        DELETE: (id: string) => `/api/expenses/${id}`,
        BY_PROJECT: (projectId: string) => `/api/expenses/project/${projectId}`,
    },

    // Sales
    SALES: {
        QUOTES: '/api/sales/quotes',
        INVOICES: '/api/sales/invoices',
        RECEIPTS: '/api/sales/receipts',
    },

    // Reports
    REPORTS: {
        DASHBOARD: '/api/reports/dashboard',
        PROJECT: '/api/reports/project',
        FINANCIAL: '/api/reports/financial',
    },
} as const

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
    PRIMARY: 'blue-600',
    SECONDARY: 'gray-600',
    SUCCESS: 'green-600',
    WARNING: 'yellow-600',
    DANGER: 'red-600',
    INFO: 'blue-500',
} as const

// ============================================================================
// STATUS COLORS
// ============================================================================

export const STATUS_COLORS = {
    // Project statuses
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',

    // Expense statuses
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
} as const

// ============================================================================
// PROJECT CONSTANTS
// ============================================================================

export const PROJECT_STATUSES = [
    { value: 'planning', label: 'Lập kế hoạch', color: 'gray' },
    { value: 'active', label: 'Đang hoạt động', color: 'green' },
    { value: 'on_hold', label: 'Tạm dừng', color: 'yellow' },
    { value: 'completed', label: 'Hoàn thành', color: 'blue' },
    { value: 'cancelled', label: 'Đã hủy', color: 'red' },
] as const

export const PRIORITIES = [
    { value: 'low', label: 'Thấp', color: 'gray' },
    { value: 'medium', label: 'Trung bình', color: 'blue' },
    { value: 'high', label: 'Cao', color: 'orange' },
    { value: 'urgent', label: 'Khẩn cấp', color: 'red' },
] as const

export const BILLING_TYPES = [
    { value: 'fixed', label: 'Giá cố định' },
    { value: 'hourly', label: 'Theo giờ' },
    { value: 'milestone', label: 'Theo mốc' },
] as const

// ============================================================================
// EXPENSE CONSTANTS
// ============================================================================

export const EXPENSE_STATUSES = [
    { value: 'draft', label: 'Bản nháp', color: 'gray' },
    { value: 'pending', label: 'Chờ duyệt', color: 'yellow' },
    { value: 'approved', label: 'Đã duyệt', color: 'green' },
    { value: 'rejected', label: 'Từ chối', color: 'red' },
] as const

export const EXPENSE_CATEGORIES = [
    { value: 'material', label: 'Vật tư' },
    { value: 'labor', label: 'Nhân công' },
    { value: 'equipment', label: 'Thiết bị' },
    { value: 'travel', label: 'Di chuyển' },
    { value: 'office', label: 'Văn phòng' },
    { value: 'other', label: 'Khác' },
] as const

// ============================================================================
// CACHE TIMES (milliseconds)
// ============================================================================

export const CACHE_TIME = {
    NONE: 0,
    SHORT: 1 * 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000,     // 5 minutes
    LONG: 15 * 60 * 1000,      // 15 minutes
    VERY_LONG: 60 * 60 * 1000, // 1 hour
    DAY: 24 * 60 * 60 * 1000,  // 24 hours
} as const

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
    MAX_PAGE_SIZE: 1000,
} as const

// ============================================================================
// VALIDATION
// ============================================================================

export const VALIDATION = {
    PROJECT: {
        NAME_MIN_LENGTH: 1,
        NAME_MAX_LENGTH: 200,
        DESCRIPTION_MAX_LENGTH: 2000,
        CODE_MIN_LENGTH: 3,
        CODE_MAX_LENGTH: 50,
    },
    CUSTOMER: {
        NAME_MIN_LENGTH: 1,
        NAME_MAX_LENGTH: 200,
        EMAIL_MAX_LENGTH: 255,
        PHONE_MAX_LENGTH: 20,
    },
    EXPENSE: {
        DESCRIPTION_MIN_LENGTH: 1,
        DESCRIPTION_MAX_LENGTH: 500,
        AMOUNT_MIN: 0,
        AMOUNT_MAX: 999999999999, // 999 billion
    },
} as const

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
    INPUT: 'yyyy-MM-dd',
    API: 'yyyy-MM-dd\'T\'HH:mm:ss',
} as const

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: {
        IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ALL: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
    },
} as const

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    ACCOUNTANT: 'accountant',
    EMPLOYEE: 'employee',
    WORKSHOP_EMPLOYEE: 'workshop_employee',
} as const

export const ROLE_LABELS = {
    [ROLES.ADMIN]: 'Quản trị viên',
    [ROLES.MANAGER]: 'Quản lý',
    [ROLES.ACCOUNTANT]: 'Kế toán',
    [ROLES.EMPLOYEE]: 'Nhân viên',
    [ROLES.WORKSHOP_EMPLOYEE]: 'Nhân viên xưởng',
} as const

// ============================================================================
// TYPE HELPERS
// ============================================================================

export type ProjectStatus = typeof PROJECT_STATUSES[number]['value']
export type Priority = typeof PRIORITIES[number]['value']
export type BillingType = typeof BILLING_TYPES[number]['value']
export type ExpenseStatus = typeof EXPENSE_STATUSES[number]['value']
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]['value']
export type Role = typeof ROLES[keyof typeof ROLES]
