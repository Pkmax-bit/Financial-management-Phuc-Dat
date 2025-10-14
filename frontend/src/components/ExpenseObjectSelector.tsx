'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Search, Plus } from 'lucide-react'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface ExpenseObjectSelectorProps {
  value?: string
  onChange: (value: string) => void
  onAddNew?: () => void
  placeholder?: string
  disabled?: boolean
}

export default function ExpenseObjectSelector({
  value,
  onChange,
  onAddNew,
  placeholder = "Chọn đối tượng chi phí",
  disabled = false
}: ExpenseObjectSelectorProps) {
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Load expense objects
  const loadExpenseObjects = async () => {
    try {
      setLoading(true)
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      try {
        const res = await fetch(`${base}/api/expense-objects/?active_only=true`, { credentials: 'omit' })
        if (res.ok) {
          const data = await res.json()
          setExpenseObjects(Array.isArray(data) ? data : [])
          return
        }
        if (res.status === 401 || res.status === 403) throw new Error('auth')
      } catch (authErr) {
        const res2 = await fetch(`${base}/api/expense-objects/public?active_only=true`, { credentials: 'omit' })
        if (res2.ok) {
          const data2 = await res2.json()
          setExpenseObjects(Array.isArray(data2) ? data2 : [])
        } else {
          setExpenseObjects([])
        }
      }
    } catch (err) {
      console.error('Error loading expense objects:', err)
      setExpenseObjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenseObjects()
  }, [])

  // Filter objects based on search term
  const filteredObjects = expenseObjects.filter(obj =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get selected object
  const selectedObject = expenseObjects.find(obj => obj.id === value)

  // Handle selection
  const handleSelect = (objectId: string) => {
    onChange(objectId)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Handle add new
  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew()
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedObject ? 'text-gray-900' : 'text-gray-500'}>
            {selectedObject ? selectedObject.name : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search */}
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
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <div className="mt-2">Đang tải...</div>
              </div>
            ) : filteredObjects.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'Không tìm thấy đối tượng nào' : 'Chưa có đối tượng chi phí'}
              </div>
            ) : (
              filteredObjects.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => handleSelect(obj.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    value === obj.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{obj.name}</div>
                  {obj.description && (
                    <div className="text-sm text-gray-500 truncate">{obj.description}</div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add New Button */}
          {onAddNew && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm đối tượng mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
