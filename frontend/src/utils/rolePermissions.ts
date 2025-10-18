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
    description: 'Bước 1: Tạo khách hàng mới',
    roles: ['admin', 'sales', 'accountant'],
    category: 'workflow'
  },
  {
    name: 'Dự án',
    href: '/projects',
    icon: 'FolderOpen',
    description: 'Bước 2: Tạo dự án và quản lý team',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'workflow'
  },
  {
    name: 'Bán hàng & Báo giá',
    href: '/sales',
    icon: 'Receipt',
    description: 'Bước 3: Tạo báo giá và quản lý thanh toán',
    roles: ['admin', 'sales', 'accountant'],
    category: 'workflow'
  },
  {
    name: 'Chi phí & Ngân sách',
    href: '/expenses',
    icon: 'DollarSign',
    description: 'Bước 4-6: Ngân sách, duyệt và chi phí thực tế',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'workflow'
  },
  {
    name: 'Đối tượng chi phí',
    href: '/expense-objects',
    icon: 'Target',
    description: 'Quản lý các đối tượng chi phí trong dự án',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'management'
  },
  {
    name: 'Báo cáo & Phân tích',
    href: '/reports',
    icon: 'BarChart3',
    description: 'Bước 7: Báo cáo tài chính chi tiết',
    roles: ['admin', 'sales', 'accountant'],
    category: 'workflow'
  },
  {
    name: 'Tiến độ dự án (Khách hàng)',
    href: '/projects/timeline',
    icon: 'Eye',
    description: 'Bước 8: Khách hàng xem tiến độ dự án',
    roles: ['customer'],
    category: 'system'
  },
  {
    name: 'Tiến độ thi công',
    href: '/projects/kanban',
    icon: 'FolderOpen',
    description: 'Theo dõi tiến độ thi công nội bộ',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'system'
  },
  {
    name: 'Nhân viên',
    href: '/employees',
    icon: 'Users',
    description: 'Quản lý nhân viên và phân quyền',
    roles: ['admin', 'accountant'],
    category: 'management'
  },
  {
    name: 'Thông báo',
    href: '/notifications',
    icon: 'Bell',
    description: 'Thông báo hệ thống và cập nhật',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker', 'customer'],
    category: 'system'
  },
  {
    name: 'Góp ý hệ thống',
    href: '/system/feedback',
    icon: 'HelpCircle',
    description: 'Gửi góp ý, báo lỗi, đề xuất ý tưởng',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
    category: 'system'
  },
  {
    name: 'Files',
    href: '/files',
    icon: 'FileText',
    description: 'Quản lý tài liệu và chứng từ',
    roles: ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker'],
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
    workflow: 'Quy trình Quản lý Tài chính',
    management: 'Quản lý',
    customer: 'Khách hàng',
    system: 'Hệ thống',
    other: 'Khác'
  }
  return displayNames[category] || category
}
