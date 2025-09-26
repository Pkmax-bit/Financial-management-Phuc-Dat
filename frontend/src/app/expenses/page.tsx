'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import ExpensesTab from '@/components/expenses/ExpensesTab'
import BillsTab from '@/components/expenses/BillsTab'
import VendorsTab from '@/components/expenses/VendorsTab'

interface User {
  full_name?: string
  role?: string
  email?: string
}

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('expenses')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [expensesStats, setExpensesStats] = useState<unknown>({})
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchExpensesStats()
  }, [])

  // Create handlers for the tab components
  const handleCreateExpense = () => {
    // Navigate to create expense page or open modal
    console.log('Create expense')
  }

  const handleCreateBill = () => {
    // Navigate to create bill page or open modal
    console.log('Create bill')
  }

  const handleCreateVendor = () => {
    // Navigate to create vendor page or open modal
    console.log('Create vendor')
  }

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
      setLoading(false)
    }
  }

  const fetchExpensesStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      // Fetch expenses data
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, status')

      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
      const expensesCount = expensesData?.length || 0
      const pendingAmount = expensesData?.filter(e => e.status === 'pending').reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
      const pendingCount = expensesData?.filter(e => e.status === 'pending').length || 0

      // Fetch bills data
      const { data: billsData } = await supabase
        .from('bills')
        .select('amount, status')

      const totalBills = billsData?.reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0
      const billsCount = billsData?.length || 0

      // Fetch vendors data
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, is_active')

      const vendorsCount = vendorsData?.length || 0
      const activeVendors = vendorsData?.filter(v => v.is_active).length || 0

      setExpensesStats({
        total_expenses: totalExpenses,
        expenses_count: expensesCount,
        pending_amount: pendingAmount,
        pending_count: pendingCount,
        total_bills: totalBills,
        bills_count: billsCount,
        vendors_count: vendorsCount,
        active_vendors: activeVendors
      })
    } catch (error) {
      console.error('Error fetching expenses stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Äang táº£i...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Quáº£n lÃ½ Chi phÃ­</h1>
            <p className="mt-2 text-gray-600">
              Theo dÃµi vÃ  quáº£n lÃ½ chi phÃ­, hÃ³a Ä‘Æ¡n nhÃ  cung cáº¥p vÃ  nhÃ  cung cáº¥p
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-500">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tá»•ng chi phÃ­</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(((expensesStats as Record<string, unknown>).total_expenses as number) || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((expensesStats as Record<string, unknown>).expenses_count as number) || 0} phiáº¿u chi
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">HÃ³a Ä‘Æ¡n NCC</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(((expensesStats as Record<string, unknown>).total_bills as number) || 0)}
                  </p>
                  <p className="text-sm text-gray-500">{((expensesStats as Record<string, unknown>).bills_count as number) || 0} hÃ³a Ä‘Æ¡n</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chá» duyá»‡t</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(((expensesStats as Record<string, unknown>).pending_amount as number) || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((expensesStats as Record<string, unknown>).pending_count as number) || 0} phiáº¿u
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">NhÃ  cung cáº¥p</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((expensesStats as Record<string, unknown>).vendors_count as number) || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((expensesStats as Record<string, unknown>).active_vendors as number) || 0} hoáº¡t Ä‘á»™ng
                  </p>
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
                    onClick={() => setActiveTab('expenses')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'expenses'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className="w-4 h-4 inline mr-1" />
                    Chi phÃ­ ({((expensesStats as Record<string, unknown>).expenses_count as number) || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('bills')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'bills'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-1" />
                    HÃ³a Ä‘Æ¡n NCC ({((expensesStats as Record<string, unknown>).bills_count as number) || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('vendors')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'vendors'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline mr-1" />
                    NhÃ  cung cáº¥p ({((expensesStats as Record<string, unknown>).vendors_count as number) || 0})
                  </button>
                </nav>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={
                    activeTab === 'expenses' 
                      ? 'TÃ¬m kiáº¿m chi phÃ­...' 
                      : activeTab === 'bills' 
                      ? 'TÃ¬m kiáº¿m hÃ³a Ä‘Æ¡n NCC...' 
                      : 'TÃ¬m kiáº¿m nhÃ  cung cáº¥p...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'expenses' && (
                <ExpensesTab 
                  searchTerm={searchTerm}
                  onCreateExpense={handleCreateExpense}
                />
              )}
              {activeTab === 'bills' && (
                <BillsTab 
                  searchTerm={searchTerm}
                  onCreateBill={handleCreateBill}
                />
              )}
              {activeTab === 'vendors' && (
                <VendorsTab 
                  searchTerm={searchTerm}
                  onCreateVendor={handleCreateVendor}
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




