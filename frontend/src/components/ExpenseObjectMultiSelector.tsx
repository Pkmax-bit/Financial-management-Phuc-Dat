'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search, Check, X, Plus } from 'lucide-react'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface ExpenseObjectMultiSelectorProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  onAddNew?: () => void
  expenseObjects?: ExpenseObject[]
}

export default function ExpenseObjectMultiSelector({
  values,
  onChange,
  placeholder = 'Chọn nhiều đối tượng chi phí',
  disabled = false,
  onAddNew,
  expenseObjects: propExpenseObjects
}: ExpenseObjectMultiSelectorProps) {
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadExpenseObjects = async () => {
    try {
      setLoading(true)
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        const res = await fetch(`${base}/api/expense-objects/?active_only=true`, { credentials: 'omit' })
        if (res.ok) {
          const data = await res.json()
          setExpenseObjects(Array.isArray(data) ? data : [])
        } else {
          throw new Error('auth or server')
        }
      } catch (_err) {
        const res2 = await fetch(`${base}/api/expense-objects/public?active_only=true`, { credentials: 'omit' })
        if (res2.ok) {
          const data2 = await res2.json()
          setExpenseObjects(Array.isArray(data2) ? data2 : [])
        } else {
          setExpenseObjects([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Use provided expense objects or load from API
  useEffect(() => {
    if (propExpenseObjects) {
      setExpenseObjects(propExpenseObjects)
      setLoading(false)
    } else {
      loadExpenseObjects()
    }
  }, [propExpenseObjects])

  const filtered = useMemo(() => (
    expenseObjects.filter(obj =>
      obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ), [expenseObjects, searchTerm])

  const toggleValue = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter(v => v !== id))
    } else {
      onChange([...values, id])
    }
  }

  const clearAll = () => onChange([])

  const selectAllFiltered = () => onChange(Array.from(new Set([...
    values,
    ...filtered.map(o => o.id)
  ])))

  const selectedObjects = useMemo(() => (
    values
      .map(id => expenseObjects.find(o => o.id === id))
      .filter(Boolean) as ExpenseObject[]
  ), [values, expenseObjects])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            {selectedObjects.length === 0 && (
              <span className="text-gray-500">{placeholder}</span>
            )}
            {selectedObjects.slice(0, 3).map(obj => (
              <span key={obj.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {obj.name}
                <span
                  role="button"
                  aria-label="Bỏ chọn đối tượng"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggleValue(obj.id) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleValue(obj.id) } }}
                  className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
            {selectedObjects.length > 3 && (
              <span className="text-xs text-gray-600">+{selectedObjects.length - 3} nữa</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm đối tượng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <button type="button" onClick={selectAllFiltered} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">Chọn tất cả</button>
              <button type="button" onClick={clearAll} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">Bỏ chọn</button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <div className="mt-2">Đang tải...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'Không tìm thấy đối tượng nào' : 'Chưa có đối tượng chi phí'}
              </div>
            ) : (
              filtered.map(obj => {
                const checked = values.includes(obj.id)
                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => toggleValue(obj.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${checked ? 'bg-blue-50' : ''}`}
                  >
                    <div>
                      <div className={`font-medium ${checked ? 'text-blue-700' : 'text-gray-900'}`}>{obj.name}</div>
                      {obj.description && (
                        <div className="text-sm text-gray-500 truncate">{obj.description}</div>
                      )}
                    </div>
                    <div className={`w-5 h-5 border rounded flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {onAddNew && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => { onAddNew(); setIsOpen(false) }}
                className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm đối tượng mới
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}


