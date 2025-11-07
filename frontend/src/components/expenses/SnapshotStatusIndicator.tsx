'use client'

import React, { useState, useEffect } from 'react'
import { 
  RotateCcw, 
  History, 
  CheckCircle, 
  Clock,
  Info,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getApiUrl()

interface SnapshotStatusIndicatorProps {
  parentId: string
  tableName: 'expenses' | 'project_expenses' | 'project_expenses_quote'
  projectId?: string // optional: ensure snapshot belongs to this project
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

export default function SnapshotStatusIndicator({ 
  parentId, 
  tableName, 
  projectId,
  onRestore,
  className = '' 
}: SnapshotStatusIndicatorProps) {
  const [loading, setLoading] = useState(false)
  const [restoreHistory, setRestoreHistory] = useState<RestoreHistoryItem[]>([])
  const [hasSnapshot, setHasSnapshot] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  useEffect(() => {
    loadRestoreHistory()
  }, [parentId, tableName, projectId])

  const loadRestoreHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        console.log('No session found')
        return
      }

      console.log(`Loading latest snapshot for parent: ${parentId}, table: ${tableName}, projectId filter: ${projectId || 'none'}`)
      // Fetch latest snapshot to validate projectId if provided
      const response = await fetch(
        `${API_BASE_URL}/api/expense-restore/latest-snapshot/${parentId}?table_name=${tableName}`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`
          }
        }
      )

      console.log(`Latest snapshot API status: ${response.status}`)
      if (response.ok) {
        const data = await response.json()
        const snapshot = data?.snapshot_data
        let snapshotOk = Boolean(snapshot)

        // If projectId filter is provided, ensure the snapshot belongs to this project
        if (snapshotOk && projectId) {
          const snapshotProjectId = snapshot?.project_id
          snapshotOk = snapshotProjectId === projectId
          console.log('Snapshot project check:', { snapshotProjectId, projectId, snapshotOk })
        }

        setHasSnapshot(snapshotOk)
        // Optionally, fetch history list only when snapshotOk to populate dropdown
        if (snapshotOk) {
          const histRes = await fetch(
            `${API_BASE_URL}/api/expense-restore/history/${parentId}?table_name=${tableName}`,
            { headers: { 'Authorization': `Bearer ${session.data.session.access_token}` } }
          )
          if (histRes.ok) {
            const histData: RestoreHistoryResponse = await histRes.json()
            setRestoreHistory(histData.restore_history || [])
          } else {
            setRestoreHistory([])
          }
        } else {
          setRestoreHistory([])
        }
      } else {
        console.error('API error:', await response.text())
      }
    } catch (error) {
      console.error('Error loading restore history:', error)
    } finally {
      setIsLoadingHistory(false)
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

  // Show loading state while checking for snapshots
  if (isLoadingHistory) {
    return (
      <div className={`inline-flex items-center text-xs text-gray-500 ${className}`}>
        <Clock className="h-3 w-3 mr-1 animate-spin" />
        Kiểm tra snapshot...
      </div>
    )
  }

  // Show status indicator
  return (
    <div className={`relative ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        {hasSnapshot ? (
          <>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">Có snapshot</span>
            </div>
            
            {/* Restore Button */}
            <button
              onClick={handleRestore}
              disabled={loading}
              className={`
                inline-flex items-center px-2 py-1 text-xs font-medium rounded
                ${loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
                }
                transition-colors duration-200
              `}
              title="Khôi phục từ snapshot"
            >
              {loading ? (
                <Clock className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              {loading ? 'Đang khôi phục...' : 'Quay lại'}
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Xem lịch sử snapshot"
            >
              <History className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex items-center text-gray-500">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Không có snapshot</span>
          </div>
        )}
      </div>

      {/* Restore Message */}
      {restoreMessage && (
        <div className={`mt-1 p-1 rounded text-xs ${
          restoreMessage.includes('✅') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {restoreMessage}
        </div>
      )}

      {/* History Dropdown */}
      {showHistory && hasSnapshot && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Lịch sử Snapshot
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Chi phí cha được tự động lưu khi tạo chi phí con
            </p>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {restoreHistory.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Chưa có snapshot nào
              </div>
            ) : (
              restoreHistory.map((item, index) => (
                <div 
                  key={item.snapshot_id}
                  className={`p-2 border-b border-gray-100 ${
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
          
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              💡 Snapshot được tạo tự động khi thêm chi phí con
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
