'use client'

import { useState, createContext, useContext } from 'react'
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
  ChevronRight,
  Eye
} from 'lucide-react'
import SupportCenterButton from './SupportCenterButton'
import { getNavigationByCategory, getRoleDisplayName, getRoleColor, getCategoryDisplayName, type UserRole } from '@/utils/rolePermissions'

interface LayoutWithSidebarProps {
  children: React.ReactNode
  user?: {
    full_name?: string
    role?: string
    email?: string
  }
  onLogout?: () => void
}

interface SidebarContextType {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a LayoutWithSidebar')
  }
  return context
}

export default function LayoutWithSidebar({ children, user, onLogout }: LayoutWithSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Get user role and navigation based on role
  const userRole = (user?.role?.toLowerCase() || 'customer') as UserRole
  const navigationByCategory = getNavigationByCategory(userRole)
  
  // Icon mapping for dynamic icons
  const iconMap: Record<string, any> = {
    Home,
    Building2,
    FolderOpen,
    Receipt,
    DollarSign,
    BarChart3,
    Eye,
    Users,
    Bell,
    FileText,
    Brain,
    Camera,
    TestTube
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const sidebarContextValue: SidebarContextType = {
    sidebarOpen,
    toggleSidebar
  }

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="min-h-screen bg-gray-50">
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
            {Object.entries(navigationByCategory).map(([category, items]) => (
              <div key={category} className="mb-4">
                {/* Category header */}
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {getCategoryDisplayName(category)}
                </div>
                
                {/* Category items */}
                {items.map((item) => {
                  const Icon = iconMap[item.icon] || Home
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
              </div>
            ))}
            </div>
          </nav>

          {/* User Section */}
          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || 'User'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)} text-white`}>
                      {getRoleDisplayName(userRole)}
                    </span>
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="mt-3 w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Đăng xuất
                </button>
              )}
            </div>
          )}

          {/* Support Center */}
          <div className="border-t border-gray-200 p-4">
            <SupportCenterButton />
          </div>
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
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
