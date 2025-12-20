"use client"

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import CustomerKanbanColumn from './CustomerKanbanColumn'
import CustomerStatusManagementModal from './CustomerStatusManagementModal'
import { supabase } from '@/lib/supabase'
import { apiGet, apiPut } from '@/lib/api'
import { Plus, Settings } from 'lucide-react'

interface Customer {
  id: string
  customer_code?: string
  name: string
  email?: string
  phone?: string
  type?: 'individual' | 'company' | 'government'
  credit_limit?: number
  status?: 'prospect' | 'active' | 'inactive'
  status_id?: string
  created_at?: string
  updated_at?: string
}

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
}

export interface CustomerKanbanBoardRef {
  refresh: () => Promise<void>
}

const CustomerKanbanBoard = forwardRef<CustomerKanbanBoardRef, CustomerKanbanBoardProps>(
  ({ onViewCustomer, onAddCustomer }, ref) => {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [statuses, setStatuses] = useState<CustomerStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [showStatusModal, setShowStatusModal] = useState(false)

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
        {/* Status Management Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Quản lý trạng thái
          </button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
          {statuses
            .sort((a, b) => a.display_order - b.display_order)
            .map((status) => (
              <CustomerKanbanColumn
                key={status.id}
                title={status.name}
                count={customersByStatusId[status.id]?.length || 0}
                statusColor={status.color}
                customers={customersByStatusId[status.id] || []}
                onCardClick={onViewCustomer}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.id)}
                isDragOver={dragOverColumn === status.id}
                onAddClick={onAddCustomer}
              />
            ))}
        </div>

        {/* Status Management Modal */}
        <CustomerStatusManagementModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onStatusChange={() => {
            fetchData()
          }}
        />
      </div>
    )
  }
)

CustomerKanbanBoard.displayName = 'CustomerKanbanBoard'

export default CustomerKanbanBoard

