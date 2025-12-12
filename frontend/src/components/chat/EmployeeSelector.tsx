'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, User, Users, Plus as PlusIcon } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { Conversation } from '@/types/chat'

interface Employee {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  department_name?: string
  position_name?: string
  status?: string
}

interface EmployeeSelectorProps {
  currentUserId: string
  onSelect: (data: any, conversationId?: string) => void
  onClose: () => void
}

export default function EmployeeSelector({ currentUserId, onSelect, onClose }: EmployeeSelectorProps) {
  const [activeTab, setActiveTab] = useState<'employees' | 'groups'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Conversation[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab === 'employees') {
      loadEmployees()
    } else {
      loadGroups()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'employees') {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        setFilteredEmployees(
          employees.filter(emp => {
            const fullName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
            return (
              fullName.toLowerCase().includes(query) ||
              emp.email?.toLowerCase().includes(query) ||
              emp.department_name?.toLowerCase().includes(query) ||
              emp.position_name?.toLowerCase().includes(query)
            )
          })
        )
      } else {
        setFilteredEmployees(employees)
      }
    } else {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        setFilteredGroups(
          groups.filter(group => 
            group.name?.toLowerCase().includes(query) ||
            group.last_message_preview?.toLowerCase().includes(query)
          )
        )
      } else {
        setFilteredGroups(groups)
      }
    }
  }, [searchQuery, employees, groups, activeTab])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/employees?status=active&limit=1000')
      const employeesList = response || []
      // Filter out current user
      const filtered = employeesList.filter((emp: Employee) => emp.user_id !== currentUserId)
      setEmployees(filtered)
      setFilteredEmployees(filtered)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/chat/conversations')
      const conversations = response?.conversations || []
      // Filter only group conversations
      const groupConversations = conversations.filter((conv: Conversation) => conv.type === 'group')
      setGroups(groupConversations)
      setFilteredGroups(groupConversations)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEmployee = async (employee: Employee) => {
    if (!employee.user_id) {
      alert('Nhân viên này chưa có tài khoản')
      return
    }

    try {
      // Check if direct conversation already exists
      const conversationsResponse = await apiGet('/api/chat/conversations')
      const conversations = conversationsResponse?.conversations || []
      const existingConv = conversations.find(
        (conv: any) => conv.type === 'direct' && conv.participants?.some((p: any) => p.user_id === employee.user_id)
      )

      if (existingConv) {
        // Use existing conversation
        onSelect(employee, existingConv.id)
        onClose()
      } else {
        // Create new conversation
        const conversationData = {
          type: 'direct',
          participant_ids: [employee.user_id]
        }
        const newConv = await apiPost('/api/chat/conversations', conversationData)
        onSelect(employee, newConv.id)
        onClose()
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Không thể tạo cuộc trò chuyện')
    }
  }

  const handleSelectGroup = (group: Conversation) => {
    onSelect(group, group.id)
    onClose()
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) {
      alert('Vui lòng nhập tên nhóm và chọn ít nhất 1 người tham gia')
      return
    }

    try {
      const conversationData = {
        type: 'group',
        name: groupName.trim(),
        participant_ids: selectedParticipants
      }
      const newConv = await apiPost('/api/chat/conversations', conversationData)
      onSelect({ name: groupName, type: 'group' }, newConv.id)
      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Không thể tạo nhóm')
    }
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        ref={containerRef}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeTab === 'employees' ? 'Chọn người để chat' : 'Chọn nhóm chat'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('employees')
              setSearchQuery('')
              setShowCreateGroup(false)
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'employees'
                ? 'text-[#0068ff] border-b-2 border-[#0068ff] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span>Nhân viên</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('groups')
              setSearchQuery('')
              setShowCreateGroup(false)
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-[#0068ff] border-b-2 border-[#0068ff] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Nhóm</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'employees' ? 'Tìm kiếm nhân viên...' : 'Tìm kiếm nhóm...'}
              className="w-full pl-10 pr-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:border-[#0068ff] transition-all text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Create Group Button (only in groups tab) */}
        {activeTab === 'groups' && !showCreateGroup && (
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full px-4 py-2 bg-[#0068ff] text-white rounded-lg hover:bg-[#0056d6] transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Tạo nhóm mới</span>
            </button>
          </div>
        )}

        {/* Create Group Form */}
        {showCreateGroup && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn thành viên</label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg bg-white p-2">
                  {employees.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-2">Đang tải nhân viên...</div>
                  ) : (
                    <div className="space-y-1">
                      {employees.map((employee) => {
                        const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
                        const isSelected = selectedParticipants.includes(employee.user_id)
                        return (
                          <button
                            key={employee.id}
                            onClick={() => employee.user_id && toggleParticipant(employee.user_id)}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                              isSelected
                                ? 'bg-[#0068ff] text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {fullName}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateGroup(false)
                    setGroupName('')
                    setSelectedParticipants([])
                  }}
                  className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedParticipants.length === 0}
                  className="flex-1 px-3 py-2 text-sm bg-[#0068ff] text-white rounded-lg hover:bg-[#0056d6] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Tạo nhóm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Đang tải...</div>
          ) : activeTab === 'employees' ? (
            filteredEmployees.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchQuery ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên nào'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
                  return (
                    <button
                      key={employee.id}
                      onClick={() => handleSelectEmployee(employee)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{fullName}</div>
                        {employee.email && (
                          <div className="text-sm text-gray-500 truncate">{employee.email}</div>
                        )}
                        {(employee.department_name || employee.position_name) && (
                          <div className="text-xs text-gray-400 truncate">
                            {[employee.department_name, employee.position_name].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            filteredGroups.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchQuery ? 'Không tìm thấy nhóm' : showCreateGroup ? 'Tạo nhóm mới ở trên' : 'Chưa có nhóm nào'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{group.name || 'Nhóm chat'}</div>
                      {group.last_message_preview && (
                        <div className="text-sm text-gray-500 truncate">{group.last_message_preview}</div>
                      )}
                      {group.participant_count && (
                        <div className="text-xs text-gray-400">
                          {group.participant_count} thành viên
                        </div>
                      )}
                    </div>
                    {group.unread_count && group.unread_count > 0 && (
                      <span className="bg-[#0068ff] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {group.unread_count > 9 ? '9+' : group.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

