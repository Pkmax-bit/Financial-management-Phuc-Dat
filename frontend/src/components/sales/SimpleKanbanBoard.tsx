'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  MoreHorizontal, 
  ExternalLink,
  Edit
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

interface KanbanBoardProps {
  tasks: Task[]
  users: any[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void
  onTaskDelete: (taskId: string) => void
}

export default function SimpleKanbanBoard({ 
  tasks, 
  users, 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskDelete 
}: KanbanBoardProps) {
  const router = useRouter()

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <div className="w-3 h-3 bg-gray-400 rounded-full" />
      case 'in-progress': return <div className="w-3 h-3 bg-blue-500 rounded-full" />
      case 'review': return <div className="w-3 h-3 bg-yellow-500 rounded-full" />
      case 'done': return <div className="w-3 h-3 bg-green-500 rounded-full" />
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kanban Board</h1>
          <p className="text-gray-600">Quản lý dự án và theo dõi tiến độ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <div key={column.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`p-4 rounded-t-lg ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-white/80 text-gray-700 text-sm px-2 py-1 rounded-full">
                    {tasks.filter(task => task.status === column.id).length}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
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
                    </div>
                  ))}
                
                {/* Add Task Button */}
                <button
                  onClick={() => {
                    // Handle add task
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm task</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
