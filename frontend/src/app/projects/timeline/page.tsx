'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Image, Search, Upload } from 'lucide-react'

export default function CustomerTimelineLandingPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId.trim()) {
      setError('Vui lòng nhập ID dự án')
      return
    }
    router.push(`/projects/timeline/${projectId.trim()}`)
  }

  return (
      <div className="bg-white min-h-screen p-4 md:p-6">
        <div className="max-w-5xl">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b flex items-center gap-3">
              <Image className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold">Xem tiến độ thi công dự án</h1>
                <p className="text-sm text-gray-600">Nhập ID dự án để xem timeline, hình ảnh, mô tả và bình luận.</p>
              </div>
            </div>
            <div className="p-5">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={inputRef}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Nhập Project ID..."
                  className="flex-1 rounded-lg border px-4 py-3"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3"
                >
                  <Search className="w-4 h-4" /> Xem timeline
                </button>
              </form>
              {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
              <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Nhân viên cập nhật ở trang riêng.
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}


