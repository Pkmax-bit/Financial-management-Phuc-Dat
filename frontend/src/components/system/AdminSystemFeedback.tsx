'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Settings, Bug, Lightbulb, Palette, Zap, FileText, Users, BarChart3, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Feedback = {
  id: string
  submitted_by: string
  title: string
  content: string
  category: 'bug' | 'idea' | 'uiux' | 'performance' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

const categoryIcons = {
  bug: <Bug className="h-4 w-4" />,
  idea: <Lightbulb className="h-4 w-4" />,
  uiux: <Palette className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />
}

const categoryLabels = {
  bug: 'Báo lỗi',
  idea: 'Ý tưởng',
  uiux: 'Giao diện',
  performance: 'Hiệu năng',
  other: 'Khác'
}

export default function AdminSystemFeedback() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    id: '' as string | '',
    title: '',
    content: '',
    category: 'other' as Feedback['category'],
    priority: 'medium' as Feedback['priority'],
    status: 'open' as Feedback['status'],
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/feedback/system`, {
        headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
      })
      if (!res.ok) throw new Error('Failed to load system feedbacks')
      const data = await res.json()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let filteredItems = items
    
    // Search filter
    const s = search.trim().toLowerCase()
    if (s) {
      filteredItems = filteredItems.filter(it => 
        it.title.toLowerCase().includes(s) || 
        it.content.toLowerCase().includes(s)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filteredItems = filteredItems.filter(it => it.status === statusFilter)
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filteredItems = filteredItems.filter(it => it.category === categoryFilter)
    }
    
    return filteredItems
  }, [items, search, statusFilter, categoryFilter])

  const stats = useMemo(() => {
    const total = items.length
    const open = items.filter(it => it.status === 'open').length
    const inProgress = items.filter(it => it.status === 'in_progress').length
    const resolved = items.filter(it => it.status === 'resolved').length
    const closed = items.filter(it => it.status === 'closed').length
    
    return { total, open, inProgress, resolved, closed }
  }, [items])

  const resetForm = () => setForm({ id: '', title: '', content: '', category: 'other', priority: 'medium', status: 'open' })

  const submit = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    }
    if (form.id) {
      const res = await fetch(`/api/feedback/system/${form.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          priority: form.priority,
          status: form.status,
        })
      })
      if (!res.ok) throw new Error('Update failed')
    } else {
      const res = await fetch(`/api/feedback/system`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          priority: form.priority,
        })
      })
      if (!res.ok) throw new Error('Create failed')
    }
    await load()
    setShowForm(false)
    resetForm()
  }

  const remove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/feedback/system/${id}`, {
      method: 'DELETE',
      headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
    })
    if (!res.ok) throw new Error('Delete failed')
    await load()
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ Quản Lý Góp Ý Hệ Thống</h2>
            <p className="text-gray-600">Quản lý và xử lý tất cả góp ý từ nhân viên</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
              <span className="text-sm text-gray-500">Tổng góp ý:</span>
              <span className="ml-2 font-semibold text-purple-600">{stats.total}</span>
            </div>
            <a
              href="/system/feedback/management"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Quản lý chi tiết
            </a>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tổng cộng</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="h-5 w-5 bg-blue-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Mở</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.open}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="h-5 w-5 bg-yellow-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đang xử lý</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="h-5 w-5 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đã xử lý</p>
              <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="h-5 w-5 bg-gray-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đóng</p>
              <p className="text-2xl font-semibold text-gray-600">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm góp ý..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-black font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all" className="text-black font-medium">Tất cả trạng thái</option>
                <option value="open" className="text-black font-medium">Mở</option>
                <option value="in_progress" className="text-black font-medium">Đang xử lý</option>
                <option value="resolved" className="text-black font-medium">Đã xử lý</option>
                <option value="closed" className="text-black font-medium">Đóng</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-black font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all" className="text-black font-medium">Tất cả loại</option>
                <option value="bug" className="text-black font-medium">Báo lỗi</option>
                <option value="idea" className="text-black font-medium">Ý tưởng</option>
                <option value="uiux" className="text-black font-medium">Giao diện</option>
                <option value="performance" className="text-black font-medium">Hiệu năng</option>
                <option value="other" className="text-black font-medium">Khác</option>
              </select>
            </div>
            
            <button 
              onClick={() => { setShowForm(true); resetForm(); }} 
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" /> 
              Thêm Góp Ý
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span>Đang tải...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có góp ý nào</h3>
            <p className="text-gray-500 mb-4">Chưa có góp ý nào phù hợp với bộ lọc</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((it, index) => (
              <div key={it.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{it.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        it.category === 'bug' ? 'bg-red-100 text-red-800' :
                        it.category === 'idea' ? 'bg-green-100 text-green-800' :
                        it.category === 'uiux' ? 'bg-purple-100 text-purple-800' :
                        it.category === 'performance' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {categoryIcons[it.category]}
                        <span className="ml-1">{categoryLabels[it.category]}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        it.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        it.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        it.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {it.priority === 'urgent' ? '🔴 Nghiêm trọng' :
                         it.priority === 'high' ? '🟠 Cao' :
                         it.priority === 'medium' ? '🟡 Trung bình' : '🟢 Thấp'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        it.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        it.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        it.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {it.status === 'open' ? '🔵 Mở' :
                         it.status === 'in_progress' ? '🟡 Đang xử lý' :
                         it.status === 'resolved' ? '🟢 Đã xử lý' : '⚫ Đóng'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{it.content}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Tạo lúc: {new Date(it.created_at).toLocaleString('vi-VN')}</span>
                      {it.updated_at !== it.created_at && (
                        <span className="ml-4">Cập nhật: {new Date(it.updated_at).toLocaleString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => { setShowForm(true); setForm({ id: it.id, title: it.title, content: it.content, category: it.category as any, priority: it.priority as any, status: it.status as any }); }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                    >
                      <Settings className="h-3 w-3 mr-1"/>
                      Quản lý
                    </button>
                    <button 
                      onClick={() => remove(it.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-end p-4">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-l-4 border-blue-500">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {form.id ? 'Quản Lý Góp Ý' : '⚙️ Thêm Góp Ý Mới'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {form.id ? 'Cập nhật thông tin góp ý' : 'Tạo góp ý mới cho hệ thống'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={form.title} 
                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                    placeholder="Nhập tiêu đề góp ý..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={form.content} 
                    onChange={(e) => setForm({ ...form, content: e.target.value })} 
                    rows={4} 
                    placeholder="Mô tả chi tiết góp ý..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none" 
                  />
                </div>

                {/* Category, Priority, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại góp ý</label>
                    <select 
                      value={form.category} 
                      onChange={(e) => setForm({ ...form, category: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="bug">🐛 Báo lỗi</option>
                      <option value="idea">💡 Ý tưởng mới</option>
                      <option value="uiux">🎨 Giao diện/Trải nghiệm</option>
                      <option value="performance">⚡ Hiệu năng</option>
                      <option value="other">📝 Khác</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
                    <select 
                      value={form.priority} 
                      onChange={(e) => setForm({ ...form, priority: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🟠 Cao</option>
                      <option value="critical">🔴 Nghiêm trọng</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                    <select 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="open">🔵 Mở</option>
                      <option value="in_progress">🟡 Đang xử lý</option>
                      <option value="resolved">🟢 Đã xử lý</option>
                      <option value="closed">⚫ Đóng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={submit}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {form.id ? 'Cập nhật' : 'Tạo góp ý'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
