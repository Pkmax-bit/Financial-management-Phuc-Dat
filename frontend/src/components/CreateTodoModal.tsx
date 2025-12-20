'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Clock, Shield } from 'lucide-react'
import { apiPost, apiPut } from '@/lib/api'
import { Task } from '@/types/task'

interface CreateTodoModalProps {
    parentTaskId: string
    groupId?: string
    projectId?: string
    onClose: () => void
    onSuccess: (newSubTask?: Task) => void
    groupMembers: Array<{ 
      employee_id: string; 
      employee_name?: string; 
      employee_email?: string;
      responsibility_type?: 'accountable' | 'responsible' | 'consulted' | 'informed';
      avatar?: string;
      phone?: string;
      status?: string;
    }>
    initialData?: Task | null
}

export default function CreateTodoModal({ parentTaskId, groupId, projectId, onClose, onSuccess, groupMembers, initialData }: CreateTodoModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [assigneeId, setAssigneeId] = useState('')
    const [accountablePersonId, setAccountablePersonId] = useState('')
    const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [projectTeamMembers, setProjectTeamMembers] = useState<Array<{id: string, name: string, email?: string, responsibility_type?: string}>>([])

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setDescription(initialData.description || '')
            setDueDate(initialData.due_date ? new Date(initialData.due_date).toISOString().slice(0, 16) : '')
            setAssigneeId(initialData.assigned_to || '')
            setAccountablePersonId((initialData as any).accountable_person || '')
            setEstimatedTime(initialData.estimated_time)
        } else {
            setTitle('')
            setDescription('')
            setDueDate('')
            setAssigneeId('')
            setAccountablePersonId('')
            setEstimatedTime(undefined)
        }
    }, [initialData])

    // Fetch project team members
    useEffect(() => {
        if (projectId) {
            fetchProjectTeamMembers()
        }
    }, [projectId])

    const fetchProjectTeamMembers = async () => {
        try {
            const response = await apiPost('/api/project-team/search', { project_id: projectId })
            const members = response?.members || []
            setProjectTeamMembers(members.map((m: any) => ({
                id: m.user_id || m.id,
                name: m.name,
                email: m.email,
                responsibility_type: m.responsibility_type
            })))
        } catch (error) {
            console.error('Failed to fetch project team members:', error)
            setProjectTeamMembers([])
        }
    }

    const createTaskNotification = async (task: Task, userId: string, role: string) => {
        try {
            const notificationPayload = {
                user_id: userId,
                type: 'task_assigned',
                title: `Bạn được giao nhiệm vụ: ${task.title}`,
                message: `Bạn được ${role === 'accountable' ? 'chịu trách nhiệm' : 'phân công'} cho nhiệm vụ "${task.title}"`,
                data: {
                    task_id: task.id,
                    project_id: projectId,
                    role: role
                },
                priority: 'medium',
                expires_at: task.due_date ? new Date(task.due_date).toISOString() : null
            }

            await apiPost('/api/notifications', notificationPayload)
        } catch (error) {
            console.error('Failed to create task notification:', error)
            // Don't block task creation if notification fails
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            setLoading(true)
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                assigned_to: assigneeId || null,
                accountable_person: accountablePersonId || null,
                estimated_time: estimatedTime,
                parent_id: parentTaskId,
                group_id: groupId,
                status: initialData ? initialData.status : 'todo',
                priority: initialData ? initialData.priority : 'medium'
            }

            let result: Task
            if (initialData) {
                // Update existing task
                result = await apiPut(`/api/tasks/${initialData.id}`, payload)
            } else {
                // Create new task
                result = await apiPost('/api/tasks', payload)
            }

            // Create notification for accountable person if assigned
            if (accountablePersonId && !initialData) {
                await createTaskNotification(result, accountablePersonId, 'accountable')
            }

            // Create notification for assigned person if assigned
            if (assigneeId && !initialData) {
                await createTaskNotification(result, assigneeId, 'assigned')
            }

            onSuccess(result)
            onClose()
        } catch (err) {
            console.error('Failed to save sub-task', err)
            alert('Không thể lưu việc cần làm')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-900">{initialData ? 'Cập nhật việc cần làm' : 'Thêm việc cần làm'}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-400"
                            placeholder="Nhập tên công việc..."
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-400 resize-none"
                            rows={3}
                            placeholder="Thêm chi tiết..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" /> Hạn chót
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Ước tính (phút)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={estimatedTime || ''}
                                onChange={e => setEstimatedTime(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                                placeholder="VD: 60"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> Người thực hiện
                        </label>
                        <select
                            value={assigneeId}
                            onChange={e => setAssigneeId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                        >
                            <option value="">-- Chọn thành viên --</option>
                            {groupMembers.map(member => {
                                const responsibilityLabel = member.responsibility_type 
                                    ? member.responsibility_type === 'accountable' ? ' (👑 Người chịu trách nhiệm)'
                                    : member.responsibility_type === 'responsible' ? ' (🔧 Người thực hiện)'
                                    : member.responsibility_type === 'consulted' ? ' (💬 Người tư vấn)'
                                    : member.responsibility_type === 'informed' ? ' (👁️ Người quan sát)'
                                    : ''
                                    : ''
                                return (
                                    <option key={member.employee_id} value={member.employee_id}>
                                        {member.employee_name || member.employee_email}{responsibilityLabel}
                                    </option>
                                )
                            })}
                        </select>
                    </div>

                    {projectId && projectTeamMembers.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5" /> Người chịu trách nhiệm
                            </label>
                            <select
                                value={accountablePersonId}
                                onChange={e => setAccountablePersonId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                            >
                                <option value="">-- Chọn người chịu trách nhiệm --</option>
                                {projectTeamMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} {member.responsibility_type ? `(${member.responsibility_type})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Tạo việc cần làm')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
