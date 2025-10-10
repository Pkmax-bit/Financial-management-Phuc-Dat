/**
 * Role-based permissions for navigation and features
 */

export type UserRole = 
  | 'admin' 
  | 'sales' 
  | 'accountant' 
  | 'workshop_employee' 
  | 'worker' 
  | 'transport' 
  | 'customer' 
  | 'employee'

export interface NavigationItem {
  name: string
  href: string
  icon: any
  description: string
  roles: UserRole[]
  category?: string
}

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  sales: 80,
  accountant: 70,
  workshop_employee: 60,
  transport: 50,
  employee: 40,
  worker: 30,
  customer: 10
}

// Navigation items with role-based access
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
    description: 'Tổng quan hệ thống',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker', 'customer'],
    category: 'main'
  },
  {
    name: 'Khách hàng',
    href: '/customers',
    icon: 'Building2',
    description: 'Quản lý khách hàng',
    roles: ['admin', 'sales', 'accountant'],
    category: 'management'
  },
  {
    name: 'Dự án',
    href: '/projects',
    icon: 'FolderOpen',
    description: 'Quản lý dự án',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'management'
  },
  {
    name: 'Bán hàng',
    href: '/sales',
    icon: 'Receipt',
    description: 'Quản lý bán hàng',
    roles: ['admin', 'sales', 'accountant'],
    category: 'business'
  },
  {
    name: 'Chi phí',
    href: '/expenses',
    icon: 'DollarSign',
    description: 'Quản lý chi phí',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'business'
  },
  {
    name: 'Báo cáo',
    href: '/reports',
    icon: 'BarChart3',
    description: 'Báo cáo tài chính',
    roles: ['admin', 'sales', 'accountant'],
    category: 'reports'
  },
  {
    name: 'View khách hàng',
    href: '/customer-view',
    icon: 'Eye',
    description: 'Xem thông tin khách hàng và timeline công trình',
    roles: ['customer'],
    category: 'customer'
  },
  {
    name: 'Nhân viên',
    href: '/employees',
    icon: 'Users',
    description: 'Quản lý nhân viên',
    roles: ['admin', 'accountant'],
    category: 'management'
  },
  {
    name: 'Thông báo',
    href: '/notifications',
    icon: 'Bell',
    description: 'Quản lý thông báo',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker', 'customer'],
    category: 'system'
  },
  {
    name: 'Files',
    href: '/files',
    icon: 'FileText',
    description: 'Quản lý files',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'system'
  },
  {
    name: 'AI Analysis',
    href: '/ai-analysis',
    icon: 'Brain',
    description: 'Phân tích AI',
    roles: ['admin', 'sales', 'accountant'],
    category: 'ai'
  },
  {
    name: 'AI Model Info',
    href: '/ai-model-info',
    icon: 'Brain',
    description: 'Thông tin model AI',
    roles: ['admin'],
    category: 'ai'
  },
  {
    name: 'Test API',
    href: '/test-api',
    icon: 'TestTube',
    description: 'Test AI API',
    roles: ['admin'],
    category: 'development'
  },
  {
    name: 'Phân quyền',
    href: '/role-permissions',
    icon: 'Shield',
    description: 'Quản lý phân quyền hệ thống',
    roles: ['admin'],
    category: 'system'
  }
]

// Get navigation items for a specific role
export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return NAVIGATION_ITEMS.filter(item => item.roles.includes(role))
}

// Get navigation items grouped by category for a specific role
export function getNavigationByCategory(role: UserRole): Record<string, NavigationItem[]> {
  const items = getNavigationForRole(role)
  const grouped: Record<string, NavigationItem[]> = {}
  
  items.forEach(item => {
    const category = item.category || 'other'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(item)
  })
  
  return grouped
}

// Check if user has permission for a specific route
export function hasPermission(role: UserRole, route: string): boolean {
  const item = NAVIGATION_ITEMS.find(nav => nav.href === route)
  return item ? item.roles.includes(role) : false
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: 'Quản trị viên',
    sales: 'Nhân viên bán hàng',
    accountant: 'Kế toán',
    workshop_employee: 'Nhân viên xưởng',
    transport: 'Nhân viên vận chuyển',
    employee: 'Nhân viên',
    worker: 'Công nhân',
    customer: 'Khách hàng'
  }
  return displayNames[role] || role
}

// Get role color for UI
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-500',
    sales: 'bg-blue-500',
    accountant: 'bg-green-500',
    workshop_employee: 'bg-orange-500',
    transport: 'bg-yellow-500',
    employee: 'bg-green-600',
    worker: 'bg-purple-500',
    customer: 'bg-indigo-500'
  }
  return colors[role] || 'bg-gray-500'
}

// Get category display name
export function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    main: 'Chính',
    management: 'Quản lý',
    business: 'Kinh doanh',
    reports: 'Báo cáo',
    customer: 'Khách hàng',
    system: 'Hệ thống',
    ai: 'AI',
    development: 'Phát triển',
    help: 'Hỗ trợ',
    other: 'Khác'
  }
  return displayNames[category] || category
}
