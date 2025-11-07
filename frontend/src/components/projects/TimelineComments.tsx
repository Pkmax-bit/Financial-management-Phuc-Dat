'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Trash2, User as UserIcon } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

interface TimelineCommentsProps {
  projectId: string
  entryId: string
  isEmployee?: boolean
}

interface CommentItem {
  id: string
  timeline_entry_id: string
  project_id: string
  user_id?: string
  author_name: string
  content: string
  created_at: string
  updated_at?: string
}

export default function TimelineComments({ projectId, entryId, isEmployee = false }: TimelineCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, entryId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await fetch(getApiEndpoint(`/api/projects/${projectId}/timeline/${entryId}/comments`))
      if (!res.ok) throw new Error('Failed to load comments')
      const data = await res.json()
      setComments(data.comments || [])
      scrollToBottom()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !authorName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline/${entryId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: authorName.trim(), content: content.trim() })
      })
      if (!res.ok) throw new Error('Failed to add comment')
      setContent('')
      await fetchComments()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bình luận này?')) return
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline/${entryId}/comments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <span className="font-medium">Bình luận</span>
      </div>
      <div ref={listRef} className="max-h-80 overflow-y-auto px-4 py-3 space-y-3">
        {loading && <div className="text-gray-500 text-sm">Đang tải bình luận...</div>}
        {!loading && comments.length === 0 && (
          <div className="text-gray-500 text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
        )}
        {!loading && comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{c.author_name}</div>
                <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString('vi-VN')}</div>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</div>
            </div>
            {isEmployee && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-gray-400 hover:text-red-600"
                title="Xóa bình luận"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t px-4 py-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            placeholder="Tên của bạn"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !authorName.trim() || !content.trim()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md disabled:opacity-60"
          >
            <Send className="w-4 h-4" /> Gửi
          </button>
        </div>
        <textarea
          placeholder="Viết bình luận..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm min-h-[60px]"
        />
      </form>
    </div>
  )
}


