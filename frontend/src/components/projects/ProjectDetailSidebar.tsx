'use client'

import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Calendar, DollarSign, Users, Target, Clock, TrendingUp, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { projectApi } from '@/lib/api'

interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  customer_id: string
  customer_name?: string
  manager_id: string
  manager_name?: string
  start_date: string
  end_date?: string
  budget?: number
  actual_cost?: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  billing_type: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  created_at: string
  updated_at: string
}

interface ProjectDetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const statusIcons = {
  planning: Target,
  active: TrendingUp,
  on_hold: Clock,
  completed: Target,
  cancelled: Target
}

export default function ProjectDetailSidebar({ isOpen, onClose, project, onEdit, onDelete }: ProjectDetailSidebarProps) {
  const [financialData, setFinancialData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && project) {
      fetchFinancialData()
    }
  }, [isOpen, project])

  const fetchFinancialData = async () => {
    if (!project) return

    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.id}/financial-summary`)
      if (response.ok) {
        const data = await response.json()
        setFinancialData(data)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          onDelete(project)
          onClose()
        } else {
          alert('Failed to delete project')
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        alert('Failed to delete project')
      }
    }
  }

  if (!isOpen || !project) return null

  const StatusIcon = statusIcons[project.status]

  return (
    <>
      {/* Invisible backdrop for click outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(project)}
              className="p-2 text-black hover:text-blue-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-black hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-black hover:text-black transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <p className="text-sm text-black">#{project.project_code}</p>
              {project.description && (
                <p className="text-sm text-black mt-2">{project.description}</p>
              )}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4 text-black" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                {project.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
              {project.priority.toUpperCase()}
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-black">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-black" />
                <span className="text-black">Customer:</span>
                <span className="font-medium">{project.customer_name || 'No Customer'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-black" />
                <span className="text-black">Manager:</span>
                <span className="font-medium">{project.manager_name || 'No Manager'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-black" />
                <span className="text-black">Start:</span>
                <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
              </div>
              {project.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-black" />
                  <span className="text-black">End:</span>
                  <span className="font-medium">{new Date(project.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Budget and Billing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-black" />
                <span className="text-black">Budget:</span>
                <span className="font-medium">${project.budget.toLocaleString()}</span>
              </div>
            )}
            {project.actual_cost && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-black" />
                <span className="text-black">Actual Cost:</span>
                <span className="font-medium">${project.actual_cost.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-black" />
              <span className="text-black">Billing:</span>
              <span className="font-medium">{project.billing_type.replace('_', ' ').toUpperCase()}</span>
            </div>
            {project.hourly_rate && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-black" />
                <span className="text-black">Rate:</span>
                <span className="font-medium">${project.hourly_rate}/hour</span>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          {financialData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-black" />
                <h4 className="font-medium text-gray-900">Financial Summary</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-black">Total Revenue</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${financialData.total_revenue?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-black">Total Costs</p>
                  <p className="text-lg font-semibold text-red-600">
                    ${financialData.total_costs?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-black">Profit</p>
                  <p className={`text-lg font-semibold ${
                    (financialData.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${financialData.profit?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {financialData?.recent_transactions && financialData.recent_transactions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Transactions</h4>
              <div className="space-y-2">
                {financialData.recent_transactions.slice(0, 5).map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
                      <p className="text-xs text-black">{transaction.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-black">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t text-xs text-black">
            <p>Created: {new Date(project.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(project.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </>
  )
}
