'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  User,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProjectTeamDialog from './ProjectTeamDialog'

interface ProjectTeamMember {
  id: string
  project_id: string
  name: string
  role: string
  email: string
  phone: string
  start_date: string
  hourly_rate: number
  status: 'active' | 'inactive'
  skills: string[]
  avatar: string
  user_id: string
}

interface ProjectTeamTabProps {
  projectId: string
}

export default function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<ProjectTeamMember | null>(null)

  useEffect(() => {
    fetchTeamMembers()
  }, [projectId])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('project_team')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (err) {
      console.error('Error fetching team members:', err)
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const { error } = await supabase
        .from('project_team')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      
      // Refresh the list
      fetchTeamMembers()
    } catch (err) {
      console.error('Error deleting team member:', err)
      setError('Failed to delete team member')
    }
  }

  const handleEdit = (member: ProjectTeamMember) => {
    setEditingMember(member)
    setShowDialog(true)
  }

  const handleAddNew = () => {
    setEditingMember(null)
    setShowDialog(true)
  }

  if (loading) {
    return <div className="p-4">Loading team members...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Project Team</h2>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Team Member
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No team members added yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow p-4 border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Started: {new Date(member.start_date).toLocaleDateString()}</span>
                </div>
                
                {member.hourly_rate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={16} />
                    <span>{member.hourly_rate.toLocaleString()} VND/hour</span>
                  </div>
                )}

                {member.skills && member.skills.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star size={16} />
                    <span>{member.skills.join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  {member.status === 'active' ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-red-600">Inactive</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <ProjectTeamDialog
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false)
            setEditingMember(null)
          }}
          onSuccess={fetchTeamMembers}
          projectId={projectId}
          editMember={editingMember}
        />
      )}
    </div>
  )
}
