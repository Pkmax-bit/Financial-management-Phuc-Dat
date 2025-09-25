'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Building2, 
  FolderOpen, 
  Receipt, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Bell,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Get user details from custom users table
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
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const stats = [
    {
      title: 'Total Employees',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: '8',
      change: '+3',
      changeType: 'positive',
      icon: FolderOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Total Customers',
      value: '156',
      change: '+8%',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: 'Monthly Revenue',
      value: '₫45.2M',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-yellow-500'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'expense',
      description: 'New expense submitted by John Doe',
      time: '2 minutes ago',
      icon: Receipt,
      color: 'text-orange-500'
    },
    {
      id: 2,
      type: 'invoice',
      description: 'Invoice #INV-001 paid by ABC Company',
      time: '15 minutes ago',
      icon: FileText,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'project',
      description: 'Project "Website Redesign" status updated',
      time: '1 hour ago',
      icon: FolderOpen,
      color: 'text-blue-500'
    },
    {
      id: 4,
      type: 'employee',
      description: 'New employee Sarah Wilson added',
      time: '2 hours ago',
      icon: Users,
      color: 'text-purple-500'
    }
  ]

  const quickActions = [
    {
      title: 'Add Employee',
      description: 'Add a new employee to the system',
      icon: Users,
      href: '/employees/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice',
      icon: FileText,
      href: '/invoices/new',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'New Project',
      description: 'Start a new project',
      icon: FolderOpen,
      href: '/projects/new',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Add Expense',
      description: 'Record a new expense',
      icon: Receipt,
      href: '/expenses/new',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-gray-900">Financial Management</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {/* Navigation items will be added here */}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900">Financial Management</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {/* Navigation items will be added here */}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role || 'employee'}
                </p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden -ml-2 mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="mt-2 text-gray-600">
              Here's what's happening with your business today.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <a
                      key={index}
                      href={action.href}
                      className={`flex items-center p-3 rounded-lg text-white transition-colors ${action.color}`}
                    >
                      <action.icon className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-500">
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-gray-100`}>
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
