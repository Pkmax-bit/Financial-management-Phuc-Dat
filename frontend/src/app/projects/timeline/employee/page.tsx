'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProjectTimeline from '@/components/projects/ProjectTimeline'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'

interface ProjectRef { id: string; name: string }

export default function EmployeeTimelineManagerPage() {
  const [projects, setProjects] = useState<ProjectRef[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16))
  const [type, setType] = useState<'milestone' | 'update' | 'issue' | 'meeting'>('update')
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('in_progress')
  const [entryFiles, setEntryFiles] = useState<FileList | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timelineRefresh, setTimelineRefresh] = useState(0)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      const items: ProjectRef[] = (data.data || data || []).map((p: any) => ({ id: p.id, name: p.name }))
      setProjects(items)
      if (items.length) setSelectedProject(items[0].id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedProject) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const path = `Timeline/${selectedProject}/${fileName}`
        const { error } = await supabase.storage.from('minhchung_chiphi').upload(path, file)
        if (error) throw error
      }
      alert('Upload thành công! Hãy thêm mục timeline kèm mô tả và đính kèm.')
    } catch (e) {
      console.error(e)
      alert('Upload thất bại')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <LayoutWithSidebar>
      <div className="bg-white min-h-screen p-4 md:p-6">
        <div className="max-w-6xl space-y-4">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b">
              <div className="text-lg font-semibold">Cập nhật tiến độ thi công</div>
              <div className="text-sm text-gray-600">Upload hình ảnh vào Storage và tạo mục timeline với mô tả, trả lời bình luận.</div>
            </div>
            <div className="p-5 flex flex-col md:flex-row md:items-center gap-3">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
                disabled={loading}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <button onClick={handleUploadClick} disabled={!selectedProject || uploading} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-60">
                  <Upload className="w-4 h-4" /> Upload hình
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUploadFiles} />
              </div>
            </div>
          </div>

          {selectedProject && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <ProjectTimeline key={timelineRefresh} projectId={selectedProject} projectName={projects.find(p => p.id === selectedProject)?.name || ''} />
                </div>
              </div>
              <div className="lg:col-span-4">
                  <div className="bg-white rounded-xl border shadow-sm p-4 lg:sticky lg:top-6">
                    <div className="mb-4">
                      <div className="text-base font-semibold">Thêm mục timeline</div>
                      <div className="text-xs text-gray-500">Form bên phải, nền trắng, không che danh sách.</div>
                    </div>
                    {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">Thông tin chung</div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Tiêu đề</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" placeholder="Ví dụ: Hoàn thành đổ bê tông tầng 1" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Ngày giờ</label>
                              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Loại</label>
                              <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
                                <option value="milestone">Mốc</option>
                                <option value="update">Cập nhật</option>
                                <option value="issue">Sự cố</option>
                                <option value="meeting">Cuộc họp</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Trạng thái</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
                              <option value="pending">Chờ</option>
                              <option value="in_progress">Đang làm</option>
                              <option value="completed">Hoàn thành</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <hr className="border-gray-200" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">Mô tả</div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[120px]" placeholder="Nhập mô tả chi tiết công việc, vật liệu, tiến độ..." />
                      </div>
                      <hr className="border-gray-200" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">Đính kèm</div>
                        <input type="file" accept="image/*" multiple onChange={(e) => setEntryFiles(e.target.files)} className="mt-1 block w-full text-sm" />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={async () => {
                            if (!selectedProject) return
                            setError(null)
                            if (!title.trim() || !description.trim()) { setError('Vui lòng nhập tiêu đề và mô tả'); return }
                            setSaving(true)
                            try {
                              const attachments: any[] = []
                              if (entryFiles && entryFiles.length > 0) {
                                for (const file of Array.from(entryFiles)) {
                                  const ext = file.name.split('.').pop()
                                  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
                                  const path = `Timeline/${selectedProject}/${fileName}`
                                  const { error: upErr } = await supabase.storage.from('minhchung_chiphi').upload(path, file)
                                  if (upErr) throw upErr
                                  const { data: pub } = supabase.storage.from('minhchung_chiphi').getPublicUrl(path)
                                  attachments.push({
                                    name: file.name,
                                    url: pub.publicUrl,
                                    type: file.type.startsWith('image/') ? 'image' : 'other',
                                    size: file.size,
                                    uploaded_at: new Date().toISOString()
                                  })
                                }
                              }
                              const payload = {
                                title: title.trim(),
                                description: description.trim(),
                                date: new Date(date).toISOString(),
                                type,
                                status,
                                created_by: 'employee',
                                attachments
                              }
                              const resp = await fetch(`/api/projects/${selectedProject}/timeline`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                              })
                              if (!resp.ok) {
                                const t = await resp.text()
                                throw new Error(t || 'Tạo mục timeline thất bại')
                              }
                              setTitle('')
                              setDescription('')
                              setEntryFiles(null)
                              setTimelineRefresh(v => v + 1)
                            } catch (e: any) {
                              setError(e?.message || 'Có lỗi xảy ra')
                            } finally {
                              setSaving(false)
                            }
                          }}
                          disabled={saving}
                          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-60"
                        >
                          {saving ? 'Đang lưu...' : 'Lưu mục timeline'}
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </LayoutWithSidebar>
  )
}
