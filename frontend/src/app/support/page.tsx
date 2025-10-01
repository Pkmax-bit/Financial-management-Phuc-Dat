'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  HelpCircle, 
  Plus, 
  Search, 
  BookOpen,
  Video,
  MessageCircle,
  Phone,
  Lightbulb,
  Target,
  Users,
  BarChart3,
  Receipt,
  FileText,
  Building2,
  ShoppingCart,
  User,
  PieChart,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  Star,
  ExternalLink,
  Home
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import SupportOverviewTab from '@/components/support/SupportOverviewTab'
import SupportModulesTab from '@/components/support/SupportModulesTab'
import SupportGuidesTab from '@/components/support/SupportGuidesTab'
import SupportVideosTab from '@/components/support/SupportVideosTab'
import SupportFAQTab from '@/components/support/SupportFAQTab'
import SupportContactTab from '@/components/support/SupportContactTab'

interface User {
  full_name?: string
  role?: string
  email?: string
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [supportStats, setSupportStats] = useState<unknown>({})
  const [shouldOpenCreateGuide, setShouldOpenCreateGuide] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

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
          // Fetch support stats after user is set
          fetchSupportStats()
        } else {
          router.push('/login')
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

  const fetchSupportStats = async () => {
    try {
      setLoading(true)
      // Mock support stats
      setSupportStats({
        total_guides: 12,
        total_videos: 4,
        total_faqs: 6,
        total_modules: 4
      })
    } catch (error) {
      console.error('Error fetching support stats:', error)
      setError('Không thể tải thống kê hỗ trợ')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleCreateGuide = () => {
    setShouldOpenCreateGuide(true)
  }

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />
      
      <div className="pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trung tâm Hỗ trợ</h1>
            <p className="mt-2 text-black">
              Hướng dẫn toàn diện cho tất cả các chức năng hệ thống
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    ((supportStats as Record<string, unknown>).total_guides as number) > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-black">
                    {((supportStats as Record<string, unknown>).total_guides as number) > 0 ? `${(supportStats as Record<string, unknown>).total_guides} hướng dẫn` : 'Chưa có dữ liệu'}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs text-black">Đã đăng nhập: {(user as { email?: string })?.email || 'Unknown'}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShouldOpenCreateGuide(true)}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hướng dẫn nhanh
                </button>
                <Link
                  href="/support/guide"
                  className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Hướng dẫn đầy đủ
                </Link>
                <Link
                  href="/support/help"
                  className="inline-flex items-center px-3 py-2 border border-purple-300 shadow-sm text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Trung tâm hỗ trợ
                </Link>
                <button
                  onClick={fetchSupportStats}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={fetchSupportStats}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Hướng dẫn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(supportStats as Record<string, unknown>).total_guides as number || 0}
                  </p>
                  <p className="text-sm text-black">Tài liệu hướng dẫn</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Video</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(supportStats as Record<string, unknown>).total_videos as number || 0}
                  </p>
                  <p className="text-sm text-black">Video hướng dẫn</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">FAQ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(supportStats as Record<string, unknown>).total_faqs as number || 0}
                  </p>
                  <p className="text-sm text-black">Câu hỏi thường gặp</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Modules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(supportStats as Record<string, unknown>).total_modules as number || 0}
                  </p>
                  <p className="text-sm text-black">Chức năng hỗ trợ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="px-6 py-3">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Tổng quan
                  </button>
                  <button
                    onClick={() => setActiveTab('modules')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'modules'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Theo Module
                  </button>
                  <button
                    onClick={() => setActiveTab('guides')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'guides'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    Hướng dẫn nhanh
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'videos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Video className="w-4 h-4 inline mr-1" />
                    Video hướng dẫn
                  </button>
                  <button
                    onClick={() => setActiveTab('faq')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'faq'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Câu hỏi thường gặp
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'contact'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Phone className="w-4 h-4 inline mr-1" />
                    Liên hệ hỗ trợ
                  </button>
                </nav>
              </div>
            </div>

            {/* Search Bar and Actions */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 mr-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-black" />
                </div>
                <input
                  type="text"
                  placeholder={
                    activeTab === 'overview' 
                      ? 'Tìm kiếm hỗ trợ...' 
                      : activeTab === 'modules' 
                        ? 'Tìm kiếm module...' 
                        : activeTab === 'guides'
                        ? 'Tìm kiếm hướng dẫn...'
                        : activeTab === 'videos'
                        ? 'Tìm kiếm video...'
                        : activeTab === 'faq'
                        ? 'Tìm kiếm câu hỏi...'
                        : 'Tìm kiếm liên hệ...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={handleCreateGuide}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo hướng dẫn
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <SupportOverviewTab 
                  searchTerm={searchTerm}
                  onCreateGuide={handleCreateGuide}
                />
              )}
              {activeTab === 'modules' && (
                <SupportModulesTab 
                  searchTerm={searchTerm}
                  onCreateGuide={handleCreateGuide}
                />
              )}
              {activeTab === 'guides' && (
                <SupportGuidesTab 
                  searchTerm={searchTerm}
                  onCreateGuide={handleCreateGuide}
                />
              )}
              {activeTab === 'videos' && (
                <SupportVideosTab 
                  searchTerm={searchTerm}
                  onCreateGuide={handleCreateGuide}
                />
              )}
              {activeTab === 'faq' && (
                <SupportFAQTab 
                  searchTerm={searchTerm}
                  onCreateGuide={handleCreateGuide}
                />
              )}
              {activeTab === 'contact' && (
                <SupportContactTab 
                  searchTerm={searchTerm}
                  onCreateGuide={handleCreateGuide}
                />
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
