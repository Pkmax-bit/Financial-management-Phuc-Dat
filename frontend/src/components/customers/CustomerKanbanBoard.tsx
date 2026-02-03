"use client"

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import CustomerKanbanColumn from './CustomerKanbanColumn'
import CustomerStatusManagementModal from './CustomerStatusManagementModal'
import { supabase } from '@/lib/supabase'
import { apiGet, apiPut, apiDelete } from '@/lib/api'
import { Plus, Settings, Filter, Tag, Edit2, Trash2 } from 'lucide-react'
import type { Customer } from '@/types'

interface CustomerStatus {
  id: string
  code: string
  name: string
  color: string
  display_order: number
  is_default: boolean
  is_system: boolean
  description?: string
}

interface CustomerKanbanBoardProps {
  onViewCustomer?: (customer: Customer) => void
  onAddCustomer?: () => void
  onEditCustomer?: (customer: Customer) => void
  onDeleteCustomer?: (customer: Customer) => void
}

export interface CustomerKanbanBoardRef {
  refresh: () => Promise<void>
}

const CustomerKanbanBoard = forwardRef<CustomerKanbanBoardRef, CustomerKanbanBoardProps>(
  ({ onViewCustomer, onAddCustomer, onEditCustomer, onDeleteCustomer }, ref) => {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [statuses, setStatuses] = useState<CustomerStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
    const [deletingStatusId, setDeletingStatusId] = useState<string | null>(null)
    const [editingStatus, setEditingStatus] = useState<CustomerStatus | null>(null)
    const [isDeletingStatus, setIsDeletingStatus] = useState(false)

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch statuses first
        const statusesData = await apiGet('/api/customers/statuses')
        setStatuses(statusesData || [])

        // Then fetch customers with status_id
        const { data, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setCustomers(data || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchData()
    }, [])

    useImperativeHandle(ref, () => ({
      refresh: fetchData
    }))

    const handleDragStart = (customer: Customer) => {
      setDraggedCustomer(customer)
    }

    const handleDragOver = (e: React.DragEvent, status: string) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverColumn(status)
    }

    const handleDragLeave = () => {
      setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedCustomer) return

      // Don't update if status is the same
      if (draggedCustomer.status_id === targetStatusId) {
        setDraggedCustomer(null)
        setDragOverColumn(null)
        return
      }

      try {
        // Find target status to get code for backward compatibility
        const targetStatus = statuses.find(s => s.id === targetStatusId)
        if (!targetStatus) {
          throw new Error('Không tìm thấy trạng thái')
        }

        // Update using API to ensure status_id is set
        await apiPut(`/api/customers/${draggedCustomer.id}`, {
          status_id: targetStatusId,
          status: targetStatus.code // Keep status for backward compatibility
        })

        // Update local state
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === draggedCustomer.id
              ? { ...c, status_id: targetStatusId, status: targetStatus.code as any }
              : c
          )
        )
      } catch (err) {
        console.error('Error updating customer status:', err)
        setError('Không thể cập nhật trạng thái khách hàng')
      } finally {
        setDraggedCustomer(null)
        setDragOverColumn(null)
      }
    }

    // Group customers by status_id
    const customersByStatusId: Record<string, Customer[]> = {}
    statuses.forEach(status => {
      customersByStatusId[status.id] = customers.filter(
        (c) => c.status_id === status.id || (!c.status_id && status.is_default)
      )
    })

    const handleAddStatus = () => {
      setEditingStatusId(null)
      setShowStatusModal(true)
    }

    const handleEditStatus = (status: CustomerStatus) => {
      setEditingStatus(status)
      setEditingStatusId(status.id)
      setShowStatusModal(true)
    }

    const handleDeleteStatus = async (statusId: string) => {
      if (!confirm('Bạn có chắc chắn muốn xóa trạng thái này?')) {
        return
      }

      try {
        setIsDeletingStatus(true)
        setDeletingStatusId(statusId)
        await apiDelete(`/api/customers/statuses/${statusId}`)
        await fetchData()
      } catch (err: any) {
        console.error('Error deleting status:', err)
        const errorMessage = err.message || err.response?.data?.detail || 'Không thể xóa trạng thái'
        setError(errorMessage)
        alert(errorMessage)
      } finally {
        setIsDeletingStatus(false)
        setDeletingStatusId(null)
      }
    }

    const handleManageStatuses = () => {
      setEditingStatusId(null)
      setShowStatusModal(true)
    }

    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Đang tải...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )
    }

    return (
      <div className="w-full">
        {/* Status Management Button and Filters */}
        <div className="mb-4 space-y-4">
          {/* Main filter row */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* Left side - can add filters here if needed */}
            <div className="flex items-center gap-4">
              {/* Placeholder for future filters */}
            </div>

            {/* Filter Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showAdvancedFilters
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
                title={showAdvancedFilters ? 'Ẩn bộ lọc nâng cao' : 'Hiện bộ lọc nâng cao'}
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {showAdvancedFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
                </span>
              </button>
            </div>

            {/* Management Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingStatus(null)
                  setEditingStatusId(null)
                  setShowStatusModal(true)
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Tạo trạng thái mới
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Placeholder for future filters */}
                <div className="text-sm text-gray-600">
                  Bộ lọc nâng cao sẽ được thêm vào sau
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board with Horizontal Scroll */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {statuses
              .sort((a, b) => a.display_order - b.display_order)
              .map((status) => {
                // Convert hex color sang lớp Tailwind, ưu tiên bảng màu cầu vồng
                const hexToColorClass = (hex: string): string => {
                  const colorMap: Record<string, string> = {
                    // Rainbow palette
                    '#EF4444': 'bg-red-100 text-red-800',       // Đỏ
                    '#F97316': 'bg-orange-100 text-orange-800', // Cam
                    '#FACC15': 'bg-yellow-100 text-yellow-800', // Vàng
                    '#22C55E': 'bg-green-100 text-green-800',   // Xanh lá
                    '#14B8A6': 'bg-teal-100 text-teal-800',     // Xanh ngọc
                    '#0EA5E9': 'bg-sky-100 text-sky-800',       // Xanh dương nhạt
                    '#3B82F6': 'bg-blue-100 text-blue-800',     // Xanh dương
                    '#6366F1': 'bg-indigo-100 text-indigo-800', // Chàm
                    '#8B5CF6': 'bg-violet-100 text-violet-800', // Tím
                    '#EC4899': 'bg-pink-100 text-pink-800',     // Hồng
                    // Neutrals
                    '#9CA3AF': 'bg-gray-100 text-gray-800',
                    '#4B5563': 'bg-gray-200 text-gray-900',
                    // Backwards-compat old palette
                    '#2FC6F6': 'bg-cyan-100 text-cyan-800',
                    '#2066B0': 'bg-blue-200 text-blue-900',
                    '#9ECF00': 'bg-lime-100 text-lime-800',
                    '#FFA900': 'bg-yellow-100 text-yellow-800',
                    '#FF5752': 'bg-red-100 text-red-800',
                    '#6B7280': 'bg-gray-200 text-gray-900',
                    '#A855F7': 'bg-purple-100 text-purple-800'
                  }
                  return colorMap[hex] || 'bg-gray-100 text-gray-800'
                }
                const colorClass = hexToColorClass(status.color)
                const statusCustomers = customersByStatusId[status.id] || []
                
                return (
                  <div key={status.id} className="flex-shrink-0" style={{ width: '320px' }}>
                    <div className="mb-2 flex items-center justify-end">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditStatus(status)}
                          disabled={isDeletingStatus}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Chỉnh sửa trạng thái"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(status.id)}
                          disabled={isDeletingStatus}
                          className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xóa trạng thái"
                        >
                          {isDeletingStatus && deletingStatusId === status.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <CustomerKanbanColumn
                      title={status.name}
                      colorClass={colorClass}
                      count={statusCustomers.length}
                      customers={statusCustomers}
                      onCardClick={(customer) => {
                        if (onViewCustomer) {
                          onViewCustomer(customer)
                        }
                      }}
                      onDragStart={handleDragStart}
                      onCardEdit={onEditCustomer}
                      onCardDelete={onDeleteCustomer}
                      onDragOver={(e) => handleDragOver(e, status.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, status.id)}
                      isDragOver={dragOverColumn === status.id}
                      onAddStatus={async () => {
                        // Set display_order = current status's display_order
                        const newDisplayOrder = status.display_order
                        setEditingStatus(null)
                        setEditingStatusId(null)
                        setShowStatusModal(true)
                      }}
                      statusId={status.id}
                    />
                  </div>
                )
              })}
          </div>
        </div>

        {/* Status Management Modal */}
        <CustomerStatusManagementModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false)
            setEditingStatusId(null)
          }}
          editingStatusId={editingStatusId}
          onStatusChange={() => {
            fetchData()
            setEditingStatusId(null)
          }}
        />
      </div>
    )
  }
)

CustomerKanbanBoard.displayName = 'CustomerKanbanBoard'

export default CustomerKanbanBoard

