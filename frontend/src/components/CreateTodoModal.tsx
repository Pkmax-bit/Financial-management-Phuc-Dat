'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Clock, Shield, Plus, Trash2 } from 'lucide-react'
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
    const [accountablePersonId, setAccountablePersonId] = useState('')
    const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [projectTeamMembers, setProjectTeamMembers] = useState<Array<{ id: string, name: string, email?: string, responsibility_type?: string }>>([])

    // Participants state
    const [participants, setParticipants] = useState<Array<{ employee_id: string, role: 'responsible' | 'participant' | 'observer' }>>([])

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setDescription(initialData.description || '')
            setDueDate(initialData.due_date ? new Date(initialData.due_date).toISOString().slice(0, 16) : '')
            setAccountablePersonId((initialData as any).accountable_person || '')
            setEstimatedTime(initialData.estimated_time)

            // Initialize participants from assigned_to if present
            if (initialData.assigned_to) {
                setParticipants([{
                    employee_id: initialData.assigned_to,
                    role: 'responsible'
                }])
            } else {
                setParticipants([])
            }
        } else {
            setTitle('')
            setDescription('')
            setDueDate('')
            setAccountablePersonId('')
            setEstimatedTime(undefined)
            setParticipants([])
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

    const handleAddParticipant = () => {
        setParticipants([...participants, { employee_id: '', role: 'participant' }])
    }

    const handleRemoveParticipant = (index: number) => {
        const newParticipants = [...participants]
        newParticipants.splice(index, 1)
        setParticipants(newParticipants)
    }

    const handleParticipantChange = (index: number, field: 'employee_id' | 'role', value: string) => {
        const newParticipants = [...participants]
        newParticipants[index] = { ...newParticipants[index], [field]: value }
        setParticipants(newParticipants)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            setLoading(true)

            // Find primary assignee (first responsible)
            const primaryAssignee = participants.find(p => p.role === 'responsible')?.employee_id || participants[0]?.employee_id || null

            // Filter out invalid participants
            const validParticipants = participants.filter(p => p.employee_id)

            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                assigned_to: primaryAssignee,
                accountable_person: accountablePersonId || null,
                estimated_time: estimatedTime,
                parent_id: parentTaskId,
                group_id: groupId,
                status: initialData ? initialData.status : 'todo',
                priority: initialData ? initialData.priority : 'medium',
                participants: validParticipants.length > 0 ? validParticipants : undefined
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

            // Create notifications for participants
            if (validParticipants.length > 0 && !initialData) {
                for (const p of validParticipants) {
                    await createTaskNotification(result, p.employee_id, p.role)
                }
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <h3 className="font-bold text-gray-900">{initialData ? 'Cập nhật việc cần làm' : 'Thêm việc cần làm'}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <form id="create-todo-form" onSubmit={handleSubmit} className="space-y-4">
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

                        {/* Participants Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" /> Người thực hiện & Vai trò
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddParticipant}
                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <Plus className="h-3 w-3" /> Thêm người
                                </button>
                            </div>

                            <div className="space-y-2">
                                {participants.length === 0 && (
                                    <div className="text-sm text-gray-500 italic p-2 border border-dashed border-gray-300 rounded-lg text-center">
                                        Chưa có người thực hiện nào.
                                        <button type="button" onClick={handleAddParticipant} className="text-blue-600 ml-1 hover:underline">Thêm ngay</button>
                                    </div>
                                )}

                                {participants.map((participant, index) => (
                                    <div key={index} className="flex gap-2 items-start animate-fade-in">
                                        <select
                                            value={participant.employee_id}
                                            onChange={e => handleParticipantChange(index, 'employee_id', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                                        >
                                            <option value="">-- Chọn thành viên --</option>
                                            {groupMembers.map(member => (
                                                <option key={member.employee_id} value={member.employee_id}>
                                                    {member.employee_name || member.employee_email}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={participant.role}
                                            onChange={e => handleParticipantChange(index, 'role', e.target.value as any)}
                                            className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                                        >
                                            <option value="responsible">Thực hiện</option>
                                            <option value="participant">Tham gia</option>
                                            <option value="observer">Quan sát</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveParticipant(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {projectId && projectTeamMembers.length > 0 && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    <Shield className="h-3.5 w-3.5" /> Người chịu trách nhiệm (Accountable)
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
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="create-todo-form"
                        disabled={loading || !title.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Tạo việc cần làm')}
                    </button>
                </div>
            </div>
        </div>
    )
}
