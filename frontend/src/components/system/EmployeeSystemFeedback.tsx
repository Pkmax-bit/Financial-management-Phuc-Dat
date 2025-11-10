'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, MessageCircle, Bug, Lightbulb, Palette, Zap, FileText } from 'lucide-react'
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

export default function EmployeeSystemFeedback() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    id: '' as string | '',
    title: '',
    content: '',
    category: 'other' as Feedback['category'],
    priority: 'medium' as Feedback['priority'],
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
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter(it => it.title.toLowerCase().includes(s) || it.content.toLowerCase().includes(s))
  }, [items, search])

  const resetForm = () => setForm({ id: '', title: '', content: '', category: 'other', priority: 'medium' })

  const submit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
      
      if (form.id) {
        const res = await fetch(`/api/feedback/system/${form.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({
            title: form.title,
            content: form.content,
            category: form.category,
            priority: form.priority,
            status: 'open',
          })
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(`Update failed: ${res.status} ${errorData.detail || res.statusText}`)
        }
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
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(`Create failed: ${res.status} ${errorData.detail || res.statusText}`)
        }
      }
      
      await load()
      setShowForm(false)
      resetForm()
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
      
      // Show more specific error messages
      let errorMessage = 'Lỗi không xác định'
      
      if (error.message.includes('No authentication token')) {
        errorMessage = 'Bạn cần đăng nhập lại để thực hiện thao tác này'
      } else if (error.message.includes('403')) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này'
      } else if (error.message.includes('404')) {
        errorMessage = 'Không tìm thấy góp ý này'
      } else if (error.message.includes('500')) {
        errorMessage = 'Lỗi server, vui lòng thử lại sau'
      } else if (error.message.includes('admin_notes')) {
        errorMessage = 'Database schema chưa được cập nhật. Vui lòng liên hệ admin.'
      } else {
        errorMessage = `Lỗi khi tạo góp ý: ${error.message}`
      }
      
      alert(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">💬 Góp Ý Hệ Thống</h2>
            <p className="text-gray-600">Chia sẻ ý kiến, báo cáo lỗi hoặc đề xuất cải tiến hệ thống</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
              <span className="text-sm text-gray-500">Tổng số góp ý của tôi:</span>
              <span className="ml-2 font-semibold text-green-600">{items.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Tìm kiếm góp ý của bạn..."
             className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-black placeholder-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
           />
        </div>
        <button 
          onClick={() => { setShowForm(true); resetForm(); }} 
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Góp Ý Mới
        </button>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              <span>Đang tải...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="mx-auto h-12 w-12" />
            </div>
             <h3 className="text-lg font-medium text-black mb-2">Chưa có góp ý nào</h3>
             <p className="text-gray-800 mb-4">Hãy chia sẻ ý kiến đầu tiên của bạn về hệ thống</p>
            <button 
              onClick={() => { setShowForm(true); resetForm(); }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo góp ý đầu tiên
            </button>
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
                     <p className="text-gray-800 text-sm mb-3 line-clamp-2">{it.content}</p>
                     <div className="flex items-center text-xs text-black">
                       <span className="font-medium">Tạo lúc: {new Date(it.created_at).toLocaleString('vi-VN')}</span>
                       {it.updated_at !== it.created_at && (
                         <span className="ml-4 font-medium">Cập nhật: {new Date(it.updated_at).toLocaleString('vi-VN')}</span>
                       )}
                     </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => { setShowForm(true); setForm({ id: it.id, title: it.title, content: it.content, category: it.category as any, priority: it.priority as any }); }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1"/>
                      Sửa
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
                    {form.id ? 'Sửa Góp Ý' : '💬 Góp Ý Mới'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {form.id ? 'Chỉnh sửa góp ý của bạn' : 'Chia sẻ ý kiến về hệ thống'}
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
                  <label className="block text-sm font-medium text-black mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                   <input 
                     value={form.title} 
                     onChange={(e) => setForm({ ...form, title: e.target.value })} 
                     placeholder="Nhập tiêu đề góp ý..."
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                   />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                   <textarea 
                     value={form.content} 
                     onChange={(e) => setForm({ ...form, content: e.target.value })} 
                     rows={4} 
                     placeholder="Mô tả chi tiết góp ý của bạn..."
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none" 
                   />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Loại góp ý</label>
                     <select 
                       value={form.category} 
                       onChange={(e) => setForm({ ...form, category: e.target.value as any })} 
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                     >
                      <option value="bug">🐛 Báo lỗi</option>
                      <option value="idea">💡 Ý tưởng mới</option>
                      <option value="uiux">🎨 Giao diện/Trải nghiệm</option>
                      <option value="performance">⚡ Hiệu năng</option>
                      <option value="other">📝 Khác</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Mức độ ưu tiên</label>
                     <select 
                       value={form.priority} 
                       onChange={(e) => setForm({ ...form, priority: e.target.value as any })} 
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                     >
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🟠 Cao</option>
                      <option value="critical">🔴 Nghiêm trọng</option>
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
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {form.id ? 'Cập nhật' : 'Gửi góp ý'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
