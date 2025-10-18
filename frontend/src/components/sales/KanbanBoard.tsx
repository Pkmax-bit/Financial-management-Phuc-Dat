'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  MoreHorizontal, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  project_id?: string
  project_name?: string
  created_at: string
  updated_at: string
  is_editing?: boolean
  editing_by?: string
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  is_online: boolean
  current_task?: string
  last_seen: string
}

interface KanbanBoardProps {
  tasks: Task[]
  users: User[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void
  onTaskDelete: (taskId: string) => void
}

export default function KanbanBoard({ 
  tasks, 
  users, 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskDelete 
}: KanbanBoardProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: ''
  })

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="w-4 h-4 text-gray-500" />
      case 'in-progress': return <Edit className="w-4 h-4 text-blue-500" />
      case 'review': return <Eye className="w-4 h-4 text-yellow-500" />
      case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      onTaskCreate({
        title: newTask.title,
        description: newTask.description,
        status: 'todo',
        priority: newTask.priority,
        assignee: newTask.assignee ? users.find(u => u.id === newTask.assignee) : undefined
      })
      setNewTask({ title: '', description: '', priority: 'medium', assignee: '' })
    }
  }

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    onTaskUpdate(taskId, { status: newStatus as any })
  }

  const handleTaskEdit = (taskId: string) => {
    onTaskUpdate(taskId, { is_editing: true, editing_by: 'current_user' })
  }

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task)
    console.log('Project ID:', task.project_id)
    if (task.project_id) {
      // Navigate to project details page with the specific project ID
      const url = `/projects/${task.project_id}/detail`
      console.log('Navigating to:', url)
      router.push(url)
    } else {
      // If no project_id, navigate to projects page
      console.log('No project_id, navigating to /projects')
      router.push('/projects')
    }
  }

  return (
    <div className="bg-gray-50">
      {/* Main Kanban Board */}
      <div className="flex-1 p-6">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-gray-900 ${sidebarOpen ? 'text-lg' : 'text-sm'}`}>
              {sidebarOpen ? 'Team Board' : 'TB'}
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Online Users */}
        <div className="p-4 border-b border-gray-200">
          <h3 className={`font-semibold text-gray-900 mb-3 ${sidebarOpen ? 'text-sm' : 'text-xs'}`}>
            {sidebarOpen ? 'Online Users' : 'Users'}
          </h3>
          <div className="space-y-2">
            {users.filter(user => user.is_online).map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    {user.current_task && (
                      <p className="text-xs text-blue-600 font-medium">Editing task</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Details */}
        {selectedUser && sidebarOpen && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">User Details</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                <p>Status: <span className="text-green-600 font-medium">Online</span></p>
                <p>Last seen: {new Date(selectedUser.last_seen).toLocaleTimeString()}</p>
                {selectedUser.current_task && (
                  <p className="text-blue-600 font-medium">Currently editing a task</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {sidebarOpen && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
              <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Users className="w-4 h-4" />
                <span>Invite User</span>
              </button>
              <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
                <span>View Reports</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Project Kanban Board</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {tasks.length} tasks • {users.filter(u => u.is_online).length} online
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex space-x-6 min-w-max">
            {columns.map(column => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className={`${column.color} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="text-sm text-gray-600">
                      {tasks.filter(task => task.status === column.id).length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {tasks
                      .filter(task => task.status === column.id)
                      .map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{task.title}</h4>
                              {task.project_name && (
                                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {task.project_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(task.status)}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle menu click
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-xs text-gray-600 mb-3">{task.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              {task.assignee && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {task.assignee.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs text-gray-600">{task.assignee.name}</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                                Click to view project →
                              </div>
                            </div>
                          </div>
                          
                          {task.is_editing && (
                            <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
                              <Edit className="w-3 h-3" />
                              <span>Being edited by {task.editing_by}</span>
                            </div>
                          )}
                          
                          <div className="mt-3 flex space-x-2">
                            {column.id !== 'todo' && (
                              <button
                                onClick={() => handleTaskStatusChange(task.id, 'todo')}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                ← To Do
                              </button>
                            )}
                            {column.id !== 'done' && (
                              <button
                                onClick={() => handleTaskStatusChange(task.id, column.id === 'todo' ? 'in-progress' : column.id === 'in-progress' ? 'review' : 'done')}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                {column.id === 'todo' ? 'Start →' : column.id === 'in-progress' ? 'Review →' : 'Done →'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    
                    {/* Add Task Button */}
                    {column.id === 'todo' && (
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Task title"
                            value={newTask.title}
                            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <textarea
                            placeholder="Task description"
                            value={newTask.description}
                            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <select
                              value={newTask.priority}
                              onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>
                            <select
                              value={newTask.assignee}
                              onChange={(e) => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Unassigned</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleCreateTask}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
