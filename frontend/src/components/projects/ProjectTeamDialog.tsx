'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Save,
  User,
  Calendar,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  Star,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  UserPlus,
  Edit
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Employee {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  role?: string
  department?: string
}

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface SelectedMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  hourly_rate?: string
  start_date: string
  source: 'employee' | 'user'
}

interface ProjectTeamDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projectId: string
}

const defaultRoleOptions = [
  'Giám sát',
  'Lắp đặt',
  'Vận chuyển',
  'Xưởng',
  'Kỹ thuật',
  'Thiết kế',
  'Quản lý',
  'Hỗ trợ',
  'Kiểm tra chất lượng'
]

export default function ProjectTeamDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId
}: ProjectTeamDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'employees' | 'users'>('employees')
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  const [customRoles, setCustomRoles] = useState<string[]>([])
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
      fetchUsers()
    }
  }, [isOpen])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, phone, avatar_url, role, department')
        .order('full_name')
      
      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .order('full_name')
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSelectMember = (person: Employee | User, source: 'employee' | 'user') => {
    const isAlreadySelected = selectedMembers.some(member => member.id === person.id)
    
    if (!isAlreadySelected) {
      setSelectedMembers([...selectedMembers, {
        id: person.id,
        name: 'full_name' in person ? person.full_name : (person.full_name || person.email),
        email: person.email,
        avatar: person.avatar_url,
        role: '',
        start_date: new Date().toISOString().split('T')[0],
        source
      }])
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== memberId))
  }

  const handleUpdateMember = (memberId: string, field: keyof SelectedMember, value: string) => {
    setSelectedMembers(selectedMembers.map(member => 
      member.id === memberId ? { ...member, [field]: value } : member
    ))
  }

  const handleAddCustomRole = () => {
    if (newRole && !customRoles.includes(newRole) && !defaultRoleOptions.includes(newRole)) {
      setCustomRoles([...customRoles, newRole])
      setNewRole('')
    }
  }

  const handleSubmit = async () => {
    if (selectedMembers.length === 0) {
      alert('Vui lòng chọn ít nhất một thành viên')
      return
    }

    if (selectedMembers.some(member => !member.role)) {
      alert('Vui lòng chọn vai trò cho tất cả thành viên')
      return
    }

    try {
      setSubmitting(true)
      
      for (const member of selectedMembers) {
        const teamMemberData = {
          project_id: projectId,
          name: member.name,
          role: member.role,
          email: member.email,
          start_date: member.start_date,
          hourly_rate: member.hourly_rate ? parseFloat(member.hourly_rate) : null,
          status: 'active',
          skills: [],
          avatar: member.avatar || null,
          user_id: member.id
        }

        const { error } = await supabase
          .from('project_team')
          .insert([teamMemberData])
        
        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving team members:', error)
      alert('Lỗi khi lưu thành viên')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop for click outside - transparent */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar dialog */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Thêm thành viên vào team
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Selected Members List */}
            {selectedMembers.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Thành viên đã chọn ({selectedMembers.length})
                </h3>
                <div className="space-y-4">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="bg-white rounded-lg border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {member.email}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vai trò
                              </label>
                              <div className="relative">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                  <option value="">Chọn vai trò</option>
                                  {defaultRoleOptions.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                  {customRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày bắt đầu
                              </label>
                              <input
                                type="date"
                                value={member.start_date}
                                onChange={(e) => handleUpdateMember(member.id, 'start_date', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Role */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thêm vai trò mới
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Nhập tên vai trò mới"
                  className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddCustomRole}
                  disabled={!newRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Search and Tabs */}
            <div className="mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setSelectedTab('employees')}
                  className={`flex-1 py-2 text-center font-medium ${
                    selectedTab === 'employees'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Nhân viên
                </button>
                <button
                  onClick={() => setSelectedTab('users')}
                  className={`flex-1 py-2 text-center font-medium ${
                    selectedTab === 'users'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Người dùng
                </button>
              </div>
            </div>

            {/* Member Selection */}
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {selectedTab === 'employees' ? (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMembers.some(m => m.id === emp.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleSelectMember(emp, 'employee')}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {emp.avatar_url ? (
                          <img
                            src={emp.avatar_url}
                            alt={emp.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {emp.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {emp.email}
                        </p>
                        {emp.role && (
                          <p className="text-xs text-gray-500">
                            {emp.role} {emp.department ? `• ${emp.department}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedMembers.some(m => m.id === emp.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                    )}
                  </div>
                ))
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMembers.some(m => m.id === user.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleSelectMember(user, 'user')}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || user.email}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {selectedMembers.some(m => m.id === user.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedMembers.length} thành viên được chọn
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                disabled={submitting || selectedMembers.length === 0}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Lưu thành viên</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}