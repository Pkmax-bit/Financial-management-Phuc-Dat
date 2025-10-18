'use client'

import { useState, useEffect } from 'react'
import KanbanBoard from '@/components/sales/KanbanBoard'

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

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design new homepage',
      description: 'Create a modern, responsive homepage design',
      status: 'todo',
      priority: 'high',
      project_id: '9f248efe-2875-4e8e-86c0-c4d679e28646',
      project_name: 'Website Redesign Project',
      assignee: {
        id: '1',
        name: 'John Doe'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Implement user authentication',
      description: 'Add login and registration functionality',
      status: 'in-progress',
      priority: 'high',
      project_id: '9f248efe-2875-4e8e-86c0-c4d679e28646',
      project_name: 'Website Redesign Project',
      assignee: {
        id: '2',
        name: 'Jane Smith'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_editing: true,
      editing_by: 'Jane Smith'
    },
    {
      id: '3',
      title: 'Write API documentation',
      description: 'Document all API endpoints and usage',
      status: 'review',
      priority: 'medium',
      project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      project_name: 'API Development Project',
      assignee: {
        id: '3',
        name: 'Mike Johnson'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      status: 'done',
      priority: 'low',
      project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      project_name: 'API Development Project',
      assignee: {
        id: '1',
        name: 'John Doe'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      title: 'Optimize database queries',
      description: 'Improve performance of slow queries',
      status: 'todo',
      priority: 'medium',
      project_id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
      project_name: 'Performance Optimization',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ])

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      is_online: true,
      last_seen: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      is_online: true,
      current_task: '2',
      last_seen: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      is_online: true,
      last_seen: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      is_online: false,
      last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david@example.com',
      is_online: true,
      last_seen: new Date().toISOString()
    }
  ])

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updated_at: new Date().toISOString() }
        : task
    ))
  }

  const handleTaskCreate = (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setTasks(prev => [...prev, task])
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prev => prev.map(user => ({
        ...user,
        last_seen: new Date().toISOString()
      })))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <KanbanBoard
        tasks={tasks}
        users={users}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  )
}
