'use client'

import React, { useState, useEffect } from 'react'
import { 
  RotateCcw, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ExpenseRestoreButtonProps {
  parentId: string
  tableName: 'expenses' | 'project_expenses' | 'project_expenses_quote'
  onRestore?: () => void
  className?: string
}

interface RestoreHistoryItem {
  snapshot_id: string
  snapshot_name: string
  created_at: string
  restored_at: string | null
  can_restore: boolean
}

interface RestoreHistoryResponse {
  parent_id: string
  table_name: string
  restore_history: RestoreHistoryItem[]
}

export default function ExpenseRestoreButton({ 
  parentId, 
  tableName, 
  onRestore,
  className = '' 
}: ExpenseRestoreButtonProps) {
  const [loading, setLoading] = useState(false)
  const [restoreHistory, setRestoreHistory] = useState<RestoreHistoryItem[]>([])
  const [hasSnapshot, setHasSnapshot] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState('')

  useEffect(() => {
    loadRestoreHistory()
  }, [parentId, tableName])

  const loadRestoreHistory = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        console.log('No session found')
        return
      }

      console.log(`Loading restore history for parent: ${parentId}, table: ${tableName}`)
      const response = await fetch(
        `${API_BASE_URL}/api/expense-restore/history/${parentId}?table_name=${tableName}`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`
          }
        }
      )

      console.log(`API response status: ${response.status}`)
      if (response.ok) {
        const data: RestoreHistoryResponse = await response.json()
        console.log('Restore history data:', data)
        setRestoreHistory(data.restore_history)
        setHasSnapshot(data.restore_history.length > 0)
        console.log(`Has snapshot: ${data.restore_history.length > 0}`)
      } else {
        console.error('API error:', await response.text())
      }
    } catch (error) {
      console.error('Error loading restore history:', error)
    }
  }

  const handleRestore = async () => {
    if (!hasSnapshot) return

    setLoading(true)
    setRestoreMessage('')

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        setRestoreMessage('Vui lòng đăng nhập để thực hiện khôi phục')
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/api/expense-restore/restore-parent/${parentId}?table_name=${tableName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`
          }
        }
      )

      if (response.ok) {
        const result = await response.json()
        setRestoreMessage('✅ Khôi phục thành công!')
        
        // Reload history
        await loadRestoreHistory()
        
        // Call callback
        if (onRestore) {
          onRestore()
        }
      } else {
        const error = await response.text()
        setRestoreMessage(`❌ Lỗi khôi phục: ${error}`)
      }
    } catch (error) {
      console.error('Error restoring expense:', error)
      setRestoreMessage('❌ Lỗi kết nối khi khôi phục')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Always show the button, but disable if no snapshot
  // if (!hasSnapshot) {
  //   return null
  // }

  return (
    <div className={`relative ${className}`}>
      {/* Main Restore Button */}
      <button
        onClick={handleRestore}
        disabled={loading || !hasSnapshot}
        className={`
          inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
          ${loading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : !hasSnapshot
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700'
          }
          transition-colors duration-200
        `}
        title={!hasSnapshot ? "Không có snapshot để khôi phục" : "Khôi phục chi phí cha từ snapshot tự động"}
      >
        {loading ? (
          <Clock className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Đang khôi phục...' : !hasSnapshot ? 'Không có snapshot' : 'Quay lại'}
      </button>

      {/* History Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        title="Xem lịch sử snapshot"
      >
        <History className="h-4 w-4" />
      </button>

      {/* Restore Message */}
      {restoreMessage && (
        <div className={`mt-2 p-2 rounded-md text-sm ${
          restoreMessage.includes('✅') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {restoreMessage}
        </div>
      )}

      {/* History Dropdown */}
      {showHistory && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Lịch sử Snapshot
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Chi phí cha được tự động lưu khi tạo chi phí con
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {restoreHistory.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Chưa có snapshot nào
              </div>
            ) : (
              restoreHistory.map((item, index) => (
                <div 
                  key={item.snapshot_id}
                  className={`p-3 border-b border-gray-100 ${
                    index === 0 ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {item.snapshot_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tạo: {formatDate(item.created_at)}
                      </div>
                      {item.restored_at && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đã khôi phục: {formatDate(item.restored_at)}
                        </div>
                      )}
                    </div>
                    <div className="ml-2">
                      {item.can_restore ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Có thể khôi phục
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Đã khôi phục
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              💡 Snapshot được tạo tự động khi thêm chi phí con
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
