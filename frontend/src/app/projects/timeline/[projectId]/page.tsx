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
  const projectId = params.projectId as string
  const [project, setProject] = useState<ProjectBasic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    fetchProject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .single()
      if (error) throw error
      setProject(data)
    } catch (e) {
      console.error(e)
      setError('Không tìm thấy dự án')
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
                {loading && <div>Đang tải dự án...</div>}
                {error && <div className="text-red-600">{error}</div>}
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


