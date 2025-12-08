'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  FolderOpen,
  FileText,
  Send,
  DollarSign,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  CreditCard
} from 'lucide-react'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { supabase } from '@/lib/supabase'

interface User {
  full_name?: string
  role?: string
  email?: string
}

interface WorkflowStep {
  id: number
  title: string
  description: string
  icon: any
  actions?: {
    label: string
    icon: any
    href: string
    color: string
  }[]
  route?: string
}

export default function WorkflowPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (userData) {
            setUser(userData)
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
      } finally {
        setUserLoading(false)
      }
    }

    checkUser()
  }, [router])

  const workflowSteps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Tạo khách hàng',
      description: 'Thêm thông tin khách hàng mới vào hệ thống',
      icon: Building2,
      route: '/customers',
      actions: [
        {
          label: 'Tạo khách hàng',
          icon: Building2,
          href: '/customers',
          color: 'bg-blue-500 hover:bg-blue-600'
        }
      ]
    },
    {
      id: 2,
      title: 'Tạo dự án',
      description: 'Tạo dự án mới và liên kết với khách hàng',
      icon: FolderOpen,
      route: '/projects',
      actions: [
        {
          label: 'Tạo dự án',
          icon: FolderOpen,
          href: '/projects',
          color: 'bg-green-500 hover:bg-green-600'
        }
      ]
    },
    {
      id: 3,
      title: 'Tạo báo giá',
      description: 'Tạo báo giá cho dự án và gửi cho khách hàng',
      icon: FileText,
      route: '/sales',
      actions: [
        {
          label: 'Tạo báo giá',
          icon: FileText,
          href: '/sales?tab=quotes',
          color: 'bg-purple-500 hover:bg-purple-600'
        }
      ]
    },
    {
      id: 4,
      title: 'Xuất PDF và Duyệt thành Hóa đơn',
      description: 'Xuất báo giá ra PDF hoặc duyệt để chuyển thành hóa đơn',
      icon: FileText,
      route: '/sales',
      actions: [
        {
          label: 'Xuất PDF',
          icon: Send,
          href: '/sales?tab=quotes',
          color: 'bg-indigo-500 hover:bg-indigo-600'
        },
        {
          label: 'Duyệt thành Hóa đơn',
          icon: DollarSign,
          href: '/sales?tab=quotes',
          color: 'bg-green-500 hover:bg-green-600'
        }
      ]
    },
    {
      id: 5,
      title: 'Tạo chi phí kế hoạch',
      description: 'Lập kế hoạch chi phí dự án',
      icon: Receipt,
      route: '/expenses',
      actions: [
        {
          label: 'Tạo chi phí kế hoạch',
          icon: Receipt,
          href: '/expenses?tab=project-expenses',
          color: 'bg-orange-500 hover:bg-orange-600'
        }
      ]
    },
    {
      id: 6,
      title: 'Xuất PDF và Duyệt thành Chi phí thực tế',
      description: 'Xuất chi phí kế hoạch ra PDF hoặc duyệt để chuyển thành chi phí thực tế',
      icon: Receipt,
      route: '/expenses',
      actions: [
        {
          label: 'Xuất PDF',
          icon: Send,
          href: '/expenses?tab=project-expenses',
          color: 'bg-indigo-500 hover:bg-indigo-600'
        },
        {
          label: 'Duyệt thành Chi phí thực tế',
          icon: DollarSign,
          href: '/expenses?tab=project-expenses',
          color: 'bg-red-500 hover:bg-red-600'
        }
      ]
    },
    {
      id: 7,
      title: 'Ghi nhận thanh toán',
      description: 'Khi khách hàng thanh toán, ghi nhận số tiền đã thanh toán vào hóa đơn',
      icon: CreditCard,
      route: '/sales',
      actions: [
        {
          label: 'Ghi nhận thanh toán',
          icon: DollarSign,
          href: '/sales?tab=invoices',
          color: 'bg-emerald-500 hover:bg-emerald-600'
        }
      ]
    }
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quy trình Quản lý Tài chính</h1>
            <p className="text-gray-600">
              Hướng dẫn các bước thực hiện trong quy trình quản lý tài chính và dự án
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-6">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              const isLast = index === workflowSteps.length - 1

              return (
                <div key={step.id} className="relative">
                  {/* Connector Line */}
                  {!isLast && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-300"></div>
                  )}

                  {/* Step Card */}
                  <div className="relative bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{step.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              B{step.id}: {step.title}
                            </h3>
                            <p className="text-gray-600">{step.description}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        {step.actions && step.actions.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {step.actions.map((action, actionIndex) => {
                              const ActionIcon = action.icon
                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() => router.push(action.href)}
                                  className={`${action.color} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
                                >
                                  <ActionIcon className="h-4 w-4" />
                                  <span className="text-sm font-medium">{action.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Card */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Tóm tắt quy trình
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-2">Quy trình bán hàng:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Tạo khách hàng → Tạo dự án → Tạo báo giá</li>
                  <li>Xuất PDF báo giá hoặc duyệt thành hóa đơn</li>
                  <li>Ghi nhận thanh toán khi khách trả tiền</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Quy trình chi phí:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Tạo chi phí kế hoạch cho dự án</li>
                  <li>Xuất PDF hoặc duyệt thành chi phí thực tế</li>
                  <li>Theo dõi và quản lý chi phí dự án</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}

