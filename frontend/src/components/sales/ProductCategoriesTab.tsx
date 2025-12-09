'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Category = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export default function ProductCategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCategories((data || []) as unknown as Category[])
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách hạng mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      const { error } = await supabase
        .from('product_categories')
        .insert({ name: name.trim(), description: description.trim() || null, is_active: true })
      if (error) throw error
      
      // Show success message
      setSuccess(`Hạng mục "${name.trim()}" đã được tạo thành công!`)
      
      setName('')
      setDescription('')
      await loadCategories()
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (e: any) {
      setError(e.message || 'Không thể tạo hạng mục')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: !isActive })
        .eq('id', id)
      if (error) throw error
      setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !isActive } : c))
    } catch (e) {
      // ignore minimal error handling
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditDescription(category.description || '')
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setError(null)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      setError('Tên hạng mục không được để trống')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      const { error } = await supabase
        .from('product_categories')
        .update({ 
          name: editName.trim(), 
          description: editDescription.trim() || null 
        })
        .eq('id', id)
      if (error) throw error
      
      setSuccess(`Hạng mục "${editName.trim()}" đã được cập nhật thành công!`)
      await loadCategories()
      cancelEdit()
      
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (e: any) {
      setError(e.message || 'Không thể cập nhật hạng mục')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, categoryName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hạng mục "${categoryName}"?\n\nLưu ý: Các sản phẩm thuộc hạng mục này sẽ không bị xóa, nhưng sẽ không còn thuộc hạng mục nào.`)) {
      return
    }
    
    try {
      setDeletingId(id)
      setError(null)
      setSuccess(null)
      
      // Check if there are products using this category
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1)
      
      if (products && products.length > 0) {
        setError(`Không thể xóa hạng mục "${categoryName}" vì còn sản phẩm đang sử dụng. Vui lòng chuyển các sản phẩm sang hạng mục khác trước.`)
        setDeletingId(null)
        return
      }
      
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setSuccess(`Hạng mục "${categoryName}" đã được xóa thành công!`)
      await loadCategories()
      
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (e: any) {
      setError(e.message || 'Không thể xóa hạng mục')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tạo hạng mục</h3>
        
        {/* Success Notification */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-600 hover:text-green-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Notification */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Tên hạng mục <span className="text-red-500 font-bold">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ví dụ: Nội thất"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Mô tả</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ghi chú mô tả cho hạng mục"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Đang tạo...' : 'Tạo hạng mục'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="text-xl font-bold text-gray-900">Danh sách hạng mục</h4>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 text-gray-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">Chưa có hạng mục</p>
                <p className="text-sm text-gray-500">Tạo hạng mục đầu tiên bằng form phía trên</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm">
                  {editingId === c.id ? (
                    // Edit mode
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Tên hạng mục <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Ví dụ: Nội thất"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Mô tả</label>
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Ghi chú mô tả cho hạng mục"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdate(c.id)}
                          disabled={submitting || !editName.trim()}
                          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={submitting}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{c.name}</h5>
                        <div className="flex items-center space-x-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            c.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              c.is_active ? 'bg-green-400' : 'bg-gray-400'
                            }`}></span>
                            {c.is_active ? 'Đang hoạt động' : 'Đã ngưng'}
                          </span>
                          <span className="text-sm text-gray-500">
                            Tạo: {new Date(c.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-sm text-gray-600 mt-2">{c.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => startEdit(c)}
                          className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId === c.id}
                          className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === c.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                        <button
                          onClick={() => toggleActive(c.id, c.is_active)}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            c.is_active 
                              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-300' 
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200 hover:border-green-300'
                          }`}
                        >
                          {c.is_active ? 'Ngưng hoạt động' : 'Kích hoạt'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


