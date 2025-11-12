from datetime import datetime
from typing import Literal, Optional, Any, List
from pydantic import BaseModel


FeedbackCategory = Literal['bug','idea','uiux','performance','other']
FeedbackPriority = Literal['low','medium','high','urgent','critical']
FeedbackStatus = Literal['open','in_progress','resolved','closed']


class AttachmentInfo(BaseModel):
    """Attachment information model"""
    id: str
    name: str
    url: str
    type: str  # 'image' or 'document'
    size: int
    uploaded_at: str
    path: str


class SystemFeedback(BaseModel):
    id: str
    submitted_by: str
    title: str
    content: str
    category: FeedbackCategory = 'other'
    priority: FeedbackPriority = 'medium'
    status: FeedbackStatus = 'open'
    attachments: Optional[List[AttachmentInfo]] = None
    created_at: datetime
    updated_at: datetime
    admin_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


class SystemFeedbackCreate(BaseModel):
    title: str
    content: str
    category: FeedbackCategory = 'other'
    priority: FeedbackPriority = 'medium'
    attachments: Optional[List[AttachmentInfo]] = None


class SystemFeedbackUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[FeedbackCategory] = None
    priority: Optional[FeedbackPriority] = None
    status: Optional[FeedbackStatus] = None
    attachments: Optional[List[AttachmentInfo]] = None


class FeedbackReply(BaseModel):
    """Reply to system feedback"""
    id: str
    feedback_id: str
    replied_by: str
    content: str
    attachments: Optional[List[AttachmentInfo]] = None
    parent_reply_id: Optional[str] = None  # For threaded replies
    created_at: datetime
    updated_at: datetime
    replied_by_name: Optional[str] = None  # For display purposes
    children: Optional[List['FeedbackReply']] = None  # Nested replies


class FeedbackReplyCreate(BaseModel):
    """Create a new reply"""
    content: str
    attachments: Optional[List[AttachmentInfo]] = None
    parent_reply_id: Optional[str] = None  # For threaded replies (reply to a reply)


class FeedbackReplyUpdate(BaseModel):
    """Update an existing reply"""
    content: Optional[str] = None
    attachments: Optional[List[AttachmentInfo]] = None




