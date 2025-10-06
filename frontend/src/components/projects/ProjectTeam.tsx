'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  Star,
  Clock
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  email?: string
  phone?: string
  start_date: string
  hourly_rate?: number
  status: 'active' | 'inactive'
  skills: string[]
  avatar?: string
}

interface ProjectTeamProps {
  projectId: string
  projectName: string
}

const roleConfig = {
  'project_manager': {
    label: 'Quản lý dự án',
    icon: Briefcase,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  'developer': {
    label: 'Lập trình viên',
    icon: Users,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  'designer': {
    label: 'Thiết kế',
    icon: Star,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  'tester': {
    label: 'Kiểm thử',
    icon: Clock,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  'other': {
    label: 'Khác',
    icon: Users,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700'
  }
}

const statusConfig = {
  active: {
    label: 'Đang làm việc',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  inactive: {
    label: 'Không hoạt động',
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500'
  }
}

export default function ProjectTeam({ projectId, projectName }: ProjectTeamProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    fetchTeamMembers()
  }, [projectId])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/team`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      
      const data = await response.json()
      setTeamMembers(data.team_members || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (memberData: Omit<TeamMember, 'id'>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      })

      if (!response.ok) {
        throw new Error('Failed to add team member')
      }

      await fetchTeamMembers()
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleUpdateMember = async (memberId: string, memberData: Partial<TeamMember>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/team/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      })

      if (!response.ok) {
        throw new Error('Failed to update team member')
      }

      await fetchTeamMembers()
      setEditingMember(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/team/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete team member')
      }

      await fetchTeamMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchTeamMembers}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Đội ngũ thi công</h3>
          <p className="text-gray-600">Quản lý thành viên dự án {projectName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Thêm thành viên
        </button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng thành viên</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Quản lý</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.role === 'project_manager').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Star className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Kỹ năng</p>
              <p className="text-2xl font-bold text-gray-900">
                {[...new Set(teamMembers.flatMap(m => m.skills))].length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h4 className="text-lg font-semibold text-gray-900">Danh sách thành viên</h4>
        </div>
        
        {teamMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có thành viên nào trong dự án</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thêm thành viên đầu tiên
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {teamMembers.map((member) => {
              const roleInfo = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.other
              const statusInfo = statusConfig[member.status]
              const RoleIcon = roleInfo.icon

              return (
                <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusInfo.dotColor}`}></div>
                      </div>

                      {/* Member Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="text-lg font-semibold text-gray-900">{member.name}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <RoleIcon className="h-4 w-4" />
                            <span>{roleInfo.label}</span>
                          </div>
                          
                          {member.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          
                          {member.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Bắt đầu: {formatDate(member.start_date)}</span>
                          </div>
                        </div>

                        {/* Skills */}
                        {member.skills.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {member.skills.map((skill, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {member.hourly_rate && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Giá/giờ</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(member.hourly_rate)}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Member Form */}
      {(showAddForm || editingMember) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const memberData = {
                  name: formData.get('name') as string,
                  role: formData.get('role') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  start_date: formData.get('start_date') as string,
                  hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : undefined,
                  status: formData.get('status') as 'active' | 'inactive',
                  skills: (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean)
                }

                if (editingMember) {
                  handleUpdateMember(editingMember.id, memberData)
                } else {
                  handleAddMember(memberData)
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên thành viên *
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingMember?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò *
                    </label>
                    <select
                      name="role"
                      defaultValue={editingMember?.role || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Chọn vai trò</option>
                      <option value="project_manager">Quản lý dự án</option>
                      <option value="developer">Lập trình viên</option>
                      <option value="designer">Thiết kế</option>
                      <option value="tester">Kiểm thử</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingMember?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingMember?.phone || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      defaultValue={editingMember?.start_date || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá/giờ (VND)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      defaultValue={editingMember?.hourly_rate || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái *
                    </label>
                    <select
                      name="status"
                      defaultValue={editingMember?.status || 'active'}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kỹ năng (phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      defaultValue={editingMember?.skills.join(', ') || ''}
                      placeholder="React, Node.js, TypeScript"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingMember ? 'Cập nhật' : 'Thêm thành viên'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingMember(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
