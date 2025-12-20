'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import CustomerProjectTimeline from '@/components/customer-view/CustomerProjectTimeline'
import { supabase } from '@/lib/supabase'
import { Eye } from 'lucide-react'

interface ProjectBasic {
  id: string
  name: string
  description?: string
}

export default function CustomerProjectTimelinePage() {
  const params = useParams()
  // Extract projectId immediately to avoid direct params access
  // Extract projectId immediately to avoid direct params access - destructure to prevent enumeration
  const { projectId: paramProjectId } = params || {}
  const projectId = (paramProjectId ?? '') as string
  const [project, setProject] = useState<ProjectBasic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setError('ID dự án không hợp lệ')
      setLoading(false)
      return
    }
    
    // Validate projectId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      setError('ID dự án không đúng định dạng')
      setLoading(false)
      return
    }
    
    fetchProject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchProject = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching project with ID:', projectId)
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Database error: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('Project not found')
      }
      
      console.log('Project data:', data)
      setProject(data)
    } catch (e) {
      console.error('Error fetching project:', e)
      const errorMessage = e instanceof Error ? e.message : 'Không tìm thấy dự án'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="bg-white min-h-screen p-0 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Cover/Header like Facebook */}
          <div className="bg-white border-b">
            <div className="h-32 md:h-44 bg-gradient-to-r from-blue-200 via-blue-100 to-white" />
            <div className="px-4 md:px-6 -mt-10">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {project?.name?.charAt(0) || 'P'}
                </div>
                <div className="pb-2">
                  <div className="text-2xl font-semibold">{project?.name || 'Dự án'}</div>
                  {project?.description && (
                    <div className="text-gray-600 mt-1 max-w-3xl line-clamp-2">{project.description}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 md:px-6 py-3 border-t bg-white/60 backdrop-blur">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" /> Khách hàng đang xem tiến độ thi công
              </div>
            </div>
          </div>

          {/* Facebook-like 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 px-4 md:px-6 py-4">
            {/* Left/Center column: Feed */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải dự án...</span>
                  </div>
                )}
                {error && (
                  <div className="text-center py-8">
                    <div className="text-red-600 text-lg font-medium mb-2">Lỗi tải dự án</div>
                    <div className="text-gray-600 mb-4">{error}</div>
                    <button 
                      onClick={fetchProject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
                {!loading && !error && project && (
                  <CustomerProjectTimeline projectId={project.id} projectName={project.name} />
                )}
              </div>
            </div>

            {/* Right column: Project info/help */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="text-sm text-gray-600">Gợi ý</div>
                <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                  <li>Nhấp vào từng mục timeline để xem chi tiết hình ảnh.</li>
                  <li>Sử dụng phần bình luận để trao đổi nhanh với nhân viên.</li>
                  <li>Ảnh minh chứng được lưu tại kho `minhchung_chiphi`.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}


