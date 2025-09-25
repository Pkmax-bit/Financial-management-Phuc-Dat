'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  Home,
  Users,
  Building2,
  FileText,
  Receipt,
  FolderOpen,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Package,
  FileSpreadsheet,
  DollarSign
} from 'lucide-react'

interface NavigationProps {
  user?: {
    full_name?: string
    role?: string
    email?: string
  }
  onLogout?: () => void
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Tổng quan hệ thống'
    },
    {
      name: 'Khách hàng',
      href: '/customers',
      icon: Building2,
      description: 'Quản lý khách hàng'
    },
    {
      name: 'Chi phí',
      href: '/expenses',
      icon: Receipt,
      description: 'Theo dõi chi phí'
    },
    {
      name: 'Bán hàng',
      href: '/sales',
      icon: DollarSign,
      description: 'Báo giá, hóa đơn và thanh toán'
    },
    {
      name: 'Báo cáo',
      href: '/reports',
      icon: BarChart3,
      description: 'Báo cáo và phân tích'
    },
    {
      name: 'Dự án',
      href: '/projects',
      icon: FolderOpen,
      description: 'Quản lý dự án'
    },
    {
      name: 'Nhân sự',
      href: '/employees',
      icon: Users,
      description: 'Quản lý nhân viên'
    },
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      description: 'Thông báo hệ thống'
    },
    {
      name: 'Files',
      href: '/files',
      icon: FileSpreadsheet,
      description: 'Quản lý tài liệu'
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">QuickBooks</h1>
            <p className="text-xs text-gray-500">Hệ thống quản lý</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex-1 text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'backen@vanphuthanh.net'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.role || 'Nhân viên'}
            </p>
          </div>
        </div>
        
        {/* User Actions */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => router.push('/settings')}
            className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4 mr-1" />
            Cài đặt
          </button>
          <button
            onClick={() => router.push('/notifications')}
            className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-4 h-4 mr-1" />
            Thông báo
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}