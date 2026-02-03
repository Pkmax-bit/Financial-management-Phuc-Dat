'use client'

import { useState, createContext, useContext, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Users,
  Building2,
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
  Eye,
  Palette,
  Lock,
  CheckSquare,
  PlayCircle,
  MessageSquare,
  Smartphone
} from 'lucide-react'
// Slider GIF icons (stored in repo /icon/slider)
import dashboardSlider from '../../../icon/slider/dashboard.gif'
import addCustomerSlider from '../../../icon/slider/add-customer.gif'
import openBookGearSlider from '../../../icon/slider/open-book-gear.gif'
import expenseSlider from '../../../icon/slider/expense.gif'
import quoteSlider from '../../../icon/slider/quote.gif'
import projectSlider from '../../../icon/slider/project.gif'
import reportSlider from '../../../icon/slider/report.gif'
import hrSlider from '../../../icon/slider/hr.gif'
import feedbackSlider from '../../../icon/slider/feedback.gif'
import managerFeedbackSlider from '../../../icon/slider/manager-feedback.gif'
import SupportCenterButton from './SupportCenterButton'
import NotificationBell from './notifications/NotificationBell'
import BackgroundSettings from './BackgroundSettings'
import FloatingActionsButton from './FloatingActionsButton'
import QRLoginModal from './QRLoginModal'
import { QRScannerModal } from './QRScannerModal'
import { useBackground } from '@/contexts/BackgroundContext'
import { getNavigationByCategory, getRoleDisplayName, getRoleColor, getCategoryDisplayName, type UserRole } from '@/utils/rolePermissions'
import { supabase } from '@/lib/supabase'

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
  hideSidebar: (hide: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a LayoutWithSidebar')
  }
  return context
}

