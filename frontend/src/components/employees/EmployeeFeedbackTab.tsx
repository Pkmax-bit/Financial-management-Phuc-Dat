'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Edit, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Feedback = {
  id: string
  employee_id: string
  given_by: string
  title: string
  content: string
  category: 'performance' | 'behavior' | 'attendance' | 'kudos' | 'other'
  rating?: number | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function EmployeeFeedbackTab({ employeeId }: { employeeId?: string }) {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    id: '' as string | '',
    title: '',
    content: '',
    category: 'other' as Feedback['category'],
    rating: undefined as number | undefined,
    is_public: false,
  })

  useEffect(() => {
    load()
  }, [employeeId])

  const load = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const params = new URLSearchParams()
      if (employeeId) params.set('employee_id', employeeId)
      const res = await fetch(`/api/feedback/employee?${params.toString()}`, {
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        }
      })
      if (!res.ok) throw new Error('Failed to load feedbacks')
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

  const resetForm = () => setForm({ id: '', title: '', content: '', category: 'other', rating: undefined, is_public: false })

  const submit = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    }
    if (form.id) {
      const res = await fetch(`/api/feedback/employee/${form.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          rating: form.rating,
          is_public: form.is_public,
        })
      })
      if (!res.ok) throw new Error('Update failed')
    } else {
      const res = await fetch(`/api/feedback/employee`, {
        method: 'POST', headers,
        body: JSON.stringify({
          employee_id: employeeId,
          title: form.title,
          content: form.content,
          category: form.category,
          rating: form.rating,
          is_public: form.is_public,
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
    const res = await fetch(`/api/feedback/employee/${id}`, {
      method: 'DELETE',
      headers: {
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      }
    })
    if (!res.ok) throw new Error('Delete failed')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm góp ý..."
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Thêm góp ý
        </button>
      </div>

      {/* List */}
      <div className="border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-black">Tiêu đề</th>
              <th className="px-3 py-2 text-left text-black">Loại</th>
              <th className="px-3 py-2 text-left text-black">Đánh giá</th>
              <th className="px-3 py-2 text-left text-black">Công khai</th>
              <th className="px-3 py-2 text-right text-black">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={5}>Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={5}>Chưa có góp ý</td></tr>
            ) : (
              filtered.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2 text-black">
                    <div className="font-medium text-black">{it.title}</div>
                    <div className="text-xs text-black line-clamp-1">{it.content}</div>
                  </td>
                  <td className="px-3 py-2 text-black">{it.category}</td>
                  <td className="px-3 py-2 text-black">{it.rating ?? '-'}</td>
                  <td className="px-3 py-2 text-black">{it.is_public ? 'Có' : 'Không'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setShowForm(true); setForm({ id: it.id, title: it.title, content: it.content, category: it.category, rating: it.rating ?? undefined, is_public: it.is_public }); }} className="text-blue-600 hover:underline text-xs mr-3 inline-flex items-center"><Edit className="h-3 w-3 mr-1"/>Sửa</button>
                    <button onClick={() => remove(it.id)} className="text-red-600 hover:underline text-xs inline-flex items-center"><Trash2 className="h-3 w-3 mr-1"/>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-40" onClick={() => setShowForm(false)} />
      )}
      <div className={`fixed top-0 right-0 h-full w-[560px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-black">{form.id ? 'Sửa góp ý' : 'Thêm góp ý'}</div>
          <button onClick={() => setShowForm(false)} className="text-black hover:text-black">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Tiêu đề</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Nội dung</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Loại</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500">
                <option value="performance">Hiệu suất</option>
                <option value="behavior">Hành vi</option>
                <option value="attendance">Chấm công</option>
                <option value="kudos">Khen ngợi</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Đánh giá (1-5)</label>
              <input type="number" min={1} max={5} value={form.rating ?? ''} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : undefined })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center text-sm text-black"><input type="checkbox" className="mr-2" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} /><span className="text-black">Công khai cho nhân viên</span></label>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm text-black">Hủy</button>
          <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Lưu</button>
        </div>
      </div>
    </div>
  )
}


