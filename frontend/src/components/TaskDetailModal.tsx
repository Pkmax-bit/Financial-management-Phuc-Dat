'use client'

import { useState, useEffect } from 'react'
import {
    X,
    Calendar,
    Clock,
    User,
    Users,
    AlertCircle,
    CheckSquare,
    MessageSquare,
    Paperclip,
    Play,
    Pause,
    Trash2,
    Plus,
    Check,
    Edit2,
    FileText,
    Download,
    Image as ImageIcon
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type ParticipantRole = 'responsible' | 'participant' | 'observer'

interface Task {
    id: string
    title: string
    description?: string
    status: TaskStatus
    priority: TaskPriority
    start_date?: string
    due_date?: string
    estimated_time?: number
    time_spent?: number
    assigned_to_name?: string
    created_by_name?: string
    group_name?: string
    project_name?: string
}

interface ChecklistItem {
    id: string
    checklist_id: string
    content: string
    is_completed: boolean
    assignee_id?: string
    assignee_name?: string
    sort_order: number
}

interface Checklist {
    id: string
    task_id: string
    title: string
    progress?: number
    items: ChecklistItem[]
}

interface TimeLog {
    id: string
    task_id: string
    user_id: string
    user_name?: string
    start_time: string
    end_time?: string
    duration_minutes?: number
    description?: string
}

interface Participant {
    id: string
    task_id: string
    employee_id: string
    employee_name?: string
    role: ParticipantRole
}

interface Attachment {
    id: string
    task_id: string
    file_name: string
    file_url: string
    file_type: string
    file_size: number
    uploaded_by: string
    uploaded_by_name?: string
    created_at: string
}

interface TaskDetailModalProps {
    taskId: string
    onClose: () => void
    onUpdate?: () => void
}

export default function TaskDetailModal({ taskId, onClose, onUpdate }: TaskDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'checklists' | 'time' | 'participants' | 'attachments'>('general')
    const [task, setTask] = useState<Task | null>(null)
    const [checklists, setChecklists] = useState<Checklist[]>([])
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
    const [participants, setParticipants] = useState<Participant[]>([])
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null)
    const [uploading, setUploading] = useState(false)

    // Checklist form states
    const [newChecklistTitle, setNewChecklistTitle] = useState('')
    const [newItemContent, setNewItemContent] = useState<{ [key: string]: string }>({})
    const [editingItem, setEditingItem] = useState<string | null>(null)

    useEffect(() => {
        loadTaskDetails()
    }, [taskId])

    const loadTaskDetails = async () => {
        try {
            setLoading(true)
            const data = await apiGet(`/api/tasks/${taskId}`)
            setTask(data.task)
            setChecklists(data.checklists || [])
            setTimeLogs(data.time_logs || [])
            setParticipants(data.participants || [])
            setAttachments(data.attachments || [])

            // Find active timer
            const active = (data.time_logs || []).find((log: TimeLog) => !log.end_time)
            setActiveTimer(active || null)
        } catch (err) {
            console.error('Failed to load task details:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateChecklist = async () => {
        if (!newChecklistTitle.trim()) return
        try {
            await apiPost(`/api/tasks/${taskId}/checklists`, { title: newChecklistTitle })
            setNewChecklistTitle('')
            loadTaskDetails()
        } catch (err) {
            alert('Không thể tạo checklist')
        }
    }

    const handleAddChecklistItem = async (checklistId: string) => {
        const content = newItemContent[checklistId]?.trim()
        if (!content) return
        try {
            await apiPost(`/api/tasks/checklists/${checklistId}/items`, { content, sort_order: 0 })
            setNewItemContent({ ...newItemContent, [checklistId]: '' })
            loadTaskDetails()
        } catch (err) {
            alert('Không thể thêm item')
        }
    }

    const handleToggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
        try {
            await apiPut(`/api/tasks/checklist-items/${itemId}`, { is_completed: !isCompleted })
            loadTaskDetails()
        } catch (err) {
            alert('Không thể cập nhật item')
        }
    }

    const handleDeleteChecklistItem = async (itemId: string) => {
        if (!confirm('Xóa item này?')) return
        try {
            await apiDelete(`/api/tasks/checklist-items/${itemId}`)
            loadTaskDetails()
        } catch (err) {
            alert('Không thể xóa item')
        }
    }

    const handleStartTimer = async () => {
        try {
            await apiPost(`/api/tasks/${taskId}/time-logs/start`, {})
            loadTaskDetails()
        } catch (err: any) {
            alert(err.message || 'Không thể bắt đầu timer')
        }
    }

    const handleStopTimer = async () => {
        if (!activeTimer) return
        try {
            await apiPost(`/api/tasks/time-logs/${activeTimer.id}/stop`, {})
            loadTaskDetails()
            if (onUpdate) onUpdate()
        } catch (err) {
            alert('Không thể dừng timer')
        }
    }

    const handleDeleteTimeLog = async (logId: string) => {
        if (!confirm('Xóa log này?')) return
        try {
            await apiDelete(`/api/tasks/time-logs/${logId}`)
            loadTaskDetails()
            if (onUpdate) onUpdate()
        } catch (err) {
            alert('Không thể xóa log')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', e.target.files[0])

        try {
            // Note: apiPost wrapper might not handle FormData correctly if it sets Content-Type to application/json
            // We might need a custom fetch or ensure apiPost handles FormData
            // Assuming apiPost handles it or we use fetch directly for this
            const token = localStorage.getItem('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tasks/${taskId}/attachments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) throw new Error('Upload failed')

            loadTaskDetails()
        } catch (err) {
            console.error(err)
            alert('Không thể upload file')
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!confirm('Xóa file này?')) return
        try {
            await apiDelete(`/api/tasks/attachments/${attachmentId}`)
            loadTaskDetails()
        } catch (err) {
            alert('Không thể xóa file')
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '0m'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-800'
            case 'in_progress': return 'bg-blue-100 text-blue-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'low': return 'text-gray-500'
            case 'medium': return 'text-yellow-600'
            case 'high': return 'text-orange-600'
            case 'urgent': return 'text-red-600'
            default: return 'text-gray-500'
        }
    }

    if (loading || !task) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* LEFT COLUMN - MAIN CONTENT (70%) */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <span>{task.project_name || 'Project'}</span>
                                <span>/</span>
                                <span>{task.group_name || 'Group'}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{task.title}</h2>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-8 border-b border-gray-100">
                        <div className="flex gap-8">
                            {[
                                { id: 'checklists', label: 'Việc cần làm', icon: CheckSquare },
                                { id: 'general', label: 'Mô tả', icon: FileText },
                                { id: 'attachments', label: 'Tài liệu', icon: Paperclip },
                                { id: 'time', label: 'Lịch sử', icon: Clock },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 border-b-2 transition-colors text-sm font-medium ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        {activeTab === 'general' && (
                            <div className="prose max-w-none">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mô tả nhiệm vụ</h3>
                                <div className="bg-gray-50 rounded-xl p-6 text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                                    {task.description || 'Chưa có mô tả chi tiết cho nhiệm vụ này.'}
                                </div>
                            </div>
                        )}

                        {activeTab === 'checklists' && (
                            <div className="space-y-6 max-w-3xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Danh sách công việc</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Tên checklist mới..."
                                            value={newChecklistTitle}
                                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleCreateChecklist()}
                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        <button
                                            onClick={handleCreateChecklist}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Thêm
                                        </button>
                                    </div>
                                </div>

                                {checklists.map((checklist) => (
                                    <div key={checklist.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-semibold text-gray-900">{checklist.title}</h4>
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                                    {Math.round((checklist.progress || 0) * 100)}%
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => { if (confirm('Xóa checklist này?')) apiDelete(`/api/tasks/checklists/${checklist.id}`).then(loadTaskDetails) }}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(checklist.progress || 0) * 100}%` }}
                                            ></div>
                                        </div>

                                        <div className="space-y-2">
                                            {checklist.items.map((item) => (
                                                <div key={item.id} className="group flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <button
                                                        onClick={() => handleToggleChecklistItem(item.id, item.is_completed)}
                                                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.is_completed
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300 hover:border-blue-500'
                                                            }`}
                                                    >
                                                        {item.is_completed && <Check className="h-3 w-3 text-white" />}
                                                    </button>
                                                    <span className={`flex-1 text-sm leading-relaxed ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                        {item.content}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Thêm công việc..."
                                                value={newItemContent[checklist.id] || ''}
                                                onChange={(e) => setNewItemContent({ ...newItemContent, [checklist.id]: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            />
                                            <button
                                                onClick={() => handleAddChecklistItem(checklist.id)}
                                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {checklists.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-gray-500">Chưa có danh sách công việc nào</p>
                                        <p className="text-sm text-gray-400 mt-1">Tạo checklist để bắt đầu theo dõi tiến độ</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'attachments' && (
                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Paperclip className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {uploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để tải lên'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Hỗ trợ mọi định dạng file</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {attachments.map((file) => (
                                        <div key={file.id} className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    {file.file_type.startsWith('image/') ? (
                                                        <ImageIcon className="h-5 w-5 text-purple-600" />
                                                    ) : (
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate" title={file.file_name}>
                                                        {file.file_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {formatFileSize(file.file_size)}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {new Date(file.created_at).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-lg p-1">
                                                <a
                                                    href={file.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteAttachment(file.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'time' && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Tổng thời gian</h3>
                                        <p className="text-2xl font-bold text-blue-600 mt-1">{formatDuration(task.time_spent)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Ước tính</p>
                                        <p className="font-medium text-gray-900">{formatDuration(task.estimated_time)}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {timeLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {(log.user_name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{log.user_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(log.start_time).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                                                    {formatDuration(log.duration_minutes)}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTimeLog(log.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - SIDEBAR (30%) */}
                <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Close Button (Desktop) */}
                        <div className="hidden lg:flex justify-end mb-4">
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Status & Priority */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Trạng thái</label>
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Mức độ ưu tiên</label>
                                <div className={`flex items-center gap-2 ${getPriorityColor(task.priority)}`}>
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="font-medium capitalize">{task.priority}</span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* People */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Người phụ trách</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {(task.assigned_to_name || 'U').charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{task.assigned_to_name || 'Chưa giao'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                                    Người tham gia ({participants.length})
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {participants.map((p) => (
                                        <div key={p.id} className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium shadow-sm" title={p.employee_name}>
                                            {(p.employee_name || 'U').charAt(0)}
                                        </div>
                                    ))}
                                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Dates */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Ngày bắt đầu</label>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {task.start_date ? new Date(task.start_date).toLocaleDateString('vi-VN') : '---'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hạn chót</label>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '---'}
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Timer Widget */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Theo dõi thời gian</label>
                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="text-center mb-3">
                                    <span className="text-2xl font-mono font-bold text-gray-900">
                                        {formatDuration(task.time_spent)}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">Tổng thời gian</p>
                                </div>
                                {activeTimer ? (
                                    <button
                                        onClick={handleStopTimer}
                                        className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Pause className="h-4 w-4" />
                                        Dừng lại
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartTimer}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Play className="h-4 w-4" />
                                        Bắt đầu
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto p-6 border-t border-gray-200">
                        <button className="w-full py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                            <Trash2 className="h-4 w-4" />
                            Xóa nhiệm vụ
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </div>
    )
}
