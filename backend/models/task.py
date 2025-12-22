"""
Task Management Models
"""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskParticipantRole(str, Enum):
    RESPONSIBLE = "responsible"
    PARTICIPANT = "participant"
    OBSERVER = "observer"

class TaskGroupRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class NoteVisibility(str, Enum):
    PRIVATE = "private"  # Only creator can see
    TASK = "task"        # All task participants can see
    GROUP = "group"      # All group members can see

class TaskGroup(BaseModel):
    """Task Group model"""
    id: str
    name: str  # Có thể lấy từ project_categories nếu có category_id
    description: Optional[str] = None  # Có thể lấy từ project_categories nếu có category_id
    category_id: Optional[str] = None  # Reference đến project_categories
    created_by: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None
    avatar_url: Optional[str] = None
    color: Optional[str] = "#3b82f6"
    # Thông tin từ category (khi JOIN)
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    category_icon: Optional[str] = None

class TaskGroupCreate(BaseModel):
    """Task Group creation model"""
    name: str
    description: Optional[str] = None
    member_ids: Optional[List[str]] = []  # List of employee IDs
    avatar_url: Optional[str] = None
    color: Optional[str] = "#3b82f6"

class TaskGroupUpdate(BaseModel):
    """Task Group update model"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    color: Optional[str] = None

class TaskGroupMember(BaseModel):
    """Task Group Member model"""
    id: str
    group_id: str
    employee_id: str
    role: str = "member"  # Legacy role from task_group_members
    responsibility_type: Optional[str] = None  # RACI role from project_team
    added_by: Optional[str] = None
    created_at: datetime
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    avatar: Optional[str] = None  # Avatar from project_team
    phone: Optional[str] = None  # Phone from project_team
    status: Optional[str] = None  # Status from project_team

class TaskGroupMemberAdd(BaseModel):
    """Add member to group"""
    employee_id: str
    role: str = "member"

class Task(BaseModel):
    """Task model"""
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    group_id: Optional[str] = None
    created_by: Optional[str] = None
    assigned_to: Optional[str] = None
    accountable_person: Optional[str] = None
    project_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    estimated_time: int = 0  # minutes
    time_spent: int = 0  # minutes cached
    created_at: datetime
    updated_at: datetime
    # Computed fields
    assigned_to_name: Optional[str] = None
    created_by_name: Optional[str] = None
    group_name: Optional[str] = None
    project_name: Optional[str] = None
    comment_count: Optional[int] = 0
    attachment_count: Optional[int] = 0
    parent_id: Optional[str] = None
    checklists: Optional[List[TaskChecklist]] = []

class TaskCreate(BaseModel):
    """Task creation model"""
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    group_id: Optional[str] = None
    assigned_to: Optional[str] = None
    accountable_person: Optional[str] = None
    project_id: Optional[str] = None
    assignee_ids: Optional[List[str]] = []  # Multiple assignees
    estimated_time: Optional[int] = 0
    parent_id: Optional[str] = None

class TaskUpdate(BaseModel):
    """Task update model"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    group_id: Optional[str] = None
    assigned_to: Optional[str] = None
    accountable_person: Optional[str] = None
    project_id: Optional[str] = None
    estimated_time: Optional[int] = None

class TaskAssignment(BaseModel):
    """Task Assignment model"""
    id: str
    task_id: str
    assigned_to: str
    assigned_by: Optional[str] = None
    assigned_at: datetime
    status: TaskStatus = TaskStatus.TODO
    notes: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_by_name: Optional[str] = None

class TaskComment(BaseModel):
    """Task Comment model"""
    id: str
    task_id: str
    user_id: Optional[str] = None
    employee_id: Optional[str] = None
    comment: str
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    employee_name: Optional[str] = None
    type: str = "text"  # text, file, image
    file_url: Optional[str] = None
    is_pinned: bool = False
    parent_id: Optional[str] = None  # ID of parent comment if this is a reply
    replies: Optional[List['TaskComment']] = []  # Nested replies

