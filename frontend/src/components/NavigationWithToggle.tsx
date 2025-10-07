'use client'

import { useState } from 'react'
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import SupportCenterButton from './SupportCenterButton'
import { getRoleDisplayName, getRoleColor, type UserRole } from '@/utils/rolePermissions'

interface NavigationWithToggleProps {
  user?: {
    full_name?: string
    role?: string
    email?: string
  }
  onLogout?: () => void
}

export default function NavigationWithToggle({ user, onLogout }: NavigationWithToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const userRole = (user?.role?.toLowerCase() || 'customer') as UserRole

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
      name: 'Nhân viên',
      href: '/employees',
      icon: Users,
      description: 'Quản lý nhân viên'
    },
    {
      name: 'Dự án',
      href: '/projects',
      icon: FolderOpen,
      description: 'Quản lý dự án'
    },
    {
      name: 'Bán hàng',
      href: '/sales',
      icon: Receipt,
      description: 'Quản lý bán hàng'
    },
    {
      name: 'Chi phí',
      href: '/expenses',
      icon: DollarSign,
      description: 'Quản lý chi phí'
    },
    {
      name: 'Báo cáo',
      href: '/reports',
      icon: BarChart3,
      description: 'Báo cáo tài chính'
    },
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      description: 'Quản lý thông báo'
    },
    {
      name: 'Files',
      href: '/files',
      icon: FileText,
      description: 'Quản lý files'
    },
    {
      name: 'AI Analysis',
      href: '/ai-analysis',
      icon: Brain,
      description: 'Phân tích AI'
    },
    {
      name: 'AI Image Reader',
      href: '/ai-image-reader',
      icon: Camera,
      description: 'Đọc ảnh bằng AI'
    },
    {
      name: 'AI Model Info',
      href: '/ai-model-info',
      icon: Brain,
      description: 'Thông tin model AI'
    },
    {
      name: 'Test API',
      href: '/test-api',
      icon: TestTube,
      description: 'Test AI API'
    },
    {
      name: 'Camera Guide',
      href: '/camera-guide',
      icon: Camera,
      description: 'Hướng dẫn setup camera cho AI'
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}>
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
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.description}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <span className="truncate">{item.name}</span>
              </button>
            )
          })}
          
          {/* Support Center - Moved into scrollable area */}
          <div className="mt-4 mb-2">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Hỗ trợ
            </div>
            <div className="px-3">
              <SupportCenterButton />
            </div>
          </div>
          </div>
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-xs font-bold text-white">
                  {user.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user.full_name || 'User'}
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userRole)} text-white shadow-sm`}>
                    {getRoleDisplayName(userRole)}
                  </span>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 transition-all duration-300 ${
          sidebarOpen ? 'left-60' : 'left-4'
        } hover:bg-gray-50`}
        title={sidebarOpen ? 'Đóng sidebar' : 'Mở sidebar'}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Content Area */}
      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* This will be the content area that adjusts based on sidebar state */}
      </div>
    </>
  )
}