// Helper component to render background based on config
function BackgroundRenderer() {
  const { background } = useBackground()

  const getBackgroundStyle = () => {
    switch (background.type) {
      case 'diagonal-cross-grid':
        return {
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
          `,
          backgroundSize: background.size || '40px 40px',
          backgroundColor: 'white'
        }

      case 'solid-white':
        return { backgroundColor: 'white' }

      case 'solid-gray':
        return { backgroundColor: '#f9fafb' } // gray-50

      case 'solid-blue':
        return { backgroundColor: '#eff6ff' } // blue-50

      case 'dots':
        return {
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: background.size || '20px 20px',
          backgroundColor: 'white'
        }

      case 'dots-large':
        return {
          backgroundImage: 'radial-gradient(circle, #e5e7eb 2px, transparent 2px)',
          backgroundSize: background.size || '30px 30px',
          backgroundColor: 'white'
        }

      case 'dots-small':
        return {
          backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)',
          backgroundSize: background.size || '15px 15px',
          backgroundColor: 'white'
        }

      case 'dots-cross':
        return {
          backgroundImage: `
            radial-gradient(circle, #e5e7eb 1px, transparent 1px),
            radial-gradient(circle, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 40px 40px',
          backgroundPosition: '0 0, 10px 10px',
          backgroundColor: 'white'
        }

      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: background.size || '40px 40px',
          backgroundColor: 'white'
        }

      case 'grid-small':
        return {
          backgroundImage: `
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: background.size || '20px 20px',
          backgroundColor: 'white'
        }

      case 'grid-large':
        return {
          backgroundImage: `
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: background.size || '60px 60px',
          backgroundColor: 'white'
        }

      case 'grid-thick':
        return {
          backgroundImage: `
            linear-gradient(#e5e7eb 2px, transparent 2px),
            linear-gradient(90deg, #e5e7eb 2px, transparent 2px)
          `,
          backgroundSize: background.size || '40px 40px',
          backgroundColor: 'white'
        }

      case 'grid-thin':
        return {
          backgroundImage: `
            linear-gradient(#e5e7eb 0.5px, transparent 0.5px),
            linear-gradient(90deg, #e5e7eb 0.5px, transparent 0.5px)
          `,
          backgroundSize: background.size || '40px 40px',
          backgroundColor: 'white'
        }

      case 'diagonal-lines':
        return {
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 11px)',
          backgroundColor: 'white'
        }

      case 'vertical-lines':
        return {
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)',
          backgroundColor: 'white'
        }

      case 'horizontal-lines':
        return {
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)',
          backgroundColor: 'white'
        }

      case 'isometric-grid':
        return {
          backgroundImage: `
            linear-gradient(30deg, transparent 0%, transparent 50%, rgba(229, 231, 235, 0.5) 50%, rgba(229, 231, 235, 0.5) 51%, transparent 51%),
            linear-gradient(-30deg, transparent 0%, transparent 50%, rgba(229, 231, 235, 0.5) 50%, rgba(229, 231, 235, 0.5) 51%, transparent 51%),
            linear-gradient(90deg, transparent 0%, transparent 50%, rgba(229, 231, 235, 0.3) 50%, rgba(229, 231, 235, 0.3) 51%, transparent 51%)
          `,
          backgroundSize: '60px 60px',
          backgroundColor: 'white'
        }

      case 'hexagonal-grid':
        return {
          backgroundImage: `
            linear-gradient(120deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 60px),
            linear-gradient(60deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 60px),
            linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 60px)
          `,
          backgroundSize: '60px 60px',
          backgroundColor: 'white'
        }

      case 'grid-spotlight':
        return {
          backgroundImage: `
            linear-gradient(90deg, rgba(16,185,129,0.25) 1px, transparent 0),
            linear-gradient(180deg, rgba(16,185,129,0.25) 1px, transparent 0),
            repeating-linear-gradient(45deg, rgba(16,185,129,0.2) 0 2px, transparent 2px 6px)
          `,
          backgroundSize: '24px 24px, 24px 24px, 24px 24px',
          backgroundColor: 'white'
        }

      case 'waves':
        return {
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              #e5e7eb 10px,
              #e5e7eb 11px
            )
          `,
          backgroundColor: 'white'
        }

      case 'custom':
        return background.customImage
          ? {
            backgroundImage: `url(${background.customImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }
          : { backgroundColor: 'white' }

      default:
        return { backgroundColor: 'white' }
    }
  }

  return (
    <div
      className="fixed inset-0"
      style={{
        ...getBackgroundStyle(),
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  )
}

export default function LayoutWithSidebar({ children, user, onLogout }: LayoutWithSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [forceHideSidebar, setForceHideSidebar] = useState(false)
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false)
  const [showQRLogin, setShowQRLogin] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showAppLauncher, setShowAppLauncher] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')

  // Get current user ID and access token
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const { data: { user: authUser }, data: { session } } = await supabase.auth.getUser()
        if (authUser) {
          setCurrentUserId(authUser.id)
          // Get access token from session
          if (session?.access_token) {
            setAccessToken(session.access_token)
          } else {
            // Fallback: try to get from localStorage
            const storedToken = localStorage.getItem('access_token')
            if (storedToken) {
              setAccessToken(storedToken)
            }
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }
    getCurrentUserId()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id)
        if (session.access_token) {
          setAccessToken(session.access_token)
        }
      } else {
        setCurrentUserId('')
        setAccessToken('')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
    Brain,
    Camera,
    TestTube,
    Settings,
    HelpCircle,
    CheckSquare,
    PlayCircle,
    MessageSquare,
    Smartphone
  }

  // Slider GIF icon mapping for app launcher (left panel)
  const sliderIconMap: Record<string, any> = {
    // Chính
    'Dashboard': dashboardSlider,
    'Quy trình': openBookGearSlider,

    // Khách hàng / Bán hàng
    'Khách hàng': addCustomerSlider,
    'Bán hàng & Báo giá': quoteSlider,

    // Dự án
    'Dự án': projectSlider,

    // Chi phí & Ngân sách
    'Chi phí & Ngân sách': expenseSlider,

    // Nhân sự
    'Nhân viên': hrSlider,

    // Phản hồi / hệ thống
    'Góp ý & Hỗ trợ': feedbackSlider,
    'Đánh giá nhân sự': managerFeedbackSlider,

    // Báo cáo
    'Báo cáo & Phân tích': reportSlider
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }


  const hideSidebar = (hide: boolean) => {
    setForceHideSidebar(hide)
  }

  const sidebarContextValue: SidebarContextType = {
    sidebarOpen,
    toggleSidebar,
    hideSidebar
  }

  // Sidebar is hidden if forceHideSidebar is true
  const shouldShowSidebar = sidebarOpen && !forceHideSidebar

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="min-h-screen w-full relative flex">
        {/* Background Renderer */}
        <BackgroundRenderer />

        {/* Mobile Sidebar Backdrop */}
        {shouldShowSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 z-50 bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start ${!sidebarOpen && 'lg:hidden'
          } w-64 flex flex-col`}>
          {/* Logo & Toggle Button */}
          <div className="flex items-center h-16 border-b border-gray-200 justify-between px-4">
            {true && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">QuickBooks</h1>
                  <p className="text-xs text-black">Hệ thống quản lý</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-[calc(100vh-8rem)] relative px-4">
            {/* Scroll indicator */}
            {true && (
              <>
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
              </>
            )}

            {/* Navigation items with padding for scroll indicators */}
            <div className="pt-1 pb-1">
              {Object.entries(navigationByCategory).map(([category, items]) => (
                <div key={category} className="mb-2">
                  {/* Category header */}
                  {true && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {getCategoryDisplayName(category)}
                    </div>
                  )}

                  {/* Category items */}
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || Home
                    const isActive = pathname === item.href

                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          handleNavigation(item.href)
                          // Close sidebar on mobile when navigating
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false)
                          }
                        }}
                        className={`w-full flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        title={item.description}
                      >
                        <Icon className={`mr-3 h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </button>
                    )
                  })}
                </div>
              ))}

              {/* Settings */}
              <div className="mt-4 mb-2 space-y-1">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cài đặt
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-700 hover:bg-gray-50"
                  title="Cài đặt"
                >
                  <Settings className="mr-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">Cài đặt</span>
                </button>
              </div>

              {/* Support Center - Moved into scrollable area */}
              <div className="mt-2 mb-2 space-y-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hỗ trợ
                </div>
                <div className="px-3 space-y-2">
                  <SupportCenterButton />
                  <button
                    onClick={() => handleNavigation('/change-password')}
                    className="w-full flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-700 hover:bg-gray-50 border border-gray-200"
                    title="Đổi mật khẩu"
                  >
                    <Lock className="mr-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">Đổi mật khẩu</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* User Section - Moved down */}
          {user && (
            <div className="border-t border-gray-200 bg-gray-50 shrink-0 p-3">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md shrink-0">
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
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="relative">
                    <NotificationBell />
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
            </div>
          )}
        </aside>

        {/* App Launcher Button (9-dot icon) - Always visible */}
        <button
          onClick={() => setShowAppLauncher(true)}
          className="fixed top-4 left-4 z-50 bg-white/95 border border-gray-200 rounded-xl shadow-lg p-3 transition-all duration-300 hover:bg-gray-50"
          title="Mở danh sách chức năng"
        >
          <div className="grid grid-cols-3 gap-1.5">
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
          </div>
        </button>


        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-auto transition-all duration-300">
          {children}
        </main>

        {/* Background Settings Modal */}
        <BackgroundSettings
          isOpen={showBackgroundSettings}
          onClose={() => setShowBackgroundSettings(false)}
        />

        {/* QR Login Modal (Web → Mobile) */}
        {accessToken && (
          <QRLoginModal
            isOpen={showQRLogin}
            onClose={() => setShowQRLogin(false)}
            accessToken={accessToken}
          />
        )}

        {/* QR Scanner Modal (Mobile → Web) */}
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />

        {/* App Launcher Overlay */}
        {showAppLauncher && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 flex items-stretch justify-start"
            onClick={() => setShowAppLauncher(false)}
          >
            <div
              className="bg-white rounded-r-2xl shadow-2xl w-[35%] min-w-[260px] h-full flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with search */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Tìm kiếm chức năng..."
                  className="flex-1 mr-3 px-3 py-2 rounded-lg border border-gray-300 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setShowAppLauncher(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content: grouped navigation items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {Object.entries(navigationByCategory).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {getCategoryDisplayName(category)}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((item) => {
                        const Icon = iconMap[item.icon] || Home
                        const sliderSrc = sliderIconMap[item.name]
                        const isActive = pathname === item.href

                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              handleNavigation(item.href)
                              setShowAppLauncher(false)
                            }}
                            className={`flex flex-col items-start rounded-xl border px-2.5 py-2 text-left transition-colors ${
                              isActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 mb-1.5 overflow-hidden">
                              {sliderSrc ? (
                                // Slider GIF icon
                                // NOTE: Đảm bảo các file tồn tại tại đường dẫn /icon/slider/*.gif
                                <img
                                  src={sliderSrc}
                                  alt={item.name}
                                  className="h-6 w-6 object-contain"
                                />
                              ) : (
                                <Icon className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="text-[13px] font-medium text-gray-900 truncate">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">
                                {item.description}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Actions Button - Combined Workflow and Chat */}
        {currentUserId && <FloatingActionsButton currentUserId={currentUserId} />}
      </div>
    </SidebarContext.Provider>
  )
}