class TaskCommentCreate(BaseModel):
    """Task Comment creation model"""
    comment: str
    type: str = "text"
    file_url: Optional[str] = None
    is_pinned: bool = False
    parent_id: Optional[str] = None  # ID of parent comment if this is a reply
    employee_id: Optional[str] = None  # Employee ID của thành viên được chọn để nhắn tin

class TaskCommentUpdate(BaseModel):
    """Task Comment update model"""
    comment: Optional[str] = None
    type: Optional[str] = None
    file_url: Optional[str] = None
    is_pinned: Optional[bool] = None

class TaskAttachment(BaseModel):
    """Task Attachment model"""
    id: str
    task_id: str
    file_name: str
    file_url: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: datetime
    uploaded_by_name: Optional[str] = None

class TaskNotification(BaseModel):
    """Task Notification model"""
    id: str
    task_id: str
    user_id: str
    employee_id: Optional[str] = None
    notification_type: str
    title: str
    message: Optional[str] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime
    task_title: Optional[str] = None

class TaskChecklistItem(BaseModel):
    id: str
    checklist_id: str
    content: str
    is_completed: bool = False
    assignee_id: Optional[str] = None
    sort_order: int = 0
    completed_at: Optional[datetime] = None
    created_at: datetime
    assignee_name: Optional[str] = None


class ChecklistItemAssignment(BaseModel):
    employee_id: str
    responsibility_type: str  # 'accountable', 'responsible', 'consulted', 'informed'


class TaskChecklistItemCreate(BaseModel):
    content: str
    assignee_id: Optional[str] = None
    sort_order: Optional[int] = 0
    assignments: Optional[List[ChecklistItemAssignment]] = None


class TaskChecklistItemUpdate(BaseModel):
    content: Optional[str] = None
    is_completed: Optional[bool] = None
    assignee_id: Optional[str] = None
    sort_order: Optional[int] = None
    assignments: Optional[List[ChecklistItemAssignment]] = None


class TaskChecklist(BaseModel):
    id: str
    task_id: str
    title: str
    created_by: Optional[str] = None
    created_at: datetime
    progress: Optional[float] = None
    items: List[TaskChecklistItem] = []


class TaskChecklistCreate(BaseModel):
    title: str


class TaskChecklistUpdate(BaseModel):
    title: Optional[str] = None


class TaskTimeLog(BaseModel):
    id: str
    task_id: str
    user_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    description: Optional[str] = None
    created_at: datetime
    duration_minutes: Optional[int] = None
    user_name: Optional[str] = None


class TaskTimeLogStart(BaseModel):
    description: Optional[str] = None


class TaskTimeLogStop(BaseModel):
    description: Optional[str] = None


class TaskParticipant(BaseModel):
    id: str
    task_id: str
    employee_id: str
    role: TaskParticipantRole = TaskParticipantRole.PARTICIPANT
    added_by: Optional[str] = None
    created_at: datetime
    employee_name: Optional[str] = None


class TaskParticipantCreate(BaseModel):
    employee_id: str
    role: TaskParticipantRole = TaskParticipantRole.PARTICIPANT


class TaskParticipantUpdate(BaseModel):
    employee_id: Optional[str] = None
    role: Optional[TaskParticipantRole] = None


class TaskNote(BaseModel):
    """Task Note model"""
    id: str
    task_id: str
    content: str
    visibility: NoteVisibility = NoteVisibility.TASK
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by_name: Optional[str] = None


class TaskNoteCreate(BaseModel):
    """Task Note creation model"""
    content: str
    visibility: NoteVisibility = NoteVisibility.TASK


class TaskNoteUpdate(BaseModel):
    """Task Note update model"""
    content: Optional[str] = None
    visibility: Optional[NoteVisibility] = None


class TaskResponse(BaseModel):
    """Task response with related data"""
    task: Task
    assignments: List[TaskAssignment] = []
    comments: List[TaskComment] = []
    attachments: List[TaskAttachment] = []
    checklists: List[TaskChecklist] = []
    time_logs: List[TaskTimeLog] = []
    participants: List[TaskParticipant] = []
    participants: List[TaskParticipant] = []
    notes: List[TaskNote] = []
    sub_tasks: List[Task] = []

