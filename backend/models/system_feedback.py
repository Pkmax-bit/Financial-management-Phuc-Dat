from datetime import datetime
from typing import Literal, Optional, Any
from pydantic import BaseModel


FeedbackCategory = Literal['bug','idea','uiux','performance','other']
FeedbackPriority = Literal['low','medium','high','urgent','critical']
FeedbackStatus = Literal['open','in_progress','resolved','closed']


class SystemFeedback(BaseModel):
    id: str
    submitted_by: str
    title: str
    content: str
    category: FeedbackCategory = 'other'
    priority: FeedbackPriority = 'medium'
    status: FeedbackStatus = 'open'
    attachments: Optional[Any] = None
    created_at: datetime
    updated_at: datetime


class SystemFeedbackCreate(BaseModel):
    title: str
    content: str
    category: FeedbackCategory = 'other'
    priority: FeedbackPriority = 'medium'
    attachments: Optional[Any] = None


class SystemFeedbackUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[FeedbackCategory] = None
    priority: Optional[FeedbackPriority] = None
    status: Optional[FeedbackStatus] = None
    attachments: Optional[Any] = None




