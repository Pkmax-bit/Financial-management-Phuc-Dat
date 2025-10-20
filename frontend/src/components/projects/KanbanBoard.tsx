"use client"

import React, { useEffect, useMemo, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircle, X, AlertTriangle } from 'lucide-react'

type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

interface ProjectItem {
  id: string
  name: string
  project_code: string
  customer_name?: string
  progress: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: ProjectStatus
}

const statusMeta: Record<ProjectStatus, { title: string; colorClass: string }> = {
  planning: { title: 'Lên kế hoạch', colorClass: 'bg-gray-100 text-gray-800' },
  active: { title: 'Đang thực hiện', colorClass: 'bg-green-100 text-green-800' },
  on_hold: { title: 'Tạm dừng', colorClass: 'bg-yellow-100 text-yellow-800' },
  completed: { title: 'Hoàn thành', colorClass: 'bg-blue-100 text-blue-800' },
  cancelled: { title: 'Hủy', colorClass: 'bg-red-100 text-red-800' }
}

export default function KanbanBoard() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedProject, setDraggedProject] = useState<ProjectItem | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(null)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<{project: ProjectItem, status: ProjectStatus} | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, project_code, status, priority, progress, customers(name)')

        if (error) throw error

        const mapped: ProjectItem[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          project_code: p.project_code,
          status: p.status,
          priority: p.priority,
          progress: typeof p.progress === 'number' ? p.progress : Number(p.progress ?? 0),
          customer_name: p.customers?.name
        }))

        setProjects(mapped)
      } catch (e: any) {
        setError(e.message || 'Lỗi tải dữ liệu dự án')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleDragStart = (project: ProjectItem) => {
    setDraggedProject(project)
  }

  const handleDragOver = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: ProjectStatus) => {
    e.preventDefault()
    
    if (!draggedProject || draggedProject.status === newStatus) {
      setDraggedProject(null)
      setDragOverColumn(null)
      return
    }

    // Show confirmation dialogs for critical status changes
    if (newStatus === 'completed') {
      setPendingDrop({ project: draggedProject, status: newStatus })
      setShowCompletionDialog(true)
      setDraggedProject(null)
      setDragOverColumn(null)
      return
    }

    if (newStatus === 'on_hold') {
      setPendingDrop({ project: draggedProject, status: newStatus })
      setShowHoldDialog(true)
      setDraggedProject(null)
      setDragOverColumn(null)
      return
    }

    if (newStatus === 'cancelled') {
      setPendingDrop({ project: draggedProject, status: newStatus })
      setShowCancelDialog(true)
      setDraggedProject(null)
      setDragOverColumn(null)
      return
    }

    // For other statuses, proceed directly
    await updateProjectStatus(draggedProject, newStatus)
  }

  const updateProjectStatus = async (project: ProjectItem, newStatus: ProjectStatus) => {
    try {
      // Prepare update data
      const updateData: any = { status: newStatus }
      
      // Auto-set progress to 100% when moving to completed
      if (newStatus === 'completed') {
        updateData.progress = 100
      }
      // Auto-set progress to 0% when moving back to planning
      else if (newStatus === 'planning') {
        updateData.progress = 0
      }

      // Update project status and progress in database
      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id)

      if (error) throw error

      // Update local state
      setProjects(prev => 
        prev.map(p => 
          p.id === project.id 
            ? { 
                ...p, 
                status: newStatus,
                progress: newStatus === 'completed' ? 100 : 
                         newStatus === 'planning' ? 0 : p.progress
              }
            : p
        )
      )

      console.log(`Project ${project.name} moved to ${newStatus}${newStatus === 'completed' ? ' with 100% progress' : ''}`)
    } catch (err) {
      console.error('Error updating project status:', err)
      setError('Không thể cập nhật trạng thái dự án')
    }
  }

  const handleConfirmCompletion = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowCompletionDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelCompletion = () => {
    setShowCompletionDialog(false)
    setPendingDrop(null)
  }

  const handleConfirmHold = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowHoldDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelHold = () => {
    setShowHoldDialog(false)
    setPendingDrop(null)
  }

  const handleConfirmCancel = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowCancelDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelCancel = () => {
    setShowCancelDialog(false)
    setPendingDrop(null)
  }

  const grouped = useMemo(() => {
    const byStatus: Record<ProjectStatus, ProjectItem[]> = {
      planning: [],
      active: [],
      on_hold: [],
      completed: [],
      cancelled: []
    }
    for (const p of projects) {
      // Auto-change status based on progress
      let displayStatus = p.status
      
      // If project has progress > 0 and status is planning, show as active
      if (p.status === 'planning' && p.progress > 0) {
        displayStatus = 'active'
      }
      // If project has progress = 100%, show as completed
      else if (p.progress >= 100 && p.status !== 'cancelled') {
        displayStatus = 'completed'
      }
      
      byStatus[displayStatus].push(p)
    }
    return byStatus
  }, [projects])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(Object.keys(statusMeta) as ProjectStatus[]).map((status) => (
          <KanbanColumn
            key={status}
            title={statusMeta[status].title}
            colorClass={statusMeta[status].colorClass}
            count={grouped[status].length}
            projects={grouped[status]}
            onCardClick={(id) => router.push(`/projects/${id}/detail`)}
            onDragStart={handleDragStart}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            isDragOver={dragOverColumn === status}
          />
        ))}
      </div>

      {/* Completion Confirmation Dialog */}
      {showCompletionDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận hoàn thành dự án
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn hoàn thành dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Dự án sẽ được đặt tiến độ 100% và chuyển sang trạng thái "Hoàn thành"
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelCompletion}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Xác nhận hoàn thành
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hold Confirmation Dialog */}
      {showHoldDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận tạm dừng dự án
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn tạm dừng dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Dự án sẽ được chuyển sang trạng thái "Tạm dừng" và có thể tiếp tục sau
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelHold}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmHold}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Xác nhận tạm dừng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận hủy dự án
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn hủy dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Dự án sẽ được chuyển sang trạng thái "Hủy" và không thể hoàn thành
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



