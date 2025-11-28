export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskMessageType = 'text' | 'file' | 'image'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  start_date?: string
  due_date?: string
  estimated_time?: number
  time_spent?: number
  group_id?: string
  assigned_to?: string
  created_by?: string
  project_id?: string
  completed_at?: string
  created_at: string
  updated_at: string
  assigned_to_name?: string
  created_by_name?: string
  group_name?: string
  project_name?: string
  comment_count?: number
  attachment_count?: number
}

export interface TaskChecklistItem {
  id: string
  checklist_id: string
  content: string
  is_completed: boolean
  assignee_id?: string
  assignee_name?: string
  sort_order: number
}

export interface TaskChecklist {
  id: string
  task_id: string
  title: string
  progress?: number
  items: TaskChecklistItem[]
}

export interface TaskAttachment {
  id: string
  task_id: string
  file_name: string  // Storage filename (with task_id and group_id)
  original_file_name?: string  // Original filename for display
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploaded_by_name?: string
  created_at: string
}

export interface TaskParticipant {
  id: string
  task_id: string
  employee_id: string
  employee_name?: string
  role: 'responsible' | 'participant' | 'observer'
}

export interface TaskTimeLog {
  id: string
  task_id: string
  user_id: string
  user_name?: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  description?: string
}

export interface TaskNote {
  id: string
  task_id: string
  content: string
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id?: string
  employee_id?: string
  user_name?: string
  employee_name?: string
  comment: string
  type: TaskMessageType
  file_url?: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface TaskAssignment {
  id: string
  task_id: string
  assigned_to: string
  assigned_to_name?: string
  assigned_by?: string
  assigned_by_name?: string
  assigned_at: string
  status: TaskStatus
  notes?: string
}

export interface TaskResponse {
  task: Task
  checklists: TaskChecklist[]
  comments: TaskComment[]
  attachments: TaskAttachment[]
  time_logs: TaskTimeLog[]
  participants: TaskParticipant[]
  notes: TaskNote[]
  assignments?: TaskAssignment[]
}


