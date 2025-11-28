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
  DollarSign,
  HelpCircle,
  Brain,
  TestTube,
  Camera,
  Lock,
  CheckSquare
} from 'lucide-react'
import SupportCenterButton from './SupportCenterButton'
import NotificationBell from './notifications/NotificationBell'

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
      description: 'Bước 1: Tạo khách hàng mới'
    },
    {
      name: 'Dự án',
      href: '/projects',
      icon: FolderOpen,
      description: 'Bước 2: Tạo dự án và quản lý team'
    },
    {
      name: 'Bán hàng & Báo giá',
      href: '/sales',
      icon: Receipt,
      description: 'Bước 3: Tạo báo giá và quản lý thanh toán'
    },
    {
      name: 'Chi phí & Ngân sách',
      href: '/expenses',
      icon: DollarSign,
      description: 'Bước 4-6: Ngân sách, duyệt và chi phí thực tế'
    },
    {
      name: 'Báo cáo & Phân tích',
      href: '/reports',
      icon: BarChart3,
      description: 'Bước 7: Báo cáo tài chính chi tiết'
    },
    {
      name: 'Nhân sự',
      href: '/employees',
      icon: Users,
      description: 'Quản lý nhân viên và phân quyền'
    },
    {
      name: 'Nhiệm vụ',
      href: '/tasks',
      icon: CheckSquare,
      description: 'Quản lý nhiệm vụ và nhóm làm việc'
    },
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      description: 'Thông báo hệ thống và cập nhật'
    },
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
            <p className="text-xs text-black">Hệ thống quản lý</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 max-h-[calc(100vh-8rem)] relative">
        {/* Scroll indicator */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
        
        {/* Navigation items with padding for scroll indicators */}
        <div className="pt-2 pb-2">
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
                  : 'text-black hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-black'}`} />
              <div className="flex-1 text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-black mt-0.5">{item.description}</div>
              </div>
            </button>
          )
        })}
        
        {/* Support Center + Change Password */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <SupportCenterButton />
          <button
            onClick={() => router.push('/change-password')}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-black bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Lock className="w-4 h-4 mr-1 text-gray-600" />
            Đổi mật khẩu
          </button>
        </div>
        </div>
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
            <p className="text-xs text-black truncate">
              {user?.email || 'backen@vanphuthanh.net'}
            </p>
            <p className="text-xs text-black truncate">
              {user?.role || 'Nhân viên'}
            </p>
          </div>
        </div>
        
        {/* User Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-black bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4 mr-1" />
            Cài đặt
          </button>
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-md py-2">
              <NotificationBell />
            </div>
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
    </div>
  )
}