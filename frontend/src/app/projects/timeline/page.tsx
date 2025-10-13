'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload, ArrowLeft, Milestone } from 'lucide-react'

export default function CustomerTimelineLandingPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [recentIds, setRecentIds] = useState<string[]>([])

  useEffect(() => {
    inputRef.current?.focus()
    try {
      const saved = JSON.parse(localStorage.getItem('recentProjectIds') || '[]')
      if (Array.isArray(saved)) {
        setRecentIds(saved.slice(0, 5))
      }
    } catch {
      // ignore localStorage parse errors
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId.trim()) {
      setError('Vui lòng nhập ID dự án')
      return
    }
    try {
      const id = projectId.trim()
      const next = [id, ...recentIds.filter(x => x !== id)].slice(0, 5)
      setRecentIds(next)
      localStorage.setItem('recentProjectIds', JSON.stringify(next))
    } catch {
      // ignore localStorage errors
    }
    router.push(`/projects/timeline/${projectId.trim()}`)
  }

  const handleQuickOpen = (id: string) => {
    setProjectId(id)
    try {
      const next = [id, ...recentIds.filter(x => x !== id)].slice(0, 5)
      setRecentIds(next)
      localStorage.setItem('recentProjectIds', JSON.stringify(next))
    } catch {
      // ignore localStorage errors
    }
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
            <div className="mt-4">
              <div className="text-sm text-gray-700 mb-2">ID mẫu để test nhanh:</div>
              <button
                type="button"
                onClick={() => handleQuickOpen('deaad8f4-7f29-4994-89ab-c28675a56c94')}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                title="Nhấp để mở nhanh timeline dự án mẫu"
              >
                deaad8f4-7f29-4994-89ab-c28675a56c94
              </button>
            </div>
          {recentIds.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-700 mb-2">ID gần đây:</div>
              <div className="flex flex-wrap gap-2">
                {recentIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProjectId(id)}
                    className="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-800"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}
            <div className="mt-6 text-sm text-gray-600 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Nhân viên cập nhật ở trang riêng.
            </div>
          </div>
        </div>
      </div>
  )
}


