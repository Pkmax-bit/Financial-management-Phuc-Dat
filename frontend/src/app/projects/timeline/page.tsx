'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload, ArrowLeft, Milestone, Database, ChevronDown } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function CustomerTimelineLandingPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [showProjectList, setShowProjectList] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    fetchAvailableProjects()
  }, [])

  const fetchAvailableProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await fetch('/api/projects/list-ids')
      if (response.ok) {
        const data = await response.json()
        setAvailableProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId.trim()) {
      setError('Vui lòng nhập ID dự án')
      return
    }
    router.push(`/projects/timeline/${projectId.trim()}`)
  }

  const handleQuickOpen = (id: string) => {
    setProjectId(id)
    router.push(`/projects/timeline/${id}`)
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Xem tiến độ thi công dự án</h1>
                <p className="text-gray-700 mt-2">Nhập ID dự án để xem timeline, hình ảnh, mô tả và bình luận.</p>
              </div>
              <div className="pt-1">
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 bg-white"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4" /> Về Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Milestone className="w-5 h-5" />
              </div>
              <div className="text-lg font-semibold text-gray-900">Project ID</div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="projectId" className="sr-only">Project ID</label>
              <input
                id="projectId"
                ref={inputRef}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Nhập Project ID..."
                className={`flex-1 rounded-lg border px-4 py-3 bg-white text-black placeholder-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-400' : 'border-gray-400'}`}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-3"
              >
                <Search className="w-4 h-4" /> Xem timeline
              </button>
            </form>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            {/* Available Projects from Database */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Dự án có sẵn trong database:
                </div>
                <button
                  type="button"
                  onClick={() => setShowProjectList(!showProjectList)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showProjectList ? 'Ẩn' : 'Hiện'} danh sách
                  <ChevronDown className={`h-4 w-4 transition-transform ${showProjectList ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {showProjectList && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
                    </div>
                  ) : availableProjects.length > 0 ? (
                    <div className="space-y-2">
                      {availableProjects.map((project) => (
                        <div
                          key={project.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                          onClick={() => handleQuickOpen(project.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {project.name}
                              </div>
                              {project.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {project.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(project.created_at).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                {project.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Không có dự án nào trong database
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 text-sm text-gray-600 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Nhân viên cập nhật ở trang riêng.
            </div>
          </div>
        </div>
      </div>
  )
}


